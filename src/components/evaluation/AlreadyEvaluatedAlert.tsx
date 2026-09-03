import React from 'react';
import { CheckCircle2, Edit3 } from 'lucide-react';
import type { Evaluation } from '../../types';

interface AlreadyEvaluatedAlertProps {
  evaluation: Evaluation;
  onEdit: () => void;
}

export const AlreadyEvaluatedAlert: React.FC<AlreadyEvaluatedAlertProps> = ({ evaluation, onEdit }) => {
  return (
    <div className="rounded-3xl bg-indigo-50/90 dark:bg-indigo-950/60 p-6 border border-indigo-200 dark:border-indigo-500/40 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        
        <div className="flex items-start space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-slate-900 dark:text-white text-base">You have already evaluated this project</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Your evaluation was previously recorded on{' '}
              <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                {new Date(evaluation.submittedAt).toLocaleDateString()}
              </span>
            </p>
          </div>
        </div>

        {/* Existing Scores Pill */}
        <div className="flex items-center space-x-4 bg-white dark:bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-indigo-200 dark:border-slate-800 shadow-sm self-start sm:self-center">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Previously Submitted</span>
            <div className="flex items-baseline space-x-1.5 font-mono">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{evaluation.totalScore.toFixed(1)}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">/ 50</span>
            </div>
          </div>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

          <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
            {evaluation.percentage}%
          </span>
        </div>

      </div>

      {/* Edit action info */}
      <div className="pt-3 border-t border-indigo-200 dark:border-indigo-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-2">
        <p className="text-slate-600 dark:text-slate-300">
          Duplicate submissions are prevented. You can update your existing evaluation scores below.
        </p>
        
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 font-semibold text-white shadow hover:bg-indigo-500 transition-colors shrink-0"
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>Update Score</span>
        </button>
      </div>
    </div>
  );
};
