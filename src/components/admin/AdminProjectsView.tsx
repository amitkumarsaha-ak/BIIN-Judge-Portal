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
  getProjects, addProject, addProjects, updateProject, deleteProject,
  toggleProjectStatus, getEvaluations
} from '../../services/storage';
import { HEAD_CATEGORIES } from '../../data/mockData';
import { matchesAppType, matchesCategory, canonicalAppType } from '../../utils/evaluation';
import { ExcelImportModal } from './ExcelImportModal';
import { useAuth } from '../../context/AuthContext';

const getAppTypeIcon = (type: ApplicationType) => {
  const canon = canonicalAppType(type);
  switch (canon) {
    case 'Student': return GraduationCap;
    case 'Organisation': return Building2;
    case 'Student-Tertiary': return University;
    default: return Users;
  }
};

const getAppTypeColor = (type: ApplicationType) => {
  const canon = canonicalAppType(type);
  switch (canon) {
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
  solutionName: '',
  applicationId: '',
  projectCode: '',
  applicationType: 'All Application Types',
  headCategory: 'All Head Category',
  teamOrOrgName: '',
  representativeName: '',
  members: [],
  email: '',
  contactNumber: '',
  institutionOrOrg: '',
  description: '',
  projectOverview: '',
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex-shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30">
              <AppTypeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">{project.title}</h3>
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

        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 touch-scroll">
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
              <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Authorized Representative</p>
              <p className="text-slate-900 dark:text-white font-medium mt-0.5">{project.representativeName}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Email Address</p>
              <p className="text-slate-900 dark:text-white font-medium mt-0.5">{project.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Contact Number</p>
              <p className="text-slate-900 dark:text-white font-medium mt-0.5">{project.contactNumber || 'N/A'}</p>
            </div>
            {project.institutionOrOrg && (
              <div className="sm:col-span-2">
                <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Institution / Affiliation</p>
                <p className="text-slate-900 dark:text-white font-medium mt-0.5">{project.institutionOrOrg}</p>
              </div>
            )}
          </div>

          {/* Members */}
          {project.members && project.members.length > 0 && (
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1.5">Team Members</p>
              <div className="flex flex-wrap gap-1.5">
                {project.members.map(member => (
                  <span key={member} className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                    {member}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {project.description && (
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Project Description</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800">
                {project.description}
              </p>
            </div>
          )}

          {/* Problem & Solution */}
          {project.problemStatement && (
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Problem Statement</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800">
                {project.problemStatement}
              </p>
            </div>
          )}
          {project.solutionSummary && (
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Proposed Solution</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800">
                {project.solutionSummary}
              </p>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {project.tags.map(tag => (
                <span key={tag} className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2 p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 min-h-[38px]"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="btn-primary flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-lg min-h-[38px]"
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
  const [form, setForm] = useState({
    ...initialData,
    solutionName: initialData.solutionName || initialData.title || '',
    projectOverview: initialData.projectOverview || initialData.description || '',
    problemStatement: initialData.problemStatement || '',
    solutionSummary: initialData.solutionSummary || '',
    applicationType: initialData.applicationType || 'All Application Types',
    headCategory: initialData.headCategory || 'All Head Category',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.solutionName.trim()) errs.solutionName = 'Solution Name is required.';
    if (!form.projectOverview.trim()) errs.projectOverview = 'Project Overview is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const solName = form.solutionName.trim();
    const overview = form.projectOverview.trim();
    const project: Project = {
      ...form,
      id: (form as Project).id || generateId(),
      title: solName,
      solutionName: solName,
      description: overview,
      projectOverview: overview,
      problemStatement: (form.problemStatement || '').trim(),
      solutionSummary: (form.solutionSummary || '').trim(),
      applicationType: form.applicationType || 'All Application Types',
      headCategory: form.headCategory || 'All Head Category',
      applicationId: form.applicationId || `BIIN-2026-${String(Date.now()).slice(-4)}`,
      projectCode: form.projectCode || `PROJ-${String(Date.now()).slice(-4)}`,
      teamOrOrgName: form.teamOrOrgName || solName || 'Independent',
      representativeName: form.representativeName || 'Lead Contact',
      email: form.email || '',
      contactNumber: form.contactNumber || '',
      members: form.members || [],
      tags: form.tags || [],
      status: form.status || 'active'
    };
    onSave(project);
  };

  const inputCls = (field: string) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all bg-slate-50 dark:bg-slate-950/60 ${errors[field] ? 'border-red-400 dark:border-red-500 focus:ring-red-500/30' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'}`;

  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30">
              {mode === 'add' ? <Plus className="h-5 w-5 text-violet-600 dark:text-violet-400" /> : <Pencil className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
            </div>
            <div>
              <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {mode === 'add' ? 'Add New Project' : 'Edit Project'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fill in the project details below</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 touch-scroll">
          {/* Solution Name */}
          <div>
            <label className={labelCls}>Solution Name *</label>
            <input
              className={inputCls('solutionName')}
              value={form.solutionName}
              onChange={set('solutionName')}
              placeholder="e.g. Smart AgriSense - Portable Soil Scanner"
            />
            {errors.solutionName && <p className="mt-1 text-xs text-red-500">{errors.solutionName}</p>}
          </div>

          {/* Application Type & Head Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Application Type *</label>
              <select className={inputCls('applicationType')} value={form.applicationType} onChange={set('applicationType')}>
                <option value="All Application Types">All Application Types</option>
                <option value="Student">Student</option>
                <option value="Student -Tertiary (University Level)">Student -Tertiary (University Level)</option>
                <option value="Organization">Organization</option>
                <option value="Individual/Group">Individual/Group</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Head Category *</label>
              <select className={inputCls('headCategory')} value={form.headCategory} onChange={set('headCategory')}>
                <option value="All Head Category">All Head Category</option>
                <option value="Consumer">Consumer</option>
                <option value="Business Services">Business Services</option>
                <option value="Industrial">Industrial</option>
                <option value="Public Sector and Government">Public Sector and Government</option>
                <option value="Individual & Communication Services">Individual & Communication Services</option>
              </select>
            </div>
          </div>

          {/* Project Overview */}
          <div>
            <label className={labelCls}>Project Overview *</label>
            <textarea
              className={`${inputCls('projectOverview')} resize-none`}
              rows={3}
              value={form.projectOverview}
              onChange={set('projectOverview')}
              placeholder="Brief overview of the nominated solution..."
            />
            {errors.projectOverview && <p className="mt-1 text-xs text-red-500">{errors.projectOverview}</p>}
          </div>

          {/* Problem Statement & Solution Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Problem Statement</label>
              <textarea
                className={`${inputCls('problemStatement')} resize-none`}
                rows={3}
                value={form.problemStatement || ''}
                onChange={set('problemStatement')}
                placeholder="What problem does it solve?"
              />
            </div>
            <div>
              <label className={labelCls}>Solution Summary</label>
              <textarea
                className={`${inputCls('solutionSummary')} resize-none`}
                rows={3}
                value={form.solutionSummary || ''}
                onChange={set('solutionSummary')}
                placeholder="How does it solve the problem?"
              />
            </div>
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

  // Reactive listener for storage updates (Excel imports, additions, deletions)
  React.useEffect(() => {
    const handleStorageUpdate = () => {
      refresh();
    };
    window.addEventListener('biin_projects_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('biin_projects_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [refresh]);

  // Filtered projects
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return projects.filter(p => {
      // Filter by Application Type
      if (!matchesAppType(p.applicationType, filterType)) return false;

      // Filter by Head Category
      if (!matchesCategory(p.headCategory, filterCategory)) return false;

      // Filter by Status
      if (filterStatus !== 'All' && p.status !== filterStatus) return false;

      // Filter by Query text
      if (q) {
        const hay = [
          p.title,
          p.solutionName || '',
          p.applicationId,
          p.projectCode,
          p.teamOrOrgName,
          p.representativeName,
          p.institutionOrOrg || '',
          p.description,
          p.projectOverview || '',
          p.problemStatement || '',
          p.solutionSummary || '',
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

  const { currentUser } = useAuth();
  const actor = useMemo(() => currentUser ? { email: currentUser.email, name: currentUser.fullName } : undefined, [currentUser]);

  const handleSave = (project: Project) => {
    if (formModal?.mode === 'add') {
      addProject(project, actor);
    } else {
      updateProject(project, actor);
    }
    refresh();
    setFormModal(null);
  };

  const handleBulkImport = (newProjects: Project[]) => {
    addProjects(newProjects, actor);
    refresh();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProject(deleteTarget.id, actor);
    refresh();
    setDeleteTarget(null);
    if (detailTarget?.id === deleteTarget.id) setDetailTarget(null);
  };

  const handleToggleStatus = (id: string) => {
    toggleProjectStatus(id, actor);
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 p-3.5 sm:p-4">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Projects</p>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold mt-1 text-indigo-600 dark:text-indigo-400">{projects.length}</p>
        </div>

        <div className="rounded-2xl border bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 p-3.5 sm:p-4">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active</p>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">{totalActive}</p>
        </div>

        <div className="rounded-2xl border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-3.5 sm:p-4">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inactive</p>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold mt-1 text-slate-600 dark:text-slate-400">{totalInactive}</p>
        </div>

        <div className="rounded-2xl border bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20 p-3.5 sm:p-4">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Head Categories</p>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold mt-1 text-cyan-600 dark:text-cyan-400">{HEAD_CATEGORIES.length}</p>
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
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as ApplicationType | 'All')}
              className="w-full sm:w-auto rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Application Types</option>
              <option value="Student">Student</option>
              <option value="Student -Tertiary (University Level)">Student -Tertiary (University Level)</option>
              <option value="Organization">Organization</option>
              <option value="Individual/Group">Individual/Group</option>
            </select>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as HeadCategoryCode | 'All')}
              className="w-full sm:w-auto rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Head Categories</option>
              <option value="HC-C">Consumer</option>
              <option value="HC-BS">Business Services</option>
              <option value="HC-I">Industrial</option>
              <option value="HC-PSG">Public Sector and Government</option>
              <option value="HC-ICS">Individual & Communication Services</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as ProjectStatus | 'All')}
              className="w-full sm:w-auto rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center justify-center space-x-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors min-h-[38px]"
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
            const category = HEAD_CATEGORIES.find(h => h.code === project.headCategory || h.name.toLowerCase() === (project.headCategory || '').toLowerCase());
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
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-between sm:justify-start w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                    {/* Status Toggle */}
                    <button
                      id={`admin-toggle-status-${project.id}`}
                      onClick={() => handleToggleStatus(project.id)}
                      title={isActive ? 'Deactivate Project' : 'Activate Project'}
                      className={`group flex items-center space-x-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition-all min-h-[38px] ${isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:border-red-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-500/20'}`}
                    >
                      {isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      <span className="hidden min-[400px]:inline">{isActive ? 'Active' : 'Inactive'}</span>
                    </button>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* View Details */}
                      <button
                        id={`admin-view-${project.id}`}
                        onClick={() => setDetailTarget(project)}
                        title="View Project Details"
                        className="flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all min-h-[38px] min-w-[38px]"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Edit Project */}
                      <button
                        id={`admin-edit-${project.id}`}
                        onClick={() => openEdit(project)}
                        title="Edit Project"
                        className="flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-500/20 transition-all min-h-[38px] min-w-[38px]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {/* Delete Project */}
                      <button
                        id={`admin-delete-${project.id}`}
                        onClick={() => setDeleteTarget(project)}
                        title="Delete Project"
                        className="flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/20 transition-all min-h-[38px] min-w-[38px]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
