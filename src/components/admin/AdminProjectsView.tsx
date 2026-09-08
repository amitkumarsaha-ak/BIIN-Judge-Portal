import React, { useState, useMemo, useCallback } from 'react';
import {
  ShieldCheck, Plus, Search, RotateCcw, Pencil, Trash2, Eye,
  ToggleLeft, ToggleRight, Building2, GraduationCap, Users,
  X, Check, AlertTriangle,
  Layers, BookOpen, Filter,
  CheckCircle2, XCircle, FolderGit2, University, FileSpreadsheet
} from 'lucide-react';
import type { Project, ApplicationType, ProjectStatus, HeadCategoryCode } from '../../types';
import {
  getProjects, addProject, updateProject, deleteProject,
  toggleProjectStatus, getEvaluations
} from '../../services/storage';
import { HEAD_CATEGORIES } from '../../data/mockData';
import { ExcelImportModal } from './ExcelImportModal';

const getAppTypeIcon = (type: ApplicationType) => {
  switch (type) {
    case 'Student': return GraduationCap;
    case 'Organisation': return Building2;
    case 'Student-Tertiary': return University;
    default: return Users;
  }
};

const getAppTypeColor = (type: ApplicationType) => {
  switch (type) {
    case 'Student': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
    case 'Organisation': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
    case 'Student-Tertiary': return 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20';
    default: return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
  }
};

