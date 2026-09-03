import React from 'react';
import { GraduationCap, Building2, Users, Check } from 'lucide-react';
import type { ApplicationType } from '../../types';
import { APPLICATION_TYPES } from '../../data/mockData';

interface ApplicationTypeSelectorProps {
  selectedType: ApplicationType | null;
  onSelectType: (type: ApplicationType) => void;
}

export const ApplicationTypeSelector: React.FC<ApplicationTypeSelectorProps> = ({
  selectedType,
  onSelectType
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return GraduationCap;
      case 'Building2':
        return Building2;
      case 'Users':
      default:
        return Users;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">1</span>
            <span>Select Application Type</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Choose the project applicant classification</p>
        </div>

        {selectedType && (
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
            Selected: {selectedType}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {APPLICATION_TYPES.map((appType) => {
          const isSelected = selectedType === appType.id;
          const IconComponent = getIcon(appType.icon);

          return (
            <div
              key={appType.id}
              onClick={() => onSelectType(appType.id)}
              className={`relative cursor-pointer rounded-2xl p-5 border transition-all duration-200 ${
                isSelected
                  ? 'bg-indigo-50/90 dark:bg-indigo-950/80 border-indigo-600 dark:border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-600 dark:ring-indigo-500'
                  : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md">
                  <Check className="h-4 w-4" />
                </div>
              )}

              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${
                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
              }`}>
                <IconComponent className="h-6 w-6" />
              </div>

              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-base">{appType.title}</h3>
                <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase">
                  {appType.badge}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {appType.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
