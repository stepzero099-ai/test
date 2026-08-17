import { GoogleGenAI, Type } from '@google/genai';
import { Category, FullStory, Importance, NewsArticle, SourceInfo } from '../src/types.js';
import { searchArabicWikipedia } from './wikipedia.js';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// In-memory cache for full story generations to prevent duplicate LLM calls
const fullStoryCache = new Map<string, { story: FullStory; timestamp: number }>();
let cachedDailyDigest: { data: any; timestamp: number } | null = null;

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function cleanJsonString(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Execute a Gemini call with retry, exponential backoff, and model fallback
 */
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  params: {
    prompt: string;
    systemInstruction?: string;
    responseSchema?: any;
    primaryModel?: string;
    fallbackModel?: string;
  }
): Promise<string> {
  const primaryModel = params.primaryModel || 'gemini-3.7-flash';
  const fallbackModel = params.fallbackModel || 'gemini-3.1-flash-lite';
  const modelsToTry = [primaryModel, fallbackModel];

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.prompt,
          config: {
            systemInstruction: params.systemInstruction,
            responseMimeType: 'application/json',
            ...(params.responseSchema ? { responseSchema: params.responseSchema } : {})
          }
        });

        const text = response.text;
        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');

        if (isTransient && attempt === 0) {
          // Short exponential backoff before retry
          await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
          continue;
        }
        // If not transient or second attempt, try next fallback model
        break;
      }
    }
  }

  throw lastError || new Error('All model attempts failed');
}

/**
 * Process a cluster of raw RSS news items into a unified, neutral, deduplicated article
 */
export async function processArticleWithAi(
  title: string,
  rawSnippets: string[],
  sources: SourceInfo[],
  fallbackCategory: Category = 'politics'
): Promise<{
  rewrittenTitle: string;
  summary: string;
  category: Category;
  importance: Importance;
  readingTimeMinutes: number;
  extractedEntities: string[];
}> {
  const ai = getAiClient();
  if (!ai) {
    return generateFallbackProcessing(title, rawSnippets, fallbackCategory);
  }

  const prompt = `أنت محرر صحفي ذكي ومحايد لمنصة "خبر اللحظة" المتخصصة في رصد وتوثيق الأخبار الرائجة والترندات العاجلة لحظة بلحظة. 
المهمة: قم بصياغة ملخص إخباري جديد تماماً ومحايد بناءً على الخبر التالي المجموع من مصادر متعددة (${sources.map(s => s.name).join('، ')}).

تعليمات صارمة للتحرير والتصنيف:
1. ركز على إبراز زاوية "الترند والخبر الرائج" وما جعل هذا الخبر يتصدر اهتمام الرأي العام والساعات الأخيرة.
2. لا تنقل النص الأصلي حرفياً لحماية حقوق النشر؛ أعد صياغة الخبر بأسلوب صحفي رصين وموجز ومحايد.
3. حدد التصنيف الدقيق من بين التصنيفات التالية فقط: politics, economy, sports, conflicts, technology, health, misc.
4. حدد مستوى الأهمية بدقة: 
   - breaking: لأحداث الساعة العاجلة والكبرى والرائجة جداً في الترند العالمي والإقليمي.
   - important: لتطورات استراتيجية أو اقتصادية أو تقنية بارزة تحظى باهتمام واسع.
   - normal: للأخبار الدورية العادية.
5. استخرج أهم الشخصيات أو الهيئات أو الدول المحورية في الخبر (1-3 كلمات مفتاحية).

عنوان الخبر الأصلي: ${title}
المقتطفات الصحفية:
${rawSnippets.join('\n---\n')}
`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      rewrittenTitle: { type: Type.STRING, description: 'عنوان صحفي محايد وموجز' },
      summary: { type: Type.STRING, description: 'ملخص تحريري جديد وموجز في 2-3 فقرات قصيرة' },
      category: { 
        type: Type.STRING, 
        enum: ['politics', 'economy', 'sports', 'conflicts', 'technology', 'health', 'misc'] 
      },
      importance: { 
        type: Type.STRING, 
        enum: ['breaking', 'important', 'normal'] 
      },
      readingTimeMinutes: { type: Type.INTEGER },
      extractedEntities: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: 'أسماء الشخصيات أو الدول أو الكيانات المحورية للبحث في ويكيبيديا'
      }
    },
    required: ['rewrittenTitle', 'summary', 'category', 'importance', 'extractedEntities']
  };

  try {
    const rawText = await callGeminiWithFallback(ai, {
      prompt,
      systemInstruction: 'أنت محرر صحفي متمرس يكتب بلغة عربية فصحى راقية، محايدة، وموجزة. الإخراج يجب أن يكون بتنسيق JSON حصراً.',
      responseSchema
    });

    const parsed = JSON.parse(cleanJsonString(rawText) || '{}');
    return {
      rewrittenTitle: parsed.rewrittenTitle || title,
      summary: parsed.summary || rawSnippets[0] || title,
      category: (parsed.category as Category) || fallbackCategory,
      importance: (parsed.importance as Importance) || 'normal',
      readingTimeMinutes: parsed.readingTimeMinutes || 2,
      extractedEntities: parsed.extractedEntities || []
    };
  } catch (error) {
    // Graceful fallback to heuristic processing
    return generateFallbackProcessing(title, rawSnippets, fallbackCategory);
  }
}

