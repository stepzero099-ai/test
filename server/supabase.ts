import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NewsArticle, Category, FullStory } from '../src/types.js';
import { SourceHealthStatus } from './rssEngine.js';

let supabaseClient: SupabaseClient | null = null;
let schemaMissingWarned = false;
let isArticlesTableAvailable = true;
let isPushTableAvailable = true;
let isSourceHealthTableAvailable = true;
let lastArticlesCheckTime = 0;
let lastPushCheckTime = 0;
let lastSourceHealthCheckTime = 0;

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      console.log('[Supabase] Client initialized with URL:', supabaseUrl);
    } catch (err: any) {
      console.warn('[Supabase] Failed to initialize client:', err?.message || err);
      supabaseClient = null;
    }
  }

  return supabaseClient;
}

export function isSupabaseTablesReady(): boolean {
  return isArticlesTableAvailable && getSupabase() !== null;
}

/**
 * Checks if the PostgREST / PostgreSQL error is due to a missing table in schema cache
 */
function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : (error.message || '');
  const code = error.code || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('Could not find the table') ||
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('relation')
  );
}

function handleTableMissing(tableName: string) {
  if (tableName === 'articles') {
    isArticlesTableAvailable = false;
    lastArticlesCheckTime = Date.now();
  } else if (tableName === 'push_subscriptions') {
    isPushTableAvailable = false;
    lastPushCheckTime = Date.now();
  } else if (tableName === 'source_health') {
    isSourceHealthTableAvailable = false;
    lastSourceHealthCheckTime = Date.now();
  }

  if (!schemaMissingWarned) {
    schemaMissingWarned = true;
    console.info(
      `[Supabase] Note: Table 'public.${tableName}' is not created yet in your Supabase project. The app is running smoothly using memory fallback. To enable persistent cloud storage, run the SQL script in /supabase-schema.sql in your Supabase SQL Editor.`
    );
  }
}

export const SUPABASE_SCHEMA_SQL = `
-- ==========================================================
-- منصة خبر اللحظة (Khabar Al-Lahza) - Supabase SQL Migration
-- ==========================================================

-- 1. جدول الأخبار والمقالات الموثقة
CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL,
  importance TEXT NOT NULL DEFAULT 'normal',
  published_at TIMESTAMPTZ NOT NULL,
  reading_time_minutes INTEGER DEFAULT 1,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_corroborated BOOLEAN DEFAULT false,
  corroboration_count INTEGER DEFAULT 1,
  full_story JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_importance ON public.articles(importance);

-- 2. جدول اشتراكات الإشعارات الفورية
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  token TEXT PRIMARY KEY,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  frequency TEXT DEFAULT 'both',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول صحة وحالة الخلاصات الإخبارية
CREATE TABLE IF NOT EXISTS public.source_health (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  last_fetched TIMESTAMPTZ,
  items_count INTEGER DEFAULT 0,
  error_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- سياسات الأمان RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on articles" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Allow public read access on source_health" ON public.source_health FOR SELECT USING (true);

CREATE POLICY "Allow anon insert/update on articles" ON public.articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert/update on push_subscriptions" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert/update on source_health" ON public.source_health FOR ALL USING (true) WITH CHECK (true);
`;

/**
 * Maps Supabase DB record to NewsArticle shape
 */
export function mapDbToArticle(row: any): NewsArticle {
  const sources = Array.isArray(row.sources) ? row.sources : (typeof row.sources === 'string' ? JSON.parse(row.sources) : []);
  const primary = sources.length > 0 ? sources[0] : { id: 'rss', name: 'وكالات الأنباء الموثقة', url: 'https://aljazeera.net' };

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    category: row.category as Category,
    importance: row.importance,
    publishedAt: row.published_at,
    readingTimeMinutes: row.reading_time_minutes || 1,
    sources,
    primarySource: primary,
    sourceCount: sources.length,
    isCorroborated: Boolean(row.is_corroborated) || sources.length >= 2,
    corroborationCount: row.corroboration_count || sources.length,
    url: row.url || primary.url || 'https://aljazeera.net',
    imageUrl: row.image_url,
    aiRewritten: true,
    viewsCount: row.views_count || Math.floor(Math.random() * 500) + 100,
    fullStory: row.full_story ? (typeof row.full_story === 'string' ? JSON.parse(row.full_story) : row.full_story) : undefined
  };
}

/**
 * Maps NewsArticle to Supabase DB record
 */
export function mapArticleToDb(art: NewsArticle): Record<string, any> {
  return {
    id: art.id,
    title: art.title,
    summary: art.summary,
    category: art.category,
    importance: art.importance,
    published_at: art.publishedAt,
    reading_time_minutes: art.readingTimeMinutes,
    sources: art.sources,
    is_corroborated: art.isCorroborated,
    corroboration_count: art.corroborationCount,
    full_story: art.fullStory || null,
    updated_at: new Date().toISOString()
  };
}

// Database helper operations

export async function fetchArticlesFromDb(limit = 60): Promise<NewsArticle[] | null> {
  const sb = getSupabase();
  if (!sb) return null;

  // If table is known to be missing and re-check cooldown has not elapsed (60s)
  if (!isArticlesTableAvailable && Date.now() - lastArticlesCheckTime < 60000) {
    return null;
  }

  try {
    const { data, error } = await sb
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (isTableMissingError(error)) {
        handleTableMissing('articles');
      } else {
        console.warn('[Supabase] fetchArticles warning:', error.message);
      }
      return null;
    }

    // Success! Mark table as available
    isArticlesTableAvailable = true;
    schemaMissingWarned = false;

    if (!data || data.length === 0) return null;
    return data.map(mapDbToArticle);
  } catch (err: any) {
    if (isTableMissingError(err)) {
      handleTableMissing('articles');
    } else {
      console.warn('[Supabase] Exception in fetchArticles:', err?.message || err);
    }
    return null;
  }
}

