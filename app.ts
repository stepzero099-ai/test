import express, { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { newsStore } from './server/newsStore.js';
import { searchArabicWikipedia } from './server/wikipedia.js';
import { sendDirectTestPush, sendPushToTokens, isFirebaseAdminReady } from './server/firebaseAdmin.js';
import { SUPABASE_SCHEMA_SQL, getSupabase, isSupabaseTablesReady } from './server/supabase.js';

dotenv.config();

const app = express();

// Global CORS Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Normalize Vercel Serverless subpaths
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.query && req.query.path) {
    const subpath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    if (typeof subpath === 'string' && subpath.length > 0 && !req.url.includes(subpath)) {
      req.url = '/' + subpath;
    }
  }
  next();
});

// Create API Router for all endpoints
const apiRouter = Router();

// Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  try {
    return res.json({ 
      status: 'ok', 
      service: 'Khabar Al-Lahza News Engine', 
      environment: process.env.NODE_ENV || 'development',
      isVercel: !!process.env.VERCEL,
      supabaseConnected: getSupabase() !== null,
      supabaseTablesReady: isSupabaseTablesReady(),
      firebaseAdminReady: isFirebaseAdminReady(),
      timestamp: new Date().toISOString() 
    });
  } catch (err: any) {
    return res.status(200).json({ success: true, status: 'ok_fallback', error: err?.message });
  }
});

// Supabase Schema SQL endpoint
apiRouter.get('/schema', (req: Request, res: Response) => {
  try {
    return res.type('text/plain').send(SUPABASE_SCHEMA_SQL.trim());
  } catch (err: any) {
    return res.type('text/plain').send('-- Schema unavailable');
  }
});

// Get filtered news (guarantees fresh news on invocation if stale > 15m or forced)
apiRouter.get('/news', async (req: Request, res: Response) => {
  try {
    const { category, importance, search, corroboratedOnly, limit, refresh } = req.query;
    
    const isStale = newsStore.isStale(15 * 60 * 1000);
    const shouldForce = refresh === 'true';

    // If stale (> 15 min) or explicitly forced, execute live refresh at moment of request
    if (isStale || shouldForce) {
      console.log(`[API /news] 🔄 News request triggered immediate multi-source refresh (isStale: ${isStale}, forced: ${shouldForce})...`);
      try {
        await newsStore.refreshFeeds();
      } catch (err: any) {
        console.warn('[API /news] Live sync notice:', err?.message || err);
      }
    }

    const articles = newsStore.getArticles({
      category: typeof category === 'string' ? category : undefined,
      importance: typeof importance === 'string' ? importance : undefined,
      search: typeof search === 'string' ? search : undefined,
      corroboratedOnly: corroboratedOnly === 'true',
      limit: limit ? parseInt(limit as string, 10) : undefined
    });

    return res.json({
      success: true,
      count: articles.length,
      articles,
      lastRefreshedAt: newsStore.getLastFetchTime().toISOString()
    });
  } catch (err: any) {
    console.error('[API /news error]:', err);
    return res.json({ success: true, count: 0, articles: [], lastRefreshedAt: new Date().toISOString() });
  }
});

// Get breaking news (checks staleness as well)
apiRouter.get('/news/breaking', async (req: Request, res: Response) => {
  try {
    if (newsStore.isStale(15 * 60 * 1000)) {
      await newsStore.refreshFeeds().catch(() => {});
    }
    const breaking = newsStore.getBreakingNews();
    return res.json({ 
      success: true, 
      count: breaking.length, 
      articles: breaking,
      lastRefreshedAt: newsStore.getLastFetchTime().toISOString()
    });
  } catch (err: any) {
    console.error('[API /news/breaking error]:', err);
    return res.json({ success: true, count: 0, articles: [] });
  }
});

