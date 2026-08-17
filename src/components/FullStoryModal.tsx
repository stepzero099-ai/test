import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  ExternalLink, 
  Clock, 
  Calendar, 
  Users, 
  HelpCircle, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Volume2, 
  VolumeX, 
  Compass, 
  Layers,
  ChevronRight,
  Globe,
  Share2,
  Check
} from 'lucide-react';
import { CATEGORIES_META, FullStory, NewsArticle } from '../types';

interface FullStoryModalProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  fontSize: 'sm' | 'md' | 'lg';
}

export const FullStoryModal: React.FC<FullStoryModalProps> = ({
  article,
  isOpen,
  onClose,
  isLoading,
  fontSize
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'entities' | 'wikipedia'>('overview');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!isOpen || !article) return null;

  const fullStory: FullStory | undefined = article.fullStory;
  const categoryMeta = CATEGORIES_META[article.category] || CATEGORIES_META.politics;

  // Text-to-Speech handler for Full Story
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('ميزة القراءة الصوتية غير مدعومة في هذا المتصفح');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const narrative = `الحكاية من الأول لخبر: ${article.title}. ${fullStory?.summary || article.summary}. لماذا تهمنا القصة الآن؟ ${fullStory?.whyItMatters || ''}. السياق التاريخي: ${fullStory?.historicalContext || ''}`;
      const utterance = new SpeechSynthesisUtterance(narrative);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.95;

      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleShare = () => {
    const text = `اقرأ "الحكاية من الأول" لخبر: ${article.title}\nمنصة خبر اللحظة`;
    if (navigator.share) {
      navigator.share({ title: article.title, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleClose = () => {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        id="full-story-modal-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden"
      >
        {/* Top Header Gradient Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-blue-950 text-white p-5 sm:p-6 relative border-b border-slate-800 shrink-0">
          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${categoryMeta.badgeBg}`}>
                {categoryMeta.label}
              </span>
              <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                الحكاية من الأول 📖
              </span>
              {article.isCorroborated && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  مؤكد من {article.sourceCount} مصادر
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Audio Listen */}
              <button
                onClick={handleToggleSpeech}
                className={`p-2 rounded-xl border transition ${
                  isPlayingAudio
                    ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
                title={isPlayingAudio ? 'إيقاف الصوت' : 'استمع للحكاية كاملة صوتياً'}
              >
                {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
                title="مشاركة القصة"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Article Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug font-['Tajawal']">
            {article.title}
          </h2>

          {/* Source Attribution Row */}
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-300 flex-wrap">
            <span>الناشر الأصلي: {article.primarySource.name}</span>
            <span>•</span>
            <span>توثيق: {article.sources.map(s => s.name).join('، ')}</span>
            <span>•</span>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-300 hover:text-white underline inline-flex items-center gap-1"
            >
              <span>رابط التغطية الأصلية</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>السياق والجذور</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>الخط الزمني للمحطات ({fullStory?.timeline?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('entities')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'entities'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الشخصيات والجهات ({fullStory?.entities?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('wikipedia')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'wikipedia'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>سياق ويكيبيديا ({fullStory?.wikipediaSources?.length || 0})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                جاري توليد السياق المعرفي والبحث في الأرشيف وموسوعة ويكيبيديا...
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* 1. Summary of roots */}
                  <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold mb-2 text-sm sm:text-base">
                      <Sparkles className="w-5 h-5 text-sky-600" />
                      <span>جذور القصة وإحاطة البداية</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed">
                      {fullStory?.summary || article.summary}
                    </p>
                  </div>

                  {/* 2. Why It Matters Now */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold mb-2 text-sm sm:text-base">
                      <HelpCircle className="w-5 h-5 text-amber-500" />
                      <span>لماذا تهمنا القصة الآن؟</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                      {fullStory?.whyItMatters || 'يكتسب هذا الموضوع أهمية محورية لتأثيره المباشر على التوازنات السياسية والمجتمعية.'}
                    </p>
                  </div>

                  {/* 3. Historical Context */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold mb-2 text-sm sm:text-base">
                      <Clock className="w-5 h-5 text-indigo-500" />
                      <span>السياق التاريخي وتراكمات الملف</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                      {fullStory?.historicalContext || 'تعود تفاصيل هذا الملف إلى تراكمات ومواقف تاريخية متشابكة شكلت المشهد الحاضر.'}
                    </p>
                  </div>

                  {/* 4. Expected Developments */}
                  {fullStory?.expectedDevelopments && fullStory.expectedDevelopments.length > 0 && (
                    <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-5 rounded-2xl">
                      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold mb-3 text-sm sm:text-base">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                        <span>ما هي التطورات والسيناريوهات المتوقعة القادمة؟</span>
                      </div>
                      <ul className="space-y-2.5">
                        {fullStory.expectedDevelopments.map((dev, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                            <span className="leading-relaxed">{dev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INTERACTIVE TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    أهم المحطات التاريخية والمفصلية التي مهدت لهذا الحدث:
                  </p>

                  <div className="relative pr-6 border-r-2 border-sky-400/40 dark:border-sky-600/40 space-y-8 my-4 mr-3">
                    {(fullStory?.timeline || []).map((tEvent, idx) => (
                      <div key={idx} className="relative group">
                        {/* Timeline Node Icon */}
                        <div className="absolute -right-[31px] top-0 w-4 h-4 rounded-full bg-sky-600 ring-4 ring-sky-100 dark:ring-sky-950 transition group-hover:scale-125"></div>

                        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
                          <span className="inline-block text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-md mb-1.5 border border-sky-200 dark:border-sky-800">
                            {tEvent.date}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                            {tEvent.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            {tEvent.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: KEY FIGURES & ENTITIES */}
              {activeTab === 'entities' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    الشخصيات والهيئات والكيانات المحورية في قلب هذه التغطية:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(fullStory?.entities || []).map((ent, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
                              {ent.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {ent.name}
                              </h4>
                              <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                                {ent.role}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {ent.background}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: WIKIPEDIA OPEN-LICENSE SOURCES */}
              {activeTab === 'wikipedia' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    مقالات مرجعية مفتوحة المصدر تم استرجاعها مباشرة عبر ويكيبيديا العربية لإثراء خلفية الخبر:
                  </p>

                  {(!fullStory?.wikipediaSources || fullStory.wikipediaSources.length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-500">
                      لا توجد مراجع ويكيبيديا مباشرة لهذا الخبر حالياً.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {fullStory.wikipediaSources.map((wiki, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex flex-col sm:flex-row items-start gap-4"
                        >
                          {wiki.thumbnail && (
                            <img
                              src={wiki.thumbnail}
                              alt={wiki.title}
                              className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {wiki.title}
                              </h4>
                              <a
                                href={wiki.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 inline-flex items-center gap-1"
                              >
                                <span>المقال على ويكيبيديا</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {wiki.extract}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span>منصة خبر اللحظة</span>
            <span>•</span>
            <span>تحليل محايد وتدقيق سياقي شامل</span>
          </div>

          <button
            onClick={handleClose}
            className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
