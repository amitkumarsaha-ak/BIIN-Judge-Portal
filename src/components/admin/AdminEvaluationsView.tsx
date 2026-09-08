import React, { useState, useMemo, useCallback } from 'react';
import {
  CheckSquare, Search, Trash2, Pencil,
  Check, X, AlertCircle, Printer, Calendar,
  Filter
} from 'lucide-react';
import type { Evaluation, Project, User, ApplicationType, HeadCategoryCode } from '../../types';
import {
  getEvaluations, getProjects, getJudges, deleteEvaluation,
  saveEvaluation
} from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import {
  getMaxRawScoreForApplicationType,
  getCriteriaForApplicationType,
  formatScoreNumber,
  calculateConvertedScore
} from '../../utils/evaluation';
import { HEAD_CATEGORIES } from '../../data/mockData';

// --- EVALUATION EDIT MODAL ---
interface EvaluationEditModalProps {
  evaluation: Evaluation;
  project?: Project;
  onClose: () => void;
  onSave: (updated: Evaluation) => void;
}

const EvaluationEditModal: React.FC<EvaluationEditModalProps> = ({ evaluation, project, onClose, onSave }) => {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    Object.entries(evaluation.scores).forEach(([k, v]) => {
      if (typeof v === 'number') initial[k] = v;
    });
    return initial;
  });
  const [feedback, setFeedback] = useState(evaluation.feedback || '');
  const [error, setError] = useState<string | null>(null);

  const criteria = project
    ? getCriteriaForApplicationType(project.applicationType)
    : [];

  const handleScoreChange = (key: string, val: number) => {
    setScores(prev => ({ ...prev, [key]: val }));
    setError(null);
  };

  const handleSave = () => {
    for (const [k, v] of Object.entries(scores)) {
      if (typeof v !== 'number' || isNaN(v) || v < 1 || v > 10) {
        setError(`Score for "${k}" must be between 1 and 10.`);
        return;
      }
    }

    const rawTotal = Object.values(scores).reduce((a, b) => a + (b || 0), 0);
    const maxRaw = evaluation.maxRawScore || (project ? getMaxRawScoreForApplicationType(project.applicationType) : 50);
    const convertedScore = Number(((rawTotal / maxRaw) * 100).toFixed(1));

    const updated: Evaluation = {
      ...evaluation,
      scores,
      feedback,
      rawTotalScore: rawTotal,
      maxRawScore: maxRaw,
      convertedScore,
      totalScore: rawTotal,
      percentage: convertedScore,
      updatedAt: new Date().toISOString()
    };

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Admin Evaluation Override</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Editing submission by {evaluation.judgeName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {error && (
            <div className="flex items-center space-x-2 rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-xs text-red-600 border border-red-200 dark:border-red-500/30">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Criterion Scores (1 – 10)</p>
            {criteria.map((crit) => {
              const val = scores[crit.key] ?? 0;
              return (
                <div key={crit.key} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{crit.label}</span>
                    <p className="text-[10px] text-slate-400">Max: 10</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={val}
                    onChange={e => handleScoreChange(crit.key, Number(e.target.value))}
                    className="w-16 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2 py-1 text-center font-bold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Judge Feedback / Comments
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-none"
              placeholder="Enter optional evaluator notes..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center space-x-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-lg"
          >
            <Check className="h-4 w-4" />
            <span>Save Evaluation</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN ADMIN EVALUATIONS VIEW ---
export const AdminEvaluationsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>(() => getEvaluations());
  const [projects, setProjects] = useState<Project[]>(() => getProjects());
  const [judges, setJudges] = useState<User[]>(() => getJudges());

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ApplicationType | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState<HeadCategoryCode | 'All'>('All');
  const [filterJudge, setFilterJudge] = useState('All');

  const [editTarget, setEditTarget] = useState<Evaluation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Evaluation | null>(null);

  const refresh = useCallback(() => {
    setEvaluations(getEvaluations());
    setProjects(getProjects());
    setJudges(getJudges());
  }, []);

  // Filter projects by Application Type, Head Category and Search Query
  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return projects.filter(p => {
      if (filterType !== 'All' && p.applicationType !== filterType) return false;
      if (filterCategory !== 'All' && p.headCategory !== filterCategory) return false;
      if (q) {
        const hay = [
          p.title,
          p.applicationId,
          p.projectCode,
          p.teamOrOrgName,
          p.representativeName,
          p.description
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [projects, filterType, filterCategory, searchQuery]);

  // Group evaluations per project
  const projectEvaluationGroups = useMemo(() => {
    return filteredProjects.map(proj => {
      let evals = evaluations.filter(e => e.projectId === proj.id);
      if (filterJudge !== 'All') {
        evals = evals.filter(e => e.judgeEmail.toLowerCase() === filterJudge.toLowerCase());
      }

      const maxRaw = getMaxRawScoreForApplicationType(proj.applicationType);
      const criteria = getCriteriaForApplicationType(proj.applicationType);

      let averageConverted = 0;
      if (evals.length > 0) {
        const sum = evals.reduce((acc, e) => {
          const raw = e.rawTotalScore ?? e.totalScore ?? 0;
          const conv = e.convertedScore ?? e.percentage ?? calculateConvertedScore(raw, maxRaw);
          return acc + conv;
        }, 0);
        averageConverted = Number((sum / evals.length).toFixed(1));
      }

      return {
        project: proj,
        evaluations: evals,
        maxRaw,
        criteria,
        averageConverted
      };
    });
  }, [filteredProjects, evaluations, filterJudge]);

  const handleSaveEdit = (updated: Evaluation) => {
    const actor = currentUser ? { email: currentUser.email, name: currentUser.fullName } : undefined;
    saveEvaluation(updated, actor);
    refresh();
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const actor = currentUser ? { email: currentUser.email, name: currentUser.fullName } : undefined;
    deleteEvaluation(deleteTarget.id, actor);
    refresh();
    setDeleteTarget(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalEvaluationsCount = evaluations.length;

  return (
    <div className="space-y-6 pb-12 print:p-0">
      {/* Printable CSS Rules */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print-card {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin-bottom: 1.5rem !important;
          }
        }
      `}</style>

      {/* Modals */}
      {editTarget && (
        <EvaluationEditModal
          evaluation={editTarget}
          project={projects.find(p => p.id === editTarget.projectId)}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Delete Evaluation Submission?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to permanently delete this score submitted by <strong>{deleteTarget.judgeName}</strong> ({deleteTarget.convertedScore}/100)?
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white shadow-lg"
              >
                Delete Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-50 dark:bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 mb-2">
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Master Submissions Engine</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Evaluation Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Filter by Application Type and Head Category to view all project evaluations, criteria scores, and averages.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 no-print">
          <button
            onClick={handlePrint}
            className="btn-primary inline-flex items-center space-x-2 rounded-2xl px-5 py-3 text-xs font-bold text-white shadow-xl hover:scale-105 transition-transform"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF</span>
          </button>
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2.5 text-center">
            <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Total Submissions</p>
            <p className="font-heading text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalEvaluationsCount}</p>
          </div>
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
            placeholder="Search by project, participant, or code..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter by Application Type */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as ApplicationType | 'All')}
          className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
        >
          <option value="All">All Application Types</option>
          <option value="Student">Student</option>
          <option value="Student-Tertiary">Student-Tertiary Categories (University Level)</option>
          <option value="Organisation">Organisation</option>
          <option value="Individual or Group">Individual or Group</option>
        </select>

        {/* Filter by Head Category */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as HeadCategoryCode | 'All')}
          className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
        >
          <option value="All">All Head Categories</option>
          {HEAD_CATEGORIES.map(hc => (
            <option key={hc.code} value={hc.code}>
              {hc.code} — {hc.name}
            </option>
          ))}
        </select>

        {/* Filter by Judge */}
        <select
          value={filterJudge}
          onChange={e => setFilterJudge(e.target.value)}
          className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
        >
          <option value="All">All Judges</option>
          {judges.map(j => (
            <option key={j.email} value={j.email}>{j.fullName}</option>
          ))}
        </select>
      </div>

      {/* Active Filter Indicators */}
      {(filterType !== 'All' || filterCategory !== 'All') && (
        <div className="no-print flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <Filter className="h-4 w-4 text-emerald-600" />
          <span>Active View:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {filterType !== 'All' ? filterType : 'All Types'}
          </span>
          <span>→</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {filterCategory !== 'All' ? (HEAD_CATEGORIES.find(c => c.code === filterCategory)?.name || filterCategory) : 'All Categories'}
          </span>
          <span className="text-slate-400">({filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} matching)</span>
        </div>
      )}

      {/* Projects and Evaluation Submissions List */}
      <div className="space-y-6">
        {projectEvaluationGroups.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500">
            <CheckSquare className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No projects found for selected filters</h3>
            <p className="text-xs mt-1">Try selecting a different Application Type or Head Category.</p>
          </div>
        ) : (
          projectEvaluationGroups.map(({ project, evaluations: projEvals, maxRaw, criteria, averageConverted }) => {
            const hasEvals = projEvals.length > 0;

            return (
              <div
                key={project.id}
                className="print-card print-break-inside-avoid glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4"
              >
                {/* Project Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                        {project.applicationId}
                      </span>
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {project.applicationType}
                      </span>
                      <span className="rounded-md bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 px-2.5 py-0.5 text-xs font-semibold">
                        {project.headCategory}
                      </span>
                    </div>

                    <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Team / Organization: <strong className="text-slate-700 dark:text-slate-300">{project.teamOrOrgName}</strong> · Lead: {project.representativeName}
                    </p>
                  </div>

                  {/* Project Average Converted Mark */}
                  <div className="flex items-center space-x-3 sm:text-right shrink-0">
                    <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/50 p-3 text-center sm:text-right">
                      <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                        Project Average
                      </p>
                      <p className="font-heading text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        {hasEvals ? `${averageConverted} / 100` : 'No Evals'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {projEvals.length} Judge evaluation{projEvals.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Judge Evaluations List */}
                {!hasEvals ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                    No judge evaluations submitted yet for this project.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projEvals.map((e, idx) => {
                      const rawScore = e.rawTotalScore ?? e.totalScore ?? 0;
                      const converted = e.convertedScore ?? e.percentage ?? calculateConvertedScore(rawScore, maxRaw);

                      return (
                        <div
                          key={e.id}
                          className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/50 p-4 space-y-3"
                        >
                          {/* Judge Persona & Total Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800/60">
                            <div className="flex items-center space-x-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                J{idx + 1}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white text-xs">
                                  {e.judgeName}
                                </p>
                                <p className="text-[11px] text-slate-500 font-mono">{e.judgeEmail}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 shrink-0">
                              {/* Raw Score */}
                              <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Raw Total</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                                  {formatScoreNumber(rawScore)} / {maxRaw}
                                </span>
                              </div>

                              {/* Converted Score */}
                              <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Converted</span>
                                <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                                  {formatScoreNumber(converted)} / 100
                                </span>
                              </div>

                              {/* Action Buttons (No-print) */}
                              <div className="no-print flex items-center space-x-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                                <button
                                  onClick={() => setEditTarget(e)}
                                  title="Edit Evaluation"
                                  className="rounded-lg p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(e)}
                                  title="Delete Submission"
                                  className="rounded-lg p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Individual Criteria Scores Matrix */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
                            {criteria.map((crit) => {
                              const mark = e.scores[crit.key] ?? 0;
                              return (
                                <div
                                  key={crit.key}
                                  className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 text-center"
                                >
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={crit.label}>
                                    {crit.label}
                                  </p>
                                  <p className="font-heading font-black text-sm text-slate-900 dark:text-white mt-0.5 font-mono">
                                    {formatScoreNumber(mark)} <span className="text-[10px] text-slate-400">/ 10</span>
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          {/* Judge Feedback & Submission Timestamp */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 pt-1">
                            {e.feedback ? (
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                                <strong className="text-slate-500 not-italic font-semibold">Feedback:</strong> "{e.feedback}"
                              </p>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No comments provided.</span>
                            )}

                            <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1 shrink-0">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(e.submittedAt).toLocaleDateString()} {new Date(e.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

