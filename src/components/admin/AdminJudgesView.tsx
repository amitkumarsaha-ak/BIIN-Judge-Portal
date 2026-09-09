import React, { useState, useMemo, useCallback } from 'react';
import {
  Users, Search, Check, X, UserCheck, Clock, XCircle,
  ShieldCheck, Mail, Calendar, UserX, Trash2
} from 'lucide-react';
import type { User, JudgeStatus } from '../../types';
import { getJudges, approveJudge, rejectJudge, deleteUser } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

export const AdminJudgesView: React.FC = () => {
  const { currentUser } = useAuth();
  const [judges, setJudges] = useState<User[]>(() => getJudges());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | JudgeStatus>('all');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const refresh = useCallback(() => {
    setJudges(getJudges());
  }, []);

  const counts = useMemo(() => {
    return {
      all: judges.length,
      pending: judges.filter(j => (j.status || 'approved') === 'pending').length,
      approved: judges.filter(j => (j.status || 'approved') === 'approved').length,
      rejected: judges.filter(j => j.status === 'rejected').length
    };
  }, [judges]);

  const filteredJudges = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return judges.filter(judge => {
      const judgeStatus = judge.status || 'approved';
      if (statusFilter !== 'all' && judgeStatus !== statusFilter) {
        return false;
      }
      if (q) {
        const text = `${judge.fullName} ${judge.email}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [judges, statusFilter, searchQuery]);

  const handleApprove = (judge: User) => {
    const actor = currentUser ? { email: currentUser.email, name: currentUser.fullName } : undefined;
    approveJudge(judge.id, actor);
    refresh();
    setActionFeedback(`Approved access for judge "${judge.fullName}". They can now log in.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleReject = (judge: User) => {
    const actor = currentUser ? { email: currentUser.email, name: currentUser.fullName } : undefined;
    rejectJudge(judge.id, actor);
    refresh();
    setActionFeedback(`Declined access for judge "${judge.fullName}". Login access is denied.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const actor = currentUser ? { email: currentUser.email, name: currentUser.fullName } : undefined;
    deleteUser(deleteTarget.id, actor);
    refresh();
    setDeleteTarget(null);
    setActionFeedback(`Removed judge record for "${deleteTarget.fullName}".`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const formatRegDate = (isoString?: string) => {
    if (!isoString) return 'Pre-seeded / N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Delete Judge Record?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to completely remove <strong>{deleteTarget.fullName}</strong> ({deleteTarget.email}) from the system?
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white shadow-lg transition-colors"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-violet-50 dark:bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Administrator Access Control</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Judge Registration Approval
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review self-registered judge requests, approve or reject portal access, and manage judge accounts.
          </p>
        </div>

        {/* Quick Stat Counter Cards */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-center border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{counts.all}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2 text-center border border-amber-200 dark:border-amber-700/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending</p>
            <p className="text-sm font-extrabold text-amber-700 dark:text-amber-300">{counts.pending}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 text-center border border-emerald-200 dark:border-emerald-700/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Approved</p>
            <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">{counts.approved}</p>
          </div>
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2 text-center border border-rose-200 dark:border-rose-700/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Rejected</p>
            <p className="text-sm font-extrabold text-rose-700 dark:text-rose-300">{counts.rejected}</p>
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="flex items-center space-x-2 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 animate-in fade-in slide-in-from-top-1">
          <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 h-full w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by judge name or email address..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => {
            const count = counts[tab];
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Registrations List */}
      {filteredJudges.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center space-y-3 bg-white/50 dark:bg-slate-900/50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-sm font-bold text-slate-700 dark:text-slate-300">No Judges Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No registered judges match the search term "${searchQuery}".`
              : `No judge accounts currently match the filter "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJudges.map(judge => {
            const status: JudgeStatus = judge.status || 'approved';

            return (
              <div
                key={judge.id}
                className={`glass-panel rounded-3xl border p-5 shadow-sm transition-all space-y-4 flex flex-col justify-between bg-white dark:bg-slate-900 ${
                  status === 'pending'
                    ? 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/20'
                    : status === 'rejected'
                    ? 'border-rose-200 dark:border-rose-900/40 opacity-80'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Icon + Name + Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold border ${
                        status === 'approved'
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                          : status === 'pending'
                          ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                          : 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                      }`}>
                        {status === 'approved' ? (
                          <UserCheck className="h-5 w-5" />
                        ) : status === 'pending' ? (
                          <Clock className="h-5 w-5" />
                        ) : (
                          <UserX className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white leading-tight truncate">
                          {judge.fullName}
                        </h4>
                        <div className="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{judge.email}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setDeleteTarget(judge)}
                      title="Delete record"
                      className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Status & Registration Date Badges */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Account Status:</span>
                      <span className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                        status === 'approved'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                          : status === 'pending'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700'
                      }`}>
                        {status === 'approved' && <Check className="h-3 w-3" />}
                        {status === 'pending' && <Clock className="h-3 w-3" />}
                        {status === 'rejected' && <XCircle className="h-3 w-3" />}
                        <span className="capitalize">{status}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Registered:</span>
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {formatRegDate(judge.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  {status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(judge)}
                        className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 px-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-colors min-h-[40px]"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(judge)}
                        className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 px-3 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition-colors min-h-[40px]"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {status === 'approved' && (
                    <button
                      onClick={() => handleReject(judge)}
                      className="w-full flex items-center justify-center space-x-1.5 rounded-xl border border-rose-300 dark:border-rose-700/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 py-2.5 px-3 text-xs font-semibold transition-colors min-h-[40px]"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Revoke / Reject Access</span>
                    </button>
                  )}

                  {status === 'rejected' && (
                    <button
                      onClick={() => handleApprove(judge)}
                      className="w-full flex items-center justify-center space-x-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 py-2.5 px-3 text-xs font-semibold transition-colors min-h-[40px]"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Re-Approve Access</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
