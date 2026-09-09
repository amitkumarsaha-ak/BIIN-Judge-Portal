import React from 'react';
import {
  FileText, Printer, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getEvaluationsByJudge, getProjectsForJudge
} from '../../services/storage';
import { HEAD_CATEGORIES } from '../../data/mockData';
import { getCriteriaForApplicationType, formatScoreNumber } from '../../utils/evaluation';

export const JudgeOwnReportView: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const myEvaluations = getEvaluationsByJudge(currentUser.email);
  const assignedProjects = getProjectsForJudge();

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
      {/* Printable CSS */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 mb-2">
            <FileText className="h-3.5 w-3.5" />
            <span>Judge Score Summary Sheet</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            My Evaluation Report
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personal evaluation summary report showing your criterion scores, raw totals, converted scores, and feedback.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="btn-primary inline-flex items-center justify-center space-x-2 rounded-2xl px-5 py-3 text-xs font-bold text-white shadow-xl hover:scale-105 transition-transform shrink-0 min-h-[40px] w-full sm:w-auto"
        >
          <Printer className="h-4 w-4" />
          <span>Print / Save PDF Report</span>
        </button>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 print:grid-cols-3">
        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-4 text-center">
          <p className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400">Total Scored Projects</p>
          <p className="font-heading text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{myEvaluations.length}</p>
        </div>

        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 text-center">
          <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">My Average Converted Score</p>
          <p className="font-heading text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{avgScore > 0 ? `${avgScore}%` : 'N/A'}</p>
        </div>

        <div className="rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 p-4 text-center">
          <p className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400">Official Evaluator</p>
          <p className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">{currentUser.fullName}</p>
          <p className="text-[11px] text-slate-500 font-mono">{currentUser.email}</p>
        </div>
      </div>

      {/* Printable Report Table */}
      <div className="glass-panel print-card rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-white">Detailed Score Breakdown</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Judge: {currentUser.fullName} ({currentUser.email})</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">{new Date().toLocaleDateString()}</span>
        </div>

        {myEvaluations.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p>No project evaluations submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myEvaluations.map((e, idx) => {
              const proj = assignedProjects.find(p => p.id === e.projectId);
              const rawScore = e.rawTotalScore ?? e.totalScore ?? 0;
              const maxRaw = e.maxRawScore || 50;
              const converted = e.convertedScore ?? e.percentage ?? 0;
              const categoryObj = HEAD_CATEGORIES.find(c => c.code === proj?.headCategory);
              const criteria = proj ? getCriteriaForApplicationType(proj.applicationType) : [];

              return (
                <div
                  key={e.id}
                  className="print-break-inside-avoid rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/40 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          #{idx + 1} · {proj?.applicationId || e.projectId}
                        </span>
                        <span className="rounded bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                          {proj?.applicationType}
                        </span>
                        {proj?.headCategory && (
                          <span className="rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 text-[10px] font-semibold">
                            {categoryObj?.name || proj.headCategory}
                          </span>
                        )}
                      </div>
                      <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-1">
                        {proj?.title || 'Unknown Project'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {proj?.teamOrOrgName} · Representative: {proj?.representativeName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4 text-right shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Raw Score</span>
                        <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">
                          {formatScoreNumber(rawScore)} / {maxRaw}
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 block">Converted Mark</span>
                        <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">
                          {formatScoreNumber(converted)} / 100
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Criteria Scores Matrix */}
                  <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
                    {criteria.map((crit) => {
                      const val = e.scores[crit.key] ?? 0;
                      return (
                        <div
                          key={crit.key}
                          className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 text-center"
                        >
                          <p className="text-[10px] text-slate-500 truncate" title={crit.label}>
                            {crit.label}
                          </p>
                          <p className="font-bold font-mono text-xs text-slate-900 dark:text-white mt-0.5">
                            {formatScoreNumber(val)} / 10
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Feedback & Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5 pt-1 text-slate-500">
                    <p className="text-[11px] italic">
                      {e.feedback ? `"${e.feedback}"` : 'No qualitative comments provided.'}
                    </p>
                    <span className="text-[10px] font-mono flex items-center space-x-1 shrink-0">
                      <Calendar className="h-3 w-3" />
                      <span>Evaluated: {new Date(e.submittedAt).toLocaleDateString()} {new Date(e.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

