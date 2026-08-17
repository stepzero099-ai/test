import express from 'express';
import path from 'path';
import dotenv from 'dotenv';

// ✅ أضفنا .js لكل الـ imports المحلية (مهم جداً في ES Modules)
import { newsStore } from './server/newsStore.js';
import { searchArabicWikipedia } from './server/wikipedia.js';
import { sendDirectTestPush, sendPushToTokens, isFirebaseAdminReady } from './server/firebaseAdmin.js';
import { SUPABASE_SCHEMA_SQL, getSupabase, isSupabaseTablesReady } from './server/supabase.js';

dotenv.config();

const app = express();

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Khabar Al-Lahza News Engine',
    environment: process.env.NODE_ENV || 'development',
    isVercel: !!process.env.VERCEL,
    supabaseConnected: getSupabase() !== null,
    supabaseTablesReady: isSupabaseTablesReady(),
    firebaseAdminReady: isFirebaseAdminReady(),
    timestamp: new Date().toISOString() 
  });
});

// Supabase Schema SQL endpoint
app.get('/api/schema', (req, res) => {
  res.type('text/plain').send(SUPABASE_SCHEMA_SQL.trim());
});

// Get filtered news
app.get('/api/news', (req, res) => {
  const { category, importance, search, corroboratedOnly, limit } = req.query;
  const articles = newsStore.getArticles({
    category: typeof category === 'string' ? category : undefined,
    importance: typeof importance === 'string' ? importance : undefined,
    search: typeof search === 'string' ? search : undefined,
    corroboratedOnly: corroboratedOnly === 'true',
    limit: limit ? parseInt(limit as string, 10) : undefined
  });
  res.json({ success: true, count: articles.length, articles });
});

// Get breaking news
app.get('/api/news/breaking', (req, res) => {
  const breaking = newsStore.getBreakingNews();
  res.json({ success: true, count: breaking.length, articles: breaking });
});

