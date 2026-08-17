import { XMLParser } from 'fast-xml-parser';

export interface RawRSSItem {
  title: string;
  link: string;
  description?: string;
  content?: string;
  pubDate?: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl?: string;
}

export interface RSSFeedConfig {
  id: string;
  name: string;
  url: string;
  fallbackUrl?: string;
  homepage: string;
  categoryHint?: string;
  enabled: boolean;
}

export interface SourceHealthStatus {
  id: string;
  name: string;
  type: 'rss' | 'newsapi' | 'gnews';
  status: 'ok' | 'error' | 'disabled';
  lastFetched?: string;
  itemsCount?: number;
  errorMessage?: string;
}

export const TRUSTED_FEEDS: RSSFeedConfig[] = [
  {
    id: 'aljazeera',
    name: 'الجزيرة',
    url: 'https://www.aljazeera.net/aljazeerarss/rss',
    fallbackUrl: 'https://www.aljazeera.net/feed',
    homepage: 'https://www.aljazeera.net',
    enabled: true
  },
  {
    id: 'bbc-arabic',
    name: 'بي بي سي عربي',
    url: 'https://feeds.bbci.co.uk/arabic/rss.xml',
    homepage: 'https://www.bbc.com/arabic',
    enabled: true
  },
  {
    id: 'france24-arabic',
    name: 'فرانس 24',
    url: 'https://www.france24.com/ar/rss',
    homepage: 'https://www.france24.com/ar',
    enabled: true
  },
  {
    id: 'skynews-arabic',
    name: 'سكاي نيوز عربية',
    url: 'https://www.skynewsarabia.com/rss',
    fallbackUrl: 'https://www.skynewsarabia.com/rss/news.xml',
    homepage: 'https://www.skynewsarabia.com',
    enabled: true
  },
  {
    id: 'dw-arabic',
    name: 'دويتشه فيله (DW)',
    url: 'https://rss.dw.com/rdf/rss-ar-all',
    homepage: 'https://www.dw.com/ar',
    enabled: true
  },
  {
    id: 'rt-arabic',
    name: 'آر تي العربية',
    url: 'https://arabic.rt.com/rss/',
    homepage: 'https://arabic.rt.com',
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
  if (item['media:content'] && item['media:content']['@_url']) {
    return item['media:content']['@_url'];
  }
  if (item['enclosure'] && item['enclosure']['@_url']) {
    return item['enclosure']['@_url'];
  }
  if (item['media:thumbnail'] && item['media:thumbnail']['@_url']) {
    return item['media:thumbnail']['@_url'];
  }
  if (typeof item.description === 'string') {
    const match = item.description.match(/<img[^>]+src="([^">]+)"/i);
    if (match && match[1]) return match[1];
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
      const timeout = setTimeout(() => controller.abort(), 6500);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        lastError = `HTTP ${response.status}: ${response.statusText}`;
        console.warn(`[RSS Error] Feed ${feed.name} (${url}) returned HTTP ${response.status}`);
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
          imageUrl
        };
      }).filter(item => item.title.length > 5);

      sourceHealthMap.set(feed.id, {
        id: feed.id,
        name: feed.name,
        type: 'rss',
        status: 'ok',
        lastFetched: new Date().toISOString(),
        itemsCount: formatted.length
      });

      return formatted;

    } catch (error: any) {
      lastError = error?.message || String(error);
      console.warn(`[RSS Error] Feed ${feed.name} (${url}) fetch exception:`, lastError);
    }
  }

  // If all attempts failed, report the error
  sourceHealthMap.set(feed.id, {
    id: feed.id,
    name: feed.name,
    type: 'rss',
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
    const timeout = setTimeout(() => controller.abort(), 6500);

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
    const timeout = setTimeout(() => controller.abort(), 6500);

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

