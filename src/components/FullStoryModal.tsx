import React, { useState, useEffect } from 'react';
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
  Globe,
  Share2,
  Check,
  FileText,
  Quote,
  CheckCircle2,
  Type,
  Copy,
  Rss,
  Info,
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  Send
} from 'lucide-react';
import { CATEGORIES_META, FullStory, NewsArticle, AdPlacement, ArticleComment, ArticleRating } from '../types';
import { AdBanner } from './AdBanner';
import { getCategoryFallbackImage, sanitizeImageUrl } from '../utils/imageFallback';

interface FullStoryModalProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  ad?: AdPlacement;
}

export const FullStoryModal: React.FC<FullStoryModalProps> = ({
  article,
  isOpen,
  onClose,
  isLoading,
  fontSize: initialFontSize,
  ad
}) => {
  const [activeTab, setActiveTab] = useState<'fullReport' | 'overview' | 'timeline' | 'entities' | 'faq' | 'wikipedia' | 'comments'>('fullReport');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedFullText, setCopiedFullText] = useState<boolean>(false);
  const [modalFontSize, setModalFontSize] = useState<'sm' | 'md' | 'lg'>(initialFontSize);
  const [coverImgError, setCoverImgError] = useState<boolean>(false);

  // Real Server Comments & Ratings State
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [ratingInfo, setRatingInfo] = useState<ArticleRating | null>(null);
  const [newCommentName, setNewCommentName] = useState<string>('');
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [newCommentRating, setNewCommentRating] = useState<number>(5);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [commentSuccessMsg, setCommentSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!article) return;

    // Fetch comments
    fetch(`/api/news/${article.id}/comments`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.comments) setComments(d.comments);
      })
      .catch(() => {});

    // Fetch rating
    fetch(`/api/news/${article.id}/rating`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.rating) setRatingInfo(d.rating);
      })
      .catch(() => {});
  }, [article?.id]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!article || !newCommentText.trim()) return;

    setIsSubmittingComment(true);
    setCommentSuccessMsg(null);

    fetch(`/api/news/${article.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: newCommentName.trim() || 'قارئ موثوق',
        text: newCommentText.trim(),
        rating: newCommentRating
      })
    })
      .then(r => r.json())
      .then(d => {
        setIsSubmittingComment(false);
        if (d.success) {
          if (d.comments) setComments(d.comments);
          setNewCommentText('');
          setCommentSuccessMsg('تم نشر تعليقك وتقييمك بنجاح على السيرفر!');
          setTimeout(() => setCommentSuccessMsg(null), 3500);

          // Refresh rating info
          fetch(`/api/news/${article.id}/rating`)
            .then(r => r.json())
            .then(rd => {
              if (rd.success && rd.rating) setRatingInfo(rd.rating);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        setIsSubmittingComment(false);
      });
  };

  const handleRate = (stars: number) => {
    if (!article) return;
    setNewCommentRating(stars);
    fetch(`/api/news/${article.id}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: stars })
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.rating) setRatingInfo(d.rating);
      })
      .catch(() => {});
  };

  if (!isOpen || !article) return null;

  const fullStory: FullStory | undefined = article.fullStory;
  const categoryMeta = CATEGORIES_META[article.category] || CATEGORIES_META.politics;

  const resolvedCoverImage = (!coverImgError && sanitizeImageUrl(article.imageUrl))
    ? sanitizeImageUrl(article.imageUrl)!
    : getCategoryFallbackImage(article.category, article.title);

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
      const reportText = fullStory?.fullReportParagraphs?.join('. ') || article.summary;
      const narrative = `التقرير الإخباري الكامل لخبر: ${article.title}. ${reportText}. المصادر الموثقة: ${article.sources.map(s => s.name).join(' و ')}.`;
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
    const text = `اقرأ التقرير والتفاصيل الكاملة لخبر: ${article.title}\nمنصة خبر اللحظة`;
    if (navigator.share) {
      navigator.share({ title: article.title, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyFullReport = () => {
    const paragraphs = fullStory?.fullReportParagraphs?.join('\n\n') || article.summary;
    const highlights = fullStory?.keyHighlights ? `\n\nأبرز المحاور:\n` + fullStory.keyHighlights.map(h => `• ${h}`).join('\n') : '';
    const fullTextToCopy = `📌 ${article.title}\n\n${paragraphs}${highlights}\n\nالمصدر الأصلي: ${article.primarySource.name} (${article.url})\nتوثيق: خبر اللحظة`;

    navigator.clipboard.writeText(fullTextToCopy);
    setCopiedFullText(true);
    setTimeout(() => setCopiedFullText(false), 2500);
  };

  const handleClose = () => {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
    onClose();
  };

  // Typography scaling
  const textClasses = {
    sm: {
      body: 'text-sm leading-relaxed',
      paragraph: 'text-sm leading-relaxed mb-4',
      title: 'text-lg sm:text-xl'
    },
    md: {
      body: 'text-base leading-relaxed',
      paragraph: 'text-base leading-relaxed mb-4',
      title: 'text-xl sm:text-2xl'
    },
    lg: {
      body: 'text-lg leading-loose',
      paragraph: 'text-lg leading-loose mb-5',
      title: 'text-2xl sm:text-3xl'
    }
  }[modalFontSize];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        id="full-story-modal-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl relative overflow-hidden"
      >
        {/* Top Header Gradient Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-blue-950 text-white p-5 sm:p-6 relative border-b border-slate-800 shrink-0">
          {/* Action buttons & Tags */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${categoryMeta.badgeBg}`}>
                {categoryMeta.label}
              </span>
              <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                التقرير والتفاصيل الكاملة
              </span>
              {article.isCorroborated && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  مؤكد من {article.sourceCount} مصادر
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Font Size Adjusters */}
              <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/20 text-xs">
                <button
                  onClick={() => setModalFontSize('sm')}
                  className={`px-2 py-1 rounded-lg transition ${modalFontSize === 'sm' ? 'bg-sky-500 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                  title="خط عادي أصغر"
                >
                  A-
                </button>
                <button
                  onClick={() => setModalFontSize('md')}
                  className={`px-2 py-1 rounded-lg transition ${modalFontSize === 'md' ? 'bg-sky-500 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                  title="خط متوسط"
                >
                  A
                </button>
                <button
                  onClick={() => setModalFontSize('lg')}
                  className={`px-2 py-1 rounded-lg transition ${modalFontSize === 'lg' ? 'bg-sky-500 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                  title="خط كبير مريح"
                >
                  A+
                </button>
              </div>

              {/* Copy Full Report */}
              <button
                onClick={handleCopyFullReport}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
                title="نسخ التقرير الإخباري الشامل"
              >
                {copiedFullText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Audio Listen */}
              <button
                onClick={handleToggleSpeech}
                className={`p-2 rounded-xl border transition ${
                  isPlayingAudio
                    ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
                title={isPlayingAudio ? 'إيقاف الصوت' : 'استمع لتفاصيل الخبر صوتياً'}
              >
                {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
                title="مشاركة"
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
          <h2 className={`${textClasses.title} font-bold text-white leading-snug font-['Tajawal']`}>
            {article.title}
          </h2>

          {/* Source Attribution Row */}
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-300 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Rss className="w-3 h-3 text-sky-400" />
              <span>المصدر الرئيسي: <strong>{article.primarySource.name}</strong></span>
            </span>
            <span>•</span>
            <span>توثيق من: {article.sources.map(s => s.name).join('، ')}</span>
            <span>•</span>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-300 hover:text-white underline inline-flex items-center gap-1 font-semibold"
            >
              <span>رابط التغطية الأصلية</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800/90 px-3 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('fullReport')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'fullReport'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-white/40 dark:bg-slate-700/40 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>نص التقرير والتفاصيل</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-white/40 dark:bg-slate-700/40 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>السياق والجذور (الحكاية)</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-white/40 dark:bg-slate-700/40 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>الخط الزمني ({fullStory?.timeline?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('entities')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'entities'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-white/40 dark:bg-slate-700/40 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الشخصيات والجهات ({fullStory?.entities?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'faq'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-white/40 dark:bg-slate-700/40 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>الأسئلة الشائعة والأبعاد ({fullStory?.faqList?.length || 1})</span>
          </button>

          <button
            onClick={() => setActiveTab('wikipedia')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'wikipedia'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-white/40 dark:bg-slate-700/40 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>سياق ويكيبيديا ({fullStory?.wikipediaSources?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'comments'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 bg-white/40 dark:bg-slate-700/40 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <span>التعليقات والتقييمات ({comments.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                جاري إعداد التقرير الإخباري الشامل وتفاصيل التغطية المعرفية...
              </p>
            </div>
          ) : (
            <>
              {/* ======================================================== */}
              {/* TAB 1: FULL IN-DEPTH REPORT (نص التقرير الإخباري والتفاصيل) */}
              {/* ======================================================== */}
              {activeTab === 'fullReport' && (
                <div className="space-y-6">
                  {/* Article Hero Image - Guaranteed and safe */}
                  <div className="relative h-56 sm:h-72 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-900">
                    <img
                      src={resolvedCoverImage}
                      alt={article.title}
                      referrerPolicy="no-referrer"
                      onError={() => setCoverImgError(true)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-3 right-4 left-4 flex items-center justify-between text-xs text-white">
                      <span className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                        المصدر: {article.primarySource.name}
                      </span>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-sky-600/90 hover:bg-sky-600 backdrop-blur-sm text-white px-3 py-1 rounded-lg flex items-center gap-1 font-semibold transition"
                      >
                        <span>قراءة المقال الأصلي لدى الناشر</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Key Highlights / Bullets */}
                  <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-800/90 dark:to-sky-950/40 border border-sky-200 dark:border-sky-800 p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 text-sky-900 dark:text-sky-300 font-bold mb-3 text-sm sm:text-base">
                      <Sparkles className="w-5 h-5 text-sky-600" />
                      <span>أبرز محاور وحقائق الخبر (Key Highlights)</span>
                    </div>
                    <ul className="space-y-2">
                      {(fullStory?.keyHighlights && fullStory.keyHighlights.length > 0 ? fullStory.keyHighlights : [
                        article.title,
                        `نقل وتوثيق من ${article.sources.map(s => s.name).join('، ')}`,
                        article.summary
                      ]).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="leading-relaxed font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Comprehensive Detailed Article Paragraphs */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 p-5 sm:p-7 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm sm:text-base">
                        <FileText className="w-5 h-5 text-sky-600" />
                        <span>نص التقرير الإخباري الشامل والتفاصيل الدقيقة</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        قراءة في ~{article.readingTimeMinutes || 3} دقيقة
                      </span>
                    </div>

                    <div className="font-['Tajawal'] text-slate-800 dark:text-slate-200">
                      {(fullStory?.fullReportParagraphs && fullStory.fullReportParagraphs.length > 0 ? (
                        fullStory.fullReportParagraphs.map((paragraph, pIdx) => (
                          <p key={pIdx} className={textClasses.paragraph}>
                            {paragraph}
                          </p>
                        ))
                      ) : (
                        <>
                          <p className={textClasses.paragraph}>{article.summary}</p>
                          <p className={textClasses.paragraph}>
                            تتواصل المتابعات الميدانية والدبلوماسية لتداعيات هذا الحدث وفق ما أكدته مصادر إخبارية متطابقة، مع استمرار تقييم الآثار المباشرة على مختلف الأصعدة.
                          </p>
                        </>
                      ))}
                    </div>
                  </div>

                  {/* Strategic In-Depth Analysis */}
                  {fullStory?.inDepthAnalysis && (
                    <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 p-5 rounded-2xl">
                      <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold mb-2 text-sm sm:text-base">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <span>التحليل المعمق وما وراء الخبر</span>
                      </div>
                      <p className={`text-slate-700 dark:text-slate-300 ${textClasses.body}`}>
                        {fullStory.inDepthAnalysis}
                      </p>
                    </div>
                  )}

                  {/* Key Quotes if available */}
                  {fullStory?.quotes && fullStory.quotes.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <Quote className="w-4 h-4 text-sky-600" />
                        <span>أبرز التصريحات والمواقف المسجلة:</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {fullStory.quotes.map((q, idx) => (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex flex-col justify-between">
                            <p className="text-xs sm:text-sm italic text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                              "{q.quote}"
                            </p>
                            <div className="text-xs font-bold text-sky-700 dark:text-sky-300 border-t border-slate-200 dark:border-slate-700/60 pt-2">
                              {q.speaker} {q.title ? `— ${q.title}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verified Sources Matrix */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>المصادر الموثقة في هذا التقرير:</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {article.sources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.url || article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition font-medium shadow-xs"
                        >
                          <span>{src.name}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 2: OVERVIEW & ROOTS (السياق والجذور والتأثير) */}
              {/* ======================================================== */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Summary of roots (AI Enriched) */}
                  <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold mb-2 text-sm sm:text-base">
                      <Sparkles className="w-5 h-5 text-sky-600" />
                      <span>جذور القصة وإحاطة البداية (الحكاية من الأول)</span>
                    </div>
                    <p className={`text-slate-700 dark:text-slate-200 ${textClasses.body}`}>
                      {fullStory?.summary || article.summary}
                    </p>
                  </div>

                  {/* Why It Matters Now */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold mb-2 text-sm sm:text-base">
                      <HelpCircle className="w-5 h-5 text-amber-500" />
                      <span>لماذا تهمنا القصة الآن؟</span>
                    </div>
                    <p className={`text-slate-600 dark:text-slate-300 ${textClasses.body}`}>
                      {fullStory?.whyItMatters || 'يكتسب هذا الموضوع أهمية محورية لتأثيره المباشر على التوازنات السياسية والمجتمعية.'}
                    </p>
                  </div>

                  {/* Historical Context */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold mb-2 text-sm sm:text-base">
                      <Clock className="w-5 h-5 text-indigo-500" />
                      <span>السياق التاريخي وتراكمات الملف</span>
                    </div>
                    <p className={`text-slate-600 dark:text-slate-300 ${textClasses.body}`}>
                      {fullStory?.historicalContext || 'تعود تفاصيل هذا الملف إلى تراكمات ومواقف تاريخية متشابكة شكلت المشهد الحاضر.'}
                    </p>
                  </div>

                  {/* Expected Developments */}
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

              {/* ======================================================== */}
              {/* TAB 3: INTERACTIVE TIMELINE (الخط الزمني للمحطات) */}
              {/* ======================================================== */}
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

              {/* ======================================================== */}
              {/* TAB 4: KEY FIGURES & ENTITIES (الشخصيات والجهات) */}
              {/* ======================================================== */}
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

              {/* ======================================================== */}
              {/* TAB 5: FAQ & QUESTIONS (الأسئلة الشائعة وتفسير الحدث) */}
              {/* ======================================================== */}
              {activeTab === 'faq' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    أسئلة شائعة وإجابات دقيقة تشرح جوهر الخبر وأبعاده:
                  </p>

                  <div className="space-y-3">
                    {(fullStory?.faqList && fullStory.faqList.length > 0 ? fullStory.faqList : [
                      {
                        question: 'ما هو جوهر هذا الخبر بالتحديد؟',
                        answer: article.summary
                      },
                      {
                        question: 'ما هي أهم التأثيرات والتداعيات المتوقعة؟',
                        answer: fullStory?.whyItMatters || 'من المتوقع استمرار المتابعة لتقييم تأثير هذا الحدث على الصعيدين الإقليمي والدولي.'
                      }
                    ]).map((faq, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 p-5 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                          <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>{faq.question}</span>
                        </div>
                        <p className={`text-slate-600 dark:text-slate-300 pr-6 ${textClasses.body}`}>
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 6: WIKIPEDIA OPEN-LICENSE SOURCES */}
              {/* ======================================================== */}
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
              {/* ======================================================== */}
              {/* TAB 7: REAL SERVER COMMENTS & RATINGS */}
              {/* ======================================================== */}
              {activeTab === 'comments' && (
                <div className="space-y-6">
                  {/* Rating Header Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                        <span>تقييمات القراء للخبر</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        تفاعل حقيقي مباشر مرتبط بالسيرفر المركزي
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-black text-amber-500">{ratingInfo?.averageRating || '5.0'}</div>
                        <div className="text-[11px] text-slate-400">{ratingInfo?.totalVotes || comments.length} أصوات</div>
                      </div>

                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

                      <div className="flex items-center gap-2">
                        <div className="text-center px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                          <div className="text-sm font-bold">{ratingInfo?.likes || 0}</div>
                          <div className="text-[10px]">إعجاب</div>
                        </div>
                        <div className="text-center px-2 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
                          <div className="text-sm font-bold">{ratingInfo?.dislikes || 0}</div>
                          <div className="text-[10px]">لم يعجبهم</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add New Comment Form */}
                  <form onSubmit={handleAddComment} className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl space-y-4 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-sky-500" />
                      <span>أضف تعليقك أو تقييمك للخبر</span>
                    </h4>

                    {commentSuccessMsg && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{commentSuccessMsg}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">اسمك الكريـم (اختياري)</label>
                        <input
                          type="text"
                          value={newCommentName}
                          onChange={(e) => setNewCommentName(e.target.value)}
                          placeholder="مثال: قارئ من القاهرة"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تقييم الخبر بالنجوم</label>
                        <div className="flex items-center gap-1 py-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRate(star)}
                              className="p-1 text-slate-300 hover:text-amber-400 transition"
                            >
                              <Star className={`w-5 h-5 ${newCommentRating >= star ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">التعليق أو وجهة النظر</label>
                      <textarea
                        rows={3}
                        required
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="اكتب تعليقك هنا ليظهر لجميع القراء..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingComment || !newCommentText.trim()}
                      className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingComment ? 'جاري النشر...' : 'نشر التعليق للسيرفر'}</span>
                    </button>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      التعليقات المنشورة ({comments.length})
                    </h5>

                    {comments.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-slate-500 text-xs">
                        لا توجد تعليقات حتى الآن. كن أول من يضيف تعليقاً لهذا الخبر!
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-4 rounded-2xl space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center justify-center">
                                {comment.userName.charAt(0)}
                              </div>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {comment.userName}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${comment.rating >= s ? 'fill-amber-400 text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed pr-9">
                            {comment.text}
                          </p>

                          <div className="text-[10px] text-slate-400 pr-9">
                            {new Date(comment.createdAt).toLocaleString('ar-EG')}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Optional In-Modal Ad Placement */}
          {ad && ad.enabled && (
            <AdBanner variant="modal" ad={ad} />
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span>منصة خبر اللحظة</span>
            <span>•</span>
            <span>تغطية شاملة وموثقة من كبرى الوكالات</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyFullReport}
              className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 text-xs"
            >
              {copiedFullText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFullText ? 'تم النسخ' : 'نسخ التقرير'}</span>
            </button>

            <button
              onClick={handleClose}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-xl font-bold transition text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
