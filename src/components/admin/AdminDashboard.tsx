import React, { useState, useCallback } from 'react';
import {
  ShieldCheck, FolderGit2, Users, CheckSquare,
  Trophy, Lock, Unlock, Plus, History, ArrowRight,
  TrendingUp, Award
} from 'lucide-react';
import {
  getProjects, getJudges, getEvaluations,
  getSystemSettings, toggleEvaluationLock, toggleFinalResultLock,
  getAuditLogs
} from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import type { AdminTab } from './AdminLayout';

interface AdminDashboardProps {
  onNavigate: (tab: AdminTab) => void;
  onOpenAddProject: () => void;
  onOpenAddJudge: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onOpenAddProject,
  onOpenAddJudge
}) => {
  const { currentUser } = useAuth();

  // Use state so lock toggles trigger a re-render
  const [settings, setSettings] = useState(() => getSystemSettings());

  const refreshData = useCallback(() => {
    setSettings(getSystemSettings());
  }, []);

  const projects = getProjects();
  const judges = getJudges();
  const evaluations = getEvaluations();
  const auditLogs = getAuditLogs().slice(0, 5);

  const totalActiveProjects = projects.filter(p => p.status === 'active').length;
  const totalEvaluationsCount = evaluations.length;

  let globalAverageScore = 0;
  if (evaluations.length > 0) {
    const sum = evaluations.reduce((acc, curr) => acc + (curr.convertedScore ?? curr.percentage ?? 0), 0);
    globalAverageScore = Number((sum / evaluations.length).toFixed(1));
  }

  const handleToggleEvalLock = () => {
    if (currentUser) {
      toggleEvaluationLock(!settings.evaluationsLocked, { email: currentUser.email, name: currentUser.fullName });
      refreshData();
    }
  };

  const handleToggleResultLock = () => {
    if (currentUser) {
      toggleFinalResultLock(!settings.finalResultsLocked, { email: currentUser.email, name: currentUser.fullName });
      refreshData();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900 via-indigo-950 to-slate-950 p-6 sm:p-8 border border-violet-500/30 shadow-2xl text-white">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-10 h-48 w-48 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300 border border-violet-400/30 mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Administrator Command Center</span>
            </div>

            <h1 className="font-heading text-3xl font-extrabold text-white sm:text-4xl">
              Welcome, {currentUser?.fullName || 'Administrator'}!
            </h1>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
              Full control over all nominated projects, category classifications, judge registration approvals, live evaluations, award designation, and system locks.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={onOpenAddProject}
              className="inline-flex items-center space-x-2 rounded-2xl bg-white text-slate-900 px-4 py-2.5 text-xs font-bold shadow-lg hover:bg-slate-100 transition-transform hover:scale-105"
            >
              <Plus className="h-4 w-4 text-violet-600" />
              <span>Add Project</span>
            </button>
            <button
              onClick={onOpenAddJudge}
              className="inline-flex items-center space-x-2 rounded-2xl bg-violet-600/40 hover:bg-violet-600/60 px-4 py-2.5 text-xs font-bold text-white border border-violet-400/30 transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>Judge Approvals</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('projects')}
          className="cursor-pointer group rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-violet-500/50 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Projects</span>
            <FolderGit2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white">{projects.length}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">{totalActiveProjects} Active / {projects.length - totalActiveProjects} Inactive</p>
        </div>

        <div
          onClick={() => onNavigate('judges')}
          className="cursor-pointer group rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Judges</span>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white">{judges.length}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">Configured Personas</p>
        </div>

        <div
          onClick={() => onNavigate('evaluations')}
          className="cursor-pointer group rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Submissions</span>
            <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white">{totalEvaluationsCount}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Evaluations Recorded</p>
        </div>

        <div
          onClick={() => onNavigate('results')}
          className="cursor-pointer group rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Global Avg</span>
            <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white">
            {globalAverageScore > 0 ? `${globalAverageScore}` : 'N/A'}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">/ 100 Overall Converted</p>
        </div>
      </div>

      {/* Control Status & System Lock Engine Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Evaluation Lock Toggle */}
        <div className={`rounded-3xl border p-5 sm:p-6 transition-all ${settings.evaluationsLocked ? 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-500/30' : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0 ${settings.evaluationsLocked ? 'bg-red-100 dark:bg-red-500/20 text-red-600 border-red-200 dark:border-red-500/30' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 border-emerald-200 dark:border-emerald-500/30'}`}>
                {settings.evaluationsLocked ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                  {settings.evaluationsLocked ? 'Evaluations Locked' : 'Evaluations Active & Open'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {settings.evaluationsLocked ? 'Judges cannot submit or edit any evaluation scores.' : 'Judges can submit & edit scores for assigned projects.'}
                </p>
              </div>
            </div>
            <button
              id="admin-toggle-eval-lock"
              onClick={handleToggleEvalLock}
              className={`w-full sm:w-auto rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md min-h-[40px] shrink-0 text-center ${settings.evaluationsLocked ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
            >
              {settings.evaluationsLocked ? 'Unlock Evaluations' : 'Lock All Evaluations'}
            </button>
          </div>
        </div>

        {/* Final Results Lock Toggle */}
        <div className={`rounded-3xl border p-5 sm:p-6 transition-all ${settings.finalResultsLocked ? 'bg-purple-50/70 dark:bg-purple-950/20 border-purple-200 dark:border-purple-500/30' : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0 ${settings.finalResultsLocked ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 border-purple-200 dark:border-purple-500/30' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 border-amber-200 dark:border-amber-500/30'}`}>
                {settings.finalResultsLocked ? <Trophy className="h-6 w-6" /> : <Award className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                  {settings.finalResultsLocked ? 'Final Results Locked & Published' : 'Final Results In Draft Mode'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {settings.finalResultsLocked ? 'Leaderboards and awards designations are frozen.' : 'Scores and rankings recalculate dynamically.'}
                </p>
              </div>
            </div>
            <button
              id="admin-toggle-result-lock"
              onClick={handleToggleResultLock}
              className={`w-full sm:w-auto rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md min-h-[40px] shrink-0 text-center ${settings.finalResultsLocked ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
            >
              {settings.finalResultsLocked ? 'Unlock Results' : 'Lock Final Results'}
            </button>
          </div>
        </div>
      </div>



      {/* Two Column Section: Quick Reports & Recent Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Results & Leaderboard Card */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Results & Award Leaderboard</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              Generate 3-Judge converted mark averages, automated Champion/Winner/Merit designations, and 1-click A4 Printable Result Sheets.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 p-3 border border-amber-200 dark:border-amber-500/20">
                <span className="font-bold text-amber-700 dark:text-amber-300">Champion Tier</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Top project in each category (Score ≥ 85%)</p>
              </div>
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 p-3 border border-indigo-200 dark:border-indigo-500/20">
                <span className="font-bold text-indigo-700 dark:text-indigo-300">Printable A4 Sheet</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Official BIIN Report ready for print & export</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('results')}
            className="btn-primary w-full rounded-2xl py-3 text-xs font-bold text-white flex items-center justify-center space-x-2 shadow-lg"
          >
            <span>Open Results & Awards Center</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Audit Log Stream Card */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Recent Audit History</h3>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center space-x-1"
            >
              <span>View Full Log</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500">No audit events recorded yet.</p>
            ) : (
              auditLogs.map(log => (
                <div
                  key={log.id}
                  className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-2.5 text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{log.actorName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
