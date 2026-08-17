import { WikipediaSource } from '../src/types.js';

const USER_AGENT = 'KhabarAlLahza/1.0 (contact@khabarlahza.app; https://khabarlahza.app)';

/**
 * Searches Wikipedia with Arabic as primary and English as automatic fallback
 */
export async function searchWikipediaWithFallback(keyword: string): Promise<WikipediaSource[]> {
  if (!keyword || keyword.trim().length < 2) return [];
  const cleanKeyword = keyword.trim().replace(/[؟!,.:"']/g, '');

  // 1. Try Arabic Wikipedia first
  const arSources = await queryWikipediaEndpoint('ar', cleanKeyword);
  if (arSources.length > 0) {
    return arSources;
  }

  // 2. Fallback to English Wikipedia if no Arabic results found
  const enSources = await queryWikipediaEndpoint('en', cleanKeyword);
  return enSources;
}

async function queryWikipediaEndpoint(lang: 'ar' | 'en', keyword: string): Promise<WikipediaSource[]> {
  try {
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(keyword)}&utf8=1&srlimit=2`;
    
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!res.ok) return [];
    const data = await res.json();
    const searchResults = data?.query?.search || [];
    if (searchResults.length === 0) return [];

    const pageTitles = searchResults.map((r: any) => r.title).join('|');
    const extractUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages|info&inprop=url&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=500&titles=${encodeURIComponent(pageTitles)}&utf8=1`;

    const detailRes = await fetch(extractUrl, {
      headers: { 'User-Agent': USER_AGENT }
    });

    if (!detailRes.ok) return [];
    const detailData = await detailRes.json();
    const pages = detailData?.query?.pages || {};

    const sources: WikipediaSource[] = [];
    for (const key of Object.keys(pages)) {
      const page = pages[key];
      if (page && page.title && page.extract) {
        sources.push({
          title: page.title,
          extract: page.extract.length > 500 ? page.extract.substring(0, 500) + '...' : page.extract,
          url: page.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
          thumbnail: page.thumbnail?.source
        });
      }
    }

    return sources;
  } catch (error) {
    console.warn(`[Wikipedia ${lang.toUpperCase()}] API Error:`, error);
    return [];
  }
}

// Keep searchArabicWikipedia alias for backwards compatibility
export const searchArabicWikipedia = searchWikipediaWithFallback;