// ✅ Refresh feeds with CRON_SECRET protection
const handleRefresh = async (req: express.Request, res: express.Response) => {
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.CRON_SECRET;
  
  if (process.env.NODE_ENV === 'production' && expectedSecret) {
    if (authHeader !== `Bearer ${expectedSecret}`) {
      console.warn('[API] ⚠️ Unauthorized refresh attempt from:', req.ip);
      return res.status(401).json({ 
        success: false, 
        error: 'غير مصرح: مفتاح غير صحيح' 
      });
    }
  }
  
  try {
    console.log('[API] 🔄 Starting news refresh...');
    const result = await newsStore.refreshFeeds();
    console.log(`[API] ✅ Refresh complete: +${result.added} articles, total: ${result.total}`);
    
    res.json({ 
      success: true, 
      added: result.added, 
      total: result.total, 
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    console.error('[API] ❌ Refresh error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'فشل تحديث الأخبار',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

app.get('/api/news/refresh', handleRefresh);
app.post('/api/news/refresh', handleRefresh);

// Generate "الحكاية من الأول" (The Full Story)
app.post('/api/news/full-story', async (req, res) => {
  const { articleId } = req.body;
  if (!articleId) {
    return res.status(400).json({ success: false, error: 'معرّف المقال مطلوب' });
  }

  try {
    const updatedArticle = await newsStore.getOrGenerateFullStory(articleId);
    if (!updatedArticle) {
      return res.status(404).json({ success: false, error: 'المقال غير موجود' });
    }
    res.json({ success: true, article: updatedArticle, fullStory: updatedArticle.fullStory });
  } catch (error: any) {
    console.error('[API] full-story error:', error);
    res.status(500).json({ success: false, error: 'تعذر تحميل سياق القصة الكاملة' });
  }
});

// Get single article
app.get('/api/news/:id', (req, res) => {
  const article = newsStore.getArticleById(req.params.id);
  if (!article) {
    return res.status(404).json({ success: false, error: 'المقال غير موجود' });
  }
  res.json({ success: true, article });
});

// Daily Smart Digest
app.get('/api/digest', async (req, res) => {
  try {
    const digest = await newsStore.getDailyDigest();
    res.json({ success: true, digest });
  } catch (error: any) {
    console.error('[API] digest error:', error);
    res.status(500).json({ success: false, error: 'تعذر إنشاء الملخص اليومي' });
  }
});

// Wikipedia live search proxy
app.get('/api/wikipedia/search', async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.json({ success: true, results: [] });
  }
  const results = await searchArabicWikipedia(query);
  res.json({ success: true, results });
});

// Sources status and stats
app.get('/api/sources', (req, res) => {
  const sources = newsStore.getSourceStats();
  res.json({ success: true, sources });
});

// Notification subscription registration
app.post('/api/notifications/subscribe', (req, res) => {
  const { token, categories, frequency } = req.body;
  if (token) {
    newsStore.registerPushSubscriber(token, categories || [], frequency || 'both');
  }
  res.json({ success: true, message: 'تم تفعيل الاشتراك في الإشعارات بنجاح' });
});

// Send Web Push via Firebase Admin
app.post('/api/notifications/test', async (req, res) => {
  const { token, title, body, category, importance } = req.body;

  const notifTitle = title || 'خبر اللحظة | تنبيه فوري تجريبي';
  const notifBody = body || 'تأكيد وصول التنبيهات الفورية المشتركة بنجاح.';

  if (token && isFirebaseAdminReady()) {
    const result = await sendDirectTestPush(token, {
      title: notifTitle,
      body: notifBody,
      category: category || 'politics',
      importance: importance || 'breaking',
      url: '/'
    });

    return res.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      deliveryMethod: 'firebase_admin_fcm',
      notification: {
        title: notifTitle,
        body: notifBody,
        timestamp: new Date().toISOString()
      }
    });
  }

  res.json({
    success: true,
    deliveryMethod: isFirebaseAdminReady() ? 'fcm_ready' : 'service_worker_browser',
    message: 'تم إرسال الإشعار للمتصفح بنجاح',
    notification: {
      title: notifTitle,
      body: notifBody,
      category: category || 'politics',
      importance: importance || 'breaking',
      timestamp: new Date().toISOString()
    }
  });
});

// 🔍 Diagnostic endpoint
app.get('/api/debug', async (req, res) => {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL,
    envVars: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      FCM_SERVER_KEY: !!process.env.FCM_SERVER_KEY,
      FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      CRON_SECRET: !!process.env.CRON_SECRET,
    }
  };

  try {
    const { getSupabase, isSupabaseTablesReady } = await import('./server/supabase.js');
    results.supabase = {
      loaded: true,
      connected: getSupabase() !== null,
      tablesReady: isSupabaseTablesReady()
    };
  } catch (err: any) {
    results.supabase = { loaded: false, error: err.message };
  }

  try {
    const { isFirebaseAdminReady } = await import('./server/firebaseAdmin.js');
    results.firebase = {
      loaded: true,
      ready: isFirebaseAdminReady()
    };
  } catch (err: any) {
    results.firebase = { loaded: false, error: err.message };
  }

  try {
    const { newsStore } = await import('./server/newsStore.js');
    results.newsStore = {
      loaded: true,
      articleCount: newsStore.getArticles().length
    };
  } catch (err: any) {
    results.newsStore = { loaded: false, error: err.message };
  }

  res.json(results);
});

// ✅ تصدير الـ app لـ Vercel
export default app;

// ✅ تشغيل الخادم محلياً فقط (ليس على Vercel) — بدون أي اعتماد على vite هنا
// أثناء التطوير المحلي: شغّل الواجهة عبر `npm run dev` (vite) في تيرمينال منفصل
// وشغّل هذا الـ API عبر `npm run dev:api` في تيرمينال آخر
if (!process.env.VERCEL) {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Khabar Al-Lahza] API server running on http://localhost:${PORT}`);
  });
}