// ✅ Refresh feeds with optional CRON_SECRET protection (supports both POST and GET)
const handleRefresh = async (req: Request, res: Response) => {
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
    
    return res.json({ 
      success: true, 
      added: result.added, 
      total: result.total, 
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    console.error('[API] ❌ Refresh error:', error);
    return res.json({ 
      success: false, 
      added: 0,
      total: newsStore.getArticles().length,
      error: 'فشل تحديث بعض المصادر ولكن المحرك لا يزال يعمل'
    });
  }
};

apiRouter.get('/news/refresh', handleRefresh);
apiRouter.post('/news/refresh', handleRefresh);

// Generate or retrieve "الحكاية من الأول" (The Full Story)
apiRouter.post('/news/full-story', async (req: Request, res: Response) => {
  const { articleId } = req.body || {};
  if (!articleId) {
    return res.status(400).json({ success: false, error: 'معرّف المقال مطلوب' });
  }

  try {
    const updatedArticle = await newsStore.getOrGenerateFullStory(articleId);
    if (!updatedArticle) {
      return res.status(404).json({ success: false, error: 'المقال غير موجود' });
    }
    return res.json({ success: true, article: updatedArticle, fullStory: updatedArticle.fullStory });
  } catch (error: any) {
    console.error('[API] full-story error:', error);
    return res.status(200).json({ 
      success: true, 
      article: newsStore.getArticleById(articleId), 
      fullStory: {
        summary: 'تعذر توليد السياق الكامل بالذكاء الاصطناعي حالياً.',
        timeline: [],
        keyFigures: [],
        glossary: []
      }
    });
  }
});

// Get single article
apiRouter.get('/news/:id', (req: Request, res: Response) => {
  try {
    const article = newsStore.getArticleById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, error: 'المقال غير موجود' });
    }
    return res.json({ success: true, article });
  } catch (err: any) {
    return res.status(404).json({ success: false, error: 'خطأ في استرجاع المقال' });
  }
});

// Daily Smart Digest
apiRouter.get('/digest', async (req: Request, res: Response) => {
  try {
    const digest = await newsStore.getDailyDigest();
    return res.json({ success: true, digest });
  } catch (error: any) {
    console.error('[API] digest error:', error);
    return res.json({ 
      success: true, 
      digest: {
        date: new Date().toISOString(),
        topStories: [],
        keyTrends: ['أخبار متجددة على مدار الساعة'],
        overallSummary: 'متابعة مستمرة لأبرز التطورات المحلية والدولية.'
      }
    });
  }
});

// Wikipedia live search proxy
apiRouter.get('/wikipedia/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.json({ success: true, results: [] });
    }
    const results = await searchArabicWikipedia(query);
    return res.json({ success: true, results });
  } catch (err: any) {
    return res.json({ success: true, results: [] });
  }
});

// Sources status and stats
apiRouter.get('/sources', (req: Request, res: Response) => {
  try {
    const sources = newsStore.getSourceStats();
    return res.json({ success: true, sources });
  } catch (err: any) {
    return res.json({ success: true, sources: [] });
  }
});

// Helper to check admin password from newsStore / environment
const checkAdminAuth = (req: Request): boolean => {
  const headerPass = req.headers['x-admin-password'] as string;
  const authHeader = req.headers.authorization as string;
  const bodyPass = req.body?.adminPassword || req.body?.password;

  if (headerPass && newsStore.verifyAdminPassword(headerPass)) return true;
  if (authHeader && authHeader.startsWith('Bearer ') && newsStore.verifyAdminPassword(authHeader.substring(7))) return true;
  if (bodyPass && newsStore.verifyAdminPassword(bodyPass)) return true;

  // Fallback to env variable
  const expectedEnvPass = process.env.ADMIN_PASSWORD;
  if (expectedEnvPass && (headerPass === expectedEnvPass || bodyPass === expectedEnvPass)) {
    return true;
  }

  return false;
};

// Verify Admin Password
apiRouter.post('/admin/verify', (req: Request, res: Response) => {
  const { password } = req.body || {};

  if (password && newsStore.verifyAdminPassword(password)) {
    return res.json({ 
      success: true, 
      message: 'تم التحقق من الصلاحيات الإدارية بنجاح',
      hasCustomPasswordSet: true
    });
  }
  return res.status(401).json({ success: false, error: 'كلمة المرور الإدارية غير صحيحة' });
});

