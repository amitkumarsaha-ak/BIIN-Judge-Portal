import React, { useState } from 'react';
import { Award, Printer, Users, CheckCircle2, Trophy, Medal, Sparkles } from 'lucide-react';
import type { CombinedProjectResult } from '../../types';
import { getProjects, getEvaluations } from '../../services/storage';
import { getProjectCombinedResult, formatScoreNumber } from '../../utils/evaluation';

interface CombinedProjectResultViewProps {
  initialProjectId?: string;
  onPrintReportSheet?: (result: CombinedProjectResult) => void;
  onBack?: () => void;
}

export const CombinedProjectResultView: React.FC<CombinedProjectResultViewProps> = ({
  initialProjectId,
  onPrintReportSheet,
  onBack
}) => {
  const allProjects = getProjects();
  const allEvaluations = getEvaluations();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId || allProjects[0]?.id || ''
  );

  const currentProject = allProjects.find((p) => p.id === selectedProjectId) || allProjects[0];

  const combinedResult: CombinedProjectResult | null = currentProject
    ? getProjectCombinedResult(currentProject, allProjects, allEvaluations)
    : null;

  const getAwardBadgeStyle = (award: string) => {
    switch (award) {
      case 'Champion':
        return 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 font-black';
      case 'Winner':
        return 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/30 font-extrabold';
      case 'Merit':
        return 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg font-bold';
      default:
        return 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold';
    }
  };

  const getAwardIcon = (award: string) => {
    switch (award) {
      case 'Champion':
        return Trophy;
      case 'Winner':
        return Medal;
      case 'Merit':
        return Award;
      default:
        return CheckCircle2;
    }
  };

  const AwardIcon = combinedResult ? getAwardIcon(combinedResult.award) : Award;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 mb-2">
              <Users className="h-3.5 w-3.5" />
              <span>Multi-Judge Evaluation Engine</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Combined Project Result Report
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Aggregated scoring across all independent judges with live award designation calculation.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-center">
            {onBack && (
              <button
                onClick={onBack}
                className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              >
                Back
              </button>
            )}

            {combinedResult && onPrintReportSheet && (
              <button
                onClick={() => onPrintReportSheet(combinedResult)}
                className="btn-primary inline-flex items-center space-x-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xl hover:scale-105 transition-transform"
              >
                <Printer className="h-4 w-4" />
                <span>Print Result Report Sheet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Project Selector */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Select Nominated Project to View Combined Result:
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 p-3 text-xs font-semibold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:outline-none"
        >
          {allProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.applicationType} • {p.headCategory})
            </option>
          ))}
        </select>
      </div>

      {/* Combined Result Sheet Content */}
      {!combinedResult ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Award className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No evaluation data available</h3>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-8">
          
          {/* Metadata Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="rounded-lg bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1 text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  {combinedResult.project.headCategory}
                </span>
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {combinedResult.applicationType}
                </span>
              </div>
              <h2 className="font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
                {combinedResult.project.title}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Participant / Org: <strong>{combinedResult.project.teamOrOrgName}</strong> ({combinedResult.project.representativeName})
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {onPrintReportSheet && (
                <button
                  onClick={() => onPrintReportSheet(combinedResult)}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Sheet</span>
                </button>
              )}
            </div>
          </div>

          {/* 3 Judges Evaluation Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>Multi-Judge Evaluation Breakdown</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {combinedResult.judgesEvaluations.length} Judge Evaluation{combinedResult.judgesEvaluations.length !== 1 ? 's' : ''} Submitted
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Judge</th>
                    <th className="px-4 py-3.5 text-center">Raw Score</th>
                    <th className="px-4 py-3.5 text-center">Converted Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-950/40">
                  {combinedResult.judgesEvaluations.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-xs text-slate-500">
                        No judge evaluations submitted for this project yet.
                      </td>
                    </tr>
                  ) : (
                    combinedResult.judgesEvaluations.map((judgeEval, idx) => (
                      <tr key={judgeEval.judgeEmail} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            Judge {idx + 1}: {judgeEval.judgeName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">{judgeEval.judgeEmail}</div>
                        </td>

                        <td className="px-4 py-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200 text-base">
                          {formatScoreNumber(judgeEval.rawScore)} / {judgeEval.maxRawScore}
                        </td>

                        <td className="px-4 py-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">
                          {formatScoreNumber(judgeEval.convertedScore)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100 dark:bg-slate-900 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="px-4 py-4 uppercase tracking-wider text-xs text-slate-900 dark:text-white">
                      Final Average Score
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-slate-500 text-xs">—</td>
                    <td className="px-4 py-4 text-center font-mono text-xl text-emerald-600 dark:text-emerald-400">
                      {formatScoreNumber(combinedResult.finalAverageScore)} / 100
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Prominent Final Score & Award Showcase */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-950 p-8 border border-indigo-500/40 shadow-2xl text-white text-center space-y-4 relative overflow-hidden">
            <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

            <span className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-500/20 px-4 py-1 text-xs font-bold text-indigo-300 border border-indigo-400/30">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Official Multi-Judge Final Result</span>
            </span>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-indigo-200 block font-mono">
                FINAL COMBINED SCORE
              </span>
              <div className="font-mono text-5xl font-black text-white tracking-tight">
                {formatScoreNumber(combinedResult.finalAverageScore)} <span className="text-2xl text-indigo-300">/ 100</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col items-center justify-center space-y-2">
              <span className="text-xs uppercase tracking-widest text-indigo-200 block font-mono">
                AWARD DESIGNATION
              </span>

              <div className={`inline-flex items-center space-x-2 rounded-2xl px-6 py-2.5 text-lg uppercase tracking-wider ${getAwardBadgeStyle(combinedResult.award)}`}>
                <AwardIcon className="h-6 w-6 shrink-0" />
                <span>AWARD: {combinedResult.award}</span>
              </div>

              {combinedResult.isHighestInCategory && combinedResult.award === 'Champion' && (
                <p className="text-xs text-amber-300 font-semibold tracking-wide mt-1">
                  ★ Highest Score in Category ({combinedResult.applicationType} • {combinedResult.project.headCategory})
                </p>
              )}
            </div>
          </div>

          {/* Action Footer */}
          {onPrintReportSheet && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onPrintReportSheet(combinedResult)}
                className="btn-primary w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white shadow-xl hover:scale-105 transition-transform"
              >
                <Printer className="h-4 w-4" />
                <span>Print Result Report Sheet</span>
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