/**
 * Generate "الحكاية من الأول" (The Full Story) signature background section
 */
export async function generateFullStoryWithAi(
  article: Partial<NewsArticle>,
  archiveArticles: NewsArticle[] = []
): Promise<FullStory> {
  const cacheKey = article.id || article.title || '';
  const cached = fullStoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.story;
  }

  const ai = getAiClient();
  
  // Extract key search terms for Wikipedia
  const queryTerm = article.title?.replace(/[«»""'':؟!,.]/g, '').split(' ').slice(0, 4).join(' ') || '';
  const wikipediaSources = await searchArabicWikipedia(queryTerm);

  if (!ai) {
    const fallback = generateFallbackFullStory(article, wikipediaSources, archiveArticles);
    fullStoryCache.set(cacheKey, { story: fallback, timestamp: Date.now() });
    return fallback;
  }

  const prompt = `أنت رئيس التحرير والمحلل الاستراتيجي الأول لمنصة "خبر اللحظة".
المهمة: إعداد ملف إخباري تحليلي متكامل وشامل لخبر: "${article.title}" يتضمن جميع التفاصيل الصحفية، التقرير الإخباري الكامل، السياق التاريخي، الشخصيات الفاعلة، والتداعيات.

تفاصيل الخبر الأساسية:
العنوان: ${article.title}
الملخص الأولي: ${article.summary}
التصنيف: ${article.category}
المصادر الراصدة: ${article.sources?.map(s => s.name).join('، ')}

معطيات مرجعية من ويكيبيديا:
${wikipediaSources.map(w => `- ${w.title}: ${w.extract}`).join('\n')}

المطلوب استيفاء الأقسام التالية بأعلى معايير الرصانة والحياد:
1. fullReportParagraphs: تقرير إخباري تحليلي متكامل ومفصل مكون من 3 إلى 5 فقرات صحفية غنية بالمعلومات والتفاصيل الدقيقة حول مجريات الحدث، ردود الأفعال، الأبعاد الإقليمية والدولية.
2. keyHighlights: من 4 إلى 6 نقاط جوهرية رئيسية (Bullet points) تلخص أهم وقائع وحقائق الخبر.
3. inDepthAnalysis: تحليل معمق يوضح ما وراء الخبر، الأبعاد الاستراتيجية، والرسائل السياسية/الاقتصادية الكامنة.
4. quotes: تصريحات واقتباسات رئيسية للأطراف الفاعلة والمعنية بالحدث (نص التصريح، اسم القائل، صفته).
5. faqList: من 2 إلى 4 أسئلة شائعة يجيب عنها الخبر بوضوح (سؤال وجواب دقيق).
6. summary: ملخص مركز يشرح جذور هذه القصة من البداية.
7. whyItMatters: لماذا تهمنا هذه القصة تحديداً الآن؟ وما هي التأثيرات المباشرة؟
8. historicalContext: السياق التاريخي وجذور الأزمة أو الحدث عبر السنوات.
9. entities: الشخصيات والكيانات الرئيسية (الاسم، المنصب/الدور، نبذة عن دورهم في هذا الملف).
10. expectedDevelopments: قائمة بأهم السيناريوهات والتطورات المتوقعة القادمة.
11. timeline: خط زمني تفاعلي من 3 إلى 5 محطات تاريخية هامة سبقت هذا الحدث (التاريخ، العنوان، الشرح).
`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      fullReportParagraphs: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      keyHighlights: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      inDepthAnalysis: { type: Type.STRING },
      quotes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING },
            speaker: { type: Type.STRING },
            title: { type: Type.STRING }
          },
          required: ['quote', 'speaker']
        }
      },
      faqList: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING }
          },
          required: ['question', 'answer']
        }
      },
      summary: { type: Type.STRING },
      whyItMatters: { type: Type.STRING },
      historicalContext: { type: Type.STRING },
      entities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            role: { type: Type.STRING },
            background: { type: Type.STRING }
          },
          required: ['name', 'role', 'background']
        }
      },
      expectedDevelopments: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      timeline: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ['date', 'title', 'description']
        }
      }
    },
    required: ['fullReportParagraphs', 'keyHighlights', 'summary', 'whyItMatters', 'historicalContext', 'entities', 'expectedDevelopments', 'timeline']
  };

  try {
    const rawText = await callGeminiWithFallback(ai, {
      prompt,
      systemInstruction: 'أنت باحث ومحلل سياسي وصحفي عربي رفيع المستوى، تقدم تقارير إخبارية مفصلة ودقيقة ومحايدة مع توثيق الأبعاد كافة.',
      responseSchema
    });

    const parsed = JSON.parse(cleanJsonString(rawText) || '{}');
    const relatedArchiveIds = archiveArticles
      .filter(a => a.id !== article.id && a.category === article.category)
      .slice(0, 3)
      .map(a => a.id);

    const fullStoryResult: FullStory = {
      summary: parsed.summary || 'تفاصيل جذور وسياق هذا الحدث المعرفي والتاريخي.',
      fullReportParagraphs: parsed.fullReportParagraphs || [
        article.summary || article.title || '',
        `تتوالى ردود الأفعال والمتابعات الدولية حول مستجدات ${article.title}، في وقت تؤكد فيه المصادر الدبلوماسية والميدانية تسارع وتيرة التطورات على أكثر من صعيد.`,
        `وتشير القراءات التحليلية إلى أن هذا الحدث يعكس تشابك المصالح والتوازنات الاستراتيجية، حيث تسعى الأطراف المعنية إلى تثبيت مواقفها في ظل المعطيات المستجدة.`
      ],
      keyHighlights: parsed.keyHighlights || [
        `تغطية شاملة وموثقة لخبر: ${article.title}`,
        'متابعة مستمرة لبيانات وتصريحات الجهات الفاعلة',
        'انعكاسات مباشرة على المشهدين الإقليمي والدولي'
      ],
      inDepthAnalysis: parsed.inDepthAnalysis || parsed.whyItMatters || 'يمثل هذا التطور مؤشراً دالاً على تحولات أوسع في البيئة الجيوسياسية والاقتصادية الراهنة.',
      quotes: parsed.quotes || [],
      faqList: parsed.faqList || [
        {
          question: 'ما هي أهمية هذا الخبر في التوقيت الراهن؟',
          answer: parsed.whyItMatters || 'يكتسب الحدث أهميته لكونه يؤثر مباشرة على توازنات القوى واستقرار المسارات الدبلوماسية والاقتصادية.'
        }
      ],
      whyItMatters: parsed.whyItMatters || 'يكتسب هذا الموضوع أهمية محورية لتأثيره المباشر على التوازنات القائمة.',
      historicalContext: parsed.historicalContext || 'تعود جذور هذه القضية إلى تراكمات ومحطات سياسية واقتصادية متلاحقة.',
      entities: parsed.entities || [],
      expectedDevelopments: parsed.expectedDevelopments || [
        'عقد مشاورات واجتماعات تنسيقية بين الأطراف المعنية',
        'متابعة ردود الفعل الدولية وتأثيرها على الأسواق',
        'ترقب صدور بيانات رسمية إضافية خلال الساعات القادمة'
      ],
      timeline: parsed.timeline || [
        { date: 'مرحلة التأسيس', title: 'بداية القضية', description: 'انطلاق التطورات الأولية وتشكيل المواقف الأساسية.' },
        { date: 'تطورات سابقة', title: 'مفاوضات ومسارات موازية', description: 'تراكم التفاعلات والتصريحات المؤثرة في مسار الملف.' },
        { date: 'اللحظة الراهنة', title: 'التطور الأحدث', description: 'وصول المشهد إلى المرحلة الحالية محل المتابعة.' }
      ],
      wikipediaSources,
      relatedArchiveIds,
      lastUpdated: new Date().toISOString()
    };

    fullStoryCache.set(cacheKey, { story: fullStoryResult, timestamp: Date.now() });
    return fullStoryResult;
  } catch (error) {
    const fallback = generateFallbackFullStory(article, wikipediaSources, archiveArticles);
    fullStoryCache.set(cacheKey, { story: fallback, timestamp: Date.now() });
    return fallback;
  }
}

