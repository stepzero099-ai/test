import { Category, Importance, NewsArticle, SourceInfo } from '../src/types.js';
import { fetchFeed, fetchGNewsItems, fetchNewsApiItems, RawRSSItem, sourceHealthMap, TRUSTED_FEEDS, SourceHealthStatus } from './rssEngine.js';
import { generateDailyDigestAi, generateFullStoryWithAi, processArticleWithAi } from './geminiService.js';
import { 
  getSupabase, 
  fetchArticlesFromDb, 
  saveArticlesToDb, 
  updateArticleFullStoryInDb, 
  savePushSubscriptionToDb, 
  fetchSubscribersFromDb, 
  saveSourceHealthToDb 
} from './supabase.js';
import { sendPushToTokens } from './firebaseAdmin.js';

// Seed initial curated high-quality articles with complete "الحكاية من الأول" stories and multi-source data
const INITIAL_ARTICLES: NewsArticle[] = [
  {
    id: 'art-001',
    title: 'مباحثات دبلوماسية مكثفة في جنيف لبحث وقف إطلاق النار ومسارات المساعدات الإنسانية',
    summary: 'انطلقت في جنيف جولة مفاوضات دبلوماسية جديدة بمشاركة وسطاء دوليين وإقليميين، تهدف إلى تثبيت هدنة إنسانية شاملة وتأمين ممرات آمنة لإدخال الإمدادات الإغاثية العاجلة إلى المناطق المتضررة.',
    category: 'conflicts',
    importance: 'breaking',
    publishedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    sources: [
      { id: 'aljazeera', name: 'الجزيرة', url: 'https://aljazeera.net' },
      { id: 'bbc', name: 'بي بي سي عربي', url: 'https://bbc.com/arabic' },
      { id: 'reuters', name: 'رويترز عربي', url: 'https://reuters.com' }
    ],
    primarySource: { id: 'aljazeera', name: 'الجزيرة', url: 'https://aljazeera.net' },
    sourceCount: 3,
    isCorroborated: true,
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1000&q=80',
    url: 'https://aljazeera.net',
    readingTimeMinutes: 2,
    aiRewritten: true,
    viewsCount: 4120,
    fullStory: {
      summary: 'تعود جذور مسار جنيف التفاوضي إلى مبادرات الوساطة الدولية المتعددة الرامية إلى منع اتساع رقعة الصراع وتوفير الحماية للمدنيين والبنى التحتية الحيوية.',
      whyItMatters: 'تسعى هذه الجولة إلى كسر الجمود وتفادي أزمة إنسانية كارثية، إضافة إلى تأثيرها المباشر على تهدئة التوترات الإقليمية والملاحة البحرية.',
      historicalContext: 'شهدت العقود الماضية محطات تفاوضية متكررة في مقر الأمم المتحدة بجنيف، حيث اعتُمدت منصة رئيسية لتقريب وجهات النظر وإبرام بروتوكولات حماية المدنيين.',
      entities: [
        {
          name: 'المبعوث الأممي الخاص',
          role: 'رئيس فريق الوساطة وتنسيق المباحثات',
          background: 'دبلوماسي مخضرم قاد جهود التهدئة في أكثر من ثلاث أزمات دولية سابقة.'
        },
        {
          name: 'منظمة الصليب الأحمر الدولية (ICRC)',
          role: 'الجهة المشرفة على الممرات الإنسانية',
          background: 'منظمة إنسانية محايدة ومستقلة مقرها جنيف تضمن إيصال المساعدات دون عوائق.'
        }
      ],
      expectedDevelopments: [
        'صدور بيان مشترك يحدد جداول زمنية للهدنة الميدانية المؤقتة',
        'بدء تسيير أول قافلة إغاثية تحت إشراف المراقبين الدوليين',
        'انعقاد جلسة طارئة لمجلس الأمن لاعتماد التفاهمات المبرمة'
      ],
      timeline: [
        { date: '2024 - الربع الأول', title: 'مبادرة الوسطاء', description: 'طرح ورقة عمل مبدئية لوقف التصعيد وفتح المعابر.' },
        { date: '2024 - منتصف العام', title: 'جولات تمهيدية في الدوحة والقاهرة', description: 'تثبيت الإطار العام ومبادئ التهدئة والتبادل.' },
        { date: 'اليوم', title: 'انطلاق محادثات جنيف الموسعة', description: 'جلوس الأطراف المعنية إلى طاولة التفاوض المباشر برعاية أممية.' }
      ],
      wikipediaSources: [
        {
          title: 'مقر الأمم المتحدة في جنيف',
          extract: 'مقر الأمم المتحدة في جنيف هو ثاني أكبر مراكز الأمم المتحدة بعد المقر الرئيسي في نيويورك، ويقع في قصر الأمم بسويسرا.',
          url: 'https://ar.wikipedia.org/wiki/قصر_الأمم'
        }
      ],
      relatedArchiveIds: []
    }
  },
  {
    id: 'art-002',
    title: 'البنوك المركزية العالمية تلمح لخفض جديد في أسعار الفائدة مع تباطؤ معدلات التضخم',
    summary: 'أشارت مؤشرات اقتصادية صادرة عن البنك المركزي الأوروبي ومجلس الاحتياطي الفيدرالي إلى احتمالية خفض تدريجي لأسعار الفائدة لدعم النمو الاقتصادي، بعد تسجيل تراجع مستمر في مؤشرات أسعار المستهلكين.',
    category: 'economy',
    importance: 'important',
    publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    sources: [
      { id: 'skynews', name: 'سكاي نيوز عربية', url: 'https://skynewsarabia.com' },
      { id: 'france24', name: 'فرانس 24', url: 'https://france24.com/ar' }
    ],
    primarySource: { id: 'skynews', name: 'سكاي نيوز عربية', url: 'https://skynewsarabia.com' },
    sourceCount: 2,
    isCorroborated: true,
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1000&q=80',
    url: 'https://skynewsarabia.com',
    readingTimeMinutes: 3,
    aiRewritten: true,
    viewsCount: 2890,
    fullStory: {
      summary: 'جاءت هذه التطورات بعد دورة تشديد نقدي تاريخية بدأت في 2022 للسيطرة على موجات التضخم التي أعقبت أزمة سلاسل الإمداد العالمية.',
      whyItMatters: 'يؤثر خفض الفائدة بصورة فورية على كلفة القروض للأفراد والشركات، وينعش تدفقات الاستثمار في أسواق الأسهم والعملات الرقمية والعقارات.',
      historicalContext: 'مر الاقتصاد العالمي على مدار السنوات الثلاث الماضية بأعلى مستويات فائدة منذ أكثر من 15 عاماً بهدف كبح التضخم دون إدخال الاقتصاد في ركود.',
      entities: [
        {
          name: 'الاحتياطي الفيدرالي الأمريكي',
          role: 'البنك المركزي للولايات المتحدة والموجه للسياسة النقدية الدولية',
          background: 'الهيئة النقدية المسؤولة عن تحديد سعر الفائدة المرجعي للدولار.'
        }
      ],
      expectedDevelopments: [
        'انعقاد اجتماع لجنة السوق المفتوحة لإقرار نسبة الخفض المستهدفة',
        'استجابة أسواق الأسهم العالمية بمكاسب للمؤشرات الرئيسية',
        'تعديل البنوك التجارية لفوائد القروض الاستهلاكية والعقارية'
      ],
      timeline: [
        { date: '2022', title: 'بدء دورة رفع الفائدة القياسية', description: 'رفع متسارع لأسعار الفائدة لمكافحة التضخم العالمي.' },
        { date: '2023', title: 'تثبيت الفائدة في القمة', description: 'فترة ترقب لتقييم أثر التشديد النقدي على أرقام الوظائف والتضخم.' },
        { date: '2024', title: 'بدء التيسير النقدي التدريجي', description: 'خفض أولي لأسعار الفائدة في ظل تراجع التضخم نحو المستهدفات.' }
      ],
      wikipediaSources: [
        {
          title: 'سعر الفائدة',
          extract: 'سعر الفائدة هو العائد على رأس المال المدفوع مقابل اقتراض النقود لفترة زمنية محددة.',
          url: 'https://ar.wikipedia.org/wiki/سعر_الفائدة'
        }
      ],
      relatedArchiveIds: []
    }
  },
  {
    id: 'art-003',
    title: 'إطلاق نموذج ذكاء اصطناعي عربي جديد متعدد الوسائط يتفوق في معالجة اللهجات الإقليمية',
    summary: 'أعلن مركز أبحاث التكنولوجيا المتقدمة عن إطلاق نموذج لغوي عربي فائق الدقة، قادر على فهم وتحليل النصوص واللهجات المحلية العربية بدقة غير مسبوقة مع دعم توليد المحتوى والبرمجة التلقائية.',
    category: 'technology',
    importance: 'normal',
    publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    sources: [
      { id: 'aljazeera', name: 'الجزيرة نت', url: 'https://aljazeera.net' },
      { id: 'dw', name: 'DW عربية', url: 'https://dw.com/ar' }
    ],
    primarySource: { id: 'aljazeera', name: 'الجزيرة نت', url: 'https://aljazeera.net' },
    sourceCount: 2,
    isCorroborated: true,
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1000&q=80',
    url: 'https://aljazeera.net',
    readingTimeMinutes: 2,
    aiRewritten: true,
    viewsCount: 1980
  },
  {
    id: 'art-004',
    title: 'قمة مناخية مصغرة تعتمد خطة تمويل طارئة لدعم مشاريع الطاقة الشمسية في الشرق الأوسط',
    summary: 'اختتمت القمة المناخية الإقليمية أعمالها بالموافقة على حزمة تمويلات خضراء بقيمة 12 مليار دولار لتعزيز مزارع الطاقة المتجددة ومحطات تحلية المياه بالطاقة النظيفة.',
    category: 'politics',
    importance: 'normal',
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    sources: [
      { id: 'bbc', name: 'بي بي سي عربي', url: 'https://bbc.com/arabic' }
    ],
    primarySource: { id: 'bbc', name: 'بي بي سي عربي', url: 'https://bbc.com/arabic' },
    sourceCount: 1,
    isCorroborated: false,
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1000&q=80',
    url: 'https://bbc.com/arabic',
    readingTimeMinutes: 2,
    aiRewritten: true,
    viewsCount: 1240
  },
  {
    id: 'art-005',
    title: 'الأهلي المصري يتأهل لنهائي دوري أبطال أفريقيا بعد مباراة مثيرة ضد الترجي التونسي',
    summary: 'حسم النادي الأهلي بطاقة العبور إلى المباراة النهائية للبطولة القارية بعد تغلبه على ضيفه الترجي في لقاء الإياب وسط حضور جماهيري غفير في استاد القاهرة الدولي.',
    category: 'sports',
    importance: 'important',
    publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    sources: [
      { id: 'aljazeera', name: 'الجزيرة رياضة', url: 'https://aljazeera.net' },
      { id: 'skynews', name: 'سكاي نيوز عربية', url: 'https://skynewsarabia.com' }
    ],
    primarySource: { id: 'aljazeera', name: 'الجزيرة رياضة', url: 'https://aljazeera.net' },
    sourceCount: 2,
    isCorroborated: true,
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
    url: 'https://aljazeera.net',
    readingTimeMinutes: 2,
    aiRewritten: true,
    viewsCount: 5320
  },
  {
    id: 'art-006',
    title: 'دراسة طبية حديثة تكشف فوائد النظام الغذائي المتوسطي في تعزيز صحة الدماغ والذاكرة',
    summary: 'أكدت دراسة سريرية مطولة شملت 10 آلاف مشارك أن الالتزام بالأطعمة الغنية بزيت الزيتون والخضروات والمكسرات يقلل مخاطر التدهور الإدراكي بنسبة تتجاوز 30%.',
    category: 'health',
    importance: 'normal',
    publishedAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    sources: [
      { id: 'dw', name: 'DW عربية', url: 'https://dw.com/ar' }
    ],
    primarySource: { id: 'dw', name: 'DW عربية', url: 'https://dw.com/ar' },
    sourceCount: 1,
    isCorroborated: false,
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1000&q=80',
    url: 'https://dw.com/ar',
    readingTimeMinutes: 2,
    aiRewritten: true,
    viewsCount: 1650
  }
];

