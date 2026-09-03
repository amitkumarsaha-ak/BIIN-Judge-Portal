import React, { useState, useMemo, useCallback } from 'react';
import {
  Trophy, Medal, Printer, Lock, Unlock,
  Search, UserCheck
} from 'lucide-react';
import type { CombinedProjectResult, ApplicationType } from '../../types';
import {
  getProjects, getEvaluations, getSystemSettings,
  toggleFinalResultLock
} from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { getProjectCombinedResult, formatScoreNumber } from '../../utils/evaluation';
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>(allProjects[0]?.id || '');
  const [activePrintResult, setActivePrintResult] = useState<CombinedProjectResult | null>(null);

  const allCombinedResults = useMemo(() => {
    return allProjects.map(p => getProjectCombinedResult(p, allProjects, allEvaluations));
  }, [allProjects, allEvaluations]);

  const rankedResults = useMemo(() => {
    const list = [...allCombinedResults];
    list.sort((a, b) => b.finalAverageScore - a.finalAverageScore);

    const q = searchQuery.toLowerCase().trim();
    return list.filter(res => {
      if (filterType !== 'All' && res.project.applicationType !== filterType) return false;
      if (q) {
        const hay = [
          res.project.title,
          res.project.applicationId,
          res.project.teamOrOrgName,
          res.project.roomNumber || ''
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allCombinedResults, searchQuery, filterType]);

  const selectedResult = useMemo(() => {
    return allCombinedResults.find(r => r.project.id === selectedProjectId) || allCombinedResults[0] || null;
  }, [allCombinedResults, selectedProjectId]);

  const handleToggleLock = () => {
    if (currentUser) {
      toggleFinalResultLock(!settings.finalResultsLocked, {
        email: currentUser.email,
        name: currentUser.fullName
      });
      refreshSettings();
    }
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

  return (
    <div className="space-y-6 pb-12">
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
            Aggregated multi-judge converted mark averages, live awards computation, and official A4 Printable Report Sheets.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleToggleLock}
            className={`inline-flex items-center space-x-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all shadow-xl ${settings.finalResultsLocked ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}
          >
            {settings.finalResultsLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4 text-emerald-500" />}
            <span>{settings.finalResultsLocked ? 'Final Results Locked' : 'Lock Final Results'}</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 h-full w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by project name, ID, team, room..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as ApplicationType | 'All')}
          className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="All">All Application Types</option>
          <option value="Student">Student</option>
          <option value="Organisation">Organisation</option>
          <option value="Individual or Group">Individual or Group</option>
        </select>
      </div>

      {/* Two-Pane Layout: Leaderboard Ranking List + Selected Project Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Ranked Project Leaderboard */}
        <div className="lg:col-span-7 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Medal className="h-4 w-4 text-amber-500" />
              <span>Ranked Leaderboard ({rankedResults.length})</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Sorted by Mark Average</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {rankedResults.map((res, idx) => {
              const isSelected = selectedResult?.project.id === res.project.id;
              const rank = idx + 1;

              return (
                <div
                  key={res.project.id}
                  onClick={() => setSelectedProjectId(res.project.id)}
                  className={`cursor-pointer rounded-2xl border p-3.5 transition-all flex items-center justify-between ${isSelected ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-500/10 shadow-md ring-2 ring-amber-500/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'}`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl font-heading font-black text-xs shrink-0 ${rank === 1 ? 'bg-amber-500 text-slate-950' : rank === 2 ? 'bg-slate-300 text-slate-900' : rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                      #{rank}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-xs truncate leading-tight">{res.project.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{res.project.applicationId} · {res.project.teamOrOrgName}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 pl-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] ${getAwardBadge(res.award)}`}>
                      {res.award}
                    </span>
                    <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white font-mono">
                      {formatScoreNumber(res.finalAverageScore)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Selected Project Multi-Judge Details */}
        <div className="lg:col-span-5 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-5 flex flex-col justify-between">
          {selectedResult ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs ${getAwardBadge(selectedResult.award)}`}>
                    {selectedResult.award}
                  </span>
                  <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white mt-2 leading-tight">
                    {selectedResult.project.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {selectedResult.project.applicationId} · {selectedResult.project.roomNumber}
                  </p>
                </div>
              </div>

              {/* Combined Average Score Big Card */}
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-cyan-500/10 border border-amber-300/30 dark:border-amber-500/20 p-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Combined 3-Judge Mark Average
                </p>
                <p className="font-heading text-4xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {formatScoreNumber(selectedResult.finalAverageScore)} / 100
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Based on {selectedResult.judgesEvaluations.length} independent judge evaluation{selectedResult.judgesEvaluations.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Individual Judge Scores List */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Judge Submissions Breakdown</p>
                {selectedResult.judgesEvaluations.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60">
                    No evaluations submitted yet for this project.
                  </p>
                ) : (
                  selectedResult.judgesEvaluations.map((je) => (
                    <div
                      key={je.judgeEmail}
                      className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="font-bold text-slate-900 dark:text-white">{je.judgeName}</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatScoreNumber(je.convertedScore)} / 100
                        </span>
                      </div>
                      {je.feedback && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">"{je.feedback}"</p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Print Button */}
              <button
                onClick={() => setActivePrintResult(selectedResult)}
                className="btn-primary w-full inline-flex items-center justify-center space-x-2 rounded-2xl py-3 text-xs font-bold text-white shadow-xl hover:scale-105 transition-transform"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official A4 Result Report Sheet</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>Select a project to view result breakdown</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