/**
 * Generate Smart Daily Digest (الملخص اليومي الذكي)
 */
export async function generateDailyDigestAi(articles: NewsArticle[]): Promise<{
  headline: string;
  executiveBrief: string;
  keyTakeaways: string[];
  quoteOfTheDay?: { quote: string; speaker: string };
}> {
  if (cachedDailyDigest && Date.now() - cachedDailyDigest.timestamp < 15 * 60 * 1000) {
    return cachedDailyDigest.data;
  }

  const ai = getAiClient();
  const topArticles = articles.slice(0, 8);
  const titlesList = topArticles.map((a, i) => `${i + 1}. [${a.category}] ${a.title}`).join('\n');

  if (!ai || topArticles.length === 0) {
    const fallback = {
      headline: 'حصاد اللحظة: أبرز التحولات الإقليمية والدولية اليوم',
      executiveBrief: 'شهد المشهد الإخباري اليوم نشاطاً دبلوماسياً مكثفاً وتطورات متسارعة في الملفات السياسية والاقتصادية الرئيسية، مع تركيز مصادر الأنباء على التوازنات الراهنة.',
      keyTakeaways: [
        'تطورات متلاحقة في المشهد السياسي والتحركات الدبلوماسية الإقليمية',
        'تأثيرات مباشرة على أسواق الطاقة وحركة المؤشرات الاقتصادية العالمية',
        'ترقب لقرارات مرتقبة من الهيئات الدولية والمنظمات المعنية'
      ],
      quoteOfTheDay: {
        quote: 'الحيادية ونقل الحقيقة بسياقها الكامل هما جوهر العمل الصحفي الموثوق.',
        speaker: 'هيئة تحرير خبر اللحظة'
      }
    };
    cachedDailyDigest = { data: fallback, timestamp: Date.now() };
    return fallback;
  }

  const prompt = `أنت رئيس التحرير لمنصة "خبر اللحظة". قم بإعداد "الملخص اليومي الذكي وحصاد الترند والأخبار الرائجة" (Daily Executive Brief & Trending Digest) في قراءة سريعة تستغرق 3 دقائق لأهم الأحداث والترندات الأكثر تداولاً اليوم بناءً على العناوين التالية:
${titlesList}

المطلوب:
1. headline: عنوان رئيسي جذاب وموجز يتضمن الإشارة إلى حصاد الترند والأخبار الرائجة اليوم.
2. executiveBrief: ملخص تنفيذي شامل في فقرتين مركزتين يلخص المشهد العام وأهم ما شغل الرأي العام.
3. keyTakeaways: من 3 إلى 5 نقاط رئيسية (Bullet points) تلخص أهم الخلاصة والتحولات التي شهدها الترند اليوم.
4. quoteOfTheDay: اقتباس معبر أو تصريح بارز متعلق بالأحداث الرائجة اليوم مع اسم صاحبه.
`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      headline: { type: Type.STRING },
      executiveBrief: { type: Type.STRING },
      keyTakeaways: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      quoteOfTheDay: {
        type: Type.OBJECT,
        properties: {
          quote: { type: Type.STRING },
          speaker: { type: Type.STRING }
        }
      }
    },
    required: ['headline', 'executiveBrief', 'keyTakeaways']
  };

  try {
    const rawText = await callGeminiWithFallback(ai, {
      prompt,
      responseSchema
    });

    const parsed = JSON.parse(cleanJsonString(rawText) || '{}');
    const result = {
      headline: parsed.headline || 'حصاد اليوم: أبرز الملفات والتطورات',
      executiveBrief: parsed.executiveBrief || 'ملخص شامل لأبرز ما حملته الساعات الأخيرة.',
      keyTakeaways: parsed.keyTakeaways || [
        'تسارع المبادرات الدبلوماسية والتواصل الإقليمي والدولي',
        'متابعة حركة الأسواق وأسعار الطاقة ومؤشرات النمو',
        'مستجدات الابتكارات التقنية والاختراقات العلمية'
      ],
      quoteOfTheDay: parsed.quoteOfTheDay
    };

    cachedDailyDigest = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    const fallback = {
      headline: 'حصاد اللحظة: أبرز التحولات والتطورات اليوم',
      executiveBrief: 'إحاطة شاملة بأبرز الأحداث السياسية، الاقتصادية، والتقنية التي تصدرت عناوين وكالات الأنباء المعتمدة اليوم.',
      keyTakeaways: [
        'تسارع المبادرات الدبلوماسية والتواصل الإقليمي والدولي',
        'متابعة حركة الأسواق وأسعار الطاقة ومؤشرات النمو',
        'مستجدات الابتكارات التقنية والاختراقات العلمية'
      ]
    };
    cachedDailyDigest = { data: fallback, timestamp: Date.now() };
    return fallback;
  }
}

