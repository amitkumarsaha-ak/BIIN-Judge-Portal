import React, { useEffect } from 'react';
import { CheckCircle2, Award, FolderGit2, LayoutDashboard, Sparkles, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Project, Evaluation } from '../../types';
import { getMaxRawScoreForApplicationType } from '../../utils/evaluation';

interface EvaluationSuccessViewProps {
  project: Project;
  evaluation: Evaluation;
  onEvaluateAnother: () => void;
  onBackToProjects: () => void;
  onGoToDashboard: () => void;
}

export const EvaluationSuccessView: React.FC<EvaluationSuccessViewProps> = ({
  project,
  evaluation,
  onEvaluateAnother,
  onBackToProjects,
  onGoToDashboard
}) => {
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const maxRawScore = evaluation.maxRawScore || getMaxRawScoreForApplicationType(project.applicationType);
  const rawScore = evaluation.rawTotalScore ?? evaluation.totalScore ?? 0;
  const convertedScore = evaluation.convertedScore ?? evaluation.percentage ?? 0;

  return (
    <div className="mx-auto max-w-2xl py-8 space-y-8 animate-in zoom-in-95 duration-300">
      
      {/* Hero Success Card */}
      <div className="glass-panel rounded-3xl p-8 sm:p-10 text-center border border-emerald-300 dark:border-emerald-500/40 bg-white dark:bg-slate-900 shadow-2xl relative overflow-hidden">
        
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 glow-emerald">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <span className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Evaluation Submitted Successfully</span>
        </span>

        <h1 className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white">
          Evaluation Recorded
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Thank you! Your official score for <strong className="text-slate-900 dark:text-white">{project.title}</strong> has been securely saved.
        </p>

        {/* Score Summary Box */}
        <div className="mt-8 rounded-2xl bg-slate-50 dark:bg-slate-900/90 p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-2">
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Project Name</span>
              <span className="font-heading font-bold text-slate-900 dark:text-white text-lg">{project.title}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">{project.teamOrOrgName} • {project.roomNumber || 'Room 01'}</span>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center space-x-1 justify-end">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{new Date(evaluation.submittedAt).toLocaleDateString()}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-6 py-2">
            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Your Raw Total Score</span>
              <span className="font-mono text-3xl font-extrabold text-slate-900 dark:text-white">
                {rawScore.toFixed(1)} <span className="text-sm text-slate-400">/ {maxRawScore}</span>
              </span>
            </div>

            <div className="h-12 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Converted Score (/100)</span>
              <span className="font-mono text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {convertedScore.toFixed(1)} / 100
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          
          <button
            onClick={onEvaluateAnother}
            className="btn-primary w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl px-5 py-3 text-xs font-bold text-white shadow-lg"
          >
            <Award className="h-4 w-4" />
            <span>Evaluate Another Project</span>
          </button>

          <button
            onClick={onBackToProjects}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <FolderGit2 className="h-4 w-4" />
            <span>Back to Projects Queue</span>
          </button>

          <button
            onClick={onGoToDashboard}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-white dark:bg-slate-900 px-5 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-800"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Judge Dashboard</span>
          </button>

        </div>

      </div>

    </div>
  );
};

