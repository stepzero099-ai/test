import React, { useEffect, useState } from 'react';
import { 
  X, 
  BookOpen, 
  ShieldCheck, 
  Scale, 
  Layers, 
  Sparkles, 
  Globe, 
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Star,
  Rss,
  Languages
} from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose
}) => {
  const [sources, setSources] = useState<any[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState<boolean>(false);
  const [activeSourceTab, setActiveSourceTab] = useState<'all' | 'ar' | 'en'>('all');

  useEffect(() => {
    if (isOpen) {
      fetchSources();
    }
  }, [isOpen]);

  const fetchSources = async () => {
    setIsLoadingSources(true);
    try {
      const res = await fetch('/api/sources');
      const data = await res.json();
      if (data.success && data.sources) {
        setSources(data.sources);
      }
    } catch (e) {
      console.warn('Failed to load sources:', e);
    } finally {
      setIsLoadingSources(false);
    }
  };

  if (!isOpen) return null;

  const filteredSources = sources.filter(s => {
    if (activeSourceTab === 'all') return true;
    if (activeSourceTab === 'ar') return s.language === 'ar' || !s.language;
    if (activeSourceTab === 'en') return s.language === 'en';
    return true;
  });

  const arabicCount = sources.filter(s => s.language === 'ar' || !s.language).length;
  const englishCount = sources.filter(s => s.language === 'en').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        id="methodology-modal-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-['Tajawal']">
                  من نحن ومنهجية الشفافية التحريرية ومصادر RSS
                </h2>
                <p className="text-xs text-slate-400">
                  كيف نرصد الأخبار من 22+ وكالة إخبارية معتمدة، نتحقق منها، ونضمن الدقة والحياد التام
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Pillar 1: Multi-Source Aggregation */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-2 text-base">
              <Layers className="w-5 h-5 text-sky-600" />
              <span>1. الرصد المستمر من كبرى الوكالات العربية والدولية</span>
            </div>
            <p>
              يقوم محرك "خبر اللحظة" بمتابعة وتنسيق خلاصات الأخبار (RSS Feeds) اللحظية من 22+ وكالة أنباء ومؤسسة صحفية دولية وعربية معتمدة مع تقييم موثوقية عالٍ (4 إلى 5 نجوم).
            </p>
          </div>

          {/* Pillar 2: Neutral Rewriting & Copyright Safety */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-2 text-base">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>2. الصياغة المحايدة وحماية حقوق النشر</span>
            </div>
            <p>
              لا يقوم الموقع بنسخ النصوص الأصلية حرفياً حفاظاً على حقوق الملكية الفكرية للمؤسسات الصحفية. بدلاً من ذلك، تعتمد المنصة صياغة موجزة تركز على جوهر الحدث بأسلوب صحفي فصيح ومحايد مع <strong>الإبقاء الدائم على اسم المصدر الأصلي ورابط التغطية الأساسية</strong>.
            </p>
          </div>

          {/* Pillar 3: Multi-Source Corroboration */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-2 text-base">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>3. معيار التحقق: وسم "مؤكد من مصدرين فأكثر"</span>
            </div>
            <p>
              عندما تتناول أكثر من وكالة إخبارية مستقلة نفس الحدث، يقوم النظام بدمج التغطيات في قصة موحدة موسومة بـ <strong>"✓ مؤكد من مصدرين أو أكثر"</strong>. أما الأخبار المنقولة عن مصدر واحد فتوسم بـ <strong>"⚑ مصدر منفرد • قيد المتابعة"</strong> لمنح القارئ أعلى درجات الشفافية.
            </p>
          </div>

          {/* Pillar 4: Signature Feature Wikipedia Integration */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-2 text-base">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <span>4. ميزة "الحكاية من الأول": السياق المعرفي والخط الزمني</span>
            </div>
            <p>
              تهدف ميزة "الحكاية من الأول" إلى تحويل الأخبار العابرة إلى معرفة متراكمة من خلال ربط الحدث بجذوره التاريخية، وإبراز الشخصيات والجهات المحورية، وتوفير خط زمني، مع استدعاء محتوى مرجعي مفتوح المصدر من موسوعة <strong>ويكيبيديا العربية</strong> وأرشيف المنصة.
            </p>
          </div>

          {/* Connected News Agencies Status */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  المصادر وخلاصات RSS المتصلة ({sources.length} مصدر معتمد):
                </h3>
                <p className="text-xs text-slate-500">
                  تحديث لحظي لحالة الاتصال والموثوقية والتخصص لكل وكالة
                </p>
              </div>

              {/* Language Filters */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setActiveSourceTab('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    activeSourceTab === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  الكل ({sources.length})
                </button>
                <button
                  onClick={() => setActiveSourceTab('ar')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    activeSourceTab === 'ar'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  العربية ({arabicCount})
                </button>
                <button
                  onClick={() => setActiveSourceTab('en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    activeSourceTab === 'en'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  English ({englishCount})
                </button>
              </div>
            </div>

            {isLoadingSources ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />
                <span>جاري فحص وتحديث حالة المصادر...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredSources.map((src) => {
                  const stars = src.reliabilityStars || 5;
                  const isAr = src.language === 'ar' || !src.language;

                  return (
                    <div 
                      key={src.id} 
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between gap-2.5 hover:border-sky-300 dark:hover:border-sky-700 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {src.status === 'ok' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                {src.name}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                                isAr 
                                  ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300' 
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              }`}>
                                {isAr ? 'عربي' : 'EN'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {src.specialty || 'تغطية إخبارية شاملة'}
                            </p>
                          </div>
                        </div>

                        {/* Reliability Stars */}
                        <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                          {Array.from({ length: stars }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Rss className="w-3 h-3 text-sky-500" />
                          <span>{src.articleCount || 0} خبر مجمع</span>
                        </span>
                        
                        <div className="flex items-center gap-3">
                          {src.feedUrl && (
                            <a
                              href={src.feedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-0.5"
                              title="خلاصة RSS"
                            >
                              <span>خلاصة RSS</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 dark:text-sky-400 hover:underline font-semibold inline-flex items-center gap-0.5"
                          >
                            <span>الموقع الرسمي</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