export class NewsStore {
  private articles: NewsArticle[] = [...INITIAL_ARTICLES];
  private lastFetchTime: Date = new Date();
  private isFetching: boolean = false;
  private isDatabaseHydrated: boolean = false;
  private subscribedPushTokens: Set<string> = new Set();
  private userNotificationSubscriptions: Map<string, { categories: Category[]; frequency: string }> = new Map();

  constructor() {
  console.log('[NewsStore] 🏗️  Initializing...');
  
  if (process.env.VERCEL) {
    console.log('[NewsStore] Vercel environment - deferred hydration');
  } else {
    this.hydrateFromDatabase().catch(err => {
      console.warn('[NewsStore] ⚠️ Hydration warning:', err?.message || err);
    });
  }
}

  /**
   * Loads persisted articles from Supabase or seeds database if empty
   */
  private async hydrateFromDatabase(): Promise<void> {
    try {
      const dbArticles = await fetchArticlesFromDb(80);
      if (dbArticles && dbArticles.length > 0) {
        this.articles = dbArticles;
        this.isDatabaseHydrated = true;
        console.log(`[NewsStore] Hydrated ${dbArticles.length} articles from Supabase database.`);
      } else {
        // Seed initial articles into Supabase
        const saved = await saveArticlesToDb(this.articles);
        if (saved) {
          this.isDatabaseHydrated = true;
          console.log('[NewsStore] Initial articles seeded to Supabase database.');
        }
      }
    } catch (err: any) {
      console.warn('[NewsStore] Database hydration fallback:', err?.message || err);
    }
  }

