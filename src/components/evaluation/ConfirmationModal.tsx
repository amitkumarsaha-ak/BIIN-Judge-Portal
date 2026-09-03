import React from 'react';
import { Award, Check, X, ShieldCheck } from 'lucide-react';
import type { Project, EvaluationScores } from '../../types';
import { getCriteriaForApplicationType, formatScoreNumber } from '../../utils/evaluation';

interface ConfirmationModalProps {
  isOpen: boolean;
  project: Project;
  scores: EvaluationScores;
  rawTotalScore?: number;
  maxRawScore?: number;
  convertedScore?: number;
  totalScore?: number;
  percentage?: number;
  judgeName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  project,
  scores,
  rawTotalScore,
  maxRawScore = 50,
  convertedScore,
  totalScore,
  percentage,
  judgeName,
  onCancel,
  onConfirm
}) => {
  if (!isOpen) return null;

  const displayRawTotal = rawTotalScore ?? totalScore ?? 0;
  const displayConverted = convertedScore ?? percentage ?? Math.round((displayRawTotal / maxRawScore) * 100);
  const activeCriteria = getCriteriaForApplicationType(project.applicationType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white">Submit Evaluation?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Please review your scores before final submission</p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Highlight Summary Card */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-indigo-950/60 dark:to-slate-900 p-5 border border-indigo-200 dark:border-indigo-500/30 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block mb-1">
            Project: {project.title}
          </span>
          <div className="flex flex-col items-center justify-center space-y-1 my-2">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-3xl font-extrabold text-slate-900 dark:text-white">
                {formatScoreNumber(displayRawTotal)} <span className="text-base text-slate-500 dark:text-slate-400">/ {maxRawScore}</span>
              </span>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-mono">
                {formatScoreNumber(displayConverted)} / 100
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Judge: <strong className="text-slate-900 dark:text-slate-200">{judgeName}</strong>
          </p>
        </div>

        {/* Scores Breakdown List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Criteria Breakdown ({project.applicationType}):
          </h4>
          <div className="divide-y divide-slate-200 dark:divide-slate-800/80 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-3 border border-slate-200 dark:border-slate-800 text-xs">
            {activeCriteria.map((crit) => {
              const val = scores[crit.key] ?? 1;
              return (
                <div key={crit.key} className="flex items-center justify-between py-1.5">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{crit.label}</span>
                  <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">{formatScoreNumber(val)} / 10</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warning Note */}
        <div className="flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-200 dark:border-amber-500/20">
          <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>This evaluation will be stored in the official multi-judge database.</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            className="btn-primary rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-lg flex items-center space-x-2"
          >
            <Check className="h-4 w-4" />
            <span>Confirm Submission</span>
          </button>
        </div>

      </div>
    </div>
  );
};

