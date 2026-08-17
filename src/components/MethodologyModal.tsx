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
  RefreshCw
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
                  من نحن ومنهجية الشفافية التحريرية
                </h2>
                <p className="text-xs text-slate-400">
                  كيف نرصد الأخبار، نتحقق منها، ونضمن الدقة والحياد التام
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
              <span>1. الرصد المستمر من المصادر الموثوقة</span>
            </div>
            <p>
              يقوم محرك "خبر اللحظة" بمتابعة وتنسيق خلاصات الأخبار (RSS Feeds) كل 10-15 دقيقة بصورة دورية من كبرى وكالات الأنباء والمؤسسات الصحفية المعتمدة عربياً ودولياً.
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
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              المصادر والوكالات المتصلة حالياً:
            </h3>

            {isLoadingSources ? (
              <div className="p-4 text-center text-slate-400">جاري فحص حالة المصادر...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sources.map((src) => (
                  <div key={src.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {src.name}
                        </span>
                        <p className="text-[11px] text-slate-500">{src.articleCount} خبر مجمع</p>
                      </div>
                    </div>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>زيارة</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
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
            فهمت ذلك
          </button>
        </div>
      </div>
    </div>
  );
};