const generateId = () => `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const generateAppId = (projects: Project[]) => {
  const nextNum = projects.length + 1;
  return `BIIN-2026-${String(nextNum).padStart(3, '0')}`;
};

const EMPTY_FORM: Omit<Project, 'id'> = {
  title: '',
  applicationId: '',
  projectCode: '',
  applicationType: 'Student',
  headCategory: 'HC-C',
  teamOrOrgName: '',
  representativeName: '',
  members: [],
  email: '',
  contactNumber: '',
  institutionOrOrg: '',
  description: '',
  problemStatement: '',
  solutionSummary: '',
  tags: [],
  status: 'active',
};

// --- DELETE CONFIRMATION MODAL ---
interface DeleteConfirmProps {
  project: Project;
  evalCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmProps> = ({ project, evalCount, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
    <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 shadow-2xl p-6 sm:p-8 space-y-5">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30">
          <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white">Delete Project?</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">This action will remove the project from the system.</p>
        </div>
      </div>
      <div className="rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 space-y-1">
        <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{project.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{project.applicationId} · {project.projectCode}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">{project.teamOrOrgName}</p>
      </div>
      <div className="flex items-start space-x-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
        <span>
          Deleting this project will permanently remove it along with <strong>{evalCount}</strong> associated evaluation{evalCount !== 1 ? 's' : ''} from the database.
        </span>
      </div>
      <div className="flex items-center justify-end space-x-3 pt-1">
        <button
          onClick={onCancel}
          className="rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex items-center space-x-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span>Confirm Delete</span>
        </button>
      </div>
    </div>
  </div>
);

// --- DETAILS MODAL ---
interface DetailModalProps {
  project: Project;
  evalCount: number;
  onClose: () => void;
  onEdit: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ project, evalCount, onClose, onEdit }) => {
  const AppTypeIcon = getAppTypeIcon(project.applicationType);
  const category = HEAD_CATEGORIES.find(h => h.code === project.headCategory);
  const isActive = project.status === 'active';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30">
              <AppTypeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">{project.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{project.applicationId} · {project.projectCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${getAppTypeColor(project.applicationType)}`}>
              <AppTypeIcon className="h-3.5 w-3.5" />
              <span>{project.applicationType}</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
              <Layers className="h-3.5 w-3.5" />
              <span>{category?.name || project.headCategory}</span>
            </span>
            <span className={`inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
              {isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              <span>{isActive ? 'Active' : 'Inactive'}</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{evalCount} Evaluation{evalCount !== 1 ? 's' : ''}</span>
            </span>
          </div>

          {/* Grid Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Participant / Organization</p>
              <p className="text-slate-900 dark:text-white font-medium mt-0.5">{project.teamOrOrgName}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Representative</p>
              <p className="text-slate-900 dark:text-white font-medium mt-0.5">{project.representativeName}</p>
            </div>
            {project.institutionOrOrg && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Institution / Organization</p>
                <p className="text-slate-900 dark:text-white font-medium mt-0.5">{project.institutionOrOrg}</p>
              </div>
            )}
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Email</p>
              <p className="text-slate-900 dark:text-white font-medium mt-0.5">{project.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Contact Number</p>
              <p className="text-slate-900 dark:text-white font-medium mt-0.5">{project.contactNumber || 'N/A'}</p>
            </div>
            {project.members && project.members.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Team Members</p>
                <p className="text-slate-900 dark:text-white font-medium mt-0.5">{project.members.join(', ')}</p>
              </div>
            )}
          </div>

          {/* Description & Problem / Solution */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Project Description</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{project.description}</p>
            </div>
            {project.problemStatement && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Problem Statement</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{project.problemStatement}</p>
              </div>
            )}
            {project.solutionSummary && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Solution Summary</p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{project.solutionSummary}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map(tag => (
                <span key={tag} className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2 p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="btn-primary flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-lg"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit Project</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ADD / EDIT PROJECT FORM MODAL ---
interface ProjectFormModalProps {
  mode: 'add' | 'edit';
  initialData: Omit<Project, 'id'> & { id?: string };
  onClose: () => void;
  onSave: (data: Project) => void;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ mode, initialData, onClose, onSave }) => {
  const [form, setForm] = useState({ ...initialData });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagsInput, setTagsInput] = useState((initialData.tags || []).join(', '));
  const [membersInput, setMembersInput] = useState((initialData.members || []).join(', '));

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Project name is required.';
    if (!form.applicationId.trim()) errs.applicationId = 'Application ID is required.';
    if (!form.projectCode.trim()) errs.projectCode = 'Project code / serial is required.';
    if (!form.teamOrOrgName.trim()) errs.teamOrOrgName = 'Participant/Organization name is required.';
    if (!form.representativeName.trim()) errs.representativeName = 'Representative name is required.';
    if (!form.description.trim()) errs.description = 'Project description is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const members = membersInput.split(',').map(m => m.trim()).filter(Boolean);
    const project: Project = {
      ...form,
      id: (form as Project).id || generateId(),
      tags,
      members: members.length > 0 ? members : undefined
    };
    onSave(project);
  };

  const inputCls = (field: string) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all bg-slate-50 dark:bg-slate-950/60 ${errors[field] ? 'border-red-400 dark:border-red-500 focus:ring-red-500/30' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'}`;

  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30">
              {mode === 'add' ? <Plus className="h-5 w-5 text-violet-600 dark:text-violet-400" /> : <Pencil className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                {mode === 'add' ? 'Add New Project' : 'Edit Project'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fill in the project details below</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {/* Project Name */}
          <div>
            <label className={labelCls}>Project / Application Name *</label>
            <input className={inputCls('title')} value={form.title} onChange={set('title')} placeholder="e.g. Smart AgriSense - Portable Soil Scanner" />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Application ID & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Application ID *</label>
              <input className={inputCls('applicationId')} value={form.applicationId} onChange={set('applicationId')} placeholder="e.g. BIIN-2026-019" />
              {errors.applicationId && <p className="mt-1 text-xs text-red-500">{errors.applicationId}</p>}
            </div>
            <div>
              <label className={labelCls}>Project Code / Serial *</label>
              <input className={inputCls('projectCode')} value={form.projectCode} onChange={set('projectCode')} placeholder="e.g. STU-HC-C-003" />
              {errors.projectCode && <p className="mt-1 text-xs text-red-500">{errors.projectCode}</p>}
            </div>
          </div>

          {/* Participant/Org & Representative */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Participant / Organization Name *</label>
              <input className={inputCls('teamOrOrgName')} value={form.teamOrOrgName} onChange={set('teamOrOrgName')} placeholder="e.g. Team AgriPulse / Apex Innovations Ltd" />
              {errors.teamOrOrgName && <p className="mt-1 text-xs text-red-500">{errors.teamOrOrgName}</p>}
            </div>
            <div>
              <label className={labelCls}>Representative Name *</label>
              <input className={inputCls('representativeName')} value={form.representativeName} onChange={set('representativeName')} placeholder="e.g. Aria Chen / Dr. Kazi Rahman" />
              {errors.representativeName && <p className="mt-1 text-xs text-red-500">{errors.representativeName}</p>}
            </div>
          </div>

          {/* Application Type & Head Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Application Type *</label>
              <select className={inputCls('applicationType')} value={form.applicationType} onChange={set('applicationType')}>
                <option value="Student">Student</option>
                <option value="Student-Tertiary">Student-Tertiary Categories (University Level)</option>
                <option value="Organisation">Organisation</option>
                <option value="Individual or Group">Individual or Group</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Head Category *</label>
              <select className={inputCls('headCategory')} value={form.headCategory} onChange={set('headCategory')}>
                {HEAD_CATEGORIES.map(h => (
                  <option key={h.code} value={h.code}>{h.name} ({h.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Status */}
          <div>
            <label className={labelCls}>Project Status</label>
            <div className="flex items-center space-x-3 mt-1.5">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none ${form.status === 'active' ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5 ${form.status === 'active' ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className={`text-xs font-semibold ${form.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {form.status === 'active' ? 'Active (Eligible for Evaluation)' : 'Inactive (Deactivated)'}
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Email</label>
              <input className={inputCls('email')} type="email" value={form.email} onChange={set('email')} placeholder="contact@example.com" />
            </div>
            <div>
              <label className={labelCls}>Contact Number</label>
              <input className={inputCls('contactNumber')} value={form.contactNumber} onChange={set('contactNumber')} placeholder="+1 (555) 000-0000" />
            </div>
          </div>

          {/* Institution / Org & Members */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Institution / Organization Name</label>
              <input className={inputCls('institutionOrOrg')} value={form.institutionOrOrg || ''} onChange={set('institutionOrOrg')} placeholder="e.g. National University / Tech Corp" />
            </div>
            <div>
              <label className={labelCls}>Team Members (comma-separated)</label>
              <input className={inputCls('members')} value={membersInput} onChange={e => setMembersInput(e.target.value)} placeholder="e.g. Alice, Bob, Carol" />
            </div>
          </div>

          {/* Project Description */}
          <div>
            <label className={labelCls}>Project Description *</label>
            <textarea className={`${inputCls('description')} resize-none`} rows={3} value={form.description} onChange={set('description')} placeholder="Brief description of the nominated project..." />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Problem Statement & Solution Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Problem Statement</label>
              <textarea className={`${inputCls('problemStatement')} resize-none`} rows={3} value={form.problemStatement || ''} onChange={set('problemStatement')} placeholder="What problem does it solve?" />
            </div>
            <div>
              <label className={labelCls}>Solution Summary</label>
              <textarea className={`${inputCls('solutionSummary')} resize-none`} rows={3} value={form.solutionSummary || ''} onChange={set('solutionSummary')} placeholder="How does it solve the problem?" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={labelCls}>Tags (comma-separated)</label>
            <input className={inputCls('tags')} value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g. IoT, Agriculture, AI, Robotics" />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 border-t border-slate-200 dark:border-slate-800">
          <button onClick={onClose} className="rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary flex items-center space-x-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-lg">
            <Check className="h-4 w-4" />
            <span>{mode === 'add' ? 'Add Project' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};// --- MAIN ADMIN PROJECT MANAGEMENT VIEW ---
export const AdminProjectsView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => getProjects());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ApplicationType | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState<HeadCategoryCode | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'All'>('All');

  const [formModal, setFormModal] = useState<{ mode: 'add' | 'edit'; data: Omit<Project, 'id'> & { id?: string } } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [detailTarget, setDetailTarget] = useState<Project | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const refresh = useCallback(() => setProjects(getProjects()), []);
  const allEvaluations = getEvaluations();

  // Filtered projects
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return projects.filter(p => {
      // Filter by Application Type
      if (filterType !== 'All' && p.applicationType !== filterType) return false;

      // Filter by Head Category
      if (filterCategory !== 'All' && p.headCategory !== filterCategory) return false;

      // Filter by Status
      if (filterStatus !== 'All' && p.status !== filterStatus) return false;

      // Filter by Query text
      if (q) {
        const hay = [
          p.title,
          p.applicationId,
          p.projectCode,
          p.teamOrOrgName,
          p.representativeName,
          p.institutionOrOrg || '',
          p.description,
          (p.tags || []).join(' ')
        ].join(' ').toLowerCase();

        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [projects, searchQuery, filterType, filterCategory, filterStatus]);

  const totalActive = projects.filter(p => p.status === 'active').length;
  const totalInactive = projects.filter(p => p.status === 'inactive').length;
  const evalCountFor = (id: string) => allEvaluations.filter(e => e.projectId === id).length;

  const handleSave = (project: Project) => {
    if (formModal?.mode === 'add') {
      addProject(project);
    } else {
      updateProject(project);
    }
    refresh();
    setFormModal(null);
  };

  const handleBulkImport = (newProjects: Project[]) => {
    newProjects.forEach(p => addProject(p));
    refresh();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProject(deleteTarget.id);
    refresh();
    setDeleteTarget(null);
    if (detailTarget?.id === deleteTarget.id) setDetailTarget(null);
  };

  const handleToggleStatus = (id: string) => {
    toggleProjectStatus(id);
    refresh();
    if (detailTarget && detailTarget.id === id) {
      setDetailTarget(prev => prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null);
    }
  };

  const openAdd = () => {
    const currentProjects = getProjects();
    setFormModal({
      mode: 'add',
      data: { ...EMPTY_FORM, applicationId: generateAppId(currentProjects) }
    });
  };

  const openEdit = (project: Project) => {
    setDetailTarget(null);
    setFormModal({ mode: 'edit', data: { ...project } });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('All');
    setFilterCategory('All');
    setFilterStatus('All');
  };

  const hasFilters = searchQuery || filterType !== 'All' || filterCategory !== 'All' || filterStatus !== 'All';

  return (
    <div className="space-y-6 pb-12">
      {/* Modals */}
      {formModal && (
        <ProjectFormModal
          mode={formModal.mode}
          initialData={formModal.data}
          onClose={() => setFormModal(null)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          project={deleteTarget}
          evalCount={evalCountFor(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {detailTarget && (
        <DetailModal
          project={detailTarget}
          evalCount={evalCountFor(detailTarget.id)}
          onClose={() => setDetailTarget(null)}
          onEdit={() => openEdit(detailTarget)}
        />
      )}

      {isImportModalOpen && (
        <ExcelImportModal
          existingProjects={projects}
          initialAppType={filterType !== 'All' ? filterType : undefined}
          initialCategory={filterCategory !== 'All' ? filterCategory : undefined}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleBulkImport}
        />
      )}

      {/* Page Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-indigo-500/5 to-cyan-500/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-violet-50 dark:bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30 mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Administrator Portal</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Project Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Add new projects manually, import from Excel spreadsheets, manage classifications, and configure project details.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="admin-excel-import-btn"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center space-x-2 rounded-2xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-4 py-3 text-sm font-bold transition-all shadow-sm flex-shrink-0"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Import Excel</span>
            </button>

            <button
              id="admin-add-project-btn"
              onClick={openAdd}
              className="btn-primary inline-flex items-center space-x-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-xl flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Projects</p>
          <p className="font-heading text-3xl font-extrabold mt-1 text-indigo-600 dark:text-indigo-400">{projects.length}</p>
        </div>

        <div className="rounded-2xl border bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active</p>
          <p className="font-heading text-3xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">{totalActive}</p>
        </div>

        <div className="rounded-2xl border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inactive</p>
          <p className="font-heading text-3xl font-extrabold mt-1 text-slate-600 dark:text-slate-400">{totalInactive}</p>
        </div>

        <div className="rounded-2xl border bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20 p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Head Categories</p>
          <p className="font-heading text-3xl font-extrabold mt-1 text-cyan-600 dark:text-cyan-400">{HEAD_CATEGORIES.length}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              id="admin-search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by project name, ID, code, participant, representative..."
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/90 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as ApplicationType | 'All')}
              className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Application Types</option>
              <option value="Student">Student</option>
              <option value="Student-Tertiary">Student-Tertiary (University Level)</option>
              <option value="Organisation">Organisation</option>
              <option value="Individual or Group">Individual or Group</option>
            </select>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as HeadCategoryCode | 'All')}
              className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Head Categories</option>
              {HEAD_CATEGORIES.map(h => (
                <option key={h.code} value={h.code}>{h.name} ({h.code})</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as ProjectStatus | 'All')}
              className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center space-x-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Badges Summary */}
        <div className="flex items-center text-xs gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-slate-600 dark:text-slate-400">
            Showing <strong className="text-slate-900 dark:text-white">{filtered.length}</strong> of {projects.length} projects
          </span>
          {filterType !== 'All' && (
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
              Type: {filterType}
            </span>
          )}
          {filterCategory !== 'All' && (
            <span className="rounded-full bg-cyan-50 dark:bg-cyan-500/20 px-2 py-0.5 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20">
              Category: {HEAD_CATEGORIES.find(h => h.code === filterCategory)?.name || filterCategory}
            </span>
          )}
          {filterStatus !== 'All' && (
            <span className={`rounded-full px-2 py-0.5 border ${filterStatus === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
              Status: {filterStatus}
            </span>
          )}
          {searchQuery && (
            <span className="rounded-full bg-amber-50 dark:bg-amber-500/20 px-2 py-0.5 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
              "{searchQuery}"
            </span>
          )}
        </div>
      </div>

      {/* Project List */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <FolderGit2 className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No projects found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            {hasFilters ? 'Try adjusting your search or filter criteria.' : 'Add your first project to get started.'}
          </p>
          {hasFilters ? (
            <button onClick={resetFilters} className="btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-lg">
              Clear Filters
            </button>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setIsImportModalOpen(true)} className="rounded-xl border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-5 py-2.5 text-xs font-bold shadow-sm">
                Import via Excel
              </button>
              <button onClick={openAdd} className="btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-lg">
                Add First Project
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(project => {
            const AppTypeIcon = getAppTypeIcon(project.applicationType);
            const isActive = project.status === 'active';
            const category = HEAD_CATEGORIES.find(h => h.code === project.headCategory);
            const evalCount = evalCountFor(project.id);

            return (
              <div
                key={project.id}
                id={`admin-project-row-${project.id}`}
                className={`glass-panel rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${isActive ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 opacity-75'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Category icon */}
                  <div className="flex-shrink-0 hidden sm:flex">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${getAppTypeColor(project.applicationType)}`}>
                      <AppTypeIcon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Main Project Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {project.title}
                      </h3>
                      <span className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'}`}>
                        {isActive ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                        <span>{isActive ? 'Active' : 'Inactive'}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{project.applicationId}</span>
                      <span className="font-mono text-slate-400 dark:text-slate-500">{project.projectCode}</span>
                      <span>·</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{project.teamOrOrgName}</span>
                      <span>·</span>
                      <span className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 font-medium border ${getAppTypeColor(project.applicationType)}`}>
                        <AppTypeIcon className="h-2.5 w-2.5" />
                        <span>{project.applicationType}</span>
                      </span>
                      <span className="inline-flex items-center space-x-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                        <Layers className="h-2.5 w-2.5" />
                        <span>{category?.name || project.headCategory}</span>
                      </span>
                      {evalCount > 0 && (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <BookOpen className="h-2.5 w-2.5" />
                          <span>{evalCount} eval{evalCount !== 1 ? 's' : ''}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Status Toggle */}
                    <button
                      id={`admin-toggle-status-${project.id}`}
                      onClick={() => handleToggleStatus(project.id)}
                      title={isActive ? 'Deactivate Project' : 'Activate Project'}
                      className={`group flex items-center space-x-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition-all ${isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:border-red-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-500/20'}`}
                    >
                      {isActive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{isActive ? 'Active' : 'Inactive'}</span>
                    </button>

                    {/* View Details */}
                    <button
                      id={`admin-view-${project.id}`}
                      onClick={() => setDetailTarget(project)}
                      title="View Project Details"
                      className="flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>

                    {/* Edit Project */}
                    <button
                      id={`admin-edit-${project.id}`}
                      onClick={() => openEdit(project)}
                      title="Edit Project"
                      className="flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-500/20 transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete Project */}
                    <button
                      id={`admin-delete-${project.id}`}
                      onClick={() => setDeleteTarget(project)}
                      title="Delete Project"
                      className="flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/20 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
