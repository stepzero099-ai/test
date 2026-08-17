import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ExternalLink, 
  Bookmark, 
  Share2, 
  Volume2, 
  VolumeX, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles,
  Flame,
  Check,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from 'lucide-react';
import { CATEGORIES_META, NewsArticle, ArticleRating } from '../types';
import { formatArabicRelativeTime } from '../utils/dateFormatter';
import { getCategoryFallbackImage, sanitizeImageUrl } from '../utils/imageFallback';

interface ArticleCardProps {
  article: NewsArticle;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onOpenFullStory: (article: NewsArticle) => void;
  fontSize: 'sm' | 'md' | 'lg';
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  isSaved,
  onToggleSave,
  onOpenFullStory,
  fontSize
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const [ratingData, setRatingData] = useState<ArticleRating | null>(null);
  const [userReacted, setUserReacted] = useState<'like' | 'dislike' | null>(null);

  useEffect(() => {
    fetch(`/api/news/${article.id}/rating`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.rating) {
          setRatingData(data.rating);
        }
      })
      .catch(() => {});
  }, [article.id]);

  const handleReaction = (e: React.MouseEvent, reaction: 'like' | 'dislike') => {
    e.stopPropagation();
    if (userReacted === reaction) return;

    setUserReacted(reaction);
    fetch(`/api/news/${article.id}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.rating) {
          setRatingData(data.rating);
        }
      })
      .catch(() => {});
  };

  const categoryMeta = CATEGORIES_META[article.category] || CATEGORIES_META.politics;

  // Resolve safe image: either sanitized article image or guaranteed category fallback
  const resolvedImageUrl = (!imgError && sanitizeImageUrl(article.imageUrl)) 
    ? sanitizeImageUrl(article.imageUrl)! 
    : getCategoryFallbackImage(article.category, article.title);

  // Text size classes based on user setting
  const getFontSizeClasses = () => {
    switch (fontSize) {
      case 'sm':
        return {
          title: 'text-base sm:text-lg',
          summary: 'text-xs sm:text-sm leading-relaxed',
        };
      case 'lg':
        return {
          title: 'text-xl sm:text-2xl',
          summary: 'text-base sm:text-lg leading-loose',
        };
      default:
        return {
          title: 'text-lg sm:text-xl',
          summary: 'text-sm sm:text-base leading-relaxed',
        };
    }
  };

  const fontClasses = getFontSizeClasses();

  // Arabic Text-to-Speech using browser SpeechSynthesis
  const handleToggleSpeech = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) {
      alert('ميزة القراءة الصوتية غير مدعومة في هذا المتصفح');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${article.title}. ${article.summary}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.95;

      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: article.title,
      text: `${article.title}\n${article.summary}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(`${article.title}\n${article.summary}\n${window.location.href}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <article
      id={`article-card-${article.id}`}
      onClick={() => onOpenFullStory(article)}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-sky-300 dark:hover:border-sky-700 transition-all duration-200 overflow-hidden flex flex-col group cursor-pointer"
    >
      {/* Top Media Thumbnail - Always guaranteed and safe */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={resolvedImageUrl}
          alt={article.title}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>

        {/* Floating Category Badge over image */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 flex-wrap">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-md ${categoryMeta.badgeBg}`}>
            {categoryMeta.label}
          </span>

          {article.importance === 'breaking' && (
            <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-white" />
              عاجل
            </span>
          )}
        </div>

        {/* Source Corroboration Badge bottom right */}
        <div className="absolute bottom-2.5 right-3">
          {article.isCorroborated ? (
            <div className="flex items-center gap-1 bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>مؤكد من {article.sourceCount} مصادر</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-700/50 text-[11px] font-medium px-2 py-0.5 rounded-md">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>مصدر منفرد • قيد المتابعة</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>

          {/* Title */}
          <h3 className={`${fontClasses.title} font-bold text-slate-900 dark:text-white mb-2.5 font-['Tajawal'] line-clamp-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition`}>
            {article.title}
          </h3>

          {/* AI Neutral Summary */}
          <p className={`${fontClasses.summary} text-slate-600 dark:text-slate-300 mb-4 line-clamp-3`}>
            {article.summary}
          </p>
        </div>

        {/* Bottom Section */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Live Rating & Community Feedback Row */}
          {ratingData && (
            <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{ratingData.averageRating}</span>
                <span className="text-slate-400 font-normal text-[11px]">({ratingData.totalVotes} تقييم)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleReaction(e, 'like')}
                  className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border transition ${
                    userReacted === 'like'
                      ? 'bg-emerald-500 text-white border-emerald-600 font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700'
                  }`}
                  title="إعجاب بالخبر"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>{ratingData.likes}</span>
                </button>

                <button
                  onClick={(e) => handleReaction(e, 'dislike')}
                  className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border transition ${
                    userReacted === 'dislike'
                      ? 'bg-rose-500 text-white border-rose-600 font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-700'
                  }`}
                  title="لم يعجبني"
                >
                  <ThumbsDown className="w-3 h-3" />
                  <span>{ratingData.dislikes}</span>
                </button>
              </div>
            </div>
          )}

          {/* Sources List & Relative Time */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
            {/* Multi-Sources Tag */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-[11px]">المصادر:</span>
              {article.sources.map((s, idx) => (
                <a
                  key={s.id || idx}
                  href={s.url || article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium transition inline-flex items-center gap-0.5"
                  title="الرابط الأصلي لدى المصدر"
                >
                  <span>{s.name}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatArabicRelativeTime(article.publishedAt)}
              </span>
            </div>
          </div>

          {/* Card Actions Row: Full Story Button + Utility Icons */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Signature Feature Button */}
            <button
              id={`full-story-btn-${article.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onOpenFullStory(article);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md shadow-sky-600/20 transition active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-sky-200" />
              <span>الحكاية من الأول 📖</span>
            </button>

            {/* Audio Reader */}
            <button
              id={`audio-btn-${article.id}`}
              onClick={handleToggleSpeech}
              className={`p-2.5 rounded-xl border transition ${
                isPlayingAudio
                  ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title={isPlayingAudio ? 'إيقاف القراءة الصوتية' : 'استمع للخبر صوتياً باللغة العربية'}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Bookmark Button */}
            <button
              id={`save-btn-${article.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(article.id);
              }}
              className={`p-2.5 rounded-xl border transition ${
                isSaved
                  ? 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-700'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title={isSaved ? 'إزالة من المحفوظات' : 'حفظ الخبر للمطالعة لاحقاً'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-sky-600 dark:fill-sky-400' : ''}`} />
            </button>

            {/* Share Button */}
            <button
              id={`share-btn-${article.id}`}
              onClick={handleShare}
              className="p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition"
              title="مشاركة الخبر"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
