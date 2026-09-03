import React from 'react';
import {
  CheckCircle2, Pencil, Calendar, Award
} from 'lucide-react';
import type { Project } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  getEvaluationsByJudge, getProjectsForJudge, getSystemSettings
} from '../../services/storage';

interface JudgeEvaluationsViewProps {
  onSelectProjectForEvaluation: (project: Project) => void;
}

export const JudgeEvaluationsView: React.FC<JudgeEvaluationsViewProps> = ({
  onSelectProjectForEvaluation
}) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const myEvaluations = getEvaluationsByJudge(currentUser.email);
  const assignedProjects = getProjectsForJudge(currentUser.roomNumber);
  const settings = getSystemSettings();

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-50 dark:bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 mb-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>My Submitted Evaluations</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Evaluation Submissions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review your scores and qualitative feedback submitted for nominated projects in your arena.
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 text-center shrink-0">
          <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">My Completed Scores</p>
          <p className="font-heading text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{myEvaluations.length}</p>
        </div>
      </div>

      {/* Submissions List */}
      {myEvaluations.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
          <Award className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No evaluations submitted yet</h3>
          <p className="text-xs text-slate-500 mt-1">Navigate to 'Assigned Projects' to begin evaluating.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myEvaluations.map(e => {
            const project = assignedProjects.find(p => p.id === e.projectId);
            const rawScore = e.rawTotalScore ?? e.totalScore ?? 0;
            const maxRaw = e.maxRawScore || 50;
            const converted = e.convertedScore ?? e.percentage ?? 0;

            return (
              <div
                key={e.id}
                className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md hover:shadow-xl transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {project?.applicationId || e.projectId}
                      </span>
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {project?.applicationType}
                      </span>
                    </div>
                    <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white mt-1">
                      {project?.title || 'Evaluated Project'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{project?.teamOrOrgName}</p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Converted Mark</p>
                      <span className="font-heading font-black text-2xl text-emerald-600 dark:text-emerald-400 font-mono">
                        {converted.toFixed(1)} / 100
                      </span>
                    </div>

                    {project && (
                      <button
                        onClick={() => onSelectProjectForEvaluation(project)}
                        disabled={settings.evaluationsLocked}
                        className="btn-primary flex items-center space-x-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Edit Score</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Scores Matrix Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
                  {Object.entries(e.scores).map(([key, val]) => (
                    <div key={key} className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 border border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-[10px] text-slate-500 capitalize truncate">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="font-heading text-base font-bold text-slate-900 dark:text-white mt-0.5 font-mono">{val} / 10</p>
                    </div>
                  ))}
                </div>

                {/* Feedback */}
                {e.feedback && (
                  <div className="rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-500/20 p-3 text-xs text-slate-700 dark:text-slate-300">
                    <p className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400 mb-0.5">My Qualitative Feedback</p>
                    <p className="italic">"{e.feedback}"</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Submitted: {new Date(e.submittedAt).toLocaleDateString()} at {new Date(e.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span>Raw Score: {rawScore.toFixed(1)} / {maxRaw}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
