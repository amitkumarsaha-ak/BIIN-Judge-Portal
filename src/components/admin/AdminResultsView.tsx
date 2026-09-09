import React, { useState, useMemo, useCallback } from 'react';
import {
  Trophy, Medal, Printer, Lock, Unlock,
  Search, UserCheck, Sparkles, Filter
} from 'lucide-react';
import type { CombinedProjectResult, ApplicationType, HeadCategoryCode } from '../../types';
import {
  getProjects, getEvaluations, getSystemSettings,
  toggleFinalResultLock
} from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import {
  getProjectCombinedResult,
  formatScoreNumber,
  getCriteriaForApplicationType,
  getMaxRawScoreForApplicationType
} from '../../utils/evaluation';
import { HEAD_CATEGORIES } from '../../data/mockData';
import { PrintResultReportSheet } from '../reports/PrintResultReportSheet';

export const AdminResultsView: React.FC = () => {
  const { currentUser } = useAuth();
  const allProjects = getProjects();
  const allEvaluations = getEvaluations();

  // State-driven so toggling lock re-renders the button instantly
  const [settings, setSettings] = useState(() => getSystemSettings());

  const refreshSettings = useCallback(() => setSettings(getSystemSettings()), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ApplicationType | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState<HeadCategoryCode | 'All'>('All');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(allProjects[0]?.id || '');
  const [activePrintResult, setActivePrintResult] = useState<CombinedProjectResult | null>(null);

  const allCombinedResults = useMemo(() => {
    return allProjects.map(p => getProjectCombinedResult(p, allProjects, allEvaluations));
  }, [allProjects, allEvaluations]);

  // Ranked results sorted from Highest -> Lowest
  const rankedResults = useMemo(() => {
    const list = [...allCombinedResults];
    list.sort((a, b) => b.finalAverageScore - a.finalAverageScore);

    const q = searchQuery.toLowerCase().trim();
    return list.filter(res => {
      if (filterType !== 'All' && res.project.applicationType !== filterType) return false;
      if (filterCategory !== 'All' && res.project.headCategory !== filterCategory) return false;
      if (q) {
        const hay = [
          res.project.title,
          res.project.applicationId,
          res.project.projectCode,
          res.project.teamOrOrgName,
          res.project.representativeName
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allCombinedResults, searchQuery, filterType, filterCategory]);

  const selectedResult = useMemo(() => {
    return rankedResults.find(r => r.project.id === selectedProjectId) || rankedResults[0] || null;
  }, [rankedResults, selectedProjectId]);

  const handleToggleLock = () => {
    if (currentUser) {
      toggleFinalResultLock(!settings.finalResultsLocked, {
        email: currentUser.email,
        name: currentUser.fullName
      });
      refreshSettings();
    }
  };

  const handlePrintFullTable = () => {
    window.print();
  };

  const getAwardBadge = (award: string) => {
    switch (award) {
      case 'Champion':
        return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/30';
      case 'Winner':
        return 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-extrabold shadow-md shadow-indigo-500/30';
      case 'Merit':
        return 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold';
      default:
        return 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold';
    }
  };

  const criteriaForSelected = selectedResult
    ? getCriteriaForApplicationType(selectedResult.project.applicationType)
    : [];

  const maxRawForSelected = selectedResult
    ? getMaxRawScoreForApplicationType(selectedResult.project.applicationType)
    : 50;

  return (
    <div className="space-y-6 pb-12 print:p-0">
      {/* Printable styles */}
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
        }
      `}</style>

      {/* Print Sheet Modal */}
      {activePrintResult && (
        <PrintResultReportSheet
          result={activePrintResult}
          onClose={() => setActivePrintResult(null)}
        />
      )}

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-amber-50 dark:bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 mb-2">
            <Trophy className="h-3.5 w-3.5" />
            <span>Master Results & Leaderboards</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Results & Award Designation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Filter by Application Type & Head Category to inspect sorted rankings, judge scorecards, and official A4 reports.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0 no-print w-full sm:w-auto">
          <button
            onClick={handlePrintFullTable}
            className="btn-primary inline-flex items-center justify-center space-x-2 rounded-2xl px-5 py-3 text-xs font-bold text-white shadow-xl hover:scale-105 transition-transform min-h-[40px]"
          >
            <Printer className="h-4 w-4" />
            <span>Print Results Report</span>
          </button>

          <button
            onClick={handleToggleLock}
            className={`inline-flex items-center justify-center space-x-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all shadow-xl min-h-[40px] ${settings.finalResultsLocked ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}
          >
            {settings.finalResultsLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4 text-emerald-500" />}
            <span>{settings.finalResultsLocked ? 'Final Results Locked' : 'Lock Final Results'}</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="no-print flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 h-full w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by project name, ID, participant, or code..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Application Type Filter */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as ApplicationType | 'All')}
          className="w-full sm:w-auto rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
        >
          <option value="All">All Application Types</option>
          <option value="Student">Student</option>
          <option value="Student-Tertiary">Student-Tertiary Categories (University Level)</option>
          <option value="Organisation">Organisation</option>
          <option value="Individual or Group">Individual or Group</option>
        </select>

        {/* Head Category Filter */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as HeadCategoryCode | 'All')}
          className="w-full sm:w-auto rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
        >
          <option value="All">All Head Categories</option>
          {HEAD_CATEGORIES.map(hc => (
            <option key={hc.code} value={hc.code}>
              {hc.code} — {hc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Active Filter Indicators */}
      {(filterType !== 'All' || filterCategory !== 'All') && (
        <div className="no-print flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
          <Filter className="h-4 w-4 text-amber-600" />
          <span>Active Category:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {filterType !== 'All' ? filterType : 'All Types'}
          </span>
          <span>→</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {filterCategory !== 'All' ? (HEAD_CATEGORIES.find(c => c.code === filterCategory)?.name || filterCategory) : 'All Categories'}
          </span>
          <span className="text-slate-400">({rankedResults.length} ranked project{rankedResults.length !== 1 ? 's' : ''})</span>
        </div>
      )}

      {/* Two-Pane Layout: Leaderboard Ranking List + Selected Project Multi-Judge Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Ranked Project Leaderboard (Highest -> Lowest) */}
        <div className="lg:col-span-6 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Medal className="h-4 w-4 text-amber-500" />
              <span>Ranked Leaderboard ({rankedResults.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Sorted: Highest → Lowest</span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1 touch-scroll">
            {rankedResults.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <p className="text-xs">No projects match the selected category filters.</p>
              </div>
            ) : (
              rankedResults.map((res, idx) => {
                const isSelected = selectedResult?.project.id === res.project.id;
                const rank = idx + 1;

                return (
                  <div
                    key={res.project.id}
                    onClick={() => setSelectedProjectId(res.project.id)}
                    className={`cursor-pointer rounded-2xl border p-3.5 transition-all flex items-center justify-between ${isSelected ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/10 shadow-md ring-2 ring-amber-500/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'}`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl font-heading font-black text-xs shrink-0 ${rank === 1 ? 'bg-amber-500 text-slate-950' : rank === 2 ? 'bg-slate-300 text-slate-900' : rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        #{rank}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate leading-tight">{res.project.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {res.project.applicationId} · {res.project.teamOrOrgName}
                        </p>
                        <div className="flex items-center space-x-1.5 mt-1 text-[10px] font-semibold text-slate-500">
                          <span className="rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2">{res.project.applicationType}</span>
                          <span>•</span>
                          <span className="rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 px-1.5 py-0.2">{res.project.headCategory}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1 shrink-0 pl-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase ${getAwardBadge(res.award)}`}>
                        {res.award}
                      </span>
                      <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white font-mono">
                        {formatScoreNumber(res.finalAverageScore)}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {res.judgesEvaluations.length} Judge{res.judgesEvaluations.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 6 Columns: Selected Project Multi-Judge Detailed Breakdown */}
        <div className="lg:col-span-6 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-5 flex flex-col justify-between">
          {selectedResult ? (
            <div className="space-y-5">
              {/* Top Title & Badges */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${getAwardBadge(selectedResult.award)}`}>
                      {selectedResult.award}
                    </span>
                    {selectedResult.isHighestInCategory && selectedResult.award === 'Champion' && (
                      <span className="inline-flex items-center space-x-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        <Sparkles className="h-3 w-3" />
                        <span>★ Highest in Category</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading text-xl font-extrabold text-slate-900 dark:text-white mt-1 leading-tight">
                    {selectedResult.project.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {selectedResult.project.applicationId} · {selectedResult.project.projectCode} · {selectedResult.project.teamOrOrgName}
                  </p>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-400 pt-0.5">
                    <span>Type: <strong>{selectedResult.applicationType}</strong></span>
                    <span>•</span>
                    <span>Category: <strong>{selectedResult.project.headCategory}</strong></span>
                  </div>
                </div>
              </div>

              {/* Combined Average Score Big Card */}
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-cyan-500/10 border border-amber-300/40 dark:border-amber-500/30 p-5 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                  FINAL AVERAGE SCORE
                </p>
                <p className="font-heading text-4xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
                  {formatScoreNumber(selectedResult.finalAverageScore)}%
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Aggregated from {selectedResult.judgesEvaluations.length} independent judge evaluation{selectedResult.judgesEvaluations.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Individual Judge Submissions with Detailed Criterion Marks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Evaluator Scorecards Breakdown
                  </p>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Raw: /{maxRawForSelected} → Converted: /100
                  </span>
                </div>

                {selectedResult.judgesEvaluations.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 text-center border border-dashed border-slate-200 dark:border-slate-800">
                    No evaluations submitted yet for this project.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 touch-scroll">
                    {selectedResult.judgesEvaluations.map((je, idx) => (
                      <div
                        key={je.judgeEmail}
                        className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4 text-xs space-y-2.5"
                      >
                        {/* Judge Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800/80 gap-2">
                          <div className="flex items-center space-x-2">
                            <UserCheck className="h-4 w-4 text-indigo-500 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white truncate block">
                                Judge {idx + 1}: {je.judgeName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block truncate">{je.judgeEmail}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end space-x-3 text-right w-full sm:w-auto pt-1 sm:pt-0">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Raw Total</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {formatScoreNumber(je.rawScore)} / {je.maxRawScore}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Converted</span>
                              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                {formatScoreNumber(je.convertedScore)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Individual Criteria Marks */}
                        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5 text-[11px]">
                          {criteriaForSelected.map(crit => {
                            const val = je.scores[crit.key] ?? 0;
                            return (
                              <div
                                key={crit.key}
                                className="rounded-lg bg-white dark:bg-slate-900 p-1.5 border border-slate-200/70 dark:border-slate-800/70 text-center"
                              >
                                <p className="text-[9px] text-slate-500 truncate" title={crit.label}>{crit.label}</p>
                                <p className="font-bold font-mono text-slate-900 dark:text-white">{formatScoreNumber(val)}</p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Qualitative Feedback */}
                        {je.feedback && (
                          <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                              "{je.feedback}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Print Official Sheet Button */}
              <button
                onClick={() => setActivePrintResult(selectedResult)}
                className="btn-primary w-full inline-flex items-center justify-center space-x-2 rounded-2xl py-3.5 text-xs font-bold text-white shadow-xl hover:scale-105 transition-transform"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official A4 Result Report Sheet</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <p>Select a project from the left leaderboard to view full multi-judge scorecard.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

