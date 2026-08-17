import { XMLParser } from 'fast-xml-parser';
import { Category } from '../src/types.js';

export interface RawRSSItem {
  title: string;
  link: string;
  description?: string;
  content?: string;
  pubDate?: string;
  sourceName: string;
  sourceUrl: string;
  sourceLanguage?: 'ar' | 'en';
  reliabilityStars?: number;
  categoryHint?: Category;
  imageUrl?: string;
}

export interface RSSFeedConfig {
  id: string;
  name: string;
  url: string;
  fallbackUrl?: string;
  homepage: string;
  language: 'ar' | 'en';
  reliabilityStars: number; // 1 to 5
  reliabilityScore: number; // 1 to 100
  specialty: string;
  categoryHint?: Category;
  enabled: boolean;
}

export interface SourceHealthStatus {
  id: string;
  name: string;
  type: 'rss' | 'newsapi' | 'gnews';
  language?: 'ar' | 'en';
  reliabilityStars?: number;
  specialty?: string;
  status: 'ok' | 'error' | 'disabled';
  lastFetched?: string;
  itemsCount?: number;
  errorMessage?: string;
}

export const TRUSTED_FEEDS: RSSFeedConfig[] = [
  // ----------------------------------------------------
  // 1. المصادر العربية (Arabic News Feeds)
  // ----------------------------------------------------
  {
    id: 'aljazeera-ar',
    name: 'الجزيرة',
    url: 'https://www.aljazeera.net/aljazeerarss/rss',
    fallbackUrl: 'https://www.aljazeera.net/feed',
    homepage: 'https://www.aljazeera.net',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 98,
    specialty: 'أخبار عامة وسياسية',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'bbc-arabic',
    name: 'بي بي سي عربي',
    url: 'https://feeds.bbci.co.uk/arabic/rss.xml',
    homepage: 'https://www.bbc.com/arabic',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 97,
    specialty: 'أخبار دولية وتحليلات',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'france24-arabic',
    name: 'فرانس 24',
    url: 'https://www.france24.com/ar/rss',
    homepage: 'https://www.france24.com/ar',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 96,
    specialty: 'تغطية دولية وشؤون الساعة',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'skynews-arabic',
    name: 'سكاي نيوز عربية',
    url: 'https://www.skynewsarabia.com/rss',
    fallbackUrl: 'https://www.skynewsarabia.com/rss/news.xml',
    homepage: 'https://www.skynewsarabia.com',
    language: 'ar',
    reliabilityStars: 4,
    reliabilityScore: 90,
    specialty: 'أخبار إقليمية وعاجلة',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'dw-arabic',
    name: 'دويتشه فيله (DW)',
    url: 'https://rss.dw.com/rdf/rss-ar-all',
    homepage: 'https://www.dw.com/ar',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 95,
    specialty: 'شؤون أوروبية ودولية',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'rt-arabic',
    name: 'آر تي العربية',
    url: 'https://arabic.rt.com/rss/',
    homepage: 'https://arabic.rt.com',
    language: 'ar',
    reliabilityStars: 4,
    reliabilityScore: 88,
    specialty: 'أخبار عالمية وعاجلة',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'alarabiya',
    name: 'العربية',
    url: 'https://www.alarabiya.net/.mrss/ar.xml',
    fallbackUrl: 'https://www.alarabiya.net/rss',
    homepage: 'https://www.alarabiya.net',
    language: 'ar',
    reliabilityStars: 4,
    reliabilityScore: 91,
    specialty: 'أخبار إقليمية واقتصادية',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'trt-arabi',
    name: 'TRT عربي',
    url: 'https://www.trtarabi.com/rss',
    homepage: 'https://www.trtarabi.com',
    language: 'ar',
    reliabilityStars: 4,
    reliabilityScore: 89,
    specialty: 'شؤون إقليمية ودولية',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'anadolu-ar',
    name: 'وكالة الأناضول',
    url: 'https://www.aa.com.tr/ar/rss/default',
    fallbackUrl: 'https://news.google.com/rss/search?q=%D9%88%D9%83%D8%A7%D9%84%D8%A9+%D8%A7%D9%84%D8%A3%D9%86%D8%A7%D8%B6%D9%88%D9%84&hl=ar&gl=AE&ceid=AE:ar',
    homepage: 'https://www.aa.com.tr/ar',
    language: 'ar',
    reliabilityStars: 4,
    reliabilityScore: 90,
    specialty: 'وكالة أنباء إقليمية ودولية',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'un-news-ar',
    name: 'أخبار الأمم المتحدة',
    url: 'https://news.un.org/feed/subscribe/ar/news/all/rss.xml',
    homepage: 'https://news.un.org/ar',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 99,
    specialty: 'شؤون إنسانية وقرارات دولية (مفتوح)',
    categoryHint: 'conflicts',
    enabled: true
  },
  {
    id: 'google-news-ar',
    name: 'Google News عربي',
    url: 'https://news.google.com/rss?hl=ar&gl=AE&ceid=AE:ar',
    homepage: 'https://news.google.com',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 95,
    specialty: 'مجمّع صحفي شامل',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'google-news-trending-ar',
    name: 'Google Trends & World News (ترند العالم العربي)',
    url: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=ar&gl=AE&ceid=AE:ar',
    fallbackUrl: 'https://news.google.com/rss/search?q=%D8%AA%D8%B1%D9%86%D8%AF+%D8%A7%D9%84%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1+%D8%A7%D9%84%D8%B1%D8%A7%D8%A0%D8%AC%D8%A9&hl=ar&gl=AE&ceid=AE:ar',
    homepage: 'https://news.google.com',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 97,
    specialty: 'الأخبار الرائجة والترند الإقليمي والعالمي',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'skynews-breaking-ar',
    name: 'سكاي نيوز - عاجل والترند',
    url: 'https://www.skynewsarabia.com/rss/breaking-news.xml',
    homepage: 'https://www.skynewsarabia.com',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 95,
    specialty: 'الأحداث العاجلة والأنباء الرائجة',
    categoryHint: 'politics',
    enabled: true
  },

  // ----------------------------------------------------
  // المصادر المخصصة الجديدة حسب الطلب (الأهلي، الرياضة، إيران، أمريكا، فلسطين، مصر، التقنية)
  // ----------------------------------------------------
  // 🔴 1. الأهلي المصري (Al Ahly FC)
  {
    id: 'alahly-official',
    name: 'الموقع الرسمي للنادي الأهلي',
    url: 'https://www.alahlyegypt.com/ar/rss',
    fallbackUrl: 'https://news.google.com/rss/search?q=%D8%A7%D9%84%D9%86%D8%A7%D8%AF%D9%8A+%D8%A7%D9%84%D8%A3%D9%87%D9%84%D9%8A&hl=ar&gl=EG&ceid=EG:ar',
    homepage: 'https://www.alahlyegypt.com',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 98,
    specialty: 'أخبار النادي الأهلي الرسمية',
    categoryHint: 'sports',
    enabled: true
  },
  {
    id: 'filgoal-sports',
    name: 'FilGoal - في الجول',
    url: 'https://www.filgoal.com/rss',
    fallbackUrl: 'https://news.google.com/rss/search?q=site:filgoal.com&hl=ar&gl=EG&ceid=EG:ar',
    homepage: 'https://www.filgoal.com',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 96,
    specialty: 'تغطية الرياضة والأهلي والكرة المصرية',
    categoryHint: 'sports',
    enabled: true
  },
  {
    id: 'yallakora-sports',
    name: 'Yalla Kora - يلا كورة',
    url: 'https://www.yallakora.com/rss',
    fallbackUrl: 'https://news.google.com/rss/search?q=site:yallakora.com&hl=ar&gl=EG&ceid=EG:ar',
    homepage: 'https://www.yallakora.com',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 95,
    specialty: 'أخبار الكرة العربية والمصرية والأهلي',
    categoryHint: 'sports',
    enabled: true
  },
  {
    id: 'kooora-sports',
    name: 'Kooora - كووورة',
    url: 'https://news.google.com/rss/search?q=site:kooora.com&hl=ar&gl=EG&ceid=EG:ar',
    homepage: 'https://www.kooora.com',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 95,
    specialty: 'تغطية شاملة للرياضة والكرة العالمية والمحلية',
    categoryHint: 'sports',
    enabled: true
  },

  // ⚽ 2. الرياضة العالمية (Sports Global)
  {
    id: 'bbc-sport',
    name: 'BBC Sport',
    url: 'http://feeds.bbci.co.uk/sport/rss.xml',
    homepage: 'https://www.bbc.com/sport',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 98,
    specialty: 'Global Sports & Premier League',
    categoryHint: 'sports',
    enabled: true
  },
  {
    id: 'sky-sports',
    name: 'Sky Sports',
    url: 'https://www.skysports.com/rss/12040',
    homepage: 'https://www.skysports.com',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 97,
    specialty: 'European Football & Global Sports',
    categoryHint: 'sports',
    enabled: true
  },
  {
    id: 'scores365-ar',
    name: '365Scores - تغطية المباريات والترند',
    url: 'https://news.google.com/rss/search?q=365scores+%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1+%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D8%A9&hl=ar&gl=AE&ceid=AE:ar',
    homepage: 'https://www.365scores.com',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 95,
    specialty: 'نتائج وأخبار الرياضة اللحظية',
    categoryHint: 'sports',
    enabled: true
  },

  // 🇮🇷 3. إيران (Iran Coverage)
  {
    id: 'iran-news-wire',
    name: 'إيران - تغطية (Reuters & AP & BBC & الجزيرة & العربية)',
    url: 'https://news.google.com/rss/search?q=%D8%A5%D9%8A%D8%B1%D8%A7%D9%86+Iran+Reuters+AP+BBC+AlJazeera+AlArabiya&hl=ar&gl=AE&ceid=AE:ar',
    homepage: 'https://news.google.com',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 97,
    specialty: 'تغطية الملف الإيراني والشؤون الإقليمية',
    categoryHint: 'politics',
    enabled: true
  },

  // 🇺🇸 4. أمريكا (USA Coverage)
  {
    id: 'usa-news-wire',
    name: 'أمريكا - تغطية (Reuters & AP & BBC & CNN)',
    url: 'https://news.google.com/rss/search?q=%D8%A3%D9%85%D8%B1%D9%8A%D9%83%D8%A7+USA+CNN+Reuters+AP+BBC&hl=ar&gl=AE&ceid=AE:ar',
    homepage: 'https://news.google.com',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 98,
    specialty: 'الانتخابات والسياسة الأمريكية والعالمية',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'cnn-world',
    name: 'CNN World News',
    url: 'http://rss.cnn.com/rss/edition.rss',
    homepage: 'https://www.cnn.com',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 96,
    specialty: 'US & Global Breaking News',
    categoryHint: 'politics',
    enabled: true
  },

  // 🇵🇸 5. فلسطين (Palestine Coverage)
  {
    id: 'palestine-news-wire',
    name: 'فلسطين - تغطية (Reuters & AP & BBC & الجزيرة & Guardian)',
    url: 'https://news.google.com/rss/search?q=%D9%81%D9%84%D8%B3%D8%B7%D9%8A%D9%86+%D8%BA%D8%B2%D8%A9+Palestine+Reuters+AP+BBC+AlJazeera+Guardian&hl=ar&gl=AE&ceid=AE:ar',
    homepage: 'https://news.google.com',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 98,
    specialty: 'تغطية الشأن الفلسطيني وغزة والتطورات الميدانية',
    categoryHint: 'conflicts',
    enabled: true
  },

  // 🌍 6. العالم (World Coverage - Reuters, AP, BBC, AFP)
  {
    id: 'afp-world-ar',
    name: 'وكالة فرانس برس (AFP بالعربية)',
    url: 'https://news.google.com/rss/search?q=AFP+%D9%81%D8%B1%D8%A7%D9%86%D8%B3+%D8%A8%D8%B1%D8%B3+%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1+%D8%A7%D9%84%D8%B9%D8%A7%D9%84%D9%85&hl=ar&gl=AE&ceid=AE:ar',
    homepage: 'https://www.afp.com',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 99,
    specialty: 'وكالة أنباء عالمية موثوقة',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'reuters-world-en',
    name: 'Reuters World',
    url: 'https://news.google.com/rss/search?q=site:reuters.com+world&hl=en-US&gl=US&ceid=US:en',
    homepage: 'https://www.reuters.com',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 99,
    specialty: 'Global Wire & Business',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'ap-world-en',
    name: 'Associated Press (AP)',
    url: 'https://news.google.com/rss/search?q=site:apnews.com+world&hl=en-US&gl=US&ceid=US:en',
    homepage: 'https://apnews.com',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 99,
    specialty: 'International Wire News',
    categoryHint: 'politics',
    enabled: true
  },

  // 🇪🇬 7. مصر (Egypt Coverage)
  {
    id: 'egypt-news-wire',
    name: 'أخبار مصر (Reuters & BBC Arabic & مصادر مصرية)',
    url: 'https://news.google.com/rss/search?q=%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1+%D9%85%D8%B5%D8%B1+Egypt&hl=ar&gl=EG&ceid=EG:ar',
    homepage: 'https://news.google.com',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 97,
    specialty: 'تغطية الأخبار المصرية والاقتصادية والسياسية',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'egypt-top-media',
    name: 'الصحافة المصرية (مصراوي + اليوم السابع + الأهرام + الوطن)',
    url: 'https://news.google.com/rss/search?q=site:masrawy.com+OR+site:youm7.com+OR+site:ahram.org.eg+OR+site:elwatannews.com&hl=ar&gl=EG&ceid=EG:ar',
    homepage: 'https://www.youm7.com',
    language: 'ar',
    reliabilityStars: 5,
    reliabilityScore: 95,
    specialty: 'أخبار الشارع المصري والمستجدات المحلية',
    categoryHint: 'politics',
    enabled: true
  },

  // 💻 8. التقنية (Technology - Reuters Tech, The Verge, TechCrunch, Ars Technica)
  {
    id: 'reuters-tech',
    name: 'Reuters Tech News',
    url: 'https://news.google.com/rss/search?q=site:reuters.com+technology&hl=en-US&gl=US&ceid=US:en',
    homepage: 'https://www.reuters.com/technology',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 98,
    specialty: 'Global Tech & AI News',
    categoryHint: 'technology',
    enabled: true
  },

  // ----------------------------------------------------
  // 2. المصادر الدولية بالإنجليزية (International English Feeds)
  // ----------------------------------------------------
  {
    id: 'aljazeera-en',
    name: 'Al Jazeera English',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    homepage: 'https://www.aljazeera.com',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 96,
    specialty: 'General / Global In-depth',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'the-guardian',
    name: 'The Guardian',
    url: 'https://www.theguardian.com/world/rss',
    homepage: 'https://www.theguardian.com',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 97,
    specialty: 'World / Investigative',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'bbc-world',
    name: 'BBC World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    homepage: 'https://www.bbc.com/news/world',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 98,
    specialty: 'World / Breaking News',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'npr-news',
    name: 'NPR News',
    url: 'https://feeds.npr.org/1001/rss.xml',
    homepage: 'https://www.npr.org',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 95,
    specialty: 'General / Public Affairs',
    categoryHint: 'politics',
    enabled: true
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    homepage: 'https://techcrunch.com',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 95,
    specialty: 'Technology / Startups & AI',
    categoryHint: 'technology',
    enabled: true
  },
  {
    id: 'the-verge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    homepage: 'https://www.theverge.com',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 95,
    specialty: 'Technology / Gadgets & Future',
    categoryHint: 'technology',
    enabled: true
  },
  {
    id: 'ars-technica',
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    homepage: 'https://arstechnica.com',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 95,
    specialty: 'Technology / Science & Computing',
    categoryHint: 'technology',
    enabled: true
  },
  {
    id: 'espn-sports',
    name: 'ESPN',
    url: 'https://www.espn.com/espn/rss/news',
    homepage: 'https://www.espn.com',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 96,
    specialty: 'Sports / Global Athletics',
    categoryHint: 'sports',
    enabled: true
  },
  {
    id: 'cnbc-business',
    name: 'CNBC',
    url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
    homepage: 'https://www.cnbc.com',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 96,
    specialty: 'Economy / Financial Markets',
    categoryHint: 'economy',
    enabled: true
  },
  {
    id: 'nature-science',
    name: 'Nature',
    url: 'https://www.nature.com/nature.rss',
    homepage: 'https://www.nature.com',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 99,
    specialty: 'Health / Peer-reviewed Science',
    categoryHint: 'health',
    enabled: true
  },
  {
    id: 'sciencedaily',
    name: 'ScienceDaily',
    url: 'https://www.sciencedaily.com/rss/all.xml',
    homepage: 'https://www.sciencedaily.com',
    language: 'en',
    reliabilityStars: 5,
    reliabilityScore: 98,
    specialty: 'Health / Scientific Discoveries',
    categoryHint: 'health',
    enabled: true
  }
];

