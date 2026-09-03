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
    <div className="sticky bottom-4 z-30 mx-auto max-w-4xl w-full px-2">
      <div className="glass-panel rounded-3xl p-5 border border-indigo-300 dark:border-indigo-500/40 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 glow-indigo">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Total Score & Converted Score */}
          <div className="flex items-center space-x-6">
            
            {/* Raw Total Score */}
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Raw Total Score
                </span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
                    {formatScoreNumber(totalScore)}
                  </span>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">/ {maxRawScore}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* Converted Score out of 100 */}
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                <Percent className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Converted Score (/100)
                </span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {typeof displayConverted === 'number' ? formatScoreNumber(displayConverted) : displayConverted} / 100
                  </span>
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>

          </div>

          {/* Visual Progress Bar */}
          <div className="flex-1 md:max-w-xs space-y-1.5">
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

