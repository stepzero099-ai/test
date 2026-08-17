import React from 'react';
import { ExternalLink, Sparkles, X } from 'lucide-react';
import { AdPlacement } from '../types';

interface AdBannerProps {
  ad?: AdPlacement;
  variant: 'header' | 'infeed' | 'sticky' | 'modal';
  onDismiss?: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({ ad, variant, onDismiss }) => {
  if (!ad || !ad.enabled) return null;

  // Custom HTML / Script ad render
  if (ad.type === 'code' && ad.customHtml) {
    return (
      <div 
        id={`ad-zone-${ad.id}`}
        className="w-full my-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-900/60"
        dangerouslySetInnerHTML={{ __html: ad.customHtml }}
      />
    );
  }

  // Google AdSense Banner (Discreet placeholder with script injection if configured)
  if (ad.type === 'adsense' && ad.adsenseClientId) {
    return (
      <div 
        id={`ad-zone-${ad.id}`}
        className="w-full my-3 p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 text-center"
      >
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 px-1">
          <span>إعلان ممول (Google AdSense)</span>
          <span>{ad.adsenseClientId}</span>
        </div>
        <div className="py-6 text-xs text-slate-500 font-medium">
          مساحة إعلانية متوافقة مع Google AdSense (Slot: {ad.adsenseSlotId || 'تلقائي'})
        </div>
      </div>
    );
  }

  // Header Banner Variant (Compact, slim, discreet above or below the breaking ticker)
  if (variant === 'header') {
    return (
      <div 
        id={`ad-zone-${ad.id}`}
        className="w-full max-w-7xl mx-auto px-4 mt-2"
      >
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-500/20 rounded-2xl p-3 sm:p-4 text-white shadow-md flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {ad.imageUrl && (
              <img 
                src={ad.imageUrl} 
                alt={ad.adTitle || 'إعلان'} 
                className="w-12 h-12 rounded-xl object-cover border border-sky-400/30 shrink-0" 
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-sky-400/30">
                  {ad.badgeText || 'إعلان ممول'}
                </span>
                {ad.sponsorName && (
                  <span className="text-xs text-slate-300 font-medium truncate">
                    {ad.sponsorName}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-white truncate">
                {ad.adTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mr-auto sm:mr-0">
            {ad.targetUrl && (
              <a
                href={ad.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
              >
                <span>{ad.buttonText || 'اكتشف المزيد'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // In-Feed Native Card Variant (Blends natively with the news grid style without disrupting user reading)
  if (variant === 'infeed') {
    return (
      <div 
        id={`ad-zone-${ad.id}`}
        className="bg-gradient-to-br from-amber-500/5 via-slate-50 to-orange-500/5 dark:from-slate-900 dark:via-slate-900/90 dark:to-amber-950/20 border-2 border-dashed border-amber-400/40 dark:border-amber-500/30 rounded-2xl p-5 shadow-sm flex flex-col justify-between transition hover:border-amber-400"
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-md border border-amber-300/60 dark:border-amber-700/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {ad.badgeText || 'محتوى برعاية شريك'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {ad.sponsorName || 'راعي المنصة'}
            </span>
          </div>

          {ad.imageUrl && (
            <div className="w-full h-36 rounded-xl overflow-hidden mb-3.5 relative">
              <img 
                src={ad.imageUrl} 
                alt={ad.adTitle || 'إعلان'} 
                className="w-full h-full object-cover transition duration-300 hover:scale-105" 
              />
            </div>
          )}

          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 leading-snug">
            {ad.adTitle}
          </h3>

          {ad.adDescription && (
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
              {ad.adDescription}
            </p>
          )}
        </div>

        {ad.targetUrl && (
          <a
            href={ad.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
          >
            <span>{ad.buttonText || 'زيارة العرض الآن'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    );
  }

  // Modal Bottom Ad (Within the Full Story report)
  if (variant === 'modal') {
    return (
      <div 
        id={`ad-zone-${ad.id}`}
        className="my-6 p-4 rounded-2xl bg-gradient-to-r from-slate-100 to-sky-50 dark:from-slate-800/80 dark:to-slate-900 border border-sky-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          {ad.imageUrl && (
            <img 
              src={ad.imageUrl} 
              alt={ad.adTitle || 'إعلان'} 
              className="w-16 h-16 rounded-xl object-cover border border-sky-300 dark:border-slate-600 shrink-0" 
            />
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-1.5 py-0.5 rounded">
                {ad.badgeText || 'إعلان'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{ad.sponsorName}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {ad.adTitle}
            </h4>
            {ad.adDescription && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                {ad.adDescription}
              </p>
            )}
          </div>
        </div>

        {ad.targetUrl && (
          <a
            href={ad.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto shrink-0 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-xl text-center transition flex items-center justify-center gap-1.5"
          >
            <span>{ad.buttonText || 'تفاصيل العرض'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    );
  }

  // Sticky Bottom Bar Variant (Dismissible)
  if (variant === 'sticky') {
    return (
      <div 
        id={`ad-zone-${ad.id}`}
        className="fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-300"
      >
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0">
              {ad.badgeText || 'إعلان'}
            </span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                {ad.adTitle}
              </p>
              {ad.adDescription && (
                <p className="text-[11px] text-slate-300 hidden sm:block truncate">
                  {ad.adDescription}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {ad.targetUrl && (
              <a
                href={ad.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
              >
                <span>{ad.buttonText || 'زيارة'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="إغلاق الإعلان"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