export async function saveArticlesToDb(articles: NewsArticle[]): Promise<boolean> {
  const sb = getSupabase();
  if (!sb || articles.length === 0) return false;

  // If table is known to be missing and re-check cooldown has not elapsed (60s)
  if (!isArticlesTableAvailable && Date.now() - lastArticlesCheckTime < 60000) {
    return false;
  }

  try {
    const rows = articles.map(mapArticleToDb);
    const { error } = await sb
      .from('articles')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      if (isTableMissingError(error)) {
        handleTableMissing('articles');
      } else {
        console.warn('[Supabase] saveArticles upsert warning:', error.message);
      }
      return false;
    }

    isArticlesTableAvailable = true;
    schemaMissingWarned = false;
    return true;
  } catch (err: any) {
    if (isTableMissingError(err)) {
      handleTableMissing('articles');
    } else {
      console.warn('[Supabase] Exception in saveArticles:', err?.message || err);
    }
    return false;
  }
}

export async function updateArticleFullStoryInDb(articleId: string, fullStory: FullStory): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  if (!isArticlesTableAvailable && Date.now() - lastArticlesCheckTime < 60000) {
    return false;
  }

  try {
    const { error } = await sb
      .from('articles')
      .update({
        full_story: fullStory,
        updated_at: new Date().toISOString()
      })
      .eq('id', articleId);

    if (error) {
      if (isTableMissingError(error)) {
        handleTableMissing('articles');
      } else {
        console.warn('[Supabase] updateArticleFullStory warning:', error.message);
      }
      return false;
    }
    return true;
  } catch (err: any) {
    if (isTableMissingError(err)) {
      handleTableMissing('articles');
    } else {
      console.warn('[Supabase] Exception in updateArticleFullStory:', err?.message || err);
    }
    return false;
  }
}

export async function savePushSubscriptionToDb(token: string, categories: Category[], frequency: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  if (!isPushTableAvailable && Date.now() - lastPushCheckTime < 60000) {
    return false;
  }

  try {
    const { error } = await sb
      .from('push_subscriptions')
      .upsert({
        token,
        categories,
        frequency,
        updated_at: new Date().toISOString()
      }, { onConflict: 'token' });

    if (error) {
      if (isTableMissingError(error)) {
        handleTableMissing('push_subscriptions');
      } else {
        console.warn('[Supabase] savePushSubscription warning:', error.message);
      }
      return false;
    }
    isPushTableAvailable = true;
    return true;
  } catch (err: any) {
    if (isTableMissingError(err)) {
      handleTableMissing('push_subscriptions');
    } else {
      console.warn('[Supabase] Exception in savePushSubscription:', err?.message || err);
    }
    return false;
  }
}

export async function fetchSubscribersFromDb(category?: Category): Promise<string[]> {
  const sb = getSupabase();
  if (!sb) return [];

  if (!isPushTableAvailable && Date.now() - lastPushCheckTime < 60000) {
    return [];
  }

  try {
    const { data, error } = await sb
      .from('push_subscriptions')
      .select('token, categories, frequency');

    if (error) {
      if (isTableMissingError(error)) {
        handleTableMissing('push_subscriptions');
      } else {
        console.warn('[Supabase] fetchSubscribers warning:', error.message);
      }
      return [];
    }

    if (!data) return [];
    isPushTableAvailable = true;

    const matchingTokens = data
      .filter((sub: any) => {
        if (sub.frequency === 'none') return false;
        if (!category) return true;
        const cats: string[] = Array.isArray(sub.categories) ? sub.categories : [];
        return cats.length === 0 || cats.includes(category);
      })
      .map((sub: any) => sub.token);

    return matchingTokens;
  } catch (err: any) {
    if (isTableMissingError(err)) {
      handleTableMissing('push_subscriptions');
    } else {
      console.warn('[Supabase] Exception in fetchSubscribers:', err?.message || err);
    }
    return [];
  }
}

export async function saveSourceHealthToDb(statuses: SourceHealthStatus[]): Promise<boolean> {
  const sb = getSupabase();
  if (!sb || statuses.length === 0) return false;

  if (!isSourceHealthTableAvailable && Date.now() - lastSourceHealthCheckTime < 60000) {
    return false;
  }

  try {
    const rows = statuses.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      status: s.status,
      last_fetched: s.lastFetched || new Date().toISOString(),
      items_count: s.itemsCount || 0,
      error_message: s.errorMessage || null,
      updated_at: new Date().toISOString()
    }));

    const { error } = await sb
      .from('source_health')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      if (isTableMissingError(error)) {
        handleTableMissing('source_health');
      } else {
        console.warn('[Supabase] saveSourceHealth warning:', error.message);
      }
      return false;
    }
    isSourceHealthTableAvailable = true;
    return true;
  } catch (err: any) {
    if (isTableMissingError(err)) {
      handleTableMissing('source_health');
    } else {
      console.warn('[Supabase] Exception in saveSourceHealth:', err?.message || err);
    }
    return false;
  }
}
