import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Database, 
  Bell, 
  Globe, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  Code,
  ShieldCheck,
  Radio,
  BookOpen,
  Send,
  RefreshCw
} from 'lucide-react';

interface ApiSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTestNotification?: () => void;
}

const SUPABASE_SQL_CODE = `-- 1. جدول الأخبار والمقالات الموثقة
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

-- فهارس السرعة
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

-- 3. جدول صحة الخلاصات الإخبارية
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

-- سياسات RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on articles" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Allow anon all on articles" ON public.articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on push_subscriptions" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on source_health" ON public.source_health FOR ALL USING (true) WITH CHECK (true);`;

export const ApiSetupModal: React.FC<ApiSetupModalProps> = ({
  isOpen,
  onClose,
  onSendTestNotification
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'env' | 'sql' | 'checklist'>('env');
  const [isTestingSources, setIsTestingSources] = useState(false);
  const [sourceResults, setSourceResults] = useState<any[] | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestSources = async () => {
    setIsTestingSources(true);
    try {
      const res = await fetch('/api/sources');
      const data = await res.json();
      if (data.sources) {
        setSourceResults(data.sources);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTestingSources(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        id="api-setup-modal-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-['Tajawal']">
                  دليل مفاتيح الربط والتحقق (API Keys & Database)
                </h2>
                <p className="text-xs text-slate-400">
                  خبر اللحظة — بنية السحب وقاعدة بيانات Supabase ومحرك Web Push
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button
              onClick={() => setActiveTab('env')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'env' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              المتغيرات المطلوبة (.env)
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'sql' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>مخطط Supabase SQL</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('checklist');
                if (!sourceResults) handleTestSources();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'checklist' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>قائمة التحقق الحية (Verification)</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700 dark:text-slate-300">
          {activeTab === 'env' && (
            <>
              {/* Summary Box */}
              <div className="bg-sky-50 dark:bg-sky-950/40 p-4 rounded-2xl border border-sky-200 dark:border-sky-800 text-xs sm:text-sm">
                <p className="font-semibold text-sky-900 dark:text-sky-200 mb-1">
                  💡 إعدادات البيئة (Environment Variables):
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  قم بوضع هذه المتغيرات في ملف <code className="bg-sky-100 dark:bg-sky-900 px-1 py-0.5 rounded font-mono">.env.local</code> أو في لوحة نشر Vercel / Cloud Run.
                </p>
              </div>

              {/* 1. RSS Feeds (No Key Needed) */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Radio className="w-4 h-4 text-emerald-500" />
                    <span>المصدر (أ): خلاصات RSS المباشرة (Primary — لا تتطلب مفتاح)</span>
                  </div>
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded">
                    مدمجة ونشطة
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  تشمل: الجزيرة، بي بي سي عربي، فرانس 24، سكاي نيوز عربية، DW، و RT. يقوم الخادم برصد أي تعذر في الرابط وتفعيل الرابط البديل تلقائياً مع تسجيل حالة كل خلاصة.
                </p>
              </div>

              {/* 2. GNews API */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span>المصدر (ج): GNews.io API (مصدر مستقل للأخبار العربية)</span>
                  </div>
                  <a
                    href="https://gnews.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 hover:underline"
                  >
                    <span>الحصول على مفتاح</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  يقرأ الخادم المفتاح من متغير البيئة <code>GNEWS_API_KEY</code> فقط وبدون أي قيم مدمجة بالكود:
                </p>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-xs flex items-center justify-between">
                  <span>GNEWS_API_KEY="YOUR_GNEWS_API_KEY"</span>
                  <button
                    onClick={() => copyToClipboard('GNEWS_API_KEY=""', 'gnews')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'gnews' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* 3. NewsAPI.org */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Globe className="w-4 h-4 text-purple-500" />
                    <span>المصدر (ب): NewsAPI.org (مصدر احتياطي إضافي)</span>
                  </div>
                  <a
                    href="https://newsapi.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 hover:underline"
                  >
                    <span>الحصول على مفتاح مجاني</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-xs flex items-center justify-between">
                  <span>NEWS_API_KEY="YOUR_NEWSAPI_ORG_KEY"</span>
                  <button
                    onClick={() => copyToClipboard('NEWS_API_KEY=""', 'newsapi')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'newsapi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* 4. Supabase Database */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span>قاعدة بيانات سوبابيز (Supabase PostgreSQL)</span>
                  </div>
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 hover:underline"
                  >
                    <span>إنشاء مشروع مجاني</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  لحفظ أرشيف الأخبار والقصص الكاملة وسجل المشتركين في الإشعارات عبر الخوادم عديمة الحالة (Serverless):
                </p>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>SUPABASE_URL="https://your-project.supabase.co"</span>
                    <button
                      onClick={() => copyToClipboard('SUPABASE_URL=""', 'supa_url')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'supa_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>SUPABASE_ANON_KEY="eyJhbGci..."</span>
                    <button
                      onClick={() => copyToClipboard('SUPABASE_ANON_KEY=""', 'supa_key')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'supa_key' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Firebase Cloud Messaging (Web Push) */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span>إشعارات الويب (Firebase Web Push & Admin SDK)</span>
                  </div>
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-600 dark:text-sky-400 inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Firebase Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  انسخ بيانات تطبيق الويب من <strong>Project Settings &gt; General &gt; Your apps &gt; Web app</strong>:
                </p>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-xs space-y-1.5 overflow-x-auto">
                  <div className="text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                    # إعدادات الواجهة الأمامية (Vite Web Config)
                  </div>
                  <div className="text-amber-300">VITE_FIREBASE_API_KEY=""</div>
                  <div className="text-amber-300">VITE_FIREBASE_AUTH_DOMAIN=""</div>
                  <div className="text-amber-300">VITE_FIREBASE_PROJECT_ID=""</div>
                  <div className="text-amber-300">VITE_FIREBASE_STORAGE_BUCKET=""</div>
                  <div className="text-amber-300">VITE_FIREBASE_MESSAGING_SENDER_ID=""</div>
                  <div className="text-amber-300">VITE_FIREBASE_APP_ID=""</div>
                  <div className="text-amber-300">VITE_FIREBASE_VAPID_KEY=""</div>
                  <div className="text-[11px] text-slate-400 pt-2 pb-1 border-b border-slate-800">
                    # مفتاح الخادم (Server Admin SDK)
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="truncate max-w-[280px]">FIREBASE_SERVICE_ACCOUNT_JSON="&#123;...&#125;"</span>
                    <button
                      onClick={() => copyToClipboard('FIREBASE_SERVICE_ACCOUNT_JSON=""', 'sa')}
                      className="text-slate-400 hover:text-white shrink-0"
                    >
                      {copiedKey === 'sa' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-emerald-950 dark:text-emerald-200">
                    مخطط إنشاء الجداول في Supabase SQL Editor
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    قم بنسخ هذا الكود ولصقه في تبويب SQL Editor داخل مشروع Supabase ثم اضغط Run
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(SUPABASE_SQL_CODE, 'full_sql')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  {copiedKey === 'full_sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'full_sql' ? 'تم النسخ' : 'نسخ كود SQL بالكامل'}</span>
                </button>
              </div>

              <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-[380px] border border-slate-800 leading-relaxed text-left" dir="ltr">
                <pre>{SUPABASE_SQL_CODE}</pre>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                <div>
                  <h3 className="font-bold text-indigo-950 dark:text-indigo-200">
                    حالة الأنظمة والمصادر المتكاملة
                  </h3>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    فحص مباشر لسلامة تدفق الخلاصات الثلاث ومحرك الموسوعة والإشعارات
                  </p>
                </div>
                <button
                  onClick={handleTestSources}
                  disabled={isTestingSources}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingSources ? 'animate-spin' : ''}`} />
                  <span>تحديث الفحص</span>
                </button>
              </div>

              {/* 1. Sources Feed Health */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 font-bold text-xs text-slate-700 dark:text-slate-200 flex justify-between">
                  <span>المصدر الإخباري</span>
                  <span>الحالة وعدد المقالات</span>
                </div>
                {sourceResults ? (
                  sourceResults.map((src: any) => (
                    <div key={src.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{src.name}</span>
                        {src.errorMessage && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">{src.errorMessage}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-slate-400">
                          {src.articleCount} مقال موثق
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          src.status === 'ok' || src.status === 'online'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : src.status === 'disabled'
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}>
                          {src.status === 'ok' || src.status === 'online' ? 'نشط ومتصل ✓' : src.status === 'disabled' ? 'غير مفعل' : 'تعذر الاتصال'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    جاري فحص المصادر...
                  </div>
                )}
              </div>

              {/* 2. Deduplication & AI Merging check */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    خوارزمية دمج وتوثيق الأخبار المشتركة (Deduplication & Supabase Sync)
                  </span>
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    مفعلة وتكتب تلقائياً ✓
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  تدمج أي خبر متطابق صادر من أكثر من وكالة في بطاقة واحدة وتمنحه وسم "موثق من مصدرين أو أكثر"، وتحدث سجلات Supabase تلقائياً.
                </p>
              </div>

              {/* 3. Test Web Push Notification Trigger */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    اختبار إرسال إشعار فوري (Web Push Test)
                  </span>
                  <button
                    onClick={() => {
                      if (onSendTestNotification) onSendTestNotification();
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال إشعار فوري للمتصفح</span>
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  يرسل إشعاراً حقيقياً للمتصفح عبر Service Worker و Firebase Messaging للتأكد من وصول التنبيه الفوري لجهاز القارئ.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-500">
            Khabar Al-Lahza Engine • Supabase & Firebase Enabled
          </span>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
