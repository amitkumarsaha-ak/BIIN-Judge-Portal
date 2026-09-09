import React from 'react';
import { Award, Percent, TrendingUp } from 'lucide-react';
import { formatScoreNumber } from '../../utils/evaluation';

interface ScoreSummaryBarProps {
  totalScore: number;
  maxRawScore?: number;
  convertedScore?: number;
  percentage?: number;
}

export const ScoreSummaryBar: React.FC<ScoreSummaryBarProps> = ({
  totalScore,
  maxRawScore = 50,
  convertedScore,
  percentage
}) => {
  const displayConverted = convertedScore ?? percentage ?? Math.round((totalScore / maxRawScore) * 100);

  const getProgressGradient = (pct: number) => {
    if (pct < 40) return 'from-amber-500 to-orange-500';
    if (pct < 75) return 'from-indigo-500 to-cyan-400';
    return 'from-emerald-500 via-teal-400 to-cyan-400';
  };

  return (
    <div className="sticky bottom-2 sm:bottom-4 z-30 mx-auto max-w-4xl w-full px-2 sm:px-4 pb-safe">
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-indigo-300 dark:border-indigo-500/40 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 glow-indigo">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-4">
          
          {/* Total Score & Converted Score Grid */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:space-x-6">
            
            {/* Raw Total Score */}
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 sm:bg-transparent min-w-0">
              <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 shrink-0">
                <Award className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  Raw Total
                </span>
                <div className="flex items-baseline space-x-1">
                  <span className="font-mono text-base sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {formatScoreNumber(totalScore)}
                  </span>
                  <span className="text-[11px] sm:text-sm font-bold text-slate-500 dark:text-slate-400">/{maxRawScore}</span>
                </div>
              </div>
            </div>

            {/* Divider (Desktop Only) */}
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* Converted Score out of 100 */}
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-0 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 sm:bg-transparent min-w-0">
              <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
                <Percent className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                  Converted
                </span>
                <div className="flex items-center space-x-1">
                  <span className="font-mono text-base sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {typeof displayConverted === 'number' ? formatScoreNumber(displayConverted) : displayConverted}
                  </span>
                  <span className="text-[11px] sm:text-sm font-bold text-slate-500 dark:text-slate-400">/100</span>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 hidden min-[380px]:inline" />
                </div>
              </div>
            </div>

          </div>

          {/* Visual Progress Bar */}
          <div className="w-full md:max-w-xs space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Converted Percentage</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {typeof displayConverted === 'number' ? formatScoreNumber(displayConverted) : displayConverted}%
              </span>
            </div>
            
            <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-950 p-0.5 border border-slate-200 dark:border-slate-800">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(
                  Number(displayConverted)
                )} transition-all duration-300 shadow-md`}
                style={{ width: `${Math.min(100, Math.max(0, Number(displayConverted)))}%` }}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