// Global status tracking for all news sources
export const sourceHealthMap = new Map<string, SourceHealthStatus>();

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true
});

function stripHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImage(item: any): string | undefined {
  const tryExtractFromUrl = (url: any): string | undefined => {
    if (typeof url === 'string' && url.trim().length > 8) {
      let cleaned = url.trim().replace(/&amp;/g, '&');
      if (cleaned.startsWith('//')) cleaned = `https:${cleaned}`;
      if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
        return cleaned;
      }
    }
    return undefined;
  };

  // 1. media:content (single or array)
  if (item['media:content']) {
    const mc = item['media:content'];
    if (Array.isArray(mc)) {
      for (const entry of mc) {
        const u = tryExtractFromUrl(entry?.['@_url'] || entry?.url || entry?.['@_href']);
        if (u) return u;
      }
    } else {
      const u = tryExtractFromUrl(mc?.['@_url'] || mc?.url || mc?.['@_href']);
      if (u) return u;
    }
  }

  // 2. media:thumbnail (single or array)
  if (item['media:thumbnail']) {
    const mt = item['media:thumbnail'];
    if (Array.isArray(mt)) {
      for (const entry of mt) {
        const u = tryExtractFromUrl(entry?.['@_url'] || entry?.url || entry?.['@_href']);
        if (u) return u;
      }
    } else {
      const u = tryExtractFromUrl(mt?.['@_url'] || mt?.url || mt?.['@_href']);
      if (u) return u;
    }
  }

  // 3. media:group
  if (item['media:group']) {
    const mg = item['media:group'];
    const mc = mg['media:content'] || mg['media:thumbnail'];
    if (Array.isArray(mc)) {
      for (const entry of mc) {
        const u = tryExtractFromUrl(entry?.['@_url'] || entry?.url);
        if (u) return u;
      }
    } else if (mc) {
      const u = tryExtractFromUrl(mc?.['@_url'] || mc?.url);
      if (u) return u;
    }
  }

  // 4. enclosure (single or array)
  if (item['enclosure']) {
    const enc = item['enclosure'];
    if (Array.isArray(enc)) {
      for (const entry of enc) {
        const u = tryExtractFromUrl(entry?.['@_url'] || entry?.url || entry?.['@_href']);
        if (u) return u;
      }
    } else {
      const u = tryExtractFromUrl(enc?.['@_url'] || enc?.url || enc?.['@_href']);
      if (u) return u;
    }
  }

  // 5. image or itunes:image
  if (item['image']) {
    const img = item['image'];
    const u = tryExtractFromUrl(img?.['@_url'] || img?.url || img?.['#text']);
    if (u) return u;
  }
  if (item['itunes:image']) {
    const iti = item['itunes:image'];
    const u = tryExtractFromUrl(iti?.['@_href'] || iti?.['@_url'] || iti?.url);
    if (u) return u;
  }

  // 6. Regex search in content:encoded, description, content
  const htmlFields = [item['content:encoded'], item.content, item.description];
  for (const field of htmlFields) {
    if (typeof field === 'string') {
      const match = field.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match && match[1]) {
        const u = tryExtractFromUrl(match[1]);
        if (u) return u;
      }
    }
  }

  return undefined;
}

