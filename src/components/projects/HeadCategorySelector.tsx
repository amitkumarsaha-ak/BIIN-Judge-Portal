import React from 'react';
import { Smartphone, Factory, Briefcase, HeartHandshake, Landmark, Check } from 'lucide-react';
import type { HeadCategoryCode } from '../../types';
import { HEAD_CATEGORIES } from '../../data/mockData';

interface HeadCategorySelectorProps {
  selectedCategory: HeadCategoryCode | null;
  onSelectCategory: (code: HeadCategoryCode) => void;
}

export const HeadCategorySelector: React.FC<HeadCategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone':
        return Smartphone;
      case 'Factory':
        return Factory;
      case 'Briefcase':
        return Briefcase;
      case 'HeartHandshake':
        return HeartHandshake;
      case 'Landmark':
      default:
        return Landmark;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">2</span>
            <span>Select Head Category</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Filter evaluation queue by domain discipline</p>
        </div>

        {selectedCategory && (
          <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-500/20">
            Selected: {selectedCategory}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {HEAD_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.code;
          const IconComponent = getIcon(cat.iconName);

          return (
            <div
              key={cat.code}
              onClick={() => onSelectCategory(cat.code)}
              className={`relative cursor-pointer rounded-2xl p-4 border transition-all duration-200 ${
                isSelected
                  ? 'bg-cyan-50/90 dark:bg-cyan-950/80 border-cyan-600 dark:border-cyan-500 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-600 dark:ring-cyan-500'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-white font-bold shadow-md">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}

              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
                isSelected ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400'
              }`}>
                <IconComponent className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <span className="inline-block rounded bg-cyan-100 dark:bg-cyan-500/20 px-2 py-0.5 text-[11px] font-bold text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                  {cat.shortCode}
                </span>
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-sm leading-tight">{cat.name}</h3>
              </div>

              <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                {cat.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
