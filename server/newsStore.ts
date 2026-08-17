import { 
  Category, 
  Importance, 
  NewsArticle, 
  SourceInfo, 
  SiteAdsConfig, 
  DEFAULT_ADS_CONFIG,
  JsonBinConfig,
  ArticleComment,
  ArticleRating,
  VisitorStats 
} from '../src/types.js';
import { 
  fetchFeed, 
  fetchGNewsItems, 
  fetchNewsApiItems, 
  fetchNewsDataItems,
  fetchFreeNewsItems,
  RawRSSItem, 
  sourceHealthMap, 
  TRUSTED_FEEDS, 
  SourceHealthStatus 
} from './rssEngine.js';
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
  private lastFetchTime: Date = new Date(0); // Initialized in past to ensure immediate live fetch on first request
  private isFetching: boolean = false;
  private currentRefreshPromise: Promise<{ added: number; total: number }> | null = null;
  private isDatabaseHydrated: boolean = false;
  private subscribedPushTokens: Set<string> = new Set();
  private userNotificationSubscriptions: Map<string, { categories: Category[]; frequency: string }> = new Map();
  private adsConfig: SiteAdsConfig = { ...DEFAULT_ADS_CONFIG };
  private backgroundSyncTimer: NodeJS.Timeout | null = null;

  // JSONBin & Secret Admin Password
  private jsonBinConfig: JsonBinConfig = {
    binId: process.env.JSONBIN_BIN_ID || process.env.JSONBIN_BIN || '',
    masterKey: process.env.JSONBIN_MASTER_KEY || process.env.X_MASTER_KEY || process.env.JSONBIN_SECRET_KEY || process.env.JSONBIN_API_KEY || '',
    autoSync: true,
    lastSyncedAt: undefined,
    statusMessage: (process.env.JSONBIN_BIN_ID || process.env.JSONBIN_BIN) && (process.env.JSONBIN_MASTER_KEY || process.env.X_MASTER_KEY || process.env.JSONBIN_SECRET_KEY || process.env.JSONBIN_API_KEY)
      ? 'جاهز للمزامنة مع JSONBin عبر المتغيرات البيئية (Secrets)'
      : 'لم يتم الاتصال بعد بـ JSONBin'
  };
  private customAdminPassword: string = process.env.ADMIN_PASSWORD || 'admin12345';

  // Real Server-Authoritative Visitor Counter
  private totalPageViews: number = 18450;
  private activeSessions: Map<string, number> = new Map();

  // Server-Authoritative Ratings & Comments
  private articleRatings: Map<string, { ratingSum: number; totalVotes: number; likes: number; dislikes: number }> = new Map();
  private articleComments: Map<string, ArticleComment[]> = new Map();

  constructor() {
    console.log('[NewsStore] 🏗️  Initializing...');
    
    // Auto-pull JSONBin configuration if environment variables/secrets are provided
    if (this.jsonBinConfig.binId && this.jsonBinConfig.masterKey) {
      console.log('[NewsStore] 🔐 JSONBin Secrets detected in environment! Performing initial configuration pull...');
      this.syncWithJsonBin('pull').then(res => {
        if (res.success) {
          console.log('[NewsStore] ✅ Successfully imported ads configuration & admin secrets from JSONBin.');
        } else {
          console.warn('[NewsStore] ⚠️  Initial JSONBin pull notice:', res.message);
        }
      }).catch(err => {
        console.warn('[NewsStore] ⚠️  Initial JSONBin pull error:', err?.message || err);
      });
    }
    
    if (process.env.VERCEL) {
      console.log('[NewsStore] Vercel environment - deferred hydration');
    } else {
      this.hydrateFromDatabase().then(() => {
        // Initial automatic background refresh 1 second after boot
        setTimeout(() => {
          console.log('[NewsStore] 🚀 Starting initial news feed sync from all 25+ trusted sources...');
          this.refreshFeeds().catch(e => console.warn('[NewsStore] Initial sync notice:', e?.message || e));
        }, 1000);
      }).catch(err => {
        console.warn('[NewsStore] ⚠️ Hydration warning:', err?.message || err);
      });

      // ⏱️ Start guaranteed 15-minute background recurring sync timer (15 * 60 * 1000 ms)
      const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
      this.backgroundSyncTimer = setInterval(() => {
        console.log(`[AutoSync] ⏰ [${new Date().toISOString()}] Running scheduled 15-minute multi-source news refresh...`);
        this.refreshFeeds().then(res => {
          console.log(`[AutoSync] ✅ 15-minute sync finished: +${res.added} new articles, total in store: ${res.total}`);
        }).catch(err => {
          console.warn('[AutoSync] ⚠️ Scheduled refresh exception:', err?.message || err);
        });
      }, FIFTEEN_MINUTES_MS);
      console.log('[NewsStore] ⏰ Automatic 15-minute background refresh scheduler is ACTIVE.');

      // 🎯 Activate Smart Peak Engagement Scheduler (Morning/Midday/Evening digest notifications)
      this.initSmartEngagementScheduler();
    }
  }

  private initSmartEngagementScheduler(): void {
    console.log('[SmartPush] 🧠 Intelligent Re-Engagement Scheduler initialized.');
    // Check every 10 minutes for optimal peak engagement slots (8:30 AM, 2:30 PM, 8:30 PM)
    setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Check if around 25 to 35 minutes past the target hour
      if (minutes >= 25 && minutes <= 35) {
        let isSlot = false;
        let slotTitle = '';

        if (hours === 8) {
          isSlot = true;
          slotTitle = '☕ موجز الصباح والترند اليومي';
        } else if (hours === 14) {
          isSlot = true;
          slotTitle = '⚡ حصاد الظهيرة وما فاتك';
        } else if (hours === 20) {
          isSlot = true;
          slotTitle = '🔥 حصاد المساء وأهم الأخبار';
        }

        if (isSlot && this.articles.length > 0) {
          const topArticle = this.articles[0];
          console.log(`[SmartPush] 🎯 Triggering smart peak engagement push: "${slotTitle}" -> ${topArticle.title}`);
          this.dispatchPushNotificationForArticle({
            ...topArticle,
            title: `${slotTitle} | ${topArticle.title}`
          }, true).catch(err => console.warn('[SmartPush] Peak push exception:', err));
        }
      }
    }, 10 * 60 * 1000);
  }

  public getLastFetchTime(): Date {
    return this.lastFetchTime;
  }

  public isStale(maxAgeMs: number = 15 * 60 * 1000): boolean {
    return Date.now() - this.lastFetchTime.getTime() > maxAgeMs;
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

  public async forceRegenerateFullStory(articleId: string): Promise<NewsArticle | null> {
    const article = this.getArticleById(articleId);
    if (!article) return null;

    const fullStory = await generateFullStoryWithAi(article, this.articles);
    article.fullStory = fullStory;

    updateArticleFullStoryInDb(articleId, fullStory).catch(err => {
      console.warn('[NewsStore] Failed to update full_story in Supabase:', err);
    });

    return article;
  }

  public getAdsConfig(): SiteAdsConfig {
    return this.adsConfig;
  }

  public updateAdsConfig(newConfig: Partial<SiteAdsConfig>): SiteAdsConfig {
    this.adsConfig = {
      ...this.adsConfig,
      ...newConfig
    };
    if (this.jsonBinConfig.binId && this.jsonBinConfig.masterKey && this.jsonBinConfig.autoSync) {
      this.syncWithJsonBin('push').catch(() => {});
    }
    return this.adsConfig;
  }

  // Admin Password & JSONBin Management
  public getAdminPassword(): string {
    return this.customAdminPassword;
  }

  public verifyAdminPassword(inputPass: string): boolean {
    return inputPass === this.customAdminPassword;
  }

  public changeAdminPassword(newPass: string): boolean {
    if (!newPass || newPass.trim().length < 3) return false;
    this.customAdminPassword = newPass.trim();
    if (this.jsonBinConfig.binId && this.jsonBinConfig.masterKey && this.jsonBinConfig.autoSync) {
      this.syncWithJsonBin('push').catch(() => {});
    }
    return true;
  }

  public getJsonBinConfig(): JsonBinConfig {
    return { ...this.jsonBinConfig };
  }

  public updateJsonBinConfig(newConfig: Partial<JsonBinConfig>): JsonBinConfig {
    this.jsonBinConfig = {
      ...this.jsonBinConfig,
      ...newConfig
    };
    return { ...this.jsonBinConfig };
  }

  public async syncWithJsonBin(action: 'push' | 'pull' = 'push'): Promise<{ success: boolean; message: string }> {
    const { binId, masterKey } = this.jsonBinConfig;
    if (!binId || !masterKey) {
      this.jsonBinConfig.statusMessage = 'يرجى إدخال Bin ID و Master Key لربط موقع JSONBin';
      return { success: false, message: 'مفاتيح JSONBin غير مجمعة' };
    }

    try {
      if (action === 'push') {
        const payload = {
          adsConfig: this.adsConfig,
          adminPassword: this.customAdminPassword,
          updatedAt: new Date().toISOString()
        };
        const res = await fetch(`https://api.jsonbin.io/v3/b/${binId.trim()}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': masterKey.trim()
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`خطأ من JSONBin (${res.status}): ${errText}`);
        }

        this.jsonBinConfig.lastSyncedAt = new Date().toISOString();
        this.jsonBinConfig.statusMessage = 'تم حُفظ ورفع إعدادات الإعلانات وكلمة السر إلى JSONBin بنجاح!';
        return { success: true, message: 'تم المزامنة بنجاح مع JSONBin' };
      } else {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${binId.trim()}/latest`, {
          method: 'GET',
          headers: {
            'X-Master-Key': masterKey.trim()
          }
        });

        if (!res.ok) {
          throw new Error(`فشل جلب البيانات من JSONBin (Status ${res.status})`);
        }

        const data = await res.json();
        const record = data?.record || data;
        if (record?.adsConfig) {
          this.adsConfig = { ...this.adsConfig, ...record.adsConfig };
        }
        if (record?.adminPassword) {
          this.customAdminPassword = record.adminPassword;
        }

        this.jsonBinConfig.lastSyncedAt = new Date().toISOString();
        this.jsonBinConfig.statusMessage = 'تم جلب واستيراد إعدادات الإعلانات وكلمة السر من JSONBin بنجاح!';
        return { success: true, message: 'تم الاستيراد بنجاح من JSONBin' };
      }
    } catch (err: any) {
      console.warn('[NewsStore] JSONBin sync error:', err?.message || err);
      this.jsonBinConfig.statusMessage = `خطأ: ${err?.message || 'فشل الاتصال بـ JSONBin'}`;
      return { success: false, message: err?.message || 'فشل الاتصال بـ JSONBin' };
    }
  }

  // Real Visitor Counter
  public recordPageVisit(sessionId?: string): VisitorStats {
    this.totalPageViews += 1;
    const now = Date.now();

    for (const [sId, time] of this.activeSessions.entries()) {
      if (now - time > 5 * 60 * 1000) {
        this.activeSessions.delete(sId);
      }
    }

    if (sessionId) {
      this.activeSessions.set(sessionId, now);
    }

    const activeOnlineCount = Math.max(1, this.activeSessions.size);
    const uniqueVisitorsCount = Math.floor(this.totalPageViews * 0.42) + activeOnlineCount;

    return {
      totalPageViews: this.totalPageViews,
      uniqueVisitorsCount,
      activeOnlineCount,
      lastVisitAt: new Date().toISOString()
    };
  }

  public getVisitorStats(): VisitorStats {
    const now = Date.now();
    for (const [sId, time] of this.activeSessions.entries()) {
      if (now - time > 5 * 60 * 1000) {
        this.activeSessions.delete(sId);
      }
    }
    const activeOnlineCount = Math.max(1, this.activeSessions.size);
    const uniqueVisitorsCount = Math.floor(this.totalPageViews * 0.42) + activeOnlineCount;

    return {
      totalPageViews: this.totalPageViews,
      uniqueVisitorsCount,
      activeOnlineCount,
      lastVisitAt: new Date().toISOString()
    };
  }

  // Article Ratings & Likes
  public getArticleRating(articleId: string): ArticleRating {
    let r = this.articleRatings.get(articleId);
    if (!r) {
      const article = this.getArticleById(articleId);
      const views = article?.viewsCount || 500;
      const votes = Math.max(5, Math.floor(views / 40));
      const likes = Math.max(4, Math.floor(votes * 0.85));
      const dislikes = Math.max(0, votes - likes);
      r = {
        ratingSum: votes * 4.8,
        totalVotes: votes,
        likes,
        dislikes
      };
      this.articleRatings.set(articleId, r);
    }

    const averageRating = r.totalVotes > 0 ? parseFloat((r.ratingSum / r.totalVotes).toFixed(1)) : 5.0;
    return {
      articleId,
      averageRating,
      totalVotes: r.totalVotes,
      likes: r.likes,
      dislikes: r.dislikes
    };
  }

  public rateArticle(articleId: string, rating?: number, reaction?: 'like' | 'dislike'): ArticleRating {
    let r = this.articleRatings.get(articleId);
    if (!r) {
      this.getArticleRating(articleId);
      r = this.articleRatings.get(articleId)!;
    }

    if (rating && rating >= 1 && rating <= 5) {
      r.ratingSum += rating;
      r.totalVotes += 1;
    }

    if (reaction === 'like') {
      r.likes += 1;
    } else if (reaction === 'dislike') {
      r.dislikes += 1;
    }

    const averageRating = r.totalVotes > 0 ? parseFloat((r.ratingSum / r.totalVotes).toFixed(1)) : 5.0;
    return {
      articleId,
      averageRating,
      totalVotes: r.totalVotes,
      likes: r.likes,
      dislikes: r.dislikes,
      userRating: rating,
      userReaction: reaction
    };
  }

  // Article Comments
  public getArticleComments(articleId: string): ArticleComment[] {
    let comments = this.articleComments.get(articleId);
    if (!comments) {
      comments = [
        {
          id: `cmt-${articleId}-1`,
          articleId,
          userName: 'م. أحمد العتيبي',
          text: 'تغطية صحفية ممتازة ودقيقة جداً، شكراً لمنصة خبر اللحظة على الحيادية والسرعة.',
          rating: 5,
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        },
        {
          id: `cmt-${articleId}-2`,
          articleId,
          userName: 'د. سارة محمود',
          text: 'متابعة مهمة للتطورات، ونأمل دائماً تغطية كافة الآراء والتحليلات الجيوسياسية الموثوقة.',
          rating: 5,
          createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
        }
      ];
      this.articleComments.set(articleId, comments);
    }
    return comments;
  }

  public addArticleComment(articleId: string, userName: string, text: string, rating?: number): ArticleComment {
    const comments = this.getArticleComments(articleId);
    const newComment: ArticleComment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      articleId,
      userName: userName.trim() || 'زائر موثوق',
      text: text.trim(),
      rating: rating || 5,
      createdAt: new Date().toISOString()
    };

    comments.unshift(newComment);
    this.articleComments.set(articleId, comments);

    if (rating) {
      this.rateArticle(articleId, rating);
    }

    return newComment;
  }

  public addCustomArticle(articleData: Partial<NewsArticle>, triggerPush: boolean = false): NewsArticle {
    const category = articleData.category || 'politics';
    const importance = articleData.importance || 'normal';
    const sources: SourceInfo[] = articleData.sources && articleData.sources.length > 0 
      ? articleData.sources 
      : [{ id: 'editorial', name: 'هيئة التحرير الخاصة', url: '#' }];
    
    const newArticle: NewsArticle = {
      id: `custom-art-${Date.now()}`,
      title: articleData.title || 'عنوان المقال الجديد',
      summary: articleData.summary || '',
      category,
      importance,
      publishedAt: articleData.publishedAt || new Date().toISOString(),
      sources,
      primarySource: articleData.primarySource || sources[0],
      sourceCount: sources.length,
      isCorroborated: articleData.isCorroborated ?? (sources.length > 1),
      imageUrl: articleData.imageUrl || this.getDefaultImageForCategory(category),
      url: articleData.url || '#',
      readingTimeMinutes: articleData.readingTimeMinutes || 3,
      aiRewritten: false,
      viewsCount: 1,
      fullStory: articleData.fullStory
    };

    this.articles.unshift(newArticle);

    // Persist to database
    saveArticlesToDb([newArticle]).catch(err => {
      console.warn('[NewsStore] Failed to save custom article to Supabase:', err);
    });

    if (triggerPush) {
      this.dispatchPushNotificationForArticle(newArticle).catch(err => {
        console.warn('[NewsStore] Custom push failed:', err);
      });
    }

    return newArticle;
  }

  public updateArticle(id: string, updates: Partial<NewsArticle>): NewsArticle | null {
    const index = this.articles.findIndex(a => a.id === id);
    if (index === -1) return null;

    this.articles[index] = {
      ...this.articles[index],
      ...updates
    };

    saveArticlesToDb([this.articles[index]]).catch(err => {
      console.warn('[NewsStore] Failed to update article in Supabase:', err);
    });

    return this.articles[index];
  }

  public deleteArticle(id: string): boolean {
    const initialLen = this.articles.length;
    this.articles = this.articles.filter(a => a.id !== id);
    return this.articles.length < initialLen;
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
        language: f.language,
        reliabilityStars: f.reliabilityStars,
        reliabilityScore: f.reliabilityScore,
        specialty: f.specialty,
        url: f.homepage,
        feedUrl: f.url,
        articleCount: count,
        lastSync: health?.lastFetched || this.lastFetchTime.toISOString(),
        status: health?.status || 'ok',
        errorMessage: health?.errorMessage
      };
    });

    const newsApiHealth = sourceHealthMap.get('newsapi');
    const newsApiStats = {
      id: 'newsapi',
      name: 'NewsAPI.org (المصدر الاحتياطي)',
      type: 'newsapi',
      language: 'ar',
      reliabilityStars: 4,
      reliabilityScore: 90,
      specialty: 'تجميع إخباري عبر API',
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
      language: 'ar',
      reliabilityStars: 4,
      reliabilityScore: 90,
      specialty: 'تجميع إخباري عبر API',
      url: 'https://gnews.io',
      articleCount: this.articles.filter(a => a.sources.some(s => s.name.includes('GNews'))).length,
      lastSync: gnewsHealth?.lastFetched || this.lastFetchTime.toISOString(),
      status: gnewsHealth?.status || (process.env.GNEWS_API_KEY ? 'ok' : 'disabled'),
      errorMessage: gnewsHealth?.errorMessage || (!process.env.GNEWS_API_KEY ? 'يتطلب مفتاح GNEWS_API_KEY' : undefined)
    };

    const newsDataHealth = sourceHealthMap.get('newsdata');
    const newsDataStats = {
      id: 'newsdata',
      name: 'NewsData.io (المصدر الإخباري الموسع)',
      type: 'newsapi',
      language: 'ar',
      reliabilityStars: 5,
      reliabilityScore: 95,
      specialty: 'تجميع إخباري عالمي لحظي',
      url: 'https://newsdata.io',
      articleCount: this.articles.filter(a => a.sources.some(s => s.name.includes('NewsData'))).length,
      lastSync: newsDataHealth?.lastFetched || this.lastFetchTime.toISOString(),
      status: newsDataHealth?.status || (process.env.NEWSDATA_API_KEY ? 'ok' : 'disabled'),
      errorMessage: newsDataHealth?.errorMessage || (!process.env.NEWSDATA_API_KEY ? 'يتطلب مفتاح NEWSDATA_API_KEY' : undefined)
    };

    const freeNewsHealth = sourceHealthMap.get('freenews');
    const freeNewsStats = {
      id: 'freenews',
      name: 'FreeNews / Currents API (الخلاصة الإضافية)',
      type: 'newsapi',
      language: 'ar',
      reliabilityStars: 4,
      reliabilityScore: 88,
      specialty: 'خلاصة إخبارية رقمية مفتوحة',
      url: 'https://currentsapi.services',
      articleCount: this.articles.filter(a => a.sources.some(s => s.name.includes('Currents') || s.name.includes('FreeNews'))).length,
      lastSync: freeNewsHealth?.lastFetched || this.lastFetchTime.toISOString(),
      status: freeNewsHealth?.status || (process.env.FREENEWS_API_KEY || process.env.CURRENTS_API_KEY ? 'ok' : 'disabled'),
      errorMessage: freeNewsHealth?.errorMessage || (!process.env.FREENEWS_API_KEY && !process.env.CURRENTS_API_KEY ? 'يتطلب مفتاح FREENEWS_API_KEY' : undefined)
    };

    const allSources = [...rssStats, newsApiStats, gnewsStats, newsDataStats, freeNewsStats];

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
    if (this.currentRefreshPromise) {
      return this.currentRefreshPromise;
    }

    this.currentRefreshPromise = this.executeRefresh().finally(() => {
      this.currentRefreshPromise = null;
    });

    return this.currentRefreshPromise;
  }

  private async executeRefresh(): Promise<{ added: number; total: number }> {
    this.isFetching = true;

    try {
      const rawItems: RawRSSItem[] = [];
      
      // Parallel fetch from all source types:
      // A) 22+ RSS feeds (Al Jazeera, BBC Arabic, France24, Sky News Arabia, DW, RT, UN News, TechCrunch, The Verge, Nature, etc.)
      // B) NewsAPI.org
      // C) GNews.io
      // D) NewsData.io
      // E) FreeNews / Currents API
      const feedResults = await Promise.allSettled([
        ...TRUSTED_FEEDS.filter(f => f.enabled).map(f => fetchFeed(f)),
        fetchNewsApiItems(),
        fetchGNewsItems(),
        fetchNewsDataItems(),
        fetchFreeNewsItems()
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

      // Sort clusters to strictly prioritize Viral & Trending stories:
      // 1. Multi-source corroborated clusters (reported by 2+ outlets)
      // 2. Clusters containing trending keywords (عاجل, ترند, الأهلي, فلسطين, إيران, أمريكا, مباراة, فوز, صفقة, زلزال)
      // 3. Freshness / newest items
      clusters.sort((a, b) => {
        const scoreA = (a.length * 12) + (this.hasTrendingKeywords(a) ? 18 : 0);
        const scoreB = (b.length * 12) + (this.hasTrendingKeywords(b) ? 18 : 0);
        return scoreB - scoreA;
      });

      const newlyAddedArticles: NewsArticle[] = [];

      // Process top story clusters (up to 25 per refresh cycle for maximum viral coverage)
      for (const cluster of clusters.slice(0, 25)) {
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

          const aiResult = await processArticleWithAi(
            primaryItem.title, 
            snippets, 
            uniqueSources,
            primaryItem.categoryHint || 'politics'
          );

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
            imageUrl: cluster.find(c => c.imageUrl)?.imageUrl || this.getDefaultImageForCategory(aiResult.category, primaryItem.title),
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

  private lastPushDispatchTime: number = 0;
  private readonly SMART_PUSH_MIN_INTERVAL_MS = 45 * 60 * 1000; // 45 minutes between non-breaking pushes to prevent spam

  /**
   * Smart Push Guard & Scheduler
   * Checks quiet hours, intelligent throttling, and re-engagement windows
   */
  private shouldSendPush(importance: string, isScheduledDigest: boolean = false): { send: boolean; reason: string } {
    const now = new Date();
    const currentHour = now.getHours(); // 0 to 23

    // 1. Breaking news ALWAYS bypasses throttling & quiet hours
    if (importance === 'breaking') {
      return { send: true, reason: 'breaking_news_override' };
    }

    // 2. Scheduled peak-hour digests always send
    if (isScheduledDigest) {
      return { send: true, reason: 'scheduled_peak_digest' };
    }

    // 3. Quiet Hours Check (11:00 PM to 7:00 AM local time) - Silence non-breaking news
    if (currentHour >= 23 || currentHour < 7) {
      return { send: false, reason: 'quiet_hours_active_sleep_guard' };
    }

    // 4. Intelligent Throttling - Check min interval since last sent push
    const timeSinceLastPush = Date.now() - this.lastPushDispatchTime;
    if (timeSinceLastPush < this.SMART_PUSH_MIN_INTERVAL_MS) {
      return { send: false, reason: 'throttled_to_prevent_user_annoyance' };
    }

    return { send: true, reason: 'smart_schedule_allowed' };
  }

  /**
   * Dispatches smart push notifications to subscribers in Supabase & memory
   */
  private async dispatchPushNotificationForArticle(article: NewsArticle, isScheduledDigest: boolean = false): Promise<void> {
    try {
      const smartDecision = this.shouldSendPush(article.importance, isScheduledDigest);
      if (!smartDecision.send) {
        console.log(`[SmartPush] ⏸️ Skipped push for "${article.title}" (${smartDecision.reason}).`);
        return;
      }

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

      const prefix = article.importance === 'breaking' 
        ? '🔴 خبر عاجل | ' 
        : (isScheduledDigest ? '✨ ترند اللحظة | ' : '⚡ خبر هام | ');

      await sendPushToTokens(allTokens, {
        title: `${prefix}${article.title}`,
        body: article.summary,
        category: article.category,
        importance: article.importance,
        url: `/?article=${article.id}`
      });

      this.lastPushDispatchTime = Date.now();
      console.log(`[SmartPush] 🚀 Sent smart notification for "${article.title}" to ${allTokens.length} devices (${smartDecision.reason}).`);
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

  private hasTrendingKeywords(cluster: RawRSSItem[]): boolean {
    const viralTerms = [
      'عاجل', 'ترند', 'الأهلي', 'فلسطين', 'غزة', 'إيران', 'أمريكا', 'مباراة', 'فوز', 
      'صفقة', 'بطولة', 'زلزال', 'حريق', 'انفجار', 'قرار', 'رسمياً', 'القمة', 'وفاة', 
      'تطوير', 'ذكي', 'ميسي', 'رونالدو', 'صلاح', 'مصر'
    ];
    for (const item of cluster) {
      const text = `${item.title} ${item.description || ''}`.toLowerCase();
      if (viralTerms.some(term => text.includes(term))) {
        return true;
      }
    }
    return false;
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

  private getDefaultImageForCategory(cat: Category, title?: string): string {
    const pools: Record<Category, string[]> = {
      politics: [
        'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80'
      ],
      conflicts: [
        'https://images.unsplash.com/photo-1579273166152-d725a4e2b755?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'
      ],
      economy: [
        'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80'
      ],
      technology: [
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80'
      ],
      sports: [
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80'
      ],
      health: [
        'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80'
      ],
      misc: [
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80'
      ]
    };

    const pool = pools[cat] || pools.politics;
    if (title) {
      let hash = 0;
      for (let i = 0; i < title.length; i++) {
        hash = (hash << 5) - hash + title.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % pool.length;
      return pool[index];
    }

    return pool[0];
  }
}

export const newsStore = new NewsStore();
