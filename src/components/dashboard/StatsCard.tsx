import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme: 'indigo' | 'emerald' | 'amber' | 'cyan';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme
}) => {
  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-50/70 dark:bg-indigo-500/10',
      border: 'border-indigo-200 dark:border-indigo-500/20',
      iconBg: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
    },
    emerald: {
      bg: 'bg-emerald-50/70 dark:bg-emerald-500/10',
      border: 'border-emerald-200 dark:border-emerald-500/20',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
    },
    amber: {
      bg: 'bg-amber-50/70 dark:bg-amber-500/10',
      border: 'border-amber-200 dark:border-amber-500/20',
      iconBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
    },
    cyan: {
      bg: 'bg-cyan-50/70 dark:bg-cyan-500/10',
      border: 'border-cyan-200 dark:border-cyan-500/20',
      iconBg: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
    }
  }[colorScheme];

  return (
    <div className={`rounded-2xl p-3.5 sm:p-5 border ${colorClasses.bg} ${colorClasses.border} backdrop-blur-md transition-all hover:scale-[1.02] shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">{title}</p>
          <h3 className="font-heading text-xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-0.5 sm:mt-1 truncate">{value}</h3>
          {subtitle && <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={`flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl shrink-0 ${colorClasses.iconBg}`}>
          <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  );
};
