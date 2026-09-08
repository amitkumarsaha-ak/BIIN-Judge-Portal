import React from 'react';
import {
  Sparkles, CheckCircle2, Clock, Award,
  ArrowRight, Eye, Lock, Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getProjectsForJudge, getEvaluationsByJudge, getSystemSettings,
  getDashboardStatsForJudge
} from '../../services/storage';
import { StatsCard } from '../dashboard/StatsCard';
import type { Project } from '../../types';
import type { JudgeTab } from './JudgeLayout';

interface JudgeDashboardViewProps {
  onNavigate: (tab: JudgeTab) => void;
  onSelectProjectForEvaluation: (project: Project) => void;
}

export const JudgeDashboardView: React.FC<JudgeDashboardViewProps> = ({
  onNavigate,
  onSelectProjectForEvaluation
}) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const assignedProjects = getProjectsForJudge();
  const myEvaluations = getEvaluationsByJudge(currentUser.email);
  const settings = getSystemSettings();
  const stats = getDashboardStatsForJudge(currentUser.email);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-6 sm:p-8 border border-indigo-500/30 shadow-2xl text-white">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-10 h-48 w-48 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-400/30">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Official BIIN Judge Workspace</span>
              </span>
            </div>

            <h1 className="font-heading text-3xl font-extrabold text-white sm:text-4xl">
              Welcome, {currentUser.fullName}!
            </h1>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              Evaluate nominated projects across Student, Student-Tertiary, Organisation, and Individual/Group categories.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('projects')}
              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-2xl px-6 py-3.5 font-bold text-white shadow-xl transition-all hover:scale-105 text-xs"
            >
              <span>View Projects</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => onNavigate('submissions')}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-2xl bg-white/10 hover:bg-white/20 dark:bg-slate-800 dark:hover:bg-slate-700 px-5 py-3.5 font-semibold text-white transition-colors border border-white/20 dark:border-slate-700 text-xs"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>My Submissions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lock Notice If Applicable */}
      {settings.evaluationsLocked && (
        <div className="flex items-center space-x-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 p-4 text-xs text-red-700 dark:text-red-300 shadow-sm">
          <Lock className="h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="font-bold">Evaluation Submissions Are Currently Locked</p>
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">The administrator has temporarily paused evaluations. You may review existing submissions, but cannot submit new scores.</p>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value={stats.totalProjects}
          subtitle="Available for evaluation"
          icon={Layers}
          colorScheme="indigo"
        />

        <StatsCard
          title="Evaluated by Me"
          value={stats.evaluatedProjectsCount}
          subtitle={`${Math.round((stats.evaluatedProjectsCount / (stats.totalProjects || 1)) * 100)}% complete`}
          icon={CheckCircle2}
          colorScheme="emerald"
        />

        <StatsCard
          title="Remaining to Score"
          value={stats.remainingProjectsCount}
          subtitle="Pending evaluation"
          icon={Clock}
          colorScheme="amber"
        />

        <StatsCard
          title="My Average Score"
          value={stats.averageScore > 0 ? `${stats.averageScore} / 100` : 'N/A'}
          subtitle="Across my submissions"
          icon={Award}
          colorScheme="cyan"
        />
      </div>

      {/* Projects Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Projects ({assignedProjects.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Browse and evaluate active projects across categories
            </p>
          </div>

          <button
            onClick={() => onNavigate('projects')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {assignedProjects.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-xs">No nominated projects found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-950/80 uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Project & Participant</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">My Status</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {assignedProjects.map(proj => {
                  const evalItem = myEvaluations.find(e => e.projectId === proj.id);
                  const isEvaluated = Boolean(evalItem);

                  return (
                    <tr key={proj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{proj.title}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{proj.applicationId} · {proj.teamOrOrgName}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {proj.applicationType}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${isEvaluated ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20'}`}>
                          {isEvaluated ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                          <span>{isEvaluated ? 'Evaluated' : 'Pending'}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center font-mono font-bold">
                        {isEvaluated && evalItem ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {(evalItem.convertedScore ?? evalItem.percentage ?? 0).toFixed(1)} / 100
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => onSelectProjectForEvaluation(proj)}
                          disabled={settings.evaluationsLocked}
                          className={`inline-flex items-center space-x-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${isEvaluated ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-600 hover:text-white' : 'btn-primary text-white shadow-md'} disabled:opacity-50`}
                        >
                          <Eye className="h-3 w-3" />
                          <span>{isEvaluated ? 'Edit Score' : 'Evaluate'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