export async function fetchFeed(feed: RSSFeedConfig): Promise<RawRSSItem[]> {
  const urlsToTry = [feed.url];
  if (feed.fallbackUrl) urlsToTry.push(feed.fallbackUrl);

  let lastError = '';

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (Khabar-Al-Lahza/1.0)',
          'Accept': 'application/rss+xml, application/rdf+xml, application/atom+xml, application/xml, text/xml, */*'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        lastError = `HTTP ${response.status}: ${response.statusText}`;
        continue;
      }

      const xmlText = await response.text();
      const parsed = parser.parse(xmlText);
      
      const rawItems: any[] = [];
      if (parsed.rss?.channel?.item) {
        if (Array.isArray(parsed.rss.channel.item)) {
          rawItems.push(...parsed.rss.channel.item);
        } else {
          rawItems.push(parsed.rss.channel.item);
        }
      } else if (parsed.feed?.entry) { // Atom feed
        if (Array.isArray(parsed.feed.entry)) {
          rawItems.push(...parsed.feed.entry);
        } else {
          rawItems.push(parsed.feed.entry);
        }
      } else if (parsed['rdf:RDF']?.item) {
        if (Array.isArray(parsed['rdf:RDF'].item)) {
          rawItems.push(...parsed['rdf:RDF'].item);
        } else {
          rawItems.push(parsed['rdf:RDF'].item);
        }
      }

      const formatted = rawItems.slice(0, 15).map((item) => {
        const title = stripHtml(typeof item.title === 'string' ? item.title : item.title?.['#text'] || '');
        const link = typeof item.link === 'string' ? item.link : item.link?.['@_href'] || item.link?.['#text'] || '';
        const description = stripHtml(typeof item.description === 'string' ? item.description : item.summary || item.content || '');
        const pubDate = item.pubDate || item.published || item.updated || item['dc:date'] || new Date().toISOString();
        const imageUrl = extractImage(item);

        return {
          title,
          link,
          description,
          pubDate: new Date(pubDate).toISOString(),
          sourceName: feed.name,
          sourceUrl: feed.homepage,
          sourceLanguage: feed.language,
          reliabilityStars: feed.reliabilityStars,
          categoryHint: feed.categoryHint,
          imageUrl
        };
      }).filter(item => item.title.length > 5);

      sourceHealthMap.set(feed.id, {
        id: feed.id,
        name: feed.name,
        type: 'rss',
        language: feed.language,
        reliabilityStars: feed.reliabilityStars,
        specialty: feed.specialty,
        status: 'ok',
        lastFetched: new Date().toISOString(),
        itemsCount: formatted.length
      });

      return formatted;

    } catch (error: any) {
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        lastError = 'استغرق الاتصال بالمصدر أكثر من 10 ثوانٍ وتم التجاوز تلقائياً إلى المصدر البديل';
      } else {
        lastError = error?.message || String(error);
      }
    }
  }

  // If all attempts failed, report the error in health map
  sourceHealthMap.set(feed.id, {
    id: feed.id,
    name: feed.name,
    type: 'rss',
    language: feed.language,
    reliabilityStars: feed.reliabilityStars,
    specialty: feed.specialty,
    status: 'error',
    lastFetched: new Date().toISOString(),
    itemsCount: 0,
    errorMessage: `تعذر جلب الخلاصة: ${lastError}`
  });

  return [];
}

