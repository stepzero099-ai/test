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

export interface FullStory {
  summary: string;
  whyItMatters: string;
  historicalContext: string;
  entities: KeyFigure[];
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
  notificationFrequency: 'breaking_only' | 'daily_digest' | 'both' | 'none';
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
