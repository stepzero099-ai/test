import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Quote, 
  Calendar, 
  ArrowLeft, 
  Flame, 
  TrendingUp, 
  ShieldCheck,
  Share2,
  Check
} from 'lucide-react';
import { DailyDigest, NewsArticle } from '../types';
import { getArabicCurrentDateString } from '../utils/dateFormatter';

interface DailyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (article: NewsArticle) => void;
  userName?: string;
}

export const DailyDigestModal: React.FC<DailyDigestModalProps> = ({
  isOpen,
  onClose,
  onSelectArticle,
  userName
}) => {
  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchDigest();
    }
  }, [isOpen]);

  const fetchDigest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/digest');
      const data = await res.json();
      if (data.success && data.digest) {
        setDigest(data.digest);
      }
    } catch (e) {
      console.warn('Failed to load digest:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window) || !digest) {
      alert('ميزة القراءة الصوتية غير مدعومة');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const narrative = `الملخص اليومي الذكي لمنصة خبر اللحظة. ${digest.title}. ${digest.executiveBrief}. أهم الخلاصات: ${digest.keyTakeaways.join('. ')}`;
      const utterance = new SpeechSynthesisUtterance(narrative);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.95;

      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        id="daily-digest-modal-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-6 relative shrink-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-white/20">
                <Sparkles className="w-3.5 h-3.5" />
                الملخص اليومي الذكي
              </span>
              <span className="text-xs text-amber-100">قراءة في 3 دقائق</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleSpeech}
                className={`p-2 rounded-xl border transition ${
                  isPlayingAudio
                    ? 'bg-white text-orange-700 border-white animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
                title={isPlayingAudio ? 'إيقاف الصوت' : 'استمع للملخص الصباحي صوتياً'}
              >
                {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white font-['Tajawal']">
            {userName ? `حصاد اليوم لك يا ${userName}` : 'حصاد اللحظة: الملخص التنفيذي للأحداث'}
          </h2>
          <p className="text-xs text-amber-100 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{getArabicCurrentDateString()}</span>
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-500">جاري إعداد وصياغة الحصاد التنفيذي لأهم أحداث اليوم...</p>
            </div>
          ) : digest ? (
            <>
              {/* Executive Brief */}
              <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 p-5 rounded-2xl">
                <h3 className="text-base font-bold text-amber-950 dark:text-amber-200 mb-2 font-['Tajawal']">
                  {digest.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                  {digest.executiveBrief}
                </p>
              </div>

              {/* Key Takeaways */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>أهم 3 إلى 5 خلاصات يجب أن تعرفها اليوم:</span>
                </h4>
                <div className="space-y-2.5">
                  {digest.keyTakeaways.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed pt-0.5">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quote of the Day */}
              {digest.quoteOfTheDay && (
                <div className="bg-slate-900 text-white p-5 rounded-2xl relative overflow-hidden border border-slate-800">
                  <Quote className="w-12 h-12 text-slate-800 absolute -bottom-2 -left-2 rotate-180" />
                  <p className="text-sm sm:text-base italic font-medium leading-relaxed mb-2 relative z-10 text-slate-100">
                    "{digest.quoteOfTheDay.quote}"
                  </p>
                  <p className="text-xs text-amber-400 font-semibold relative z-10">
                    — {digest.quoteOfTheDay.speaker}
                  </p>
                </div>
              )}

              {/* Top Stories Preview */}
              {digest.topArticles && digest.topArticles.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                    الأخبار المرتبطة بهذا الحصاد:
                  </h4>
                  <div className="space-y-2">
                    {digest.topArticles.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => {
                          onSelectArticle(art);
                          handleClose();
                        }}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer transition flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 truncate">
                            {art.title}
                          </p>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {art.primarySource.name}
                          </span>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={handleClose}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-bold transition"
          >
            إغلاق الملخص
          </button>
        </div>
      </div>
    </div>
  );
};
