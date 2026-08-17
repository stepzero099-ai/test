import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Radio, 
  Sparkles, 
  RefreshCw, 
  SlidersHorizontal, 
  BookOpen, 
  Bookmark, 
  Search, 
  Download,
  AlertCircle,
  TrendingUp,
  Flame,
  CheckCheck
} from 'lucide-react';
import { Category, NewsArticle, UserPreferences, SiteAdsConfig, DEFAULT_ADS_CONFIG } from './types';
import { DEFAULT_PREFERENCES, loadUserPreferences, saveUserPreferences, toggleSavedArticle } from './utils/storage';
import { Navbar } from './components/Navbar';
import { BreakingNewsTicker } from './components/BreakingNewsTicker';
import { CategoryTabs } from './components/CategoryTabs';
import { ArticleCard } from './components/ArticleCard';
import { FullStoryModal } from './components/FullStoryModal';
import { OnboardingModal } from './components/OnboardingModal';
import { DailyDigestModal } from './components/DailyDigestModal';
import { MethodologyModal } from './components/MethodologyModal';
import { NotificationToast } from './components/NotificationToast';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AdBanner } from './components/AdBanner';
import { requestAndRegisterWebPush, sendServerTestNotification } from './lib/firebaseClient';
import { INITIAL_ARTICLES } from './data/initialNews';