/**
 * Fetch top Arabic news items from NewsAPI.org
 */
export async function fetchNewsApiItems(providedKey?: string): Promise<RawRSSItem[]> {
  const apiKey = providedKey || process.env.NEWS_API_KEY;
  if (!apiKey) {
    sourceHealthMap.set('newsapi', {
      id: 'newsapi',
      name: 'NewsAPI.org',
      type: 'newsapi',
      status: 'disabled',
      errorMessage: 'المفتاح غير معرّف في متغيرات البيئة (NEWS_API_KEY)'
    });
    return [];
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const url = `https://newsapi.org/v2/top-headlines?language=ar&pageSize=15&apiKey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = `HTTP ${res.status}`;
      console.warn(`[NewsAPI.org] Returned status ${res.status}`);
      sourceHealthMap.set('newsapi', {
        id: 'newsapi',
        name: 'NewsAPI.org',
        type: 'newsapi',
        status: 'error',
        lastFetched: new Date().toISOString(),
        itemsCount: 0,
        errorMessage: errText
      });
      return [];
    }

    const data = await res.json();
    const articles = data?.articles || [];

    const formatted: RawRSSItem[] = articles.map((art: any) => ({
      title: stripHtml(art.title || ''),
      link: art.url || '',
      description: stripHtml(art.description || art.content || ''),
      pubDate: art.publishedAt ? new Date(art.publishedAt).toISOString() : new Date().toISOString(),
      sourceName: art.source?.name ? `NewsAPI (${art.source.name})` : 'NewsAPI.org',
      sourceUrl: art.url || 'https://newsapi.org',
      imageUrl: art.urlToImage || undefined
    })).filter((item: RawRSSItem) => item.title.length > 5);

    sourceHealthMap.set('newsapi', {
      id: 'newsapi',
      name: 'NewsAPI.org',
      type: 'newsapi',
      status: 'ok',
      lastFetched: new Date().toISOString(),
      itemsCount: formatted.length
    });

    return formatted;
  } catch (err: any) {
    console.warn('[NewsAPI.org] Fetch error:', err?.message || err);
    sourceHealthMap.set('newsapi', {
      id: 'newsapi',
      name: 'NewsAPI.org',
      type: 'newsapi',
      status: 'error',
      lastFetched: new Date().toISOString(),
      itemsCount: 0,
      errorMessage: err?.message || 'خطأ في الاتصال'
    });
    return [];
  }
}

/**
 * Fetch top Arabic news items from GNews API v4
 */
export async function fetchGNewsItems(providedKey?: string): Promise<RawRSSItem[]> {
  const apiKey = providedKey || process.env.GNEWS_API_KEY;
  if (!apiKey) {
    sourceHealthMap.set('gnews', {
      id: 'gnews',
      name: 'GNews.io',
      type: 'gnews',
      status: 'disabled',
      errorMessage: 'المفتاح غير معرّف في متغيرات البيئة (GNEWS_API_KEY)'
    });
    return [];
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const url = `https://gnews.io/api/v4/top-headlines?category=general&lang=ar&max=15&apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[GNews] API returned status ${res.status}`);
      sourceHealthMap.set('gnews', {
        id: 'gnews',
        name: 'GNews.io',
        type: 'gnews',
        status: 'error',
        lastFetched: new Date().toISOString(),
        itemsCount: 0,
        errorMessage: `HTTP ${res.status}`
      });
      return [];
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.articles)) {
      return [];
    }

    const formatted: RawRSSItem[] = data.articles.map((art: any) => ({
      title: stripHtml(art.title || ''),
      link: art.url || '',
      description: stripHtml(art.description || art.content || ''),
      pubDate: art.publishedAt ? new Date(art.publishedAt).toISOString() : new Date().toISOString(),
      sourceName: art.source?.name ? `GNews (${art.source.name})` : 'GNews.io',
      sourceUrl: art.source?.url || 'https://gnews.io',
      imageUrl: art.image || undefined
    })).filter((item: RawRSSItem) => item.title.length > 5);

    sourceHealthMap.set('gnews', {
      id: 'gnews',
      name: 'GNews.io',
      type: 'gnews',
      status: 'ok',
      lastFetched: new Date().toISOString(),
      itemsCount: formatted.length
    });

    return formatted;
  } catch (err: any) {
    console.warn('[GNews] Fetch error:', err?.message || err);
    sourceHealthMap.set('gnews', {
      id: 'gnews',
      name: 'GNews.io',
      type: 'gnews',
      status: 'error',
      lastFetched: new Date().toISOString(),
      itemsCount: 0,
      errorMessage: err?.message || 'خطأ في الاتصال'
    });
    return [];
  }
}

