export type Category =
  | 'politics'
  | 'economy'
  | 'sports'
  | 'conflicts'
  | 'technology'
  | 'health'
  | 'misc';

export type Importance = 'breaking' | 'important' | 'normal';

export interface SourceInfo {
  id: string;
  name: string; // e.g. الجزيرة, بي بي سي عربي, سكاي نيوز عربية, رويترز
  url: string;
  logo?: string;
  trustScore?: number; // 1-100
}

export interface TimelineEvent {
  id?: string;
  date: string;
  title: string;
  description: string;
}

export interface KeyFigure {
  name: string;
  role: string;
  background: string;
  wikipediaUrl?: string;
  imageUrl?: string;
}

export interface WikipediaSource {
  title: string;
  extract: string;
  url: string;
  thumbnail?: string;
}

export interface KeyQuote {
  quote: string;
  speaker: string;
  title?: string;
}

export interface NewsFaq {
  question: string;
  answer: string;
}

export interface FullStory {
  summary: string;
  fullReportParagraphs?: string[];
  keyHighlights?: string[];
  whyItMatters: string;
  historicalContext: string;
  inDepthAnalysis?: string;
  entities: KeyFigure[];
  quotes?: KeyQuote[];
  faqList?: NewsFaq[];
  expectedDevelopments: string[];
  timeline: TimelineEvent[];
  wikipediaSources: WikipediaSource[];
  relatedArchiveIds: string[];
  lastUpdated?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  fullContent?: string;
  originalSnippet?: string;
  category: Category;
  importance: Importance;
  publishedAt: string; // ISO string
  relativeTimeStr?: string;
  sources: SourceInfo[];
  primarySource: SourceInfo;
  sourceCount: number;
  corroborationCount?: number;
  isCorroborated: boolean; // 2+ sources corroborated
  imageUrl?: string;
  url: string;
  fullStory?: FullStory;
  sentiment?: 'neutral' | 'positive' | 'negative';
  readingTimeMinutes: number;
  aiRewritten: boolean;
  viewsCount?: number;
}

export interface UserPreferences {
  name: string;
  categories: Category[];
  notificationFrequency: 'smart' | 'breaking_only' | 'daily_digest' | 'both' | 'none';
  digestTime: string; // "08:00" or "20:00"
  onboardingCompleted: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  savedArticleIds: string[];
  themeMode: 'light' | 'dark' | 'navy';
  notificationsEnabled: boolean;
  fcmToken?: string;
}

export interface DailyDigest {
  date: string;
  title: string;
  executiveBrief: string;
  keyTakeaways: string[];
  topArticles: NewsArticle[];
  quoteOfTheDay?: {
    quote: string;
    speaker: string;
  };
}

export interface CategoryMeta {
  id: Category;
  label: string;
  iconName: string;
  color: string;
  bgLight: string;
  badgeBg: string;
  description: string;
}

export const CATEGORIES_META: Record<Category, CategoryMeta> = {
  politics: {
    id: 'politics',
    label: 'السياسة',
    iconName: 'Landmark',
    color: 'text-blue-600',
    bgLight: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeBg: 'bg-blue-600 text-white',
    description: 'الأخبار الدبلوماسية، الحكومات، والقرارات الدولية'
  },
  conflicts: {
    id: 'conflicts',
    label: 'حروب ونزاعات',
    iconName: 'ShieldAlert',
    color: 'text-amber-700',
    bgLight: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeBg: 'bg-amber-700 text-white',
    description: 'التطورات العسكرية، النزاعات الإقليمية، والأمن الدولي'
  },
  economy: {
    id: 'economy',
    label: 'الاقتصاد',
    iconName: 'TrendingUp',
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeBg: 'bg-emerald-600 text-white',
    description: 'الأسواق المالية، الطاقة، الاستثمار والتضخم'
  },
  technology: {
    id: 'technology',
    label: 'التكنولوجيا',
    iconName: 'Cpu',
    color: 'text-indigo-600',
    bgLight: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    badgeBg: 'bg-indigo-600 text-white',
    description: 'الذكاء الاصطناعي، الأمن السيبراني، والاختراقات التقنية'
  },
  sports: {
    id: 'sports',
    label: 'الرياضة',
    iconName: 'Trophy',
    color: 'text-cyan-600',
    bgLight: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    badgeBg: 'bg-cyan-600 text-white',
    description: 'البطولات العربية والعالمية، كرة القدم، والصفقات'
  },
  health: {
    id: 'health',
    label: 'الصحة',
    iconName: 'HeartPulse',
    color: 'text-rose-600',
    bgLight: 'bg-rose-50 text-rose-700 border-rose-200',
    badgeBg: 'bg-rose-600 text-white',
    description: 'الطب، الأوبئة، الأبحاث الصحية، ونمط الحياة'
  },
  misc: {
    id: 'misc',
    label: 'منوعات',
    iconName: 'Sparkles',
    color: 'text-purple-600',
    bgLight: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeBg: 'bg-purple-600 text-white',
    description: 'علوم وثقافة، قضايا المجتمع، وأخبار من حول العالم'
  }
};

