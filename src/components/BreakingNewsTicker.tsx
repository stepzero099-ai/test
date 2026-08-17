import React from 'react';
import { Flame, ArrowLeft, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { NewsArticle } from '../types';
import { formatArabicRelativeTime } from '../utils/dateFormatter';

interface BreakingNewsTickerProps {
  breakingArticles: NewsArticle[];
  onOpenArticle: (article: NewsArticle) => void;
  onOpenFullStory: (article: NewsArticle) => void;
}

export const BreakingNewsTicker: React.FC<BreakingNewsTickerProps> = ({
  breakingArticles,
  onOpenArticle,
  onOpenFullStory
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  if (!breakingArticles || breakingArticles.length === 0) {
    return null;
  }

  const currentArticle = breakingArticles[currentIndex % breakingArticles.length];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % breakingArticles.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + breakingArticles.length) % breakingArticles.length);
  };

  return (
    <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white shadow-md border-b border-red-800/80">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Breaking Badge with pulse */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/20 font-bold text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-300"></span>
            </span>
            <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <span>عاجل</span>
          </div>

          {breakingArticles.length > 1 && (
            <span className="text-[11px] text-red-100 bg-red-800/60 px-2 py-0.5 rounded">
              {currentIndex + 1} من {breakingArticles.length}
            </span>
          )}
        </div>

        {/* Article Title & Source info */}
        <div 
          onClick={() => onOpenArticle(currentArticle)}
          className="flex-1 min-w-0 cursor-pointer group flex items-center gap-2 overflow-hidden"
        >
          <p className="text-sm font-semibold text-white group-hover:text-yellow-200 transition truncate">
            {currentArticle.title}
          </p>

          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-red-100/90 bg-black/20 px-2 py-0.5 rounded-full shrink-0">
            {currentArticle.isCorroborated && <ShieldCheck className="w-3 h-3 text-emerald-300" />}
            {currentArticle.isCorroborated ? `مؤكد من ${currentArticle.sourceCount} مصادر` : currentArticle.primarySource.name}
          </span>

          <span className="hidden lg:inline text-[11px] text-red-200/80 shrink-0">
            • {formatArabicRelativeTime(currentArticle.publishedAt)}
          </span>
        </div>

        {/* Action button & Carousel arrows */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="breaking-full-story-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFullStory(currentArticle);
            }}
            className="flex items-center gap-1 bg-white text-red-700 hover:bg-yellow-300 hover:text-red-900 transition font-bold text-xs px-3 py-1 rounded-lg shadow-sm"
          >
            <span>الحكاية من الأول 📖</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          {breakingArticles.length > 1 && (
            <div className="flex items-center gap-0.5 bg-black/20 rounded-lg p-0.5">
              <button
                onClick={handlePrev}
                className="p-1 hover:bg-white/20 rounded text-white transition"
                title="الخبر السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 hover:bg-white/20 rounded text-white transition"
                title="الخبر التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