export default function App() {
  // User Preferences
  const [userPrefs, setUserPrefs] = useState<UserPreferences>(() => loadUserPreferences());

  // Ads Configuration State
  const [adsConfig, setAdsConfig] = useState<SiteAdsConfig>(DEFAULT_ADS_CONFIG);

  // News State with Instant Seed Articles
  const [articles, setArticles] = useState<NewsArticle[]>(() => INITIAL_ARTICLES);
  const [breakingArticles, setBreakingArticles] = useState<NewsArticle[]>(() => 
    INITIAL_ARTICLES.filter((a: NewsArticle) => a.importance === 'breaking')
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [corroboratedOnly, setCorroboratedOnly] = useState<boolean>(false);

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(!userPrefs.onboardingCompleted);
  const [selectedArticleForFullStory, setSelectedArticleForFullStory] = useState<NewsArticle | null>(null);
  const [isFullStoryLoading, setIsFullStoryLoading] = useState<boolean>(false);
  const [isDigestOpen, setIsDigestOpen] = useState<boolean>(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Notification Toast
  const [activeToast, setActiveToast] = useState<{
    title: string;
    body: string;
    importance?: string;
    article?: NewsArticle;
  } | null>(null);

  // PWA Install Prompt
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  // Fetch initial news
  const fetchNews = useCallback(async (isManualRefresh: boolean = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/news');
      const data = await res.json().catch(() => null);
      if (data && data.success && Array.isArray(data.articles) && data.articles.length > 0) {
        setArticles(data.articles);
        setBreakingArticles(data.articles.filter((a: NewsArticle) => a.importance === 'breaking'));
        setLastSyncTime(new Date());
      } else if (!res.ok) {
        throw new Error('فشل جلب الأخبار من الخادم');
      }
    } catch (err: any) {
      console.warn('Fetch news note:', err?.message || err);
      // Keep existing articles in state so user always has news displayed
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch Site Ads Configuration
  const fetchAds = useCallback(async () => {
    try {
      const res = await fetch('/api/ads');
      const data = await res.json().catch(() => null);
      if (data && data.success && data.ads) {
        setAdsConfig(data.ads);
      }
    } catch (e) {
      console.warn('Fetch ads note:', e);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    fetchAds();

    // ⏱️ Auto-refresh client news feed from all sources every 15 minutes (15 * 60 * 1000 ms)
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
    const interval = setInterval(() => {
      console.log('[AutoSync] 🔄 15-minute client sync triggered...');
      fetchNews();
    }, FIFTEEN_MINUTES_MS);

    // Listen for PWA beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [fetchNews, fetchAds]);

  // Request browser push notification permission and register FCM Web Push
  useEffect(() => {
    if (userPrefs.notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        requestAndRegisterWebPush(userPrefs).catch(() => {});
      } else if (Notification.permission === 'granted') {
        requestAndRegisterWebPush(userPrefs).catch(() => {});
      }
    }
  }, [userPrefs.notificationsEnabled, userPrefs]);

  // Handle Manual News Refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/news/refresh', { method: 'POST' });
      await fetchNews(true);
    } catch (e) {
      await fetchNews(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open "الحكاية من الأول" (The Full Story)
  const handleOpenFullStory = async (article: NewsArticle) => {
    setSelectedArticleForFullStory(article);

    // If fullStory is not yet enriched, call backend to generate
    if (!article.fullStory || !article.fullStory.timeline || article.fullStory.timeline.length === 0) {
      setIsFullStoryLoading(true);
      try {
        const res = await fetch('/api/news/full-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId: article.id })
        });
        const data = await res.json();
        if (data.success && data.article) {
          setSelectedArticleForFullStory(data.article);
          // update in articles list
          setArticles(prev => prev.map(a => a.id === data.article.id ? data.article : a));
        }
      } catch (err) {
        console.warn('Error fetching full story:', err);
      } finally {
        setIsFullStoryLoading(false);
      }
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = (id: string) => {
    const updatedIds = toggleSavedArticle(id);
    setUserPrefs(prev => ({ ...prev, savedArticleIds: updatedIds }));
  };

  // Change Font Size
  const handleChangeFontSize = (size: 'sm' | 'md' | 'lg') => {
    const updated = saveUserPreferences({ fontSize: size });
    setUserPrefs(updated);
  };

  // Test Notification Trigger
  const handleTestNotification = async () => {
    const breaking = articles.find(a => a.importance === 'breaking') || articles[0];
    const notif = {
      title: 'خبر اللحظة | تنبيه عاجل',
      body: breaking ? breaking.title : 'تطورات سياسية ودبلوماسية متسارعة في المنطقة',
      importance: 'breaking',
      article: breaking
    };

    setActiveToast(notif);

    // Call server endpoint to trigger real FCM Web Push / Multi-subscriber dispatch
    try {
      await sendServerTestNotification({
        title: notif.title,
        body: notif.body,
        category: breaking?.category || 'politics',
        importance: 'breaking'
      });
    } catch (e) {
      console.warn('Server test notification call fallback:', e);
    }

    // Direct browser notification fallback if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notif.title, {
          body: notif.body,
          icon: '/icon-192.svg',
          dir: 'rtl',
          lang: 'ar'
        });
      } catch (e) {}
    }
  };

  // Install PWA
  const handleInstallPWA = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredInstallPrompt(null);
      }
    }
  };

  // Count articles per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: articles.length };
    for (const art of articles) {
      counts[art.category] = (counts[art.category] || 0) + 1;
    }
    return counts;
  }, [articles]);

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    let list = [...articles];

    // Saved tab filter
    if (activeCategory === 'saved') {
      list = list.filter(a => userPrefs.savedArticleIds.includes(a.id));
    } else if (activeCategory !== 'all') {
      list = list.filter(a => a.category === activeCategory);
    }

    // Corroborated filter
    if (corroboratedOnly) {
      list = list.filter(a => a.isCorroborated);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.sources.some(s => s.name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [articles, activeCategory, corroboratedOnly, searchQuery, userPrefs.savedArticleIds]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['IBM_Plex_Sans_Arabic',sans-serif]">
      {/* 1. Header / Navbar */}
      <Navbar
        userPrefs={userPrefs}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenDigest={() => setIsDigestOpen(true)}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onRefreshNews={handleManualRefresh}
        isRefreshing={isRefreshing}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeCategory}
        onSelectFilter={setActiveCategory}
        savedCount={userPrefs.savedArticleIds.length}
        fontSize={userPrefs.fontSize}
        onChangeFontSize={handleChangeFontSize}
        onTestNotification={handleTestNotification}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* 2. Breaking News Ticker (Top Banner) */}
      <BreakingNewsTicker
        breakingArticles={breakingArticles}
        onOpenArticle={(art) => handleOpenFullStory(art)}
        onOpenFullStory={(art) => handleOpenFullStory(art)}
      />

      {/* 2.5 Optional Top Header Ad Banner */}
      {adsConfig?.header_banner?.enabled && (
        <div className="max-w-7xl mx-auto px-4 pt-3 w-full">
          <AdBanner variant="header" ad={adsConfig.header_banner} />
        </div>
      )}

      {/* 3. Category Pill Tabs */}
      <CategoryTabs
        categories={userPrefs.categories || ['politics', 'conflicts', 'economy', 'technology', 'sports', 'health', 'misc']}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        corroboratedOnly={corroboratedOnly}
        onToggleCorroboratedOnly={() => setCorroboratedOnly(prev => !prev)}
        articlesCount={categoryCounts}
        onOpenInterests={() => setIsOnboardingOpen(true)}
      />

      {/* 4. Main News Stream */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 flex-1 w-full">
        {/* User Greeting Bar if name set */}
        {userPrefs.name && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-sky-900 to-indigo-950 text-white shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold font-['Tajawal'] flex items-center gap-2">
                <span>أهلاً بك يا {userPrefs.name}</span>
                <span className="text-sm font-normal text-sky-200">| إليك أحدث ما تم رصده في أقسامك المختارة</span>
              </h2>
            </div>

            <button
              onClick={() => setIsDigestOpen(true)}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl border border-white/20 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>مطالعة حصاد اليوم</span>
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-24 text-center space-y-4">
            <div className="inline-block w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-600">
              جاري فحص خلاصات وكالات الأنباء وتلخيص الأخبار بحيادية...
            </p>
          </div>
        )}

        {/* Error Notice */}
        {error && !isLoading && (
          <div className="my-8 p-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-base mb-1">تعذر تحميل الأخبار</h3>
              <p className="text-sm">{error}</p>
              <button
                onClick={() => fetchNews(true)}
                className="mt-3 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-700 transition"
              >
                إعادة المحاولة الآن
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredArticles.length === 0 && (
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="inline-flex p-4 rounded-full bg-slate-100 text-slate-500">
              {activeCategory === 'saved' ? <Bookmark className="w-8 h-8" /> : <Search className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-['Tajawal']">
              {activeCategory === 'saved' ? 'لا توجد أخبار محفوظة حتى الآن' : 'لم نعثر على أخبار مطابقة لبحثك'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {activeCategory === 'saved'
                ? 'انقر على أيقونة الحفظ في بطاقة أي خبر لإضافته إلى قائمة محفوظاتك والرجوع إليه لاحقاً.'
                : 'جرب البحث بكلمات مختلفة أو قم بإلغاء مرشحات التصفية.'}
            </p>
            {activeCategory === 'saved' && (
              <button
                onClick={() => setActiveCategory('all')}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition"
              >
                تصفح كل الأخبار
              </button>
            )}
          </div>
        )}

        {/* Articles Grid with Native In-Feed Ad Insertion */}
        {!isLoading && !error && filteredArticles.length > 0 && (
          <div className="space-y-6">
            {/* Live Auto-Sync Status Bar */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500 bg-white/70 backdrop-blur-sm border border-slate-200/80 px-4 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-slate-700">تحديث حي ومباشر</span>
                <span className="text-slate-400">•</span>
                <span>تحديث دوري كل 15 دقيقة من أكثر من 25 مصدراً موثوقاً</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">
                  آخر مزامنة: {lastSyncTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold transition disabled:opacity-50"
                  title="تحديث الأخبار الآن"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'جاري التحديث...' : 'تحديث الآن'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article, index) => (
                <React.Fragment key={article.id}>
                  <ArticleCard
                    article={article}
                    isSaved={userPrefs.savedArticleIds.includes(article.id)}
                    onToggleSave={handleToggleBookmark}
                    onOpenFullStory={handleOpenFullStory}
                    fontSize={userPrefs.fontSize}
                  />
                  {/* Insert Native In-Feed Ad after the 3rd item if enabled */}
                  {index === 2 && adsConfig?.infeed_native?.enabled && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                      <AdBanner variant="infeed" ad={adsConfig.infeed_native} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Sticky Ad at Bottom if Enabled */}
      {adsConfig?.sidebar_sticky?.enabled && (
        <AdBanner 
          variant="sticky" 
          ad={adsConfig.sidebar_sticky} 
          onDismiss={() => setAdsConfig(prev => ({
            ...prev,
            sidebar_sticky: { ...prev.sidebar_sticky, enabled: false }
          }))}
        />
      )}

      {/* 5. Floating Quick Action Buttons */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-2.5">
        {/* PWA Install Button if available */}
        {deferredInstallPrompt && (
          <button
            id="install-pwa-fab"
            onClick={handleInstallPWA}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs p-3.5 rounded-2xl shadow-xl transition active:scale-95 border border-emerald-400/40"
            title="تثبيت خبر اللحظة كتطبيق على جهازك (PWA)"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">تثبيت التطبيق (PWA)</span>
          </button>
        )}

        {/* Customize Interests Floating Button */}
        <button
          id="customize-interests-fab"
          onClick={() => setIsOnboardingOpen(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-3.5 rounded-2xl shadow-xl transition active:scale-95 border border-slate-700"
          title="تعديل الاهتمامات والأقسام المفضلة"
        >
          <SlidersHorizontal className="w-5 h-5 text-sky-400" />
          <span className="hidden sm:inline">تعديل اهتماماتي</span>
        </button>
      </div>

      {/* 6. Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-white mt-12 py-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
                <Radio className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold font-['Tajawal']">خبر اللحظة</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              منصة إخبارية مستقلة ترصد وتنسّق الأخبار من كبرى وكالات الأنباء المعتمدة بحيادية تامة، مع ميزة "الحكاية من الأول" لتقديم السياق التاريخي والمعرفي الكامل خلف كل خبر.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
              <CheckCheck className="w-3.5 h-3.5" />
              <span>مراقبة مستمرة وتحديث متواصل كل 10-15 دقيقة</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">روابط سريعة والشفافية</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => setIsMethodologyOpen(true)} className="hover:text-white transition">
                  • من نحن ومنهجية التحقق وحماية حقوق النشر
                </button>
              </li>
              <li>
                <button onClick={() => setIsDigestOpen(true)} className="hover:text-white transition">
                  • الحصاد الإخباري اليومي (Daily Brief)
                </button>
              </li>
              <li>
                <button onClick={() => setIsOnboardingOpen(true)} className="hover:text-white transition">
                  • تخصيص الأقسام وتفضيلات التنبيهات
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">المصادر المعتمدة</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              نجمع الأخبار من: الجزيرة، بي بي سي عربي، سكاي نيوز عربية، فرانس 24، دويتشه فيله، وآر تي العربية، مع توثيق الرابط الأصلي لكل خبر.
            </p>
            <p className="text-[11px] text-slate-500">
              جميع الحقوق محفوظة © {new Date().getFullYear()} - خبر اللحظة (Khabar Al-Lahza)
            </p>
          </div>
        </div>
      </footer>

      {/* 7. Signature "الحكاية من الأول" Modal with optional ad banner */}
      <FullStoryModal
        article={selectedArticleForFullStory}
        isOpen={Boolean(selectedArticleForFullStory)}
        onClose={() => setSelectedArticleForFullStory(null)}
        isLoading={isFullStoryLoading}
        fontSize={userPrefs.fontSize}
        ad={adsConfig?.modal_bottom}
      />

      {/* 8. Onboarding / Preferences Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        currentPrefs={userPrefs}
        onSavePreferences={(prefs) => {
          setUserPrefs(prefs);
        }}
      />

      {/* 9. Smart Daily Digest Modal */}
      <DailyDigestModal
        isOpen={isDigestOpen}
        onClose={() => setIsDigestOpen(false)}
        onSelectArticle={(art) => handleOpenFullStory(art)}
        userName={userPrefs.name}
      />

      {/* 10. Methodology & Transparency Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      {/* 11. Secret Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        articles={articles}
        onRefreshArticles={fetchNews}
        adsConfig={adsConfig}
        onUpdateAdsConfig={(newAds) => setAdsConfig(newAds)}
      />

      {/* 12. In-App Push Notification Toast */}
      <NotificationToast
        notification={activeToast}
        onClose={() => setActiveToast(null)}
        onOpenArticle={(art) => handleOpenFullStory(art)}
      />
    </div>
  );
}
