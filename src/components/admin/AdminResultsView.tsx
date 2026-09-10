import React, { useState, useMemo, useCallback } from 'react';
import {
  Trophy, Medal, Award, Printer, Lock, Unlock,
  Search, UserCheck, Sparkles, Filter, RotateCcw,
  CheckCircle2, LayoutGrid, ListOrdered, ChevronDown, ChevronRight,
  Smartphone, Briefcase, Factory, Landmark, HeartHandshake
} from 'lucide-react';
import type { CombinedProjectResult, ApplicationType, HeadCategoryCode } from '../../types';
import {
  getProjects, getEvaluations, getSystemSettings,
  toggleFinalResultLock
} from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import {
  getProjectCombinedResult,
  calculateCategorizedResults,
  formatScoreNumber,
  getCriteriaForApplicationType,
  getMaxRawScoreForApplicationType,
  RESULT_APPLICATION_TYPES,
  RESULT_HEAD_CATEGORIES,
  canonicalAppType,
  canonicalHeadCategory
} from '../../utils/evaluation';
import { PrintResultReportSheet } from '../reports/PrintResultReportSheet';

export const AdminResultsView: React.FC = () => {
  const { currentUser } = useAuth();

  // State-driven storage data so recalculate or external updates trigger a fresh render
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [recalculatedNotice, setRecalculatedNotice] = useState<string | null>(null);

  const allProjects = useMemo(() => getProjects(), [refreshTrigger]);
  const allEvaluations = useMemo(() => getEvaluations(), [refreshTrigger]);

  // State-driven so toggling lock re-renders the button instantly
  const [settings, setSettings] = useState(() => getSystemSettings());
  const refreshSettings = useCallback(() => setSettings(getSystemSettings()), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ApplicationType | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState<HeadCategoryCode | 'All'>('All');
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(allProjects[0]?.id || '');
  const [activePrintResult, setActivePrintResult] = useState<CombinedProjectResult | null>(null);
  const [collapsedTypes, setCollapsedTypes] = useState<Record<string, boolean>>({});

  // 1. Calculate all combined results
  const allCombinedResults = useMemo(() => {
    return allProjects.map(p => getProjectCombinedResult(p, allProjects, allEvaluations));
  }, [allProjects, allEvaluations]);

  // 2. Calculate 20 categorized results (4 Application Types × 5 Head Categories)
  const categoryGroups = useMemo(() => {
    return calculateCategorizedResults(allProjects, allEvaluations);
  }, [allProjects, allEvaluations]);

  // 3. Flat Ranked results sorted from Highest -> Lowest (for search and table view)
  const rankedResults = useMemo(() => {
    const list = [...allCombinedResults];
    list.sort((a, b) => b.finalAverageScore - a.finalAverageScore);

    const q = searchQuery.toLowerCase().trim();
    return list.filter(res => {
      const pAppType = canonicalAppType(res.project.applicationType);
      const pHeadCat = canonicalHeadCategory(res.project.headCategory);

      if (filterType !== 'All' && pAppType !== filterType) return false;
      if (filterCategory !== 'All' && pHeadCat !== filterCategory) return false;
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
    if (selectedProjectId) {
      const found = allCombinedResults.find(r => r.project.id === selectedProjectId);
      if (found) return found;
    }
    return rankedResults[0] || allCombinedResults[0] || null;
  }, [allCombinedResults, rankedResults, selectedProjectId]);

  // Recalculation handler according to Rule 17
  const handleRecalculate = () => {
    // Refreshes existing completed judge evaluations & projects
    setRefreshTrigger(prev => prev + 1);
    const now = new Date().toLocaleTimeString();
    setRecalculatedNotice(`Results successfully recalculated at ${now} across all 20 categories with latest judge evaluations.`);
    setTimeout(() => {
      setRecalculatedNotice(null);
    }, 6000);
  };

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

  const toggleTypeCollapse = (typeId: string) => {
    setCollapsedTypes(prev => ({
      ...prev,
      [typeId]: !prev[typeId]
    }));
  };

  const getAwardBadge = (award: string) => {
    switch (award) {
      case 'Champion':
        return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/30';
      case 'Winner':
        return 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-extrabold shadow-md shadow-indigo-500/30';
      case 'Merit':
        return 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold';
      case 'No Award':
      case 'Participant':
      default:
        return 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold';
    }
  };

  const getCategoryIcon = (code: HeadCategoryCode) => {
    switch (code) {
      case 'HC-C':
        return Smartphone;
      case 'HC-BS':
        return Briefcase;
      case 'HC-I':
        return Factory;
      case 'HC-PSG':
        return Landmark;
      case 'HC-ICS':
      default:
        return HeartHandshake;
    }
  };

  const criteriaForSelected = selectedResult
    ? getCriteriaForApplicationType(selectedResult.project.applicationType)
    : [];

  const maxRawForSelected = selectedResult
    ? getMaxRawScoreForApplicationType(selectedResult.project.applicationType)
    : 50;

  // Filtered 20-category groups
  const filteredCategoryGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return categoryGroups.filter(grp => {
      if (filterType !== 'All' && grp.appType !== filterType) return false;
      if (filterCategory !== 'All' && grp.headCategoryCode !== filterCategory) return false;
      return true;
    }).map(grp => {
      if (!q) return grp;

      // Filter applicants within this category by search query
      const matchSearch = (res: CombinedProjectResult) => {
        const hay = [
          res.project.title,
          res.project.applicationId,
          res.project.projectCode,
          res.project.teamOrOrgName,
          res.project.representativeName
        ].join(' ').toLowerCase();
        return hay.includes(q);
      };

      const champions = grp.champions.filter(matchSearch);
      const winners = grp.winners.filter(matchSearch);
      const merits = grp.merits.filter(matchSearch);
      const noAwards = grp.noAwards.filter(matchSearch);
      const allResults = grp.allResults.filter(matchSearch);

      return {
        ...grp,
        champions,
        winners,
        merits,
        noAwards,
        allResults,
        totalApplicants: allResults.length
      };
    });
  }, [categoryGroups, filterType, filterCategory, searchQuery]);

  // Group filtered categories by Application Type for structured 20-category board display
  const structuredCategoriesByType = useMemo(() => {
    return RESULT_APPLICATION_TYPES.map(app => {
      const categories = filteredCategoryGroups.filter(g => g.appType === app.id);
      const totalInApp = categories.reduce((sum, c) => sum + c.totalApplicants, 0);
      const totalChampions = categories.reduce((sum, c) => sum + c.champions.length, 0);
      const totalWinners = categories.reduce((sum, c) => sum + c.winners.length, 0);
      const totalMerits = categories.reduce((sum, c) => sum + c.merits.length, 0);

      return {
        appType: app,
        categories,
        totalInApp,
        totalChampions,
        totalWinners,
        totalMerits
      };
    }).filter(group => {
      if (filterType !== 'All' && group.appType.id !== filterType) return false;
      return true;
    });
  }, [filteredCategoryGroups, filterType]);

  // Overall totals across categories
  const overallTotals = useMemo(() => {
    const totalProjects = allProjects.length;
    const totalChampions = allCombinedResults.filter(r => r.award === 'Champion').length;
    const totalWinners = allCombinedResults.filter(r => r.award === 'Winner').length;
    const totalMerits = allCombinedResults.filter(r => r.award === 'Merit').length;
    const totalNoAward = allCombinedResults.filter(r => r.award === 'No Award' || r.award === 'Participant').length;

    return { totalProjects, totalChampions, totalWinners, totalMerits, totalNoAward };
  }, [allProjects, allCombinedResults]);

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
            page-break-inside: avoid;
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
            <span>Master Results & Award Board (20 Independent Categories)</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Results & Award Designation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            4 Application Types × 5 Head Categories = 20 completely independent result categories. Award designations are calculated by score threshold: <strong>≥80% Champion</strong>, <strong>≥70% Winner</strong>, <strong>≥60% Merit</strong>, and <strong>&lt;60% No Award</strong>, with no limit on recipient counts.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 shrink-0 no-print w-full sm:w-auto">
          {/* Recalculate Results Button (Rule 17) */}
          <button
            onClick={handleRecalculate}
            title="Recalculate results across all 20 categories using latest judge evaluations"
            className="inline-flex items-center justify-center space-x-2 rounded-2xl px-4 py-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all hover:scale-105 min-h-[40px]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Recalculate Results</span>
          </button>

          <button
            onClick={handlePrintFullTable}
            className="btn-primary inline-flex items-center justify-center space-x-2 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-xl hover:scale-105 transition-transform min-h-[40px]"
          >
            <Printer className="h-4 w-4" />
            <span>Print Results Report</span>
          </button>

          <button
            onClick={handleToggleLock}
            className={`inline-flex items-center justify-center space-x-2 rounded-2xl px-4 py-3 text-xs font-bold transition-all shadow-xl min-h-[40px] ${settings.finalResultsLocked ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}
          >
            {settings.finalResultsLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4 text-emerald-500" />}
            <span>{settings.finalResultsLocked ? 'Final Results Locked' : 'Lock Final Results'}</span>
          </button>
        </div>
      </div>

      {/* Recalculation feedback notice */}
      {recalculatedNotice && (
        <div className="no-print flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{recalculatedNotice}</span>
          </div>
          <button
            onClick={() => setRecalculatedNotice(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-100 font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Statistics Banner */}
      <div className="no-print grid grid-cols-2 min-[640px]:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Applications</p>
          <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">{overallTotals.totalProjects}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Across 20 categories</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-300/40 dark:border-amber-500/30 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center space-x-1">
            <Trophy className="h-3 w-3" />
            <span>Champions (≥80%)</span>
          </p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">{overallTotals.totalChampions}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Unlimited recipients</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/5 border border-indigo-300/40 dark:border-indigo-500/30 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center space-x-1">
            <Medal className="h-3 w-3" />
            <span>Winners (70–79%)</span>
          </p>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">{overallTotals.totalWinners}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Unlimited recipients</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-300/40 dark:border-emerald-500/30 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center space-x-1">
            <Award className="h-3 w-3" />
            <span>Merits (60–69%)</span>
          </p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{overallTotals.totalMerits}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Unlimited recipients</p>
        </div>

        <div className="col-span-2 min-[640px]:col-span-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">No Award (&lt;60%)</p>
          <p className="text-xl font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5">{overallTotals.totalNoAward}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Below 60% threshold</p>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="no-print flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
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

        {/* Application Type Filter (Rule 1 & 14) */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as ApplicationType | 'All')}
          className="w-full md:w-auto rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
        >
          <option value="All">All Application Types (4 Types)</option>
          {RESULT_APPLICATION_TYPES.map(app => (
            <option key={app.id} value={app.id}>
              {app.title}
            </option>
          ))}
        </select>

        {/* Head Category Filter (Rule 2 & 14) */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as HeadCategoryCode | 'All')}
          className="w-full md:w-auto rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
        >
          <option value="All">All Head Categories (5 Categories)</option>
          {RESULT_HEAD_CATEGORIES.map(hc => (
            <option key={hc.code} value={hc.code}>
              {hc.code} — {hc.name}
            </option>
          ))}
        </select>

        {/* View Mode Toggle: 20-Category Board vs Ranked Table */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>20-Category Board</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <ListOrdered className="h-3.5 w-3.5" />
            <span>Ranked Table</span>
          </button>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {(filterType !== 'All' || filterCategory !== 'All' || searchQuery) && (
        <div className="no-print flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
          <Filter className="h-4 w-4 text-amber-600" />
          <span>Active Scope:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {filterType !== 'All' ? (RESULT_APPLICATION_TYPES.find(a => a.id === filterType)?.title || filterType) : 'All Application Types'}
          </span>
          <span>×</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {filterCategory !== 'All' ? (RESULT_HEAD_CATEGORIES.find(c => c.code === filterCategory)?.name || filterCategory) : 'All Head Categories'}
          </span>
          {searchQuery && (
            <>
              <span>•</span>
              <span>Query: "{searchQuery}"</span>
            </>
          )}
          <button
            onClick={() => {
              setFilterType('All');
              setFilterCategory('All');
              setSearchQuery('');
            }}
            className="text-amber-700 dark:text-amber-300 underline font-semibold ml-auto"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Two-Pane Layout: 20-Category Result Board / Table on Left + Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (lg:col-span-7): The 20-Category Result Board or Ranked List */}
        <div className="lg:col-span-7 space-y-4">
          {viewMode === 'board' ? (
            /* ============================================================ */
            /* 20-CATEGORY RESULT BOARD (Sections 13, 14, 15)               */
            /* ============================================================ */
            <div className="space-y-6">
              {structuredCategoriesByType.map(typeGroup => {
                const isCollapsed = collapsedTypes[typeGroup.appType.id] || false;

                return (
                  <div
                    key={typeGroup.appType.id}
                    className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4"
                  >
                    {/* Application Type Master Section Header */}
                    <div
                      onClick={() => toggleTypeCollapse(typeGroup.appType.id)}
                      className="cursor-pointer flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 select-none group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                        <div>
                          <h2 className="font-heading text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">
                            {typeGroup.appType.title}
                          </h2>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {typeGroup.categories.length} Head Categories · {typeGroup.totalInApp} Applicant{typeGroup.totalInApp !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] font-semibold">
                        <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 border border-amber-200/60 dark:border-amber-800/60">
                          🏆 {typeGroup.totalChampions} Champ
                        </span>
                        <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 border border-indigo-200/60 dark:border-indigo-800/60">
                          🥈 {typeGroup.totalWinners} Win
                        </span>
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 border border-emerald-200/60 dark:border-emerald-800/60">
                          🥉 {typeGroup.totalMerits} Merit
                        </span>
                      </div>
                    </div>

                    {/* Head Categories under this Application Type */}
                    {!isCollapsed && (
                      <div className="space-y-4">
                        {typeGroup.categories.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 text-xs italic">
                            No categories match current filters.
                          </div>
                        ) : (
                          typeGroup.categories.map(cat => {
                            const CategoryIcon = getCategoryIcon(cat.headCategoryCode);

                            return (
                              <div
                                key={cat.categoryKey}
                                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 space-y-3.5"
                              >
                                {/* Category Header (e.g. Consumer, Industrial, etc.) */}
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800/70">
                                  <div className="flex items-center space-x-2.5">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                                      <CategoryIcon className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                                        {cat.headCategoryName}
                                      </span>
                                      <span className="ml-2 font-mono text-[10px] font-bold text-slate-400">
                                        ({cat.headCategoryCode})
                                      </span>
                                    </div>
                                  </div>

                                  <span className="text-[11px] font-mono text-slate-500 font-semibold">
                                    {cat.totalApplicants} Total Applicant{cat.totalApplicants !== 1 ? 's' : ''}
                                  </span>
                                </div>

                                {/* 4 DESIGNATION BLOCKS: Champion, Winner, Merit, No Award */}
                                <div className="space-y-2.5">

                                  {/* 1. CHAMPION (>= 80%) */}
                                  <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-1.5">
                                        <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                        <span className="text-xs font-black tracking-wider text-amber-900 dark:text-amber-200 uppercase">
                                          Champion (≥ 80%)
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-800/50 text-amber-900 dark:text-amber-200">
                                        {cat.champions.length}
                                      </span>
                                    </div>

                                    {cat.champions.length === 0 ? (
                                      <p className="text-[11px] italic text-amber-800/60 dark:text-amber-400/50 pl-1">
                                        No Champion
                                      </p>
                                    ) : (
                                      <div className="space-y-1.5">
                                        {cat.champions.map(app => {
                                          const isSelected = selectedResult?.project.id === app.project.id;
                                          return (
                                            <div
                                              key={app.project.id}
                                              onClick={() => setSelectedProjectId(app.project.id)}
                                              className={`cursor-pointer rounded-lg p-2.5 transition-all flex items-center justify-between ${isSelected ? 'bg-amber-100 dark:bg-amber-900/40 border border-amber-400 dark:border-amber-600 shadow-sm ring-2 ring-amber-500/20' : 'bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/30 hover:border-amber-300'}`}
                                            >
                                              <div className="min-w-0 pr-2">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                  {app.project.title}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                                                  {app.project.applicationId} · {app.project.teamOrOrgName}
                                                </p>
                                              </div>
                                              <div className="flex items-center space-x-2 shrink-0">
                                                <span className="font-mono font-black text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                                                  {formatScoreNumber(app.finalAverageScore)}%
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* 2. WINNER (>= 70% AND < 80%) */}
                                  <div className="rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/50 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-1.5">
                                        <Medal className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                                        <span className="text-xs font-black tracking-wider text-indigo-900 dark:text-indigo-200 uppercase">
                                          Winner (70% – 79.99%)
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-200/70 dark:bg-indigo-800/50 text-indigo-900 dark:text-indigo-200">
                                        {cat.winners.length}
                                      </span>
                                    </div>

                                    {cat.winners.length === 0 ? (
                                      <p className="text-[11px] italic text-indigo-800/60 dark:text-indigo-400/50 pl-1">
                                        No Winner
                                      </p>
                                    ) : (
                                      <div className="space-y-1.5">
                                        {cat.winners.map(app => {
                                          const isSelected = selectedResult?.project.id === app.project.id;
                                          return (
                                            <div
                                              key={app.project.id}
                                              onClick={() => setSelectedProjectId(app.project.id)}
                                              className={`cursor-pointer rounded-lg p-2.5 transition-all flex items-center justify-between ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-400 dark:border-indigo-600 shadow-sm ring-2 ring-indigo-500/20' : 'bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-300'}`}
                                            >
                                              <div className="min-w-0 pr-2">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                  {app.project.title}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                                                  {app.project.applicationId} · {app.project.teamOrOrgName}
                                                </p>
                                              </div>
                                              <div className="flex items-center space-x-2 shrink-0">
                                                <span className="font-mono font-black text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-md">
                                                  {formatScoreNumber(app.finalAverageScore)}%
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* 3. MERIT (>= 60% AND < 70%) */}
                                  <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-1.5">
                                        <Award className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-xs font-black tracking-wider text-emerald-900 dark:text-emerald-200 uppercase">
                                          Merit (60% – 69.99%)
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-800/50 text-emerald-900 dark:text-emerald-200">
                                        {cat.merits.length}
                                      </span>
                                    </div>

                                    {cat.merits.length === 0 ? (
                                      <p className="text-[11px] italic text-emerald-800/60 dark:text-emerald-400/50 pl-1">
                                        No Merit
                                      </p>
                                    ) : (
                                      <div className="space-y-1.5">
                                        {cat.merits.map(app => {
                                          const isSelected = selectedResult?.project.id === app.project.id;
                                          return (
                                            <div
                                              key={app.project.id}
                                              onClick={() => setSelectedProjectId(app.project.id)}
                                              className={`cursor-pointer rounded-lg p-2.5 transition-all flex items-center justify-between ${isSelected ? 'bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-400 dark:border-emerald-600 shadow-sm ring-2 ring-emerald-500/20' : 'bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300'}`}
                                            >
                                              <div className="min-w-0 pr-2">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                  {app.project.title}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                                                  {app.project.applicationId} · {app.project.teamOrOrgName}
                                                </p>
                                              </div>
                                              <div className="flex items-center space-x-2 shrink-0">
                                                <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                                                  {formatScoreNumber(app.finalAverageScore)}%
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* 4. NO AWARD (< 60%) */}
                                  {cat.noAwards.length > 0 && (
                                    <div className="rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold tracking-wider text-slate-600 dark:text-slate-400 uppercase">
                                          No Award (&lt; 60%)
                                        </span>
                                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                          {cat.noAwards.length}
                                        </span>
                                      </div>

                                      <div className="space-y-1.5">
                                        {cat.noAwards.map(app => {
                                          const isSelected = selectedResult?.project.id === app.project.id;
                                          return (
                                            <div
                                              key={app.project.id}
                                              onClick={() => setSelectedProjectId(app.project.id)}
                                              className={`cursor-pointer rounded-lg p-2 transition-all flex items-center justify-between ${isSelected ? 'bg-slate-200 dark:bg-slate-800 border border-slate-400 shadow-sm' : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
                                            >
                                              <div className="min-w-0 pr-2">
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                                  {app.project.title}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-mono truncate">
                                                  {app.project.applicationId}
                                                </p>
                                              </div>
                                              <span className="font-mono text-xs text-slate-500 font-bold">
                                                {formatScoreNumber(app.finalAverageScore)}%
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ============================================================ */
            /* FLAT RANKED TABLE VIEW (Alternative view)                    */
            /* ============================================================ */
            <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-3">
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
          )}
        </div>

        {/* Right 5 Columns: Selected Project Multi-Judge Detailed Breakdown */}
        <div className="lg:col-span-5 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-5 flex flex-col justify-between">
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

