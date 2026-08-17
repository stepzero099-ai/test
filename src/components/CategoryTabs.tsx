import React from 'react';
import { 
  CheckCheck, 
  Layers, 
  Landmark, 
  ShieldAlert, 
  TrendingUp, 
  Cpu, 
  Trophy, 
  HeartPulse, 
  Sparkles,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';
import { Category, CATEGORIES_META } from '../types';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  corroboratedOnly: boolean;
  onToggleCorroboratedOnly: () => void;
  articlesCount: Record<string, number>;
  onOpenInterests: () => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  corroboratedOnly,
  onToggleCorroboratedOnly,
  articlesCount,
  onOpenInterests
}) => {
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'all': return <Layers className="w-4 h-4" />;
      case 'saved': return <Bookmark className="w-4 h-4" />;
      case 'politics': return <Landmark className="w-4 h-4" />;
      case 'conflicts': return <ShieldAlert className="w-4 h-4" />;
      case 'economy': return <TrendingUp className="w-4 h-4" />;
      case 'technology': return <Cpu className="w-4 h-4" />;
      case 'sports': return <Trophy className="w-4 h-4" />;
      case 'health': return <HeartPulse className="w-4 h-4" />;
      case 'misc': return <Sparkles className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-[69px] z-30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        {/* Scrollable Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1">
          {/* 'All' Tab */}
          <button
            id="tab-all"
            onClick={() => onSelectCategory('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-sky-600 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {getCategoryIcon('all')}
            <span>كل الأخبار</span>
            {articlesCount['all'] !== undefined && (
              <span className="text-[10px] opacity-80 px-1">({articlesCount['all']})</span>
            )}
          </button>

          {/* User's Selected Category Tabs */}
          {categories.map((catId) => {
            const meta = CATEGORIES_META[catId];
            if (!meta) return null;
            const isActive = activeCategory === catId;
            const count = articlesCount[catId] || 0;

            return (
              <button
                key={catId}
                id={`tab-${catId}`}
                onClick={() => onSelectCategory(catId)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  isActive
                    ? `${meta.badgeBg} shadow-sm`
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {getCategoryIcon(catId)}
                <span>{meta.label}</span>
                {count > 0 && (
                  <span className="text-[10px] opacity-80 px-1">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filters & Actions right side */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Corroborated Multi-Source Filter Toggle */}
          <button
            id="corroborated-filter-toggle"
            onClick={onToggleCorroboratedOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              corroboratedOnly
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
            title="إظهار الأخبار التي تم التحقق منها وتأكيدها من مصدرين أو أكثر فقط"
          >
            <CheckCheck className={`w-3.5 h-3.5 ${corroboratedOnly ? 'text-white' : 'text-emerald-500'}`} />
            <span className="hidden sm:inline">مؤكد من مصدرين+</span>
            <span className="sm:hidden">مؤكد</span>
          </button>

          {/* Quick Edit Interests */}
          <button
            id="edit-interests-pill-btn"
            onClick={onOpenInterests}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="تخصيص الأقسام والاهتمامات"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