function generateFallbackProcessing(
  title: string,
  rawSnippets: string[],
  fallbackCategory: Category
): {
  rewrittenTitle: string;
  summary: string;
  category: Category;
  importance: Importance;
  readingTimeMinutes: number;
  extractedEntities: string[];
} {
  const lower = title.toLowerCase();
  let category: Category = fallbackCategory;
  let importance: Importance = 'normal';

  if (title.includes('عاجل') || title.includes('انفجار') || title.includes('اتفاق طارئ') || title.includes('زلزال') || title.includes('إعلان مفاجئ')) {
    importance = 'breaking';
  } else if (title.includes('قمة') || title.includes('قرار رئاسي') || title.includes('الفائدة') || title.includes('تراجع حاد') || title.includes('أزمة')) {
    importance = 'important';
  }

  if (title.includes('غزة') || title.includes('حرب') || title.includes('عسكري') || title.includes('قصف') || title.includes('جيش') || title.includes('صاروخ') || title.includes('معارك')) {
    category = 'conflicts';
  } else if (title.includes('دولار') || title.includes('نفط') || title.includes('اقتصاد') || title.includes('بنك') || title.includes('تضخم') || title.includes('أسهم') || title.includes('استثمار')) {
    category = 'economy';
  } else if (title.includes('مباراة') || title.includes('هدف') || title.includes('دوري') || title.includes('كرة قدم') || title.includes('منتخب') || title.includes('بطولة') || title.includes('ريال') || title.includes('برشلونة')) {
    category = 'sports';
  } else if (title.includes('ذكاء اصطناعي') || title.includes('هاتف') || title.includes('تطبيق') || title.includes('أبل') || title.includes('مايكروسوفت') || title.includes('إنترنت') || title.includes('تقنية')) {
    category = 'technology';
  } else if (title.includes('صحة') || title.includes('فيروس') || title.includes('علاج') || title.includes('لقاح') || title.includes('طبي') || title.includes('دراسة طبية') || title.includes('مستشفى')) {
    category = 'health';
  } else if (title.includes('رئيس') || title.includes('حكومة') || title.includes('وزير') || title.includes('انتخابات') || title.includes('برلمان') || title.includes('مجلس الأمن') || title.includes('مفاوضات')) {
    category = 'politics';
  }

  const cleanTitle = title.replace(/^عاجل\s*[:|-]\s*/i, '').trim();
  const summary = rawSnippets[0] || cleanTitle;

  return {
    rewrittenTitle: cleanTitle,
    summary: summary.length > 280 ? summary.substring(0, 280) + '...' : summary,
    category,
    importance,
    readingTimeMinutes: Math.max(1, Math.round(summary.length / 300)),
    extractedEntities: [cleanTitle.split(' ')[0], cleanTitle.split(' ')[1]].filter(Boolean)
  };
}