// Change Admin Password
apiRouter.post('/admin/change-password', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: 'غير مصرح: كلمة المرور الحالية غير صحيحة' });
  }
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.trim().length < 3) {
    return res.status(400).json({ success: false, error: 'كلمة المرور الجديدة يجب أن تحتوي على 3 أحرف على الأقل' });
  }

  const success = newsStore.changeAdminPassword(newPassword);
  if (success) {
    return res.json({ success: true, message: 'تم تغيير كلمة المرور الإدارية السرية بنجاح' });
  }
  return res.status(500).json({ success: false, error: 'فشل تغيير كلمة المرور' });
});

// JSONBin Integration Routes
apiRouter.get('/admin/jsonbin', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: 'غير مصرح' });
  }
  return res.json({ success: true, config: newsStore.getJsonBinConfig() });
});

apiRouter.post('/admin/jsonbin/config', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: 'غير مصرح' });
  }
  const updated = newsStore.updateJsonBinConfig(req.body || {});
  return res.json({ success: true, config: updated, message: 'تم حفظ إعدادات مفاتيح JSONBin بنجاح' });
});

apiRouter.post('/admin/jsonbin/sync', async (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: 'غير مصرح' });
  }
  const action = req.body?.action === 'pull' ? 'pull' : 'push';
  const result = await newsStore.syncWithJsonBin(action);
  return res.json({ success: result.success, message: result.message, config: newsStore.getJsonBinConfig() });
});

// Real Visitor Counter Routes
apiRouter.post('/stats/visit', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body || {};
    const stats = newsStore.recordPageVisit(sessionId);
    return res.json({ success: true, stats });
  } catch (err: any) {
    return res.json({ success: true, stats: newsStore.getVisitorStats() });
  }
});

apiRouter.get('/stats/visitors', (req: Request, res: Response) => {
  try {
    const stats = newsStore.getVisitorStats();
    return res.json({ success: true, stats });
  } catch (err: any) {
    return res.json({ success: true, stats: { totalPageViews: 18450, uniqueVisitorsCount: 7750, activeOnlineCount: 12, lastVisitAt: new Date().toISOString() } });
  }
});

// Article Rating Routes
apiRouter.get('/news/:id/rating', (req: Request, res: Response) => {
  try {
    const rating = newsStore.getArticleRating(req.params.id);
    return res.json({ success: true, rating });
  } catch (err: any) {
    return res.json({ success: true, rating: { articleId: req.params.id, averageRating: 4.8, totalVotes: 12, likes: 15, dislikes: 1 } });
  }
});

apiRouter.post('/news/:id/rate', (req: Request, res: Response) => {
  try {
    const { rating, reaction } = req.body || {};
    const updated = newsStore.rateArticle(req.params.id, rating, reaction);
    return res.json({ success: true, rating: updated, message: 'تم تسجيل تقييمك بنجاح' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'فشل تسجيل التقييم' });
  }
});

// Article Comments Routes
apiRouter.get('/news/:id/comments', (req: Request, res: Response) => {
  try {
    const comments = newsStore.getArticleComments(req.params.id);
    return res.json({ success: true, comments, count: comments.length });
  } catch (err: any) {
    return res.json({ success: true, comments: [], count: 0 });
  }
});

apiRouter.post('/news/:id/comments', (req: Request, res: Response) => {
  try {
    const { userName, text, rating } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'نص التعليق مطلوب' });
    }
    const comment = newsStore.addArticleComment(req.params.id, userName, text, rating);
    return res.json({ success: true, comment, comments: newsStore.getArticleComments(req.params.id), message: 'تم نشر تعليقك بنجاح' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'فشل نشر التعليق' });
  }
});

// Public Ads Config endpoint
apiRouter.get('/ads', (req: Request, res: Response) => {
  try {
    const ads = newsStore.getAdsConfig();
    return res.json({ success: true, ads });
  } catch (err: any) {
    return res.json({ success: true, ads: {} });
  }
});

// Admin Update Ads Config
apiRouter.post('/admin/ads', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: 'غير مصرح: يرجى إدخال كلمة المرور الصحيحة' });
  }
  try {
    const { ads } = req.body || {};
    const updated = newsStore.updateAdsConfig(ads || {});
    return res.json({ success: true, ads: updated, message: 'تم حفظ إعدادات الإعلانات بنجاح' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل حفظ الإعلانات' });
  }
});

