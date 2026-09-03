import React, { useState, useMemo, useCallback } from 'react';
import {
  CheckSquare, Search, Trash2, Pencil,
  Check, X, AlertCircle
} from 'lucide-react';
import type { Evaluation, Project, User } from '../../types';
import {
  getEvaluations, getProjects, getJudges, deleteEvaluation,
  saveEvaluation
} from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { getMaxRawScoreForApplicationType } from '../../utils/evaluation';

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

  const handleScoreChange = (key: string, val: number) => {
    setScores(prev => ({ ...prev, [key]: val }));
    setError(null);
  };

  const handleSave = () => {
    // Validate scores are 1-10
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
            {Object.entries(scores).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={val}
                  onChange={e => handleScoreChange(key, Number(e.target.value))}
                  className="w-16 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2 py-1 text-center font-bold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            ))}
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
  const [filterJudge, setFilterJudge] = useState('All');
  const [filterRoom, setFilterRoom] = useState('All');

  const [editTarget, setEditTarget] = useState<Evaluation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Evaluation | null>(null);

  const refresh = useCallback(() => {
    setEvaluations(getEvaluations());
    setProjects(getProjects());
    setJudges(getJudges());
  }, []);

  const roomList = useMemo(() => {
    const list = Array.from(new Set(projects.map(p => p.roomNumber).filter(Boolean)));
    return ['All', ...list.sort()];
  }, [projects]);

  const filteredEvaluations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return evaluations.filter(e => {
      if (filterJudge !== 'All' && e.judgeEmail.toLowerCase() !== filterJudge.toLowerCase()) {
        return false;
      }
      const proj = projects.find(p => p.id === e.projectId);
      if (filterRoom !== 'All' && proj?.roomNumber !== filterRoom && e.roomNumber !== filterRoom) {
        return false;
      }
      if (q) {
        const hay = [
          e.judgeName,
          e.judgeEmail,
          proj?.title || '',
          proj?.applicationId || '',
          e.feedback || ''
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [evaluations, projects, filterJudge, filterRoom, searchQuery]);

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

  return (
    <div className="space-y-6 pb-12">
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
            Review all scores submitted across all judges and rooms. Edit marks, inspect individual criterion scores, and purge invalid submissions.
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 text-center shrink-0">
          <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Total Submissions</p>
          <p className="font-heading text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{evaluations.length}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 h-full w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by project, judge name, or feedback..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={filterJudge}
          onChange={e => setFilterJudge(e.target.value)}
          className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="All">All Judges</option>
          {judges.map(j => (
            <option key={j.email} value={j.email}>{j.fullName}</option>
          ))}
        </select>

        <select
          value={filterRoom}
          onChange={e => setFilterRoom(e.target.value)}
          className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          {roomList.map(r => (
            <option key={r} value={r}>{r === 'All' ? 'All Rooms' : r}</option>
          ))}
        </select>
      </div>

      {/* Evaluation Submissions Table */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
        {filteredEvaluations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckSquare className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No evaluations found</h3>
            <p className="text-xs mt-1">Try adjusting search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-950/80 uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Project & Code</th>
                  <th className="px-4 py-3.5">Judge Persona</th>
                  <th className="px-4 py-3.5">Room</th>
                  <th className="px-4 py-3.5 text-center">Raw Score</th>
                  <th className="px-4 py-3.5 text-center">Converted / 100</th>
                  <th className="px-4 py-3.5">Submitted</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filteredEvaluations.map(e => {
                  const proj = projects.find(p => p.id === e.projectId);
                  const rawScore = e.rawTotalScore ?? e.totalScore ?? 0;
                  const maxRaw = e.maxRawScore || 50;
                  const converted = e.convertedScore ?? e.percentage ?? 0;

                  return (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{proj?.title || 'Unknown Project'}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{proj?.applicationId} · {proj?.applicationType}</p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{e.judgeName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{e.judgeEmail}</p>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-md bg-cyan-50 dark:bg-cyan-500/10 px-2 py-0.5 font-mono font-bold text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
                          {proj?.roomNumber || e.roomNumber || 'Room 01'}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {rawScore.toFixed(1)} / {maxRaw}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-mono">
                          {converted.toFixed(1)}%
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-500 font-mono text-[11px]">
                        {new Date(e.submittedAt).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setEditTarget(e)}
                            title="Edit Evaluation"
                            className="rounded-lg p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(e)}
                            title="Delete Submission"
                            className="rounded-lg p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