  public getArticles(filter?: {
    category?: string;
    importance?: string;
    search?: string;
    corroboratedOnly?: boolean;
    limit?: number;
  }): NewsArticle[] {
    let result = [...this.articles];

    if (filter?.category && filter.category !== 'all' && filter.category !== 'saved') {
      result = result.filter(a => a.category === filter.category);
    }

    if (filter?.importance) {
      result = result.filter(a => a.importance === filter.importance);
    }

    if (filter?.corroboratedOnly) {
      result = result.filter(a => a.isCorroborated);
    }

    if (filter?.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.sources.some(s => s.name.toLowerCase().includes(q))
      );
    }

    // Sort breaking and newest first
    result.sort((a, b) => {
      if (a.importance === 'breaking' && b.importance !== 'breaking') return -1;
      if (b.importance === 'breaking' && a.importance !== 'breaking') return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    if (filter?.limit) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }

  public getArticleById(id: string): NewsArticle | undefined {
    return this.articles.find(a => a.id === id);
  }

  public getBreakingNews(): NewsArticle[] {
    return this.articles.filter(a => a.importance === 'breaking');
  }

  public async getOrGenerateFullStory(articleId: string): Promise<NewsArticle | null> {
    const article = this.getArticleById(articleId);
    if (!article) return null;

    if (article.fullStory && article.fullStory.entities && article.fullStory.entities.length > 0) {
      return article;
    }

    // Generate Full Story via AI + Wikipedia
    const fullStory = await generateFullStoryWithAi(article, this.articles);
    article.fullStory = fullStory;

    // Persist full story to Supabase
    updateArticleFullStoryInDb(articleId, fullStory).catch(err => {
      console.warn('[NewsStore] Failed to update full_story in Supabase:', err);
    });

    return article;
  }

  public async getDailyDigest(): Promise<any> {
    const digest = await generateDailyDigestAi(this.articles);
    return {
      date: new Date().toISOString(),
      title: digest.headline,
      executiveBrief: digest.executiveBrief,
      keyTakeaways: digest.keyTakeaways,
      quoteOfTheDay: digest.quoteOfTheDay,
      topArticles: this.articles.slice(0, 5)
    };
  }

  public getSourceStats(): any {
    const rssStats = TRUSTED_FEEDS.map(f => {
      const health = sourceHealthMap.get(f.id);
      const count = this.articles.filter(a => a.sources.some(s => s.id === f.id || s.name === f.name)).length;
      return {
        id: f.id,
        name: f.name,
        type: 'rss',
        url: f.homepage,
        feedUrl: f.url,
        articleCount: count,
        lastSync: health?.lastFetched || this.lastFetchTime.toISOString(),
        status: health?.status || 'online',
        errorMessage: health?.errorMessage
      };
    });

    const newsApiHealth = sourceHealthMap.get('newsapi');
    const newsApiStats = {
      id: 'newsapi',
      name: 'NewsAPI.org (المصدر الاحتياطي)',
      type: 'newsapi',
      url: 'https://newsapi.org',
      articleCount: this.articles.filter(a => a.sources.some(s => s.name.includes('NewsAPI'))).length,
      lastSync: newsApiHealth?.lastFetched || this.lastFetchTime.toISOString(),
      status: newsApiHealth?.status || (process.env.NEWS_API_KEY ? 'ok' : 'disabled'),
      errorMessage: newsApiHealth?.errorMessage || (!process.env.NEWS_API_KEY ? 'يتطلب مفتاح NEWS_API_KEY' : undefined)
    };

    const gnewsHealth = sourceHealthMap.get('gnews');
    const gnewsStats = {
      id: 'gnews',
      name: 'GNews.io (المصدر الإضافي المستقل)',
      type: 'gnews',
      url: 'https://gnews.io',
      articleCount: this.articles.filter(a => a.sources.some(s => s.name.includes('GNews'))).length,
      lastSync: gnewsHealth?.lastFetched || this.lastFetchTime.toISOString(),
      status: gnewsHealth?.status || (process.env.GNEWS_API_KEY ? 'ok' : 'disabled'),
      errorMessage: gnewsHealth?.errorMessage || (!process.env.GNEWS_API_KEY ? 'يتطلب مفتاح GNEWS_API_KEY' : undefined)
    };

    const allSources = [...rssStats, newsApiStats, gnewsStats];

    // Sync source health to Supabase
    saveSourceHealthToDb(Array.from(sourceHealthMap.values())).catch(() => {});

    return allSources;
  }

  public registerPushSubscriber(token: string, categories: Category[], frequency: string) {
    this.subscribedPushTokens.add(token);
    this.userNotificationSubscriptions.set(token, { categories, frequency });

    // Save subscription to Supabase for permanent multi-instance persistence
    savePushSubscriptionToDb(token, categories, frequency).catch(err => {
      console.warn('[NewsStore] Failed to save push subscription to Supabase:', err);
    });
  }

  public async refreshFeeds(): Promise<{ added: number; total: number }> {
    if (this.isFetching) return { added: 0, total: this.articles.length };
    this.isFetching = true;

    try {
      const rawItems: RawRSSItem[] = [];
      
      // Parallel fetch from all THREE source types:
      // A) RSS feeds (Al Jazeera, BBC Arabic, France24, Sky News Arabia, DW, RT)
      // B) NewsAPI.org
      // C) GNews.io
      const feedResults = await Promise.allSettled([
        ...TRUSTED_FEEDS.filter(f => f.enabled).map(f => fetchFeed(f)),
        fetchNewsApiItems(),
        fetchGNewsItems()
      ]);

      for (const res of feedResults) {
        if (res.status === 'fulfilled') {
          rawItems.push(...res.value);
        }
      }

      if (rawItems.length === 0) {
        this.isFetching = false;
        return { added: 0, total: this.articles.length };
      }

      // Group & deduplicate raw items by similarity
      const clusters = this.clusterRawItems(rawItems);
      const newlyAddedArticles: NewsArticle[] = [];

      // Prioritize top clusters
      for (const cluster of clusters.slice(0, 10)) {
        const primaryItem = cluster[0];
        // Check if we already have an article with similar title
        const existing = this.articles.find(a => this.isSimilarTitle(a.title, primaryItem.title));
        
        if (existing) {
          // Merge newly detected sources
          let mergedNewSource = false;
          for (const item of cluster) {
            if (!existing.sources.some(s => s.name === item.sourceName)) {
              existing.sources.push({
                id: item.sourceName.toLowerCase().replace(/\s+/g, '-'),
                name: item.sourceName,
                url: item.sourceUrl
              });
              mergedNewSource = true;
            }
          }
          if (mergedNewSource) {
            existing.sourceCount = existing.sources.length;
            existing.isCorroborated = existing.sources.length >= 2;
            newlyAddedArticles.push(existing);
          }
        } else {
          // New story cluster! Process with AI
          const sources: SourceInfo[] = cluster.map(item => ({
            id: item.sourceName.toLowerCase().replace(/\s+/g, '-'),
            name: item.sourceName,
            url: item.sourceUrl
          }));

          // Deduplicate sources in cluster
          const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);
          const snippets = cluster.map(c => c.description || c.title).filter(Boolean);

          const aiResult = await processArticleWithAi(primaryItem.title, snippets, uniqueSources);

          const newArticle: NewsArticle = {
            id: `art-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: aiResult.rewrittenTitle || primaryItem.title,
            summary: aiResult.summary || primaryItem.description || primaryItem.title,
            category: aiResult.category,
            importance: aiResult.importance,
            publishedAt: primaryItem.pubDate || new Date().toISOString(),
            sources: uniqueSources,
            primarySource: uniqueSources[0],
            sourceCount: uniqueSources.length,
            isCorroborated: uniqueSources.length >= 2,
            imageUrl: cluster.find(c => c.imageUrl)?.imageUrl || this.getDefaultImageForCategory(aiResult.category),
            url: primaryItem.link,
            readingTimeMinutes: aiResult.readingTimeMinutes || 2,
            aiRewritten: true,
            viewsCount: Math.floor(Math.random() * 500) + 50
          };

          this.articles.unshift(newArticle);
          newlyAddedArticles.push(newArticle);

          // Trigger REAL Firebase Web Push for breaking or important news
          if (newArticle.importance === 'breaking' || newArticle.importance === 'important') {
            this.dispatchPushNotificationForArticle(newArticle).catch(err => {
              console.warn('[NewsStore] Push notification dispatch exception:', err);
            });
          }

          // Small delay between AI requests to respect rate limits
          await new Promise(r => setTimeout(r, 200));
        }
      }

      // Cap at 100 articles
      if (this.articles.length > 100) {
        this.articles = this.articles.slice(0, 100);
      }

      // Persist newly added/updated articles to Supabase
      if (newlyAddedArticles.length > 0) {
        saveArticlesToDb(newlyAddedArticles).catch(err => {
          console.warn('[NewsStore] Failed to persist new articles to Supabase:', err);
        });
      }

      // Persist source health
      saveSourceHealthToDb(Array.from(sourceHealthMap.values())).catch(() => {});

      this.lastFetchTime = new Date();
      return { added: newlyAddedArticles.length, total: this.articles.length };
    } catch (err) {
      console.warn('[NewsStore] Refresh error:', err);
      return { added: 0, total: this.articles.length };
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Dispatches push notifications to subscribers in Supabase & memory
   */
  private async dispatchPushNotificationForArticle(article: NewsArticle): Promise<void> {
    try {
      // 1. Get tokens from Supabase
      const dbTokens = await fetchSubscribersFromDb(article.category);
      
      // 2. Combine with in-memory tokens
      const memoryTokens: string[] = [];
      this.userNotificationSubscriptions.forEach((sub, token) => {
        if (sub.frequency !== 'none' && (!sub.categories.length || sub.categories.includes(article.category))) {
          memoryTokens.push(token);
        }
      });

      const allTokens = Array.from(new Set([...dbTokens, ...memoryTokens]));
      if (allTokens.length === 0) return;

      const prefix = article.importance === 'breaking' ? '🔴 خبر عاجل | ' : '⚡ خبر هام | ';
      await sendPushToTokens(allTokens, {
        title: `${prefix}${article.title}`,
        body: article.summary,
        category: article.category,
        importance: article.importance,
        url: `/?article=${article.id}`
      });
      console.log(`[NewsStore] Sent push notification for article "${article.title}" to ${allTokens.length} devices.`);
    } catch (err: any) {
      console.warn('[NewsStore] dispatchPushNotification error:', err?.message || err);
    }
  }

  private clusterRawItems(items: RawRSSItem[]): RawRSSItem[][] {
    const clusters: RawRSSItem[][] = [];
    
    for (const item of items) {
      let matchedCluster = false;
      for (const cluster of clusters) {
        if (this.isSimilarTitle(cluster[0].title, item.title)) {
          cluster.push(item);
          matchedCluster = true;
          break;
        }
      }
      if (!matchedCluster) {
        clusters.push([item]);
      }
    }
    return clusters;
  }

  private isSimilarTitle(titleA: string, titleB: string): boolean {
    const cleanA = titleA.replace(/[^\u0621-\u064A\s]/g, '').trim().split(/\s+/);
    const cleanB = titleB.replace(/[^\u0621-\u064A\s]/g, '').trim().split(/\s+/);

    const stopwords = new Set(['في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'أن', 'إن', 'بين', 'بعد', 'قبل', 'خلال', 'ضد', 'ما', 'لا', 'لم', 'لن', 'هو', 'هي', 'هم']);
    const wordsA = new Set(cleanA.filter(w => w.length > 2 && !stopwords.has(w)));
    const wordsB = new Set(cleanB.filter(w => w.length > 2 && !stopwords.has(w)));

    if (wordsA.size === 0 || wordsB.size === 0) return false;

    let matchCount = 0;
    for (const w of wordsA) {
      if (wordsB.has(w)) matchCount++;
    }

    const similarity = matchCount / Math.min(wordsA.size, wordsB.size);
    return similarity >= 0.45;
  }

  private getDefaultImageForCategory(cat: Category): string {
    const images: Record<Category, string> = {
      politics: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1000&q=80',
      conflicts: 'https://images.unsplash.com/photo-1579273166152-d725a4e2b755?auto=format&fit=crop&w=1000&q=80',
      economy: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1000&q=80',
      technology: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1000&q=80',
      sports: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
      health: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1000&q=80',
      misc: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80'
    };
    return images[cat] || images.politics;
  }
}

export const newsStore = new NewsStore();
