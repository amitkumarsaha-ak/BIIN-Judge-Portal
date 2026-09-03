import React, { useState, useMemo, useCallback } from 'react';
import {
  Users, Plus, Search, Pencil, Trash2, DoorOpen,
  Check, X, UserCheck, KeyRound
} from 'lucide-react';
import type { User, Room } from '../../types';
import {
  getJudges, saveUser, updateUser, deleteUser,
  getRooms, getEvaluationsByJudge, assignJudgeToRoom
} from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

const EMPTY_JUDGE_FORM: Omit<User, 'id' | 'createdAt'> = {
  fullName: '',
  email: '',
  password: 'password123',
  role: 'judge',
  roomNumber: 'Room 01'
};

// --- JUDGE FORM MODAL ---
interface JudgeFormModalProps {
  mode: 'add' | 'edit';
  initialData: Omit<User, 'id' | 'createdAt'> & { id?: string };
  rooms: Room[];
  onClose: () => void;
  onSave: (data: User) => void;
}

const JudgeFormModal: React.FC<JudgeFormModalProps> = ({ mode, initialData, rooms, onClose, onSave }) => {
  const [form, setForm] = useState({ ...initialData });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.email.trim()) errs.email = 'Email address is required.';
    if (!form.password || form.password.length < 4) errs.password = 'Password must be at least 4 characters.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const user: User = {
      ...form,
      id: form.id || `judge-${Date.now()}`,
      role: 'judge',
      createdAt: (form as User).createdAt || new Date().toISOString()
    };
    onSave(user);
  };

  const inputCls = (field: string) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all bg-slate-50 dark:bg-slate-950/60 ${errors[field] ? 'border-red-400 focus:ring-red-500/30' : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              {mode === 'add' ? <Plus className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                {mode === 'add' ? 'Add New Judge' : 'Edit Judge Details'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure credentials & room assignment</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Full Name *
            </label>
            <input
              className={inputCls('fullName')}
              value={form.fullName}
              onChange={e => {
                setForm(prev => ({ ...prev, fullName: e.target.value }));
                if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
              }}
              placeholder="e.g. Dr. Kazi Rahman"
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              className={inputCls('email')}
              value={form.email}
              onChange={e => {
                setForm(prev => ({ ...prev, email: e.target.value }));
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
              placeholder="e.g. judge.rahman@biin.org"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Password *
            </label>
            <input
              type="text"
              className={inputCls('password')}
              value={form.password}
              onChange={e => {
                setForm(prev => ({ ...prev, password: e.target.value }));
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
              }}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Assigned Room
            </label>
            <select
              className={inputCls('roomNumber')}
              value={form.roomNumber || ''}
              onChange={e => setForm(prev => ({ ...prev, roomNumber: e.target.value }))}
            >
              <option value="">-- Unassigned --</option>
              {rooms.map(r => (
                <option key={r.id} value={r.roomNumber}>
                  {r.roomNumber} — {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center space-x-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-lg"
          >
            <Check className="h-4 w-4" />
            <span>{mode === 'add' ? 'Create Judge' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN ADMIN JUDGES VIEW ---
export const AdminJudgesView: React.FC = () => {
  const { currentUser } = useAuth();
  const [judges, setJudges] = useState<User[]>(() => getJudges());
  const [rooms, setRooms] = useState<Room[]>(() => getRooms());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoom, setFilterRoom] = useState<string>('All');

  const [formModal, setFormModal] = useState<{ mode: 'add' | 'edit'; data: Omit<User, 'id' | 'createdAt'> & { id?: string } } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const refresh = useCallback(() => {
    setJudges(getJudges());
    setRooms(getRooms());
  }, []);

  const roomOptions = useMemo(() => {
    const list = Array.from(new Set(rooms.map(r => r.roomNumber)));
    return ['All', ...list.sort(), 'Unassigned'];
  }, [rooms]);

  const filteredJudges = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return judges.filter(j => {
      if (filterRoom !== 'All') {
        if (filterRoom === 'Unassigned') {
          if (j.roomNumber && j.roomNumber.trim()) return false;
        } else if (j.roomNumber !== filterRoom) {
          return false;
        }
      }
      if (q) {
        const hay = [j.fullName, j.email, j.roomNumber || ''].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [judges, searchQuery, filterRoom]);

  const handleSave = (user: User) => {
    const actor = currentUser ? { email: currentUser.email, name: currentUser.fullName } : undefined;
    if (formModal?.mode === 'add') {
      saveUser(user, actor);
    } else {
      updateUser(user, actor);
    }
    refresh();
    setFormModal(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const actor = currentUser ? { email: currentUser.email, name: currentUser.fullName } : undefined;
    deleteUser(deleteTarget.id, actor);
    refresh();
    setDeleteTarget(null);
  };

  const handleQuickRoomAssign = (judgeEmail: string, roomNumber: string) => {
    const actor = currentUser ? { email: currentUser.email, name: currentUser.fullName } : undefined;
    assignJudgeToRoom(judgeEmail, roomNumber, actor);
    refresh();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Modals */}
      {formModal && (
        <JudgeFormModal
          mode={formModal.mode}
          initialData={formModal.data}
          rooms={rooms}
          onClose={() => setFormModal(null)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Delete Judge Account?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to remove <strong>{deleteTarget.fullName} ({deleteTarget.email})</strong>?
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
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-blue-50 dark:bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 mb-2">
            <Users className="h-3.5 w-3.5" />
            <span>Judge Personas & Permissions</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Judge Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create and manage judge credentials, assign judges to evaluation rooms, and monitor evaluation progress.
          </p>
        </div>

        <button
          id="admin-add-judge-btn"
          onClick={() => setFormModal({ mode: 'add', data: { ...EMPTY_JUDGE_FORM } })}
          className="btn-primary inline-flex items-center space-x-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-xl shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Judge</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 h-full w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by judge name, email, or room..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filterRoom}
          onChange={e => setFilterRoom(e.target.value)}
          className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
        >
          {roomOptions.map(r => (
            <option key={r} value={r}>
              {r === 'All' ? 'All Rooms' : r}
            </option>
          ))}
        </select>
      </div>

      {/* Judges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJudges.map(judge => {
          const evals = getEvaluationsByJudge(judge.email);
          const hasRoom = Boolean(judge.roomNumber && judge.roomNumber.trim());

          let avgGiven = 0;
          if (evals.length > 0) {
            const sum = evals.reduce((a, c) => a + (c.convertedScore ?? c.percentage ?? 0), 0);
            avgGiven = Number((sum / evals.length).toFixed(1));
          }

          return (
            <div
              key={judge.id}
              className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-md space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-500/30">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white leading-tight">{judge.fullName}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{judge.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setFormModal({ mode: 'edit', data: { ...judge } })}
                      title="Edit Judge"
                      className="rounded-lg p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(judge)}
                      title="Delete Judge"
                      className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Credentials reminder & Room Assignment */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${hasRoom ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20'}`}>
                    <DoorOpen className="h-3 w-3" />
                    <span>{hasRoom ? judge.roomNumber : 'Unassigned Room'}</span>
                  </span>

                  <span className="inline-flex items-center space-x-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    <KeyRound className="h-3 w-3" />
                    <span>{judge.password || '••••••••'}</span>
                  </span>
                </div>
              </div>

              {/* Evaluation stats & Quick Room Switch */}
              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500">Evaluations</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{evals.length}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500">Avg Given</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{avgGiven > 0 ? `${avgGiven}` : 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <label className="text-[11px] text-slate-500 shrink-0">Room:</label>
                  <select
                    value={judge.roomNumber || ''}
                    onChange={e => handleQuickRoomAssign(judge.email, e.target.value)}
                    className="flex-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.roomNumber}>{r.roomNumber}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
