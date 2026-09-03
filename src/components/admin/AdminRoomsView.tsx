import React, { useState, useMemo, useCallback } from 'react';
import {
  DoorOpen, Plus, Search, Pencil, Trash2, Users,
  FolderGit2, Check, X, MapPin, Eye
} from 'lucide-react';
import type { Room, Project, User } from '../../types';
import {
  getRooms, addRoom, updateRoom, deleteRoom,
  getProjects, getJudges, assignProjectToRoom,
  assignJudgeToRoom, removeProjectFromRoom
} from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

const EMPTY_ROOM_FORM: Omit<Room, 'id' | 'createdAt'> = {
  roomNumber: '',
  name: '',
  location: '',
  capacity: 10,
  description: ''
};

// --- ROOM FORM MODAL ---
interface RoomFormModalProps {
  mode: 'add' | 'edit';
  initialData: Omit<Room, 'id' | 'createdAt'> & { id?: string };
  onClose: () => void;
  onSave: (data: Room) => void;
}

const RoomFormModal: React.FC<RoomFormModalProps> = ({ mode, initialData, onClose, onSave }) => {
  const [form, setForm] = useState({ ...initialData });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.roomNumber.trim()) errs.roomNumber = 'Room number / identifier is required.';
    if (!form.name.trim()) errs.name = 'Room name is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const room: Room = {
      ...form,
      id: form.id || `room-${Date.now()}`,
      createdAt: (form as Room).createdAt || new Date().toISOString()
    };
    onSave(room);
  };

  const inputCls = (field: string) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all bg-slate-50 dark:bg-slate-950/60 ${errors[field] ? 'border-red-400 focus:ring-red-500/30' : 'border-slate-300 dark:border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20'}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
              {mode === 'add' ? <Plus className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                {mode === 'add' ? 'Add New Judging Room' : 'Edit Judging Room'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure room details & location</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Room Identifier *
            </label>
            <input
              className={inputCls('roomNumber')}
              value={form.roomNumber}
              onChange={e => {
                setForm(prev => ({ ...prev, roomNumber: e.target.value }));
                if (errors.roomNumber) setErrors(prev => ({ ...prev, roomNumber: '' }));
              }}
              placeholder="e.g. Room 06, Hall A"
            />
            {errors.roomNumber && <p className="mt-1 text-xs text-red-500">{errors.roomNumber}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Room Title / Domain *
            </label>
            <input
              className={inputCls('name')}
              value={form.name}
              onChange={e => {
                setForm(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Room 06 — AI & Big Data Arena"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Location / Floor
              </label>
              <input
                className={inputCls('location')}
                value={form.location || ''}
                onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Building C, 3rd Fl"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Capacity (People)
              </label>
              <input
                type="number"
                className={inputCls('capacity')}
                value={form.capacity || 10}
                onChange={e => setForm(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Description
            </label>
            <textarea
              className={`${inputCls('description')} resize-none`}
              rows={3}
              value={form.description || ''}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the room focus or facilities..."
            />
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
            <span>{mode === 'add' ? 'Create Room' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ROOM INSPECT MODAL ---
interface RoomInspectModalProps {
  room: Room;
  assignedProjects: Project[];
  assignedJudges: User[];
  allProjects: Project[];
  allJudges: User[];
  onClose: () => void;
  onRefresh: () => void;
}

const RoomInspectModal: React.FC<RoomInspectModalProps> = ({
  room,
  assignedProjects,
  assignedJudges,
  allProjects,
  allJudges,
  onClose,
  onRefresh
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'projects' | 'judges'>('projects');
  const [selectedAddProjectId, setSelectedAddProjectId] = useState('');
  const [selectedAddJudgeEmail, setSelectedAddJudgeEmail] = useState('');

  const availableProjects = allProjects.filter(p => p.roomNumber !== room.roomNumber);
  const availableJudges = allJudges.filter(j => j.roomNumber !== room.roomNumber);

  const handleAddProject = () => {
    if (!selectedAddProjectId) return;
    assignProjectToRoom(selectedAddProjectId, room.roomNumber);
    setSelectedAddProjectId('');
    onRefresh();
  };

  const handleRemoveProject = (id: string) => {
    removeProjectFromRoom(id);
    onRefresh();
  };

  const handleAddJudge = () => {
    if (!selectedAddJudgeEmail) return;
    assignJudgeToRoom(selectedAddJudgeEmail, room.roomNumber);
    setSelectedAddJudgeEmail('');
    onRefresh();
  };

  const handleRemoveJudge = (email: string) => {
    assignJudgeToRoom(email, '');
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
              <DoorOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold rounded-md bg-cyan-100 dark:bg-cyan-500/20 px-2 py-0.5 text-cyan-800 dark:text-cyan-300">
                  {room.roomNumber}
                </span>
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white leading-tight">{room.name}</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{room.location || 'Main Venue'} · Capacity: {room.capacity || 10}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 space-x-4">
          <button
            onClick={() => setActiveSubTab('projects')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors ${activeSubTab === 'projects' ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <FolderGit2 className="h-4 w-4" />
            <span>Assigned Projects ({assignedProjects.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('judges')}
            className={`pb-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors ${activeSubTab === 'judges' ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
          >
            <Users className="h-4 w-4" />
            <span>Assigned Judges ({assignedJudges.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {activeSubTab === 'projects' ? (
            <div className="space-y-4">
              {/* Quick Add Project dropdown */}
              <div className="flex gap-2">
                <select
                  value={selectedAddProjectId}
                  onChange={e => setSelectedAddProjectId(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Select project to assign to this room --</option>
                  {availableProjects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.applicationId}) - Currently: {p.roomNumber || 'Unassigned'}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddProject}
                  disabled={!selectedAddProjectId}
                  className="btn-primary rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50"
                >
                  Assign
                </button>
              </div>

              {/* Projects list */}
              {assignedProjects.length === 0 ? (
                <div className="text-center py-8 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-300 dark:border-slate-800">
                  <p className="text-xs text-slate-500">No projects currently assigned to this room.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedProjects.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3 text-xs"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{p.applicationId} · {p.teamOrOrgName} · {p.applicationType}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveProject(p.id)}
                        className="rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-2.5 py-1 text-[11px] font-semibold hover:bg-red-100 transition-colors shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick Add Judge dropdown */}
              <div className="flex gap-2">
                <select
                  value={selectedAddJudgeEmail}
                  onChange={e => setSelectedAddJudgeEmail(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Select judge to assign to this room --</option>
                  {availableJudges.map(j => (
                    <option key={j.email} value={j.email}>
                      {j.fullName} ({j.email}) - Currently: {j.roomNumber || 'Unassigned'}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddJudge}
                  disabled={!selectedAddJudgeEmail}
                  className="btn-primary rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50"
                >
                  Assign
                </button>
              </div>

              {/* Judges list */}
              {assignedJudges.length === 0 ? (
                <div className="text-center py-8 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-300 dark:border-slate-800">
                  <p className="text-xs text-slate-500">No judges currently assigned to this room.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedJudges.map(j => (
                    <div
                      key={j.email}
                      className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3 text-xs"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{j.fullName}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{j.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveJudge(j.email)}
                        className="rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 px-2.5 py-1 text-[11px] font-semibold hover:bg-red-100 transition-colors shrink-0"
                      >
                        Unassign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN ADMIN ROOMS VIEW ---
export const AdminRoomsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState<Room[]>(() => getRooms());
  const [projects, setProjects] = useState<Project[]>(() => getProjects());
  const [judges, setJudges] = useState<User[]>(() => getJudges());
  const [searchQuery, setSearchQuery] = useState('');

  const [formModal, setFormModal] = useState<{ mode: 'add' | 'edit'; data: Omit<Room, 'id' | 'createdAt'> & { id?: string } } | null>(null);
  const [inspectTarget, setInspectTarget] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  const refresh = useCallback(() => {
    setRooms(getRooms());
    setProjects(getProjects());
    setJudges(getJudges());
  }, []);

  const filteredRooms = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return rooms;
    return rooms.filter(r =>
      r.roomNumber.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      (r.location || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
    );
  }, [rooms, searchQuery]);

  const handleSave = (room: Room) => {
    const actor = currentUser ? { email: currentUser.email, name: currentUser.fullName } : undefined;
    if (formModal?.mode === 'add') {
      addRoom(room, actor);
    } else {
      updateRoom(room, actor);
    }
    refresh();
    setFormModal(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const actor = currentUser ? { email: currentUser.email, name: currentUser.fullName } : undefined;
    deleteRoom(deleteTarget.id, actor);
    refresh();
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Modals */}
      {formModal && (
        <RoomFormModal
          mode={formModal.mode}
          initialData={formModal.data}
          onClose={() => setFormModal(null)}
          onSave={handleSave}
        />
      )}

      {inspectTarget && (
        <RoomInspectModal
          room={inspectTarget}
          assignedProjects={projects.filter(p => (p.roomNumber || '').toLowerCase().trim() === inspectTarget.roomNumber.toLowerCase().trim())}
          assignedJudges={judges.filter(j => j.roomNumber?.toLowerCase().trim() === inspectTarget.roomNumber.toLowerCase().trim())}
          allProjects={projects}
          allJudges={judges}
          onClose={() => setInspectTarget(null)}
          onRefresh={refresh}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 p-6 space-y-4 shadow-2xl">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Delete Judging Room?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <strong>{deleteTarget.roomNumber} ({deleteTarget.name})</strong>? All projects and judges currently in this room will be unassigned automatically.
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
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-cyan-50 dark:bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 mb-2">
            <DoorOpen className="h-3.5 w-3.5" />
            <span>Judging Arenas & Locations</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Room Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, edit, and configure evaluation rooms. Inspect and assign nominated projects and judges to specific arenas.
          </p>
        </div>

        <button
          id="admin-add-room-btn"
          onClick={() => setFormModal({ mode: 'add', data: { ...EMPTY_ROOM_FORM, roomNumber: `Room 0${rooms.length + 1}` } })}
          className="btn-primary inline-flex items-center space-x-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-xl shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Room</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 h-full w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by room name, identifier, or location..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <span className="text-xs font-mono font-bold text-slate-500 pr-2">
          {filteredRooms.length} Room{filteredRooms.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map(room => {
          const assignedProj = projects.filter(p => (p.roomNumber || '').toLowerCase().trim() === room.roomNumber.toLowerCase().trim());
          const assignedJdg = judges.filter(j => j.roomNumber?.toLowerCase().trim() === room.roomNumber.toLowerCase().trim());

          return (
            <div
              key={room.id}
              className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md hover:shadow-xl transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center rounded-xl bg-cyan-50 dark:bg-cyan-500/20 px-3 py-1 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                    {room.roomNumber}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setFormModal({ mode: 'edit', data: { ...room } })}
                      title="Edit Room"
                      className="rounded-lg p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(room)}
                      title="Delete Room"
                      className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white leading-snug">{room.name}</h3>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                    <span>{room.location || 'Main Venue'}</span>
                  </div>
                </div>

                {room.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {room.description}
                  </p>
                )}
              </div>

              {/* Stats & Actions */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Assigned Judges</p>
                    <p className="font-heading text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{assignedJdg.length}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">Assigned Projects</p>
                    <p className="font-heading text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{assignedProj.length}</p>
                  </div>
                </div>

                <button
                  onClick={() => setInspectTarget(room)}
                  className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 text-slate-800 dark:text-slate-200 hover:text-cyan-700 dark:hover:text-cyan-300 py-2.5 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-500/30 transition-all"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Inspect & Assign Room</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
