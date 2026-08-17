import React from 'react';
import { Bell, Flame, X, ArrowLeft } from 'lucide-react';
import { NewsArticle } from '../types';

interface NotificationToastProps {
  notification: {
    title: string;
    body: string;
    importance?: string;
    article?: NewsArticle;
  } | null;
  onClose: () => void;
  onOpenArticle?: (article: NewsArticle) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onOpenArticle
}) => {
  if (!notification) return null;

  return (
    <div className="fixed bottom-6 left-4 sm:left-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 text-white p-4 rounded-2xl shadow-2xl relative flex items-start gap-3">
        <div className={`p-2.5 rounded-xl shrink-0 ${notification.importance === 'breaking' ? 'bg-red-600 animate-pulse' : 'bg-sky-600'}`}>
          {notification.importance === 'breaking' ? (
            <Flame className="w-5 h-5 text-white fill-white" />
          ) : (
            <Bell className="w-5 h-5 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>{notification.title}</span>
              {notification.importance === 'breaking' && (
                <span className="bg-red-500/30 text-red-300 text-[10px] px-1.5 py-0.2 rounded font-bold">
                  عاجل
                </span>
              )}
            </h4>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm font-semibold text-white leading-snug line-clamp-2">
            {notification.body}
          </p>

          {notification.article && onOpenArticle && (
            <button
              onClick={() => {
                onOpenArticle(notification.article!);
                onClose();
              }}
              className="mt-2 text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <span>قراءة التفاصيل والحكاية من الأول</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
