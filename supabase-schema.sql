-- ==========================================================
-- منصة خبر اللحظة (Khabar Al-Lahza) - Supabase SQL Migration
-- قم بنسخ هذا الكود ولصقه في Supabase SQL Editor ثم اضغط Run
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

-- إنشاء فهارس لتحسين سرعة الاستعلامات والفلترة
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_importance ON public.articles(importance);

-- 2. جدول اشتراكات الإشعارات الفورية (Web Push Tokens)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  token TEXT PRIMARY KEY,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  frequency TEXT DEFAULT 'both',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول صحة وحالة الخلاصات الإخبارية (Source Health)
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

-- تمكين سياسات الوصول العام الآمن (Row Level Security - RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_health ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة لجميع الزوار
CREATE POLICY "Allow public read access on articles" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Allow public read access on source_health" ON public.source_health FOR SELECT USING (true);

-- السماح بعمليات الإدخال والتحديث
CREATE POLICY "Allow anon insert/update on articles" ON public.articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert/update on push_subscriptions" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert/update on source_health" ON public.source_health FOR ALL USING (true) WITH CHECK (true);
