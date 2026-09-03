import React from 'react';
import {
  FileText, Printer
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getEvaluationsByJudge, getProjectsForJudge
} from '../../services/storage';

export const JudgeOwnReportView: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const myEvaluations = getEvaluationsByJudge(currentUser.email);
  const assignedProjects = getProjectsForJudge(currentUser.roomNumber);

  let avgScore = 0;
  if (myEvaluations.length > 0) {
    const sum = myEvaluations.reduce((a, c) => a + (c.convertedScore ?? c.percentage ?? 0), 0);
    avgScore = Number((sum / myEvaluations.length).toFixed(1));
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 print:p-0">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 mb-2">
            <FileText className="h-3.5 w-3.5" />
            <span>Judge Score Summary Sheet</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            My Evaluation Report
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personal evaluation summary report across all scored projects in your assigned room.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="btn-primary inline-flex items-center space-x-2 rounded-2xl px-5 py-3 text-xs font-bold text-white shadow-xl hover:scale-105 transition-transform shrink-0"
        >
          <Printer className="h-4 w-4" />
          <span>Print Evaluation Report</span>
        </button>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-4 text-center">
          <p className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400">Total Scored Projects</p>
          <p className="font-heading text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{myEvaluations.length}</p>
        </div>

        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 text-center">
          <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">My Average Score</p>
          <p className="font-heading text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{avgScore > 0 ? `${avgScore}%` : 'N/A'}</p>
        </div>

        <div className="rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 p-4 text-center">
          <p className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400">Assigned Room</p>
          <p className="font-heading text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-0.5">{currentUser.roomNumber || 'Unassigned'}</p>
        </div>
      </div>

      {/* Printable Report Table */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Detailed Score Breakdown</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Judge: {currentUser.fullName} ({currentUser.email})</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">{new Date().toLocaleDateString()}</span>
        </div>

        {myEvaluations.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p>No project evaluations submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-950/80 uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Project Title & ID</th>
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Raw Score</th>
                  <th className="px-4 py-3 text-center">Converted Score</th>
                  <th className="px-4 py-3">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {myEvaluations.map((e, idx) => {
                  const proj = assignedProjects.find(p => p.id === e.projectId);
                  const rawScore = e.rawTotalScore ?? e.totalScore ?? 0;
                  const maxRaw = e.maxRawScore || 50;
                  const converted = e.convertedScore ?? e.percentage ?? 0;

                  return (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5 font-bold font-mono text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{proj?.title || 'Unknown Project'}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{proj?.applicationId}</p>
                      </td>
                      <td className="px-4 py-3.5">{proj?.teamOrOrgName}</td>
                      <td className="px-4 py-3.5 font-mono">{proj?.applicationType}</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold">{rawScore.toFixed(1)} / {maxRaw}</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{converted.toFixed(1)} / 100</td>
                      <td className="px-4 py-3.5 text-[11px] italic max-w-xs truncate">{e.feedback || '—'}</td>
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