function generateFallbackFullStory(
  article: Partial<NewsArticle>,
  wikipediaSources: any[],
  archiveArticles: NewsArticle[]
): FullStory {
  const title = article.title || 'الحدث الإخباري';
  const summary = article.summary || 'تفاصيل التغطية الصحفية الشاملة للحدث.';
  const sourceName = article.sources?.[0]?.name || 'وكالات الأنباء الدولية والمحلية';

  return {
    summary: `يقدم هذا التقرير تحليلاً شاملاً لأبعاد خبر "${title}" وخلفياته التاريخية وتأثيراته المتوقعة.`,
    fullReportParagraphs: [
      summary,
      `أفادت التقارير الواردة من ${sourceName} بحدوث مستجدات لافتة تتعلق بهذا الملف، وسط متابعة إقليمية ودولية حثيثة لتداعيات الموقف وتأثيره على الأطراف ذات الصلة.`,
      `وتشير البيانات الصادرة عن الجهات المعنية إلى استمرار التنسيق والاتصالات لاحتواء التأثيرات المباشرة، مع التركيز على استقرار المسارات المتفق عليها وضمان استمرارية التهدئة والعمل المشترك.`,
      `من جانبهم، يرى مراقبون ومحللون أن هذه التطورات تأتي في سياق إعادة ترتيب الأولويات والتحولات المتسارعة التي تشهدها المنطقة في الفترة الحالية.`
    ],
    keyHighlights: [
      `رصد وتوثيق تفاصيل الحدث: ${title}`,
      `متابعة منسقة عبر ${article.sources?.length || 1} مصادر إخبارية معتمدة`,
      'تحليل للتأثيرات المباشرة على المدى القريب والمتوسط',
      'ترقب لردود الأفعال الرسمية والبيانات الدبلوماسية اللاحقة'
    ],
    inDepthAnalysis: `يحمل هذا التطور أبعاداً استراتيجية مهمة تتجاوز النطاق الآني للحدث، حيث يتقاطع مع ملفات سياسية واقتصادية إقليمية تتطلب مراقبة دقيقة لمسارات التفاوض وصنع القرار.`,
    quotes: [
      {
        quote: 'نتابع عن كثب مجريات وتطورات الموقف بما يضمن الحفاظ على المصالح المشتركة والاستقرار.',
        speaker: 'الجهات الدبلوماسية المتابعة للملف',
        title: 'تصريح للمصادر الإخبارية'
      }
    ],
    faqList: [
      {
        question: 'ما هو جوهر هذا الخبر وما الذي حدث بالتحديد؟',
        answer: summary
      },
      {
        question: 'ما هي أهم التداعيات المتوقعة خلال الأيام القادمة؟',
        answer: 'من المتوقع صدور بيانات توضيحية من الأطراف المعنية، مع استمرار التواصل الدبلوماسي والميداني لتثبيت التفاهمات.'
      }
    ],
    whyItMatters: 'يمثل هذا التطور منعطفاً مهماً في مجريات الأحداث نظراً لتأثيره المباشر على التوازنات السياسية والاقتصادية ذات الصلة.',
    historicalContext: 'تعود جذور هذه القضية إلى سلسلة من الأحداث والمحطات السابقة التي شكلت المشهد الحالي عبر سنوات من التفاعل.',
    entities: [
      {
        name: sourceName,
        role: 'مصدر المتابعة والتوثيق',
        background: 'متابعة حية لتطورات الموقف والتصريحات الصادرة من مختلف الأطراف المعنية.'
      }
    ],
    expectedDevelopments: [
      'استمرار المشاورات بين الأطراف الفاعلة لاحتواء التداعيات',
      'ترقب صدور مؤشرات أو بيانات رسمية تؤكد مسار التهدئة أو التصعيد',
      'انعكاسات محتملة على حركة الأسواق والقطاعات المرتبطة'
    ],
    timeline: [
      {
        date: 'المرحلة التمهيدية',
        title: 'جذور الأزمة',
        description: 'بداية تشكل ملامح القضية وظهور التباينات بين الأطراف.'
      },
      {
        date: 'المحطة الوسيطة',
        title: 'تفاعل المواقف',
        description: 'تدخل الوسطاء ومحاولات التوصل إلى تسويات وتفاهمات مشتركة.'
      },
      {
        date: 'التطور الحالي',
        title: 'الحدث الأخير',
        description: 'الوصول إلى الواقعة الحالية محل التغطية الإخبارية المكثفة.'
      }
    ],
    wikipediaSources,
    relatedArchiveIds: archiveArticles.slice(0, 2).map(a => a.id),
    lastUpdated: new Date().toISOString()
  };
}
