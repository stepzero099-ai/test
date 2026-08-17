import React from 'react';
import { 
  Radio, 
  Sparkles, 
  Bookmark, 
  Settings2, 
  BookOpen, 
  RefreshCw, 
  Search,
  Volume2,
  Bell,
  Users,
  Clock
} from 'lucide-react';
import { getArabicCurrentDateString } from '../utils/dateFormatter';
import { UserPreferences, VisitorStats } from '../types';

interface NavbarProps {
  userPrefs: UserPreferences;
  onOpenOnboarding: () => void;
  onOpenDigest: () => void;
  onOpenMethodology: () => void;
  onRefreshNews: () => void;
  isRefreshing: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  savedCount: number;
  fontSize: 'sm' | 'md' | 'lg';
  onChangeFontSize: (size: 'sm' | 'md' | 'lg') => void;
  onTestNotification: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userPrefs,
  onOpenOnboarding,
  onOpenDigest,
  onOpenMethodology,
  onRefreshNews,
  isRefreshing,
  searchQuery,
  onSearchChange,
  activeFilter,
  onSelectFilter,
  savedCount,
  fontSize,
  onChangeFontSize,
  onTestNotification,
  onOpenAdmin
}) => {
  const currentDateStr = getArabicCurrentDateString();
  const [logoClickCount, setLogoClickCount] = React.useState<number>(0);
  const [visitorStats, setVisitorStats] = React.useState<VisitorStats | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = React.useState<string>(() => {
    return new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  });
  const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    // Live clock timer updating every second
    const clockInterval = setInterval(() => {
      setCurrentTimeStr(
        new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    }, 1000);

    // Generate session ID for visitor tracking
    let sessionId = sessionStorage.getItem('visitor_session_id');
    if (!sessionId) {
      sessionId = 'sess-' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('visitor_session_id', sessionId);
    }

    // Record visitor session on server
    fetch('/api/stats/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          setVisitorStats(data.stats);
        }
      })
      .catch(() => {});

    // Refresh visitor stats every 20 seconds
    const interval = setInterval(() => {
      fetch('/api/stats/visitors')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.stats) {
            setVisitorStats(data.stats);
          }
        })
        .catch(() => {});
    }, 20000);

    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  const handleLogoClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const nextCount = logoClickCount + 1;
    if (nextCount >= 5) {
      setLogoClickCount(0);
      if (onOpenAdmin) {
        onOpenAdmin();
      }
    } else {
      setLogoClickCount(nextCount);
      clickTimeoutRef.current = setTimeout(() => {
        setLogoClickCount(0);
      }, 3000);
    }

    onSelectFilter('all');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      {/* Top micro-bar: Date, Live status, and Font Adjuster */}
      <div className="bg-slate-950/80 px-4 py-1.5 text-xs text-slate-400 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              تحديث مباشر على مدار الساعة
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-300">{currentDateStr}</span>

            {/* Live Digital Clock Badge */}
            <span className="hidden sm:inline text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-amber-300 text-[11px] bg-slate-900/90 border border-amber-500/30 px-2.5 py-0.5 rounded-full shadow-inner tracking-wide">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-bold font-mono text-amber-300">{currentTimeStr}</span>
            </div>

            {/* Live Visitor Counter Badge */}
            {visitorStats && (
              <>
                <span className="hidden md:inline text-slate-600">|</span>
                <div className="hidden sm:flex items-center gap-2 text-slate-300 text-[11px] bg-slate-800/90 px-2.5 py-0.5 rounded-full border border-slate-700/60 shadow-inner">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>الزوار الآن: <strong className="text-emerald-400 font-bold">{visitorStats.activeOnlineCount}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>إجمالي الزيارات: <strong className="text-sky-300 font-bold">{visitorStats.totalPageViews.toLocaleString('ar-EG')}</strong></span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Font size adjuster */}
            <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
              <span className="text-[11px] text-slate-400 ml-1">حجم الخط:</span>
              <button
                id="font-size-sm"
                onClick={() => onChangeFontSize('sm')}
                className={`px-1.5 py-0.5 rounded text-xs transition ${fontSize === 'sm' ? 'bg-sky-500 text-white font-bold' : 'hover:text-white'}`}
                title="خط صغير"
              >
                أ-
              </button>
              <button
                id="font-size-md"
                onClick={() => onChangeFontSize('md')}
                className={`px-1.5 py-0.5 rounded text-xs transition ${fontSize === 'md' ? 'bg-sky-500 text-white font-bold' : 'hover:text-white'}`}
                title="خط متوسط"
              >
                أ
              </button>
              <button
                id="font-size-lg"
                onClick={() => onChangeFontSize('lg')}
                className={`px-1.5 py-0.5 rounded text-xs transition ${fontSize === 'lg' ? 'bg-sky-500 text-white font-bold' : 'hover:text-white'}`}
                title="خط كبير"
              >
                أ+
              </button>
            </div>

            {/* Test Notification Button */}
            <button
              id="test-notification-btn"
              onClick={onTestNotification}
              className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-amber-300 transition"
              title="تجربة إشعار عاجل فوري"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>اختبار التنبيهات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div 
          id="brand-logo-btn"
          className="flex items-center gap-3 cursor-pointer select-none group" 
          onClick={handleLogoClick}
          title="خَبَرُ اللَّحْظَة (اضغط 5 مرات للوصول السريع للإدارة)"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-sky-900/30 border border-sky-400/30 group-hover:scale-105 transition">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-['Tajawal']">
                خَبَرُ اللَّحْظَة
              </h1>
              <span className="bg-red-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                مباشر
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              الخبر في لحظته... والحكاية كاملة
            </p>
          </div>
        </div>

        {/* Search Input (Desktop/Tablet) */}
        <div className="hidden md:flex flex-1 max-w-md mx-2">
          <div className="relative w-full">
            <input
              id="search-news-input"
              type="text"
              placeholder="ابحث في عناوين الأخبار، المصادر، أو الأحداث..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl py-2 pr-10 pl-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                مسح
              </button>
            )}
          </div>
        </div>

        {/* Actions Nav */}
        <div className="flex items-center gap-2">
          {/* Smart Daily Digest Button */}
          <button
            id="daily-digest-btn"
            onClick={onOpenDigest}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs md:text-sm font-bold px-3.5 py-2 rounded-xl shadow-md shadow-orange-950/20 transition active:scale-95 cursor-pointer border border-amber-400/30"
            title="الحصاد التنفيذي الشامل لأبرز أحداث اليوم (ملخص ذكي في 3 دقائق)"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
            <span className="font-['Tajawal']">حصاد اليوم</span>
          </button>

          {/* Bookmarks Filter Button */}
          <button
            id="bookmarks-filter-btn"
            onClick={() => onSelectFilter(activeFilter === 'saved' ? 'all' : 'saved')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm transition border ${
              activeFilter === 'saved'
                ? 'bg-sky-600 text-white border-sky-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="الأخبار المحفوظة"
          >
            <Bookmark className="w-4 h-4" />
            <span className="hidden sm:inline">المحفوظات</span>
            {savedCount > 0 && (
              <span className="bg-sky-400 text-slate-900 text-[11px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </button>

          {/* Refresh RSS Feeds Button */}
          <button
            id="refresh-news-btn"
            onClick={onRefreshNews}
            disabled={isRefreshing}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 p-2 rounded-xl border border-slate-700 transition"
            title="تحديث الأخبار الآن من وكالات الأنباء"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {/* Methodology & Transparency */}
          <button
            id="methodology-btn"
            onClick={onOpenMethodology}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-xl border border-slate-700 transition hidden sm:flex items-center gap-1"
            title="من نحن ومنهجية العمل والتحقق والمصادر"
          >
            <BookOpen className="w-4 h-4 text-slate-300" />
            <span className="text-xs">من نحن ومنهجيتنا</span>
          </button>

          {/* User Preferences / Interests */}
          <button
            id="user-prefs-btn"
            onClick={onOpenOnboarding}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            title="تعديل الاهتمامات والأقسام المفضلة"
          >
            <Settings2 className="w-4 h-4 text-slate-300" />
            <span className="text-xs font-medium hidden sm:inline">
              {userPrefs.name ? userPrefs.name : 'اهتماماتي'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative w-full">
          <input
            id="mobile-search-news-input"
            type="text"
            placeholder="ابحث في الأخبار والأحداث..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pr-10 pl-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>
      </div>
    </header>
  );
};