/**
 * Fetch top news items from NewsData.io (supports Arabic & English)
 */
export async function fetchNewsDataItems(providedKey?: string): Promise<RawRSSItem[]> {
  const apiKey = providedKey || process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    sourceHealthMap.set('newsdata', {
      id: 'newsdata',
      name: 'NewsData.io',
      type: 'newsapi',
      language: 'ar',
      reliabilityStars: 5,
      specialty: 'تجميع إخباري عالمي لحظي',
      status: 'disabled',
      errorMessage: 'المفتاح غير معرّف في متغيرات البيئة (NEWSDATA_API_KEY)'
    });
    return [];
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const url = `https://newsdata.io/api/1/news?apikey=${encodeURIComponent(apiKey)}&language=ar&category=top,world,politics`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[NewsData.io] API returned status ${res.status}`);
      sourceHealthMap.set('newsdata', {
        id: 'newsdata',
        name: 'NewsData.io',
        type: 'newsapi',
        language: 'ar',
        reliabilityStars: 5,
        specialty: 'تجميع إخباري عالمي لحظي',
        status: 'error',
        lastFetched: new Date().toISOString(),
        itemsCount: 0,
        errorMessage: `HTTP ${res.status}`
      });
      return [];
    }

    const data = await res.json();
    const results = data?.results || [];

    const formatted: RawRSSItem[] = results.map((art: any) => ({
      title: stripHtml(art.title || ''),
      link: art.link || '',
      description: stripHtml(art.description || art.content || ''),
      pubDate: art.pubDate ? new Date(art.pubDate).toISOString() : new Date().toISOString(),
      sourceName: art.source_id ? `NewsData (${art.source_id})` : 'NewsData.io',
      sourceUrl: art.link || 'https://newsdata.io',
      sourceLanguage: 'ar',
      reliabilityStars: 5,
      imageUrl: art.image_url || undefined
    })).filter((item: RawRSSItem) => item.title.length > 5);

    sourceHealthMap.set('newsdata', {
      id: 'newsdata',
      name: 'NewsData.io',
      type: 'newsapi',
      language: 'ar',
      reliabilityStars: 5,
      specialty: 'تجميع إخباري عالمي لحظي',
      status: 'ok',
      lastFetched: new Date().toISOString(),
      itemsCount: formatted.length
    });

    return formatted;
  } catch (err: any) {
    console.warn('[NewsData.io] Fetch error:', err?.message || err);
    sourceHealthMap.set('newsdata', {
      id: 'newsdata',
      name: 'NewsData.io',
      type: 'newsapi',
      language: 'ar',
      reliabilityStars: 5,
      specialty: 'تجميع إخباري عالمي لحظي',
      status: 'error',
      lastFetched: new Date().toISOString(),
      itemsCount: 0,
      errorMessage: err?.message || 'خطأ في الاتصال'
    });
    return [];
  }
}

/**
 * Fetch top news items from FreeNewsAPI / Currents API / World News API
 */
export async function fetchFreeNewsItems(providedKey?: string): Promise<RawRSSItem[]> {
  const apiKey = providedKey || process.env.FREENEWS_API_KEY || process.env.CURRENTS_API_KEY;
  if (!apiKey) {
    sourceHealthMap.set('freenews', {
      id: 'freenews',
      name: 'FreeNews / Currents API',
      type: 'newsapi',
      language: 'ar',
      reliabilityStars: 4,
      specialty: 'خلاصة إخبارية رقمية مفتوحة',
      status: 'disabled',
      errorMessage: 'المفتاح غير معرّف في متغيرات البيئة (FREENEWS_API_KEY)'
    });
    return [];
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const url = `https://api.currentsapi.services/v1/latest-news?language=ar&apiKey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[FreeNewsAPI] API returned status ${res.status}`);
      sourceHealthMap.set('freenews', {
        id: 'freenews',
        name: 'FreeNews / Currents API',
        type: 'newsapi',
        language: 'ar',
        reliabilityStars: 4,
        specialty: 'خلاصة إخبارية رقمية مفتوحة',
        status: 'error',
        lastFetched: new Date().toISOString(),
        itemsCount: 0,
        errorMessage: `HTTP ${res.status}`
      });
      return [];
    }

    const data = await res.json();
    const newsItems = data?.news || [];

    const formatted: RawRSSItem[] = newsItems.map((art: any) => ({
      title: stripHtml(art.title || ''),
      link: art.url || '',
      description: stripHtml(art.description || ''),
      pubDate: art.published ? new Date(art.published).toISOString() : new Date().toISOString(),
      sourceName: art.author ? `Currents (${art.author})` : 'FreeNews / Currents',
      sourceUrl: art.url || 'https://currentsapi.services',
      sourceLanguage: 'ar',
      reliabilityStars: 4,
      imageUrl: art.image !== 'None' ? art.image : undefined
    })).filter((item: RawRSSItem) => item.title.length > 5);

    sourceHealthMap.set('freenews', {
      id: 'freenews',
      name: 'FreeNews / Currents API',
      type: 'newsapi',
      language: 'ar',
      reliabilityStars: 4,
      specialty: 'خلاصة إخبارية رقمية مفتوحة',
      status: 'ok',
      lastFetched: new Date().toISOString(),
      itemsCount: formatted.length
    });

    return formatted;
  } catch (err: any) {
    console.warn('[FreeNewsAPI] Fetch error:', err?.message || err);
    sourceHealthMap.set('freenews', {
      id: 'freenews',
      name: 'FreeNews / Currents API',
      type: 'newsapi',
      language: 'ar',
      reliabilityStars: 4,
      specialty: 'خلاصة إخبارية رقمية مفتوحة',
      status: 'error',
      lastFetched: new Date().toISOString(),
      itemsCount: 0,
      errorMessage: err?.message || 'خطأ في الاتصال'
    });
    return [];
  }
}