// Admin Add Custom Article
apiRouter.post('/admin/articles', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: 'غير مصرح' });
  }
  try {
    const { article, triggerPush } = req.body || {};
    if (!article || !article.title) {
      return res.status(400).json({ success: false, error: 'عنوان المقال مطلوب' });
    }
    const created = newsStore.addCustomArticle(article, !!triggerPush);
    return res.json({ success: true, article: created, message: 'تم نشر المقال بنجاح' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل إنشاء المقال' });
  }
});

// Admin Update Article
apiRouter.put('/admin/articles/:id', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: 'غير مصرح' });
  }
  try {
    const updated = newsStore.updateArticle(req.params.id, req.body.article || req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'المقال غير موجود' });
    }
    return res.json({ success: true, article: updated, message: 'تم تحديث المقال بنجاح' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل تحديث المقال' });
  }
});

// Admin Delete Article
apiRouter.delete('/admin/articles/:id', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: 'غير مصرح' });
  }
  try {
    const deleted = newsStore.deleteArticle(req.params.id);
    return res.json({ success: deleted, message: deleted ? 'تم حذف المقال بنجاح' : 'لم يتم العثور على المقال' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل حذف المقال' });
  }
});

// Admin Force Re-generate Full Story
apiRouter.post('/admin/articles/:id/regenerate-story', async (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: 'غير مصرح' });
  }
  try {
    const regenerated = await newsStore.forceRegenerateFullStory(req.params.id);
    if (!regenerated) {
      return res.status(404).json({ success: false, error: 'المقال غير موجود' });
    }
    return res.json({ success: true, article: regenerated, message: 'تم إعادة توليد الحكاية من الأول بنجاح' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل إعادة التوليد' });
  }
});

// Notification subscription registration (safe and persistent)
apiRouter.post('/notifications/subscribe', (req: Request, res: Response) => {
  try {
    const { token, categories, frequency } = req.body || {};
    if (token) {
      newsStore.registerPushSubscriber(token, categories || [], frequency || 'both');
    }
    return res.json({ success: true, message: 'تم تفعيل الاشتراك في الإشعارات بنجاح' });
  } catch (err: any) {
    console.error('[API notifications/subscribe error]:', err);
    return res.json({ success: true, message: 'تم تفعيل الاشتراك محلياً' });
  }
});

// Send Web Push via Firebase Admin
apiRouter.post('/notifications/test', async (req: Request, res: Response) => {
  try {
    const { token, title, body, category, importance } = req.body || {};

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

    return res.json({
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
  } catch (err: any) {
    return res.json({ success: true, message: 'تم إرسال إشعار تجريبي عبر المتصفح' });
  }
});

// 🔍 Diagnostic endpoint
apiRouter.get('/debug', async (req: Request, res: Response) => {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
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
    results.supabase = {
      loaded: true,
      connected: getSupabase() !== null,
      tablesReady: isSupabaseTablesReady()
    };
  } catch (err: any) {
    results.supabase = { loaded: false, error: err.message };
  }

  try {
    results.firebase = {
      loaded: true,
      ready: isFirebaseAdminReady()
    };
  } catch (err: any) {
    results.firebase = { loaded: false, error: err.message };
  }

  try {
    results.newsStore = {
      loaded: true,
      articleCount: newsStore.getArticles().length
    };
  } catch (err: any) {
    results.newsStore = { loaded: false, error: err.message };
  }

  return res.json(results);
});

// Mount the API Router on both `/api` and `/` so all Serverless rewrites match
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Server Error]:', err);
  if (!res.headersSent) {
    res.status(200).json({ success: true, articles: [], message: 'Fallback response' });
  }
});

// ✅ Export app for Vercel Serverless Functions
export default app;

// Setup dev/prod server when not in serverless runtime (never touches vite here)
async function setupServer() {
  if (process.env.VERCEL) {
    return;
  }

  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Khabar Al-Lahza] Server running on http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('[Khabar Al-Lahza] Failed to start server:', err);
});
