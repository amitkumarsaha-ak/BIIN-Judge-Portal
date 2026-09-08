import React, { useState } from 'react';
import { UserCheck, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { getProjects, getEvaluations } from '../../services/storage';
import { getCriteriaForApplicationType, getMaxRawScoreForApplicationType, formatScoreNumber } from '../../utils/evaluation';

interface IndividualJudgeReportViewProps {
  initialProjectId?: string;
  onBack?: () => void;
}

export const IndividualJudgeReportView: React.FC<IndividualJudgeReportViewProps> = ({
  initialProjectId,
  onBack
}) => {
  const allProjects = getProjects();
  const allEvaluations = getEvaluations();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId || allProjects[0]?.id || ''
  );
  const [selectedJudgeEmail, setSelectedJudgeEmail] = useState<string>('');

  const currentProject = allProjects.find((p) => p.id === selectedProjectId) || allProjects[0];

  const projectEvaluations = currentProject
    ? allEvaluations.filter((e) => e.projectId === currentProject.id)
    : [];

  const activeEvaluation = selectedJudgeEmail
    ? projectEvaluations.find((e) => e.judgeEmail.toLowerCase() === selectedJudgeEmail.toLowerCase()) || projectEvaluations[0]
    : projectEvaluations[0];

  const activeCriteria = currentProject
    ? getCriteriaForApplicationType(currentProject.applicationType)
    : [];
  const maxRawScore = currentProject
    ? getMaxRawScoreForApplicationType(currentProject.applicationType)
    : 50;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 mb-2">
              <UserCheck className="h-3.5 w-3.5" />
              <span>Individual Judge Evaluation Report</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Individual Judge Result Sheet
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Inspect criteria-wise score breakdown, raw totals, and converted score / 100 for each judge.
            </p>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 self-start sm:self-center"
            >
              Back to Overview
            </button>
          )}
        </div>
      </div>

      {/* Project & Judge Selection Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Select Project */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Select Project / Application:
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSelectedJudgeEmail('');
            }}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 p-3 text-xs font-semibold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.applicationType} • {p.headCategory})
              </option>
            ))}
          </select>
        </div>

        {/* Select Judge */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Select Judge Evaluation:
          </label>
          <select
            value={activeEvaluation?.judgeEmail || ''}
            onChange={(e) => setSelectedJudgeEmail(e.target.value)}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 p-3 text-xs font-semibold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            {projectEvaluations.length === 0 ? (
              <option value="">No evaluations submitted yet for this project</option>
            ) : (
              projectEvaluations.map((e, idx) => (
                <option key={e.id} value={e.judgeEmail}>
                  Judge {idx + 1}: {e.judgeName} ({e.judgeEmail})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Main Individual Report Content */}
      {!activeEvaluation ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No evaluation submitted for this judge</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            There are no recorded judge scores for {currentProject?.title} yet.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950/70 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Category</span>
              <span className="font-heading font-extrabold text-indigo-600 dark:text-indigo-400 text-lg">
                {currentProject.headCategory || 'General'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Judge Name</span>
              <span className="font-heading font-bold text-slate-900 dark:text-white text-base">
                {activeEvaluation.judgeName}
              </span>
              <span className="text-xs text-slate-500 block font-mono">{activeEvaluation.judgeEmail}</span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Application / Project</span>
              <span className="font-heading font-bold text-slate-900 dark:text-white text-base">
                {currentProject.title}
              </span>
              <span className="text-xs text-slate-500 block">{currentProject.teamOrOrgName}</span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Application Type</span>
              <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 mt-1">
                {currentProject.applicationType}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Participant / Institution</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                {currentProject.representativeName}
              </span>
              {currentProject.institutionOrOrg && (
                <span className="text-xs text-slate-500 block">{currentProject.institutionOrOrg}</span>
              )}
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Submission Date</span>
              <span className="text-xs text-slate-700 dark:text-slate-300 font-mono flex items-center space-x-1 mt-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{new Date(activeEvaluation.submittedAt).toLocaleString()}</span>
              </span>
            </div>
          </div>

          {/* Criteria-wise Score Breakdown Table */}
          <div className="space-y-3">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Criteria-wise Mark Breakdown</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">SL</th>
                    <th className="px-4 py-3.5">Evaluation Criterion</th>
                    <th className="px-4 py-3.5 text-center">Max Score</th>
                    <th className="px-4 py-3.5 text-center">Score Awarded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-950/40">
                  {activeCriteria.map((crit, idx) => {
                    const scoreVal = activeEvaluation.scores[crit.key] ?? 0;
                    return (
                      <tr key={crit.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">0{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{crit.label}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{crit.description}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs font-bold text-slate-500">
                          10
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-cyan-600 dark:text-cyan-400 text-base">
                          {formatScoreNumber(scoreVal)} / 10
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Qualitative Feedback if present */}
          {activeEvaluation.feedback && (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/80 p-4 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Judge Qualitative Comments:</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{activeEvaluation.feedback}"</p>
            </div>
          )}

          {/* Score Summary Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="glass-panel rounded-2xl p-5 border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/40 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block mb-1">
                Raw Score Total
              </span>
              <span className="font-mono text-3xl font-extrabold text-slate-900 dark:text-white">
                {formatScoreNumber(activeEvaluation.rawTotalScore ?? activeEvaluation.totalScore ?? 0)}
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Maximum Raw Score
              </span>
              <span className="font-mono text-3xl font-extrabold text-slate-700 dark:text-slate-300">
                {activeEvaluation.maxRawScore || maxRawScore}
              </span>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/40 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block mb-1">
                Converted Score (/100)
              </span>
              <span className="font-mono text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatScoreNumber(activeEvaluation.convertedScore ?? activeEvaluation.percentage ?? 0)} / 100
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