export type AdZoneId = 'header_banner' | 'infeed_native' | 'sidebar_sticky' | 'modal_bottom';

export interface AdPlacement {
  id: AdZoneId;
  zoneName: string;
  enabled: boolean;
  type: 'custom' | 'adsense' | 'code';
  sponsorName?: string;
  adTitle?: string;
  adDescription?: string;
  imageUrl?: string;
  targetUrl?: string;
  buttonText?: string;
  badgeText?: string;
  adsenseClientId?: string;
  adsenseSlotId?: string;
  customHtml?: string;
}

export type SiteAdsConfig = Record<AdZoneId, AdPlacement>;

export const DEFAULT_ADS_CONFIG: SiteAdsConfig = {
  header_banner: {
    id: 'header_banner',
    zoneName: 'إعلان شريط أعلى الموقع (Header Banner)',
    enabled: true,
    type: 'custom',
    sponsorName: 'منصة خبراء الاستثمار والتقنية',
    adTitle: 'اشترك في النشرة الرقمية المتخصصة في أسواق المال والأعمال',
    adDescription: 'تحليلات يومية حصرية وتوصيات استثمارية مجانية مباشرة في بريدك.',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80',
    targetUrl: 'https://example.com/newsletter',
    buttonText: 'اشتراك مجاني',
    badgeText: 'إعلان ممول'
  },
  infeed_native: {
    id: 'infeed_native',
    zoneName: 'إعلان البطاقة الإخبارية المدمجة (In-Feed Sponsored)',
    enabled: true,
    type: 'custom',
    sponsorName: 'أكاديمية التقنية والذكاء الاصطناعي',
    adTitle: 'برنامج دبلوم هندسة الذكاء الاصطناعي التوليدي باللغة العربية',
    adDescription: 'انضم إلى أكثر من 50 ألف خبير ومتعلم في أحدث تقنيات البرمجة والذكاء الاصطناعي مع شهادات معتمدة.',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    targetUrl: 'https://example.com/ai-course',
    buttonText: 'سجل الآن',
    badgeText: 'برعاية'
  },
  sidebar_sticky: {
    id: 'sidebar_sticky',
    zoneName: 'إعلان الشريط العائم السفلي (Bottom Floating Bar)',
    enabled: false,
    type: 'custom',
    sponsorName: 'تطبيق التداول السريع',
    adTitle: 'احصل على مكافأة ترحيبية بقيمة 100$ عند فتح حساب تجريبي',
    adDescription: 'تداول الأسهم والسلع بسهولة وسرعة فائقة من هاتفك الذكي.',
    targetUrl: 'https://example.com/trading',
    buttonText: 'افتح حسابك',
    badgeText: 'إعلان شريك'
  },
  modal_bottom: {
    id: 'modal_bottom',
    zoneName: 'إعلان داخل نافذة التقرير الشامل (Modal Bottom Ad)',
    enabled: true,
    type: 'custom',
    sponsorName: 'مكتبة التحليلات السياسية والاقتصادية',
    adTitle: 'حمل التقرير الاستراتيجي الربع سنوي مجاناً بصيغة PDF',
    adDescription: 'دراسات جيوسياسية معمقة أعدها كبار المحللين والخبراء الإقليميين.',
    imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=500&q=80',
    targetUrl: 'https://example.com/report-pdf',
    buttonText: 'تحميل التقرير',
    badgeText: 'إعلان'
  }
};

export interface JsonBinConfig {
  binId: string;
  masterKey: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  statusMessage?: string;
}

export interface ArticleComment {
  id: string;
  articleId: string;
  userName: string;
  text: string;
  rating?: number;
  createdAt: string;
}

export interface ArticleRating {
  articleId: string;
  averageRating: number;
  totalVotes: number;
  likes: number;
  dislikes: number;
  userRating?: number;
  userReaction?: 'like' | 'dislike';
}

export interface VisitorStats {
  totalPageViews: number;
  uniqueVisitorsCount: number;
  activeOnlineCount: number;
  lastVisitAt: string;
}

