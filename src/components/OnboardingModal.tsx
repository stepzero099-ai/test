import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Bell, 
  ShieldAlert, 
  TrendingUp, 
  Landmark, 
  Cpu, 
  Trophy, 
  HeartPulse, 
  HelpCircle,
  Radio,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Category, CATEGORIES_META, UserPreferences } from '../types';
import { saveUserPreferences } from '../utils/storage';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrefs: UserPreferences;
  onSavePreferences: (prefs: UserPreferences) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  currentPrefs,
  onSavePreferences
}) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>(currentPrefs.name || '');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(
    currentPrefs.categories && currentPrefs.categories.length > 0
      ? currentPrefs.categories
      : (['politics', 'conflicts', 'economy', 'technology', 'sports', 'health', 'misc'] as Category[])
  );
  const [notificationFrequency, setNotificationFrequency] = useState<UserPreferences['notificationFrequency']>(
    currentPrefs.notificationFrequency || 'both'
  );

  if (!isOpen) return null;

  const toggleCategory = (cat: Category) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(c => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories(['politics', 'conflicts', 'economy', 'technology', 'sports', 'health', 'misc']);
  };

  const handleFinish = () => {
    const updated = saveUserPreferences({
      name: name.trim(),
      categories: selectedCategories,
      notificationFrequency,
      onboardingCompleted: true,
      notificationsEnabled: notificationFrequency !== 'none'
    });

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    onSavePreferences(updated);
    onClose();
  };

  const getCategoryIcon = (id: Category) => {
    switch (id) {
      case 'politics': return <Landmark className="w-5 h-5" />;
      case 'conflicts': return <ShieldAlert className="w-5 h-5" />;
      case 'economy': return <TrendingUp className="w-5 h-5" />;
      case 'technology': return <Cpu className="w-5 h-5" />;
      case 'sports': return <Trophy className="w-5 h-5" />;
      case 'health': return <HeartPulse className="w-5 h-5" />;
      case 'misc': return <Sparkles className="w-5 h-5" />;
      default: return <HelpCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="onboarding-modal-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700"></div>

        {/* Close Button if already onboarded */}
        {currentPrefs.onboardingCompleted && (
          <button
            onClick={onClose}
            className="absolute top-5 left-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header & Step progress indicator */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 mb-3 border border-sky-200 dark:border-sky-800">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-['Tajawal']">
            {currentPrefs.onboardingCompleted ? 'تعديل التفضيلات والاهتمامات' : 'مرحباً بك في خبر اللحظة'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            صمم تجربتك الإخبارية المخصصة بدقة واحترافية
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-sky-600' : 'w-2 bg-slate-300 dark:bg-slate-700'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-sky-600' : 'w-2 bg-slate-300 dark:bg-slate-700'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 3 ? 'w-8 bg-sky-600' : 'w-2 bg-slate-300 dark:bg-slate-700'}`} />
          </div>
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <label htmlFor="user-name-input" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                ما اسمك الكريم؟ (اختياري)
              </label>
              <input
                id="user-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أحمد أو مريم..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm transition"
              />
              <p className="text-xs text-slate-500 mt-2">
                نستخدم اسمك لتخصيص تحية الصباح والحصاد التنفيذي اليومي.
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                id="step-1-next-btn"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md transition"
              >
                <span>المتابعة إلى الاهتمامات</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Categories Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                اختر الأقسام التي تود متابعتها:
              </p>
              <button
                onClick={handleSelectAllCategories}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
              >
                تحديد الكل ({Object.keys(CATEGORIES_META).length})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {(Object.keys(CATEGORIES_META) as Category[]).map((catId) => {
                const meta = CATEGORIES_META[catId];
                const isSelected = selectedCategories.includes(catId);

                return (
                  <div
                    key={catId}
                    id={`cat-select-${catId}`}
                    onClick={() => toggleCategory(catId)}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-3 select-none ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isSelected ? meta.badgeBg : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {getCategoryIcon(catId)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {meta.label}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {meta.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 text-sm font-medium"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>

              <button
                id="step-2-next-btn"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md transition"
              >
                <span>المتابعة إلى الإشعارات</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Notification Preferences */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              كيف تود أن نُبقيك على اطلاع؟
            </p>

            <div className="space-y-3">
              {[
                {
                  id: 'smart' as const,
                  title: 'وضع الإشعارات الذكي التكيفي (موصى به جدًا ⭐)',
                  desc: 'إرسال ذكي في أوقات التفاعل المثالية (صباحاً/ظهراً/مساءً) دون إزعاج مع مراعاة أوقات الراحة',
                  icon: <Sparkles className="w-5 h-5 text-amber-500" />
                },
                {
                  id: 'both' as const,
                  title: 'الأخبار العاجلة والملخص اليومي',
                  desc: 'تنبيه فوري عند وقوع أحداث طارئة + إشعار بالحصاد الصباحي والمسائي',
                  icon: <Bell className="w-5 h-5 text-sky-500" />
                },
                {
                  id: 'breaking_only' as const,
                  title: 'الأخبار العاجلة فقط',
                  desc: 'تنبيهات فورية للأحداث الكبرى المصنفة "عاجل" فقط',
                  icon: <ShieldAlert className="w-5 h-5 text-red-500" />
                },
                {
                  id: 'daily_digest' as const,
                  title: 'الملخص اليومي فقط',
                  desc: 'إشعار واحد يومياً يتضمن القراءة التنفيذية السريعة',
                  icon: <Clock className="w-5 h-5 text-emerald-500" />
                },
                {
                  id: 'none' as const,
                  title: 'بدون إشعارات',
                  desc: 'تصفح الأخبار يدوياً عند فتح الموقع فقط',
                  icon: <X className="w-5 h-5 text-slate-400" />
                }
              ].map((opt) => (
                <div
                  key={opt.id}
                  id={`notif-opt-${opt.id}`}
                  onClick={() => setNotificationFrequency(opt.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center gap-3.5 ${
                    notificationFrequency === opt.id
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    {opt.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {opt.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {opt.desc}
                    </p>
                  </div>
                  {notificationFrequency === opt.id && (
                    <Check className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 text-sm font-medium"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>

              <button
                id="finish-onboarding-btn"
                onClick={handleFinish}
                className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white px-7 py-3 rounded-xl font-bold text-sm shadow-lg shadow-sky-600/30 transition active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>بدء تجربة خبر اللحظة</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
