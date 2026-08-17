import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  PlusCircle, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Eye, 
  Radio, 
  Sliders, 
  DollarSign, 
  ExternalLink, 
  Bell, 
  FileText,
  Flame,
  Layers,
  Link as LinkIcon,
  Image as ImageIcon,
  KeyRound,
  Database,
  CloudUpload,
  CloudDownload,
  ShieldAlert
} from 'lucide-react';
import { 
  Category, 
  CATEGORIES_META, 
  Importance, 
  NewsArticle, 
  SiteAdsConfig, 
  AdPlacement, 
  DEFAULT_ADS_CONFIG,
  AdZoneId
} from '../types';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: NewsArticle[];
  onRefreshArticles: () => void;
  adsConfig: SiteAdsConfig;
  onUpdateAdsConfig: (newConfig: SiteAdsConfig) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  articles,
  onRefreshArticles,
  adsConfig,
  onUpdateAdsConfig
}) => {
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'create_article' | 'manage_articles' | 'ads_manager' | 'jsonbin' | 'security'>('create_article');

  // JSONBin Local State
  const [jsonBinId, setJsonBinId] = useState<string>('');
  const [jsonBinMasterKey, setJsonBinMasterKey] = useState<string>('');
  const [jsonBinAutoSync, setJsonBinAutoSync] = useState<boolean>(true);
  const [jsonBinMsg, setJsonBinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingJsonBin, setIsSavingJsonBin] = useState<boolean>(false);

  // Admin Security Password State
  const [newAdminPass, setNewAdminPass] = useState<string>('');
  const [confirmAdminPass, setConfirmAdminPass] = useState<string>('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  // Add Article Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<Category>('politics');
  const [newImportance, setNewImportance] = useState<Importance>('important');
  const [newSummary, setNewSummary] = useState<string>('');
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newSourceName, setNewSourceName] = useState<string>('هيئة التحرير الخاصة');
  const [newSourceUrl, setNewSourceUrl] = useState<string>('');
  const [newIsCorroborated, setNewIsCorroborated] = useState<boolean>(true);
  const [sendPushNotification, setSendPushNotification] = useState<boolean>(false);
  const [fullStoryRoot, setFullStoryRoot] = useState<string>('');
  const [isSubmittingArticle, setIsSubmittingArticle] = useState<boolean>(false);
  const [articleSuccessMsg, setArticleSuccessMsg] = useState<string | null>(null);

  // Ads Config Local State
  const [localAds, setLocalAds] = useState<SiteAdsConfig>(adsConfig || DEFAULT_ADS_CONFIG);
  const [isSavingAds, setIsSavingAds] = useState<boolean>(false);
  const [adsSuccessMsg, setAdsSuccessMsg] = useState<string | null>(null);

  // Article Management State
  const [articleSearch, setArticleSearch] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (adsConfig) {
      setLocalAds(adsConfig);
    }
  }, [adsConfig]);

  if (!isOpen) return null;

  // Handle Admin Password Verification
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setAuthError('يرجى كتابة كلمة المرور الإدارية');
      return;
    }

    setIsVerifying(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        setAuthError(null);

        // Fetch JSONBin Config
        fetch('/api/admin/jsonbin', {
          headers: { 'x-admin-password': adminPassword.trim() }
        })
          .then(r => r.json())
          .then(d => {
            if (d.success && d.config) {
              setJsonBinId(d.config.binId || '');
              setJsonBinMasterKey(d.config.masterKey || '');
              setJsonBinAutoSync(d.config.autoSync !== false);
            }
          })
          .catch(() => {});
      } else {
        setAuthError(data.error || 'كلمة المرور غير صحيحة');
      }
    } catch (err: any) {
      setAuthError('فشل الاتصال بخادم التحقق');
    } finally {
      setIsVerifying(false);
    }
  };

  // Save JSONBin Config
  const handleSaveJsonBin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingJsonBin(true);
    setJsonBinMsg(null);

    try {
      const res = await fetch('/api/admin/jsonbin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({
          binId: jsonBinId.trim(),
          masterKey: jsonBinMasterKey.trim(),
          autoSync: jsonBinAutoSync
        })
      });
      const data = await res.json();
      if (data.success) {
        setJsonBinMsg({ type: 'success', text: 'تم حفظ مفاتيح JSONBin واختبار الربط بنجاح!' });
      } else {
        setJsonBinMsg({ type: 'error', text: data.error || 'فشل حفظ إعدادات JSONBin' });
      }
    } catch (err: any) {
      setJsonBinMsg({ type: 'error', text: 'خطأ في الاتصال بالخادم' });
    } finally {
      setIsSavingJsonBin(false);
    }
  };

  // Trigger Manual JSONBin Sync
  const handleSyncJsonBin = async (action: 'push' | 'pull') => {
    setIsSavingJsonBin(true);
    setJsonBinMsg(null);

    try {
      const res = await fetch('/api/admin/jsonbin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setJsonBinMsg({ type: 'success', text: data.message || 'تمت مزامنة البيانات بنجاح مع cloud JSONBin' });
      } else {
        setJsonBinMsg({ type: 'error', text: data.message || 'فشلت المزامنة' });
      }
    } catch (err: any) {
      setJsonBinMsg({ type: 'error', text: 'فشل الاتصال بخادم المزامنة' });
    } finally {
      setIsSavingJsonBin(false);
    }
  };

  // Change Admin Password
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPass !== confirmAdminPass) {
      setPasswordMsg({ type: 'error', text: 'كلمتا المرور غير متطابقتين' });
      return;
    }
    if (newAdminPass.length < 3) {
      setPasswordMsg({ type: 'error', text: 'كلمة المرور يجب أن تتكون من 3 أحرف على الأقل' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMsg(null);

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ newPassword: newAdminPass.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setAdminPassword(newAdminPass.trim());
        setPasswordMsg({ type: 'success', text: 'تم تغيير كلمة المرور الإدارية ومزامنتها بنجاح!' });
        setNewAdminPass('');
        setConfirmAdminPass('');
      } else {
        setPasswordMsg({ type: 'error', text: data.error || 'فشل تغيير كلمة المرور' });
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: 'حدث خطأ في الاتصال بالسيرفر' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Publish New Article
  const handlePublishArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) {
      alert('يرجى إدخال عنوان وخلاصة المقال');
      return;
    }

    setIsSubmittingArticle(true);
    setArticleSuccessMsg(null);

    try {
      const payload = {
        password: adminPassword,
        triggerPush: sendPushNotification,
        article: {
          title: newTitle.trim(),
          summary: newSummary.trim(),
          category: newCategory,
          importance: newImportance,
          imageUrl: newImageUrl.trim() || undefined,
          sources: [
            {
              id: 'editorial',
              name: newSourceName.trim() || 'هيئة التحرير',
              url: newSourceUrl.trim() || '#'
            }
          ],
          primarySource: {
            id: 'editorial',
            name: newSourceName.trim() || 'هيئة التحرير',
            url: newSourceUrl.trim() || '#'
          },
          isCorroborated: newIsCorroborated,
          fullStory: fullStoryRoot ? {
            summary: fullStoryRoot,
            historicalRoots: fullStoryRoot,
            whyItMatters: 'قضية إخبارية ذات أبعاد استراتيجية متسارعة.',
            whatIsNext: 'متابعة مستمرة لقرارات الجهات المعنية.',
            timeline: [
              { date: 'اليوم', event: newTitle.trim(), significance: 'إعلان الحدث وتداعياته المباشرة.' }
            ],
            entities: [],
            keyHighlights: [newTitle.trim(), newSummary.trim().slice(0, 80)],
            fullReportParagraphs: [newSummary.trim()]
          } : undefined
        }
      };

      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setArticleSuccessMsg('تم نشر المقال بنجاح وإضافته إلى التغذية المباشرة!');
        setNewTitle('');
        setNewSummary('');
        setNewImageUrl('');
        setFullStoryRoot('');
        onRefreshArticles();
        setTimeout(() => setArticleSuccessMsg(null), 5000);
      } else {
        alert(data.error || 'فشل نشر المقال');
      }
    } catch (err: any) {
      alert('حدث خطأ أثناء الاتصال بالخادم: ' + (err.message || err));
    } finally {
      setIsSubmittingArticle(false);
    }
  };

  // Handle Save Ads Configuration
  const handleSaveAds = async () => {
    setIsSavingAds(true);
    setAdsSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ ads: localAds })
      });
      const data = await res.json();

      if (data.success) {
        onUpdateAdsConfig(data.ads || localAds);
        setAdsSuccessMsg('تم حفظ وتطبيق إعدادات الإعلانات الربحية بنجاح!');
        setTimeout(() => setAdsSuccessMsg(null), 4000);
      } else {
        alert(data.error || 'فشل حفظ الإعلانات');
      }
    } catch (err: any) {
      alert('خطأ أثناء حفظ الإعلانات');
    } finally {
      setIsSavingAds(false);
    }
  };

  // Handle Delete Article
  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المقال نهائياً؟')) return;

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword }
      });
      const data = await res.json();
      if (data.success) {
        onRefreshArticles();
      } else {
        alert(data.error || 'فشل حذف المقال');
      }
    } catch (e) {
      alert('خطأ أثناء حذف المقال');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Toggle Breaking Status
  const handleToggleImportance = async (article: NewsArticle) => {
    const nextImportance: Importance = article.importance === 'breaking' ? 'normal' : 'breaking';
    setActionLoadingId(article.id);

    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ importance: nextImportance })
      });
      const data = await res.json();
      if (data.success) {
        onRefreshArticles();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Force Re-generate AI Story
  const handleRegenerateStory = async (articleId: string) => {
    setActionLoadingId(articleId);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/regenerate-story`, {
        method: 'POST',
        headers: { 'x-admin-password': adminPassword }
      });
      const data = await res.json();
      if (data.success) {
        alert('تم توليد التقرير المعمق والحكاية من الأول بالذكاء الاصطناعي بنجاح!');
        onRefreshArticles();
      }
    } catch (e) {
      alert('فشل إعادة التوليد');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helper to update specific ad zone in state
  const updateAdZone = (zoneId: AdZoneId, field: keyof AdPlacement, val: any) => {
    setLocalAds(prev => ({
      ...prev,
      [zoneId]: {
        ...(prev[zoneId] || DEFAULT_ADS_CONFIG[zoneId]),
        [field]: val
      }
    }));
  };

  const filteredArticles = articles.filter(a => 
    !articleSearch.trim() || 
    a.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
    a.category.includes(articleSearch)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        id="secret-admin-panel-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-950 text-white p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center shadow-md">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-['Tajawal'] text-white">
                  لوحة التحكم والإدارة السرية
                </h2>
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                  Admin Master
                </span>
              </div>
              <p className="text-xs text-slate-400">
                إدارة المقالات والنشر الفوري، تخصيص الإعلانات الربحية، ومراقبة المحرك
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authentication View */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 max-w-md mx-auto w-full my-auto text-center space-y-6">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-['Tajawal']">
                منطقة الإدارة المحمية
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                يرجى إدخال كلمة المرور الإدارية للوصول إلى أدوات النشر والإعلانات.
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div className="text-right">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  كلمة المرور الإدارية (ADMIN_PASSWORD):
                </label>
                <input
                  id="admin-password-input"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                id="admin-login-btn"
                type="submit"
                disabled={isVerifying}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isVerifying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>دخول لوحة التحكم</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-[11px] text-slate-400">
              * ملحوظة: يمكنك تحديد وتغيير كلمة المرور عبر متغير <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-amber-500 font-mono">ADMIN_PASSWORD</code> في إعدادات البيئة.
            </p>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs Navigation */}
            <div className="bg-slate-100 dark:bg-slate-950 px-4 sm:px-6 pt-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0">
              <button
                id="admin-tab-create"
                onClick={() => setActiveTab('create_article')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition border-b-2 ${
                  activeTab === 'create_article'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-amber-500'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة ونشر مقال</span>
              </button>

              <button
                id="admin-tab-manage"
                onClick={() => setActiveTab('manage_articles')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition border-b-2 ${
                  activeTab === 'manage_articles'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-amber-500'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>التحكم في المقالات ({articles.length})</span>
              </button>

              <button
                id="admin-tab-ads"
                onClick={() => setActiveTab('ads_manager')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition border-b-2 ${
                  activeTab === 'ads_manager'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-500'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>الإعلانات الربحية (Monetization)</span>
              </button>

              <button
                id="admin-tab-jsonbin"
                onClick={() => setActiveTab('jsonbin')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition border-b-2 ${
                  activeTab === 'jsonbin'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border-sky-500'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <Database className="w-4 h-4 text-sky-500" />
                <span>ربط JSONBin الإعلانات</span>
              </button>

              <button
                id="admin-tab-security"
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition border-b-2 ${
                  activeTab === 'security'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-rose-500'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <span>كلمة المرور والأمان</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: ADD NEW ARTICLE */}
              {activeTab === 'create_article' && (
                <form onSubmit={handlePublishArticle} className="space-y-6 max-w-3xl mx-auto">
                  {articleSuccessMsg && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-3 animate-in fade-in">
                      <Check className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-bold">{articleSuccessMsg}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        عنوان الخبر / المقال *
                      </label>
                      <input
                        id="new-article-title"
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="مثال: انعقاد قمة استثنائية لإعلان خطة سلام إقليمية..."
                        required
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          التصنيف الإخباري
                        </label>
                        <select
                          id="new-article-category"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value as Category)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white"
                        >
                          {Object.values(CATEGORIES_META).map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          مستوى الأهمية والتمييز
                        </label>
                        <select
                          id="new-article-importance"
                          value={newImportance}
                          onChange={(e) => setNewImportance(e.target.value as Importance)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white font-medium"
                        >
                          <option value="breaking">🔴 عاجل وفوري (Breaking News)</option>
                          <option value="important">⚡ هام ومميز (Important Story)</option>
                          <option value="normal">📄 عادي (Standard)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        خلاصة الخبر المحايدة *
                      </label>
                      <textarea
                        id="new-article-summary"
                        rows={3}
                        value={newSummary}
                        onChange={(e) => setNewSummary(e.target.value)}
                        placeholder="اكتب تلخيصاً واضحاً ومحايداً للحدث..."
                        required
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        رابط الصورة البارزة (اختياري)
                      </label>
                      <input
                        id="new-article-image"
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          اسم المصدر الناشر
                        </label>
                        <input
                          id="new-article-source"
                          type="text"
                          value={newSourceName}
                          onChange={(e) => setNewSourceName(e.target.value)}
                          placeholder="مثال: رويترز، هيئة التحرير، الجزيرة"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          رابط المصدر الأصلي
                        </label>
                        <input
                          id="new-article-source-url"
                          type="url"
                          value={newSourceUrl}
                          onChange={(e) => setNewSourceUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Context and Full Story */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        السياق والتفاصيل الكاملة (الحكاية من الأول - اختياري)
                      </label>
                      <textarea
                        id="new-article-fullstory"
                        rows={3}
                        value={fullStoryRoot}
                        onChange={(e) => setFullStoryRoot(e.target.value)}
                        placeholder="أضف الجذور التاريخية وتفاصيل القصة ليتم عرضها في نافذة التقرير الشامل..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Push Notification Toggle */}
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <input
                        id="send-push-checkbox"
                        type="checkbox"
                        checked={sendPushNotification}
                        onChange={(e) => setSendPushNotification(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                      />
                      <label htmlFor="send-push-checkbox" className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white cursor-pointer flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-500" />
                        <span>إرسال إشعار فوري (Web Push) لجميع المشتركين عند النشر</span>
                      </label>
                    </div>
                  </div>

                  <button
                    id="publish-article-submit-btn"
                    type="submit"
                    disabled={isSubmittingArticle}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-3.5 px-6 rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingArticle ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        <span>نشر المقال وتعميمه الآن</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 2: MANAGE EXISTING ARTICLES */}
              {activeTab === 'manage_articles' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <input
                      type="text"
                      placeholder="ابحث في قائمة المقالات النشطة..."
                      value={articleSearch}
                      onChange={(e) => setArticleSearch(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-white max-w-sm w-full"
                    />
                    <span className="text-xs text-slate-500">
                      إجمالي المقالات المتاحة: {filteredArticles.length}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    {filteredArticles.slice(0, 30).map((art) => (
                      <div key={art.id} className="p-4 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              art.importance === 'breaking' 
                                ? 'bg-red-500 text-white' 
                                : art.importance === 'important'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              {art.importance === 'breaking' ? 'عاجل' : art.importance === 'important' ? 'هام' : 'عادي'}
                            </span>
                            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                              {CATEGORIES_META[art.category]?.label || art.category}
                            </span>
                            <span className="text-xs text-slate-400">• {art.primarySource?.name}</span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                            {art.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {art.summary}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Toggle Breaking Status */}
                          <button
                            onClick={() => handleToggleImportance(art)}
                            disabled={actionLoadingId === art.id}
                            className={`p-2 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                              art.importance === 'breaking'
                                ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-600'
                                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-500'
                            }`}
                            title="تبديل وسم عاجل"
                          >
                            <Flame className="w-3.5 h-3.5" />
                          </button>

                          {/* Re-generate AI Story */}
                          <button
                            onClick={() => handleRegenerateStory(art.id)}
                            disabled={actionLoadingId === art.id}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-500 transition"
                            title="إعادة توليد الحكاية من الأول بالذكاء الاصطناعي"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Article */}
                          <button
                            onClick={() => handleDeleteArticle(art.id)}
                            disabled={actionLoadingId === art.id}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 transition"
                            title="حذف المقال"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: AD MONETIZATION MANAGER */}
              {activeTab === 'ads_manager' && (
                <div className="space-y-8 max-w-4xl mx-auto">
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-4 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span>نظام إدارة الإعلانات الربحية (Ad Monetization System)</span>
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        تحكم في مساحات الإعلانات في كامل المنصة (أعلى الصفحة، مدمج بين الأخبار، الشريط العائم، وداخل نافذة التقرير).
                      </p>
                    </div>

                    <button
                      id="save-ads-config-btn"
                      onClick={handleSaveAds}
                      disabled={isSavingAds}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition shadow flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingAds ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>حفظ وتطبيق جميع الإعلانات</span>
                    </button>
                  </div>

                  {adsSuccessMsg && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-3 animate-in fade-in">
                      <Check className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-bold">{adsSuccessMsg}</span>
                    </div>
                  )}

                  {/* 4 Ad Placement Zones */}
                  <div className="space-y-6">
                    {(['header_banner', 'infeed_native', 'sidebar_sticky', 'modal_bottom'] as AdZoneId[]).map((zoneKey) => {
                      const zone = localAds[zoneKey] || DEFAULT_ADS_CONFIG[zoneKey];
                      return (
                        <div 
                          key={zoneKey} 
                          className={`p-5 rounded-2xl border transition ${
                            zone.enabled 
                              ? 'bg-white dark:bg-slate-800/70 border-slate-300 dark:border-slate-700 shadow-sm' 
                              : 'bg-slate-50 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800 opacity-75'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                  {zone.zoneName}
                                </h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  zone.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                                }`}>
                                  {zone.enabled ? 'مفعل نشط' : 'معطل'}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400">Zone ID: {zone.id}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                                <span>تفعيل هذا الإعلان:</span>
                                <input
                                  type="checkbox"
                                  checked={zone.enabled}
                                  onChange={(e) => updateAdZone(zoneKey, 'enabled', e.target.checked)}
                                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                                />
                              </label>
                            </div>
                          </div>

                          {zone.enabled && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    نوع الإعلان
                                  </label>
                                  <select
                                    value={zone.type}
                                    onChange={(e) => updateAdZone(zoneKey, 'type', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                                  >
                                    <option value="custom">بنر مخصص / شريك ممول (Custom Banner)</option>
                                    <option value="adsense">جوجل أدسنس (Google AdSense)</option>
                                    <option value="code">كود HTML / سكريبت إعلاني مخصص</option>
                                  </select>
                                </div>

                                {zone.type === 'custom' && (
                                  <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                      اسم الراعي / الشركة
                                    </label>
                                    <input
                                      type="text"
                                      value={zone.sponsorName || ''}
                                      onChange={(e) => updateAdZone(zoneKey, 'sponsorName', e.target.value)}
                                      placeholder="مثال: أكاديمية الذكاء الاصطناعي"
                                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                                    />
                                  </div>
                                )}
                              </div>

                              {zone.type === 'custom' && (
                                <>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        عنوان الإعلان البارز
                                      </label>
                                      <input
                                        type="text"
                                        value={zone.adTitle || ''}
                                        onChange={(e) => updateAdZone(zoneKey, 'adTitle', e.target.value)}
                                        placeholder="اكتب عنوان العرض أو المنتج..."
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        رابط الهبوط والتحويل (URL)
                                      </label>
                                      <input
                                        type="url"
                                        value={zone.targetUrl || ''}
                                        onChange={(e) => updateAdZone(zoneKey, 'targetUrl', e.target.value)}
                                        placeholder="https://..."
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        رابط صورة البنر
                                      </label>
                                      <input
                                        type="url"
                                        value={zone.imageUrl || ''}
                                        onChange={(e) => updateAdZone(zoneKey, 'imageUrl', e.target.value)}
                                        placeholder="https://..."
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        نص زر الإجراء (CTA)
                                      </label>
                                      <input
                                        type="text"
                                        value={zone.buttonText || ''}
                                        onChange={(e) => updateAdZone(zoneKey, 'buttonText', e.target.value)}
                                        placeholder="سجل الآن / اكتشف المزيد"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        وسم الإعلان (Badge)
                                      </label>
                                      <input
                                        type="text"
                                        value={zone.badgeText || ''}
                                        onChange={(e) => updateAdZone(zoneKey, 'badgeText', e.target.value)}
                                        placeholder="إعلان ممول / برعاية"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                      الوصف الترويجي القصير
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={zone.adDescription || ''}
                                      onChange={(e) => updateAdZone(zoneKey, 'adDescription', e.target.value)}
                                      placeholder="شرح موجز عن العرض أو الخدمة المقدمة..."
                                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                                    />
                                  </div>
                                </>
                              )}

                              {zone.type === 'adsense' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                      AdSense Publisher Client ID
                                    </label>
                                    <input
                                      type="text"
                                      value={zone.adsenseClientId || ''}
                                      onChange={(e) => updateAdZone(zoneKey, 'adsenseClientId', e.target.value)}
                                      placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                      AdSense Slot ID
                                    </label>
                                    <input
                                      type="text"
                                      value={zone.adsenseSlotId || ''}
                                      onChange={(e) => updateAdZone(zoneKey, 'adsenseSlotId', e.target.value)}
                                      placeholder="1234567890"
                                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                                    />
                                  </div>
                                </div>
                              )}

                              {zone.type === 'code' && (
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    كود HTML / Javascript للإعلان
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={zone.customHtml || ''}
                                    onChange={(e) => updateAdZone(zoneKey, 'customHtml', e.target.value)}
                                    placeholder="<div class='ad-block'>...</div>"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: JSONBIN INTEGRATION */}
              {activeTab === 'jsonbin' && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/80 p-5 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          ربط قاعدة البيانات بـ JSONBin.io (Cloud Sync)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          ربط إعدادات الإعلانات وكلمة المرور الإدارية بسيرفر خارجي دائم ليظهر للجميع عبر كافة الجلسات
                        </p>
                      </div>
                    </div>
                  </div>

                  {jsonBinMsg && (
                    <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 ${
                      jsonBinMsg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    }`}>
                      {jsonBinMsg.type === 'success' ? <Check className="w-5 h-5 shrink-0 text-emerald-500" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />}
                      <span>{jsonBinMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveJsonBin} className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        JSONBin Bin ID
                      </label>
                      <input
                        type="text"
                        value={jsonBinId}
                        onChange={(e) => setJsonBinId(e.target.value)}
                        placeholder="مثال: 65a123456789abcdef"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-sky-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">معرف الـ Bin الذي تم إنشاؤه على موقع jsonbin.io</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        JSONBin Master Key / API Key
                      </label>
                      <input
                        type="password"
                        value={jsonBinMasterKey}
                        onChange={(e) => setJsonBinMasterKey(e.target.value)}
                        placeholder="$2a$10$XXXXXXXXXXXXXXXXXXXXXX"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-sky-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">مفتاح الوصول الخاص بك من حساب JSONBin للحفظ والقراءة</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="auto-sync-jsonbin"
                        checked={jsonBinAutoSync}
                        onChange={(e) => setJsonBinAutoSync(e.target.checked)}
                        className="w-4 h-4 text-sky-600 rounded border-slate-300"
                      />
                      <label htmlFor="auto-sync-jsonbin" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        تفعيل المزامنة التلقائية فور إجراء تغييرات الإعلانات
                      </label>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 flex-wrap">
                      <button
                        type="submit"
                        disabled={isSavingJsonBin}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSavingJsonBin ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                        <span>حفظ إعدادات JSONBin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSyncJsonBin('push')}
                        disabled={isSavingJsonBin || !jsonBinId}
                        className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CloudUpload className="w-4 h-4 text-sky-500" />
                        <span>رفع التكوين الحالي لسيرفر JSONBin (Push)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSyncJsonBin('pull')}
                        disabled={isSavingJsonBin || !jsonBinId}
                        className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CloudDownload className="w-4 h-4 text-emerald-500" />
                        <span>جلب التكوين من سيرفر JSONBin (Pull)</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 5: ADMIN SECURITY PASSWORD */}
              {activeTab === 'security' && (
                <div className="space-y-6 max-w-xl mx-auto">
                  <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 p-5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          تغيير كلمة المرور الإدارية السرية
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          حماية لوحة التحكم والإعلانات بكلمة سر جديدة خاصة بك
                        </p>
                      </div>
                    </div>
                  </div>

                  {passwordMsg && (
                    <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 ${
                      passwordMsg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    }`}>
                      {passwordMsg.type === 'success' ? <Check className="w-5 h-5 shrink-0 text-emerald-500" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />}
                      <span>{passwordMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangeAdminPassword} className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        كلمة المرور الجديدة
                      </label>
                      <input
                        type="password"
                        required
                        value={newAdminPass}
                        onChange={(e) => setNewAdminPass(e.target.value)}
                        placeholder="أدخل كلمة المرور الجديدة..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        تأكيد كلمة المرور الجديدة
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmAdminPass}
                        onChange={(e) => setConfirmAdminPass(e.target.value)}
                        placeholder="أعد إدخال كلمة المرور الجديدة..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isChangingPassword || !newAdminPass.trim()}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isChangingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>حفظ كلمة المرور السرية الجديدة</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
