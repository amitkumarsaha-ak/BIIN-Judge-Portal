import React, { useState, useMemo, useEffect } from 'react';
import {
  X, Check, Trash2, Sliders, AlertCircle, CheckSquare, Square,
  GraduationCap, Building2, Users, University, FolderGit2,
  ChevronDown, ChevronUp
} from 'lucide-react';
import type { User, JudgeAssignment, ApplicationType, HeadCategoryCode, Project } from '../../types';
import {
  getJudgeAssignmentsByJudge,
  saveJudgeAssignment,
  deleteJudgeAssignment,
  getProjects
} from '../../services/storage';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

import {
  canonicalAppType,
  matchesAppType,
  matchesCategory,
  getHeadCategoriesForAppType,
  getHeadCategoryDisplayName
} from '../../utils/evaluation';

interface JudgeAssignmentModalProps {
  judge: User;
  onClose: () => void;
  onUpdated?: () => void;
}

const APPLICATION_TYPES: ApplicationType[] = [
  'All Application Types',
  'Student-Secondary',
  'Individual/Group',
  'Organization',
  'Student -Tertiary (University Level)'
];

export const JudgeAssignmentModal: React.FC<JudgeAssignmentModalProps> = ({
  judge,
  onClose,
  onUpdated
}) => {
  const { currentUser } = useAuth();
  const safeActor = {
    email: currentUser?.email || 'admin@biin.org',
    name: currentUser?.fullName || 'Administrator'
  };

  const [assignments, setAssignments] = useState<JudgeAssignment[]>(() =>
    getJudgeAssignmentsByJudge(judge.email)
  );
  const [allProjects, setAllProjects] = useState<Project[]>(() => getProjects());
  const [expandedAsgnIds, setExpandedAsgnIds] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchFresh = async () => {
      try {
        const [liveProjects, liveAssignments] = await Promise.all([
          api.getProjects(),
          api.getAssignmentsByJudge(judge.email)
        ]);
        if (mounted) {
          if (Array.isArray(liveProjects) && liveProjects.length > 0) {
            setAllProjects(liveProjects);
          }
          if (Array.isArray(liveAssignments)) {
            setAssignments(liveAssignments);
            setExpandedAsgnIds(liveAssignments.map(a => a.id));
          }
        }
      } catch {}
    };
    fetchFresh();
    return () => {
      mounted = false;
    };
  }, [judge.email]);

  const toggleExpand = (id: string) => {
    setExpandedAsgnIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Helper to get projects assigned under an assignment
  const getProjectsForAssignment = (asgn: JudgeAssignment): Project[] => {
    if (Array.isArray(asgn.projectIds) && asgn.projectIds.length > 0) {
      const idSet = new Set(asgn.projectIds.map(id => String(id).trim().toLowerCase()));
      return allProjects.filter(p => {
        const pId = String(p.id || '').trim().toLowerCase();
        const pAppId = String(p.applicationId || '').trim().toLowerCase();
        const pCode = String(p.projectCode || '').trim().toLowerCase();
        return idSet.has(pId) || (pAppId && idSet.has(pAppId)) || (pCode && idSet.has(pCode));
      });
    }

    return allProjects.filter(p => {
      const statusStr = (p.status || 'active').trim().toLowerCase();
      if (statusStr !== 'active') return false;
      if (!matchesAppType(p.applicationType, asgn.applicationType)) return false;
      if (asgn.headCategory && asgn.headCategory !== 'All Head Category' && asgn.headCategory !== 'N/A') {
        if (!matchesCategory(p.headCategory, asgn.headCategory, p.applicationType)) return false;
      }
      return true;
    });
  };

  // Form State - default to scope so saving always works immediately
  const [selectedAppType, setSelectedAppType] = useState<ApplicationType>('Student-Secondary');
  const [selectedHeadCategory, setSelectedHeadCategory] = useState<string>('All Head Category');
  const [assignMode, setAssignMode] = useState<'scope' | 'specific'>('scope');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isNoHeadCategory = useMemo(() => {
    const canon = canonicalAppType(selectedAppType);
    return canon === 'Student-Secondary' || canon === 'Individual/Group' || canon === 'Individual or Group' || canon === 'All Application Types';
  }, [selectedAppType]);

  // Matching projects based on selected scope
  const matchingProjects = useMemo(() => {
    return allProjects.filter(p => {
      const statusStr = (p.status || 'active').trim().toLowerCase();
      if (statusStr !== 'active') return false;
      if (!matchesAppType(p.applicationType, selectedAppType)) return false;
      if (!isNoHeadCategory && selectedHeadCategory && selectedHeadCategory !== 'All Head Category') {
        if (!matchesCategory(p.headCategory, selectedHeadCategory, p.applicationType)) return false;
      }
      return true;
    });
  }, [allProjects, selectedAppType, selectedHeadCategory, isNoHeadCategory]);

  const handleAppTypeChange = (type: ApplicationType) => {
    setSelectedAppType(type);
    setSelectedProjectIds([]);
    setAssignMode('scope'); // always reset to scope when app type changes
    const canon = canonicalAppType(type);
    if (canon === 'Student-Secondary' || canon === 'Individual/Group' || canon === 'Individual or Group' || canon === 'All Application Types') {
      setSelectedHeadCategory('N/A');
    } else {
      setSelectedHeadCategory('All Head Category');
    }
  };

  const handleToggleProject = (projectId: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };

  const handleSelectAllProjects = () => {
    setSelectedProjectIds(matchingProjects.map(p => p.id));
  };

  const handleDeselectAllProjects = () => {
    setSelectedProjectIds([]);
  };

  const handleSaveAssignment = async () => {
    setFeedback(null);

    if (assignMode === 'specific' && selectedProjectIds.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Please select at least one project for this assignment.'
      });
      return;
    }

    const finalCategory: HeadCategoryCode | null = isNoHeadCategory
      ? 'N/A'
      : (selectedHeadCategory === 'All Head Category' ? null : selectedHeadCategory);

    const newAsgn: JudgeAssignment = {
      id: `asgn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      judgeId: judge.id,
      judgeEmail: judge.email,
      judgeName: judge.fullName,
      applicationType: canonicalAppType(selectedAppType),
      headCategory: finalCategory,
      projectIds: assignMode === 'specific' ? selectedProjectIds : undefined,
      createdAt: new Date().toISOString()
    };

    await saveJudgeAssignment(newAsgn, safeActor);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('biin_assignments_updated'));
      window.dispatchEvent(new Event('biin_projects_updated'));
    }

    const updated = await api.getAssignmentsByJudge(judge.email).catch(() => getJudgeAssignmentsByJudge(judge.email));
    setAssignments(updated);
    setExpandedAsgnIds(prev => [...prev, newAsgn.id]);
    setSelectedProjectIds([]);
    setFeedback({
      type: 'success',
      message: `Successfully assigned projects to ${judge.fullName}.`
    });
    onUpdated?.();

    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleDeleteAssignment = async (id: string) => {
    await deleteJudgeAssignment(id, safeActor);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('biin_assignments_updated'));
      window.dispatchEvent(new Event('biin_projects_updated'));
    }

    const updated = await api.getAssignmentsByJudge(judge.email).catch(() => getJudgeAssignmentsByJudge(judge.email));
    setAssignments(updated);
    onUpdated?.();
    setFeedback({
      type: 'success',
      message: 'Assignment removed.'
    });
    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  const handleRemoveProjectFromAssignment = async (asgn: JudgeAssignment, projectIdToRemove: string) => {
    setFeedback(null);
    try {
      const pTarget = String(projectIdToRemove || '').trim().toLowerCase();
      if (Array.isArray(asgn.projectIds) && asgn.projectIds.length > 0) {
        const remainingIds = asgn.projectIds.filter(id => {
          const clean = String(id || '').trim().toLowerCase();
          return clean !== pTarget;
        });

        if (remainingIds.length === 0) {
          await deleteJudgeAssignment(asgn.id, safeActor);
        } else {
          const updatedAsgn: JudgeAssignment = {
            ...asgn,
            projectIds: remainingIds
          };
          await saveJudgeAssignment(updatedAsgn, safeActor);
        }
      } else {
        const scopeProjects = getProjectsForAssignment(asgn);
        const remainingIds = scopeProjects
          .map(p => p.id)
          .filter(id => String(id).trim().toLowerCase() !== pTarget);

        if (remainingIds.length === 0) {
          await deleteJudgeAssignment(asgn.id, safeActor);
        } else {
          const updatedAsgn: JudgeAssignment = {
            ...asgn,
            projectIds: remainingIds
          };
          await saveJudgeAssignment(updatedAsgn, safeActor);
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('biin_assignments_updated'));
        window.dispatchEvent(new Event('biin_projects_updated'));
      }

      const updated = await api.getAssignmentsByJudge(judge.email).catch(() => getJudgeAssignmentsByJudge(judge.email));
      setAssignments(updated);
      setFeedback({
        type: 'success',
        message: 'Project removed from judge assignment.'
      });
      onUpdated?.();
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({
        type: 'error',
        message: 'Failed to remove project from assignment.'
      });
    }
  };

  const getAppTypeIcon = (type: string) => {
    const canonical = canonicalAppType(type);
    switch (canonical) {
      case 'Student-Secondary':
      case 'Student': return GraduationCap;
      case 'Organization':
      case 'Organisation': return Building2;
      case 'Student-Tertiary':
      case 'Student -Tertiary (University Level)': return University;
      default: return Users;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white leading-snug">
                Project Assignments for {judge.fullName}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {judge.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mx-5 sm:mx-6 mt-4 p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}>
            {feedback.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Section 1: Active Assignments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Active Assignments</span>
                <span className="rounded-full bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 text-[11px] font-bold text-violet-700 dark:text-violet-300">
                  {assignments.length}
                </span>
              </h3>
            </div>

            {assignments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6 text-center bg-slate-50/50 dark:bg-slate-950/30">
                <FolderGit2 className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Projects Assigned Yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  This judge will see an empty project list until you assign specific projects below.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map(asgn => {
                  const Icon = getAppTypeIcon(asgn.applicationType);
                  const isSpecific = Array.isArray(asgn.projectIds) && asgn.projectIds.length > 0;
                  const asgnCanon = canonicalAppType(asgn.applicationType);
                  const isNoCat = asgnCanon === 'Student-Secondary' || asgnCanon === 'Individual/Group' || asgnCanon === 'Individual or Group';
                  const asgnProjects = getProjectsForAssignment(asgn);
                  const isExpanded = expandedAsgnIds.includes(asgn.id);

                  return (
                    <div
                      key={asgn.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 overflow-hidden transition-all shadow-xs"
                    >
                      {/* Assignment Card Header */}
                      <div className="flex items-center justify-between p-3.5 gap-2">
                        <div
                          onClick={() => toggleExpand(asgn.id)}
                          className="flex items-center space-x-3 min-w-0 cursor-pointer flex-1"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {asgn.applicationType}
                              </span>
                              {!isNoCat && asgn.headCategory && asgn.headCategory !== 'N/A' && (
                                <span className="inline-block rounded-md bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  {getHeadCategoryDisplayName(asgn.headCategory, asgn.applicationType)}
                                </span>
                              )}
                              <span className="inline-block rounded-md bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 text-[10px] font-bold">
                                {asgnProjects.length} project{asgnProjects.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {isSpecific
                                ? `Specific projects assigned`
                                : 'Scope-wide assignment'} · Click to {isExpanded ? 'hide' : 'view'} projects
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleExpand(asgn.id)}
                            title={isExpanded ? 'Collapse' : 'Expand projects'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAssignment(asgn.id)}
                            title="Delete entire assignment"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Projects List */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 p-3 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                            Assigned Projects ({asgnProjects.length})
                          </p>

                          {asgnProjects.length === 0 ? (
                            <p className="text-xs text-slate-400 p-2 text-center italic">
                              No matching projects found in database.
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {asgnProjects.map(p => (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70 text-xs gap-2"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 px-1.5 py-0.5 rounded border border-violet-200 dark:border-violet-800 shrink-0">
                                        {p.applicationId || p.projectCode || p.id.slice(0, 8)}
                                      </span>
                                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                                        {p.title}
                                      </p>
                                    </div>
                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                      {p.teamOrOrgName} · {getHeadCategoryDisplayName(p.headCategory, p.applicationType) || p.applicationType}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProjectFromAssignment(asgn, p.id)}
                                    title={`Remove "${p.title}" from this judge`}
                                    className="flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 shrink-0 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 2: Assign New Projects / Scopes */}
          <div className="space-y-4">
            <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white">
              Assign New Scope or Projects
            </h3>

            {/* Application Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Application Type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAppType}
                onChange={e => handleAppTypeChange(e.target.value as ApplicationType)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 font-semibold"
              >
                {APPLICATION_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Head Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                2. Head Category
              </label>
              {isNoHeadCategory ? (
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">N/A — Not Applicable</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {selectedAppType} has no head category. Assignment automatically covers all projects in this category.
                  </p>
                </div>
              ) : (
                <select
                  value={selectedHeadCategory}
                  onChange={e => setSelectedHeadCategory(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 font-semibold"
                >
                  <option value="All Head Category">All Head Categories in this Type</option>
                  {getHeadCategoriesForAppType(selectedAppType).map(hc => (
                    <option key={hc.code} value={hc.code}>
                      {hc.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Assignment Mode: Scope vs Specific */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                3. Assignment Target
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssignMode('scope')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    assignMode === 'scope'
                      ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-400 dark:border-violet-600 ring-2 ring-violet-400/20'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">All Matching Projects</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {matchingProjects.length} projects currently in scope
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => { setAssignMode('specific'); setSelectedProjectIds(prev => prev.length === 0 ? matchingProjects.map(p => p.id) : prev); }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    assignMode === 'specific'
                      ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-400 dark:border-violet-600 ring-2 ring-violet-400/20'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Select Specific Projects</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Choose individual projects manually
                  </p>
                </button>
              </div>
            </div>

            {/* If Specific: Checkbox list of projects */}
            {assignMode === 'specific' && (
              <div className="space-y-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Projects ({selectedProjectIds.length} of {matchingProjects.length} selected):
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAllProjects}
                      className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-400">·</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllProjects}
                      className="text-[11px] font-bold text-slate-500 hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {matchingProjects.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No active projects found for this Application Type / Category.
                  </p>
                ) : (
                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                    {matchingProjects.map(proj => {
                      const isChecked = selectedProjectIds.includes(proj.id);
                      return (
                        <div
                          key={proj.id}
                          onClick={() => handleToggleProject(proj.id)}
                          className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-violet-100/70 dark:bg-violet-950/60 border-violet-300 dark:border-violet-700'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-850'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400">
                            {isChecked ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-400" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                              {proj.title}
                            </p>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono mt-0.5">
                              <span>{proj.applicationId}</span>
                              {proj.teamLeadName && (
                                <>
                                  <span>·</span>
                                  <span className="font-sans">Lead: {proj.teamLeadName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors min-h-[38px]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSaveAssignment}
            className="flex items-center space-x-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition-colors min-h-[38px]"
          >
            <Check className="h-4 w-4" />
            <span>Save Assignment</span>
          </button>
        </div>

      </div>
    </div>
  );
};
