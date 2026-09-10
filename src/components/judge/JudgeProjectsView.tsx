import React, { useState, useMemo, useEffect } from 'react';
import {
  FolderGit2, Search, CheckCircle2, Clock,
  Eye, Building2, GraduationCap, Users, University, Filter
} from 'lucide-react';
import type { Project } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  getProjectsForJudge, getEvaluationsByJudge, getSystemSettings
} from '../../services/storage';
import { HEAD_CATEGORIES } from '../../data/mockData';
import {
  matchesAppType,
  matchesCategory,
  canonicalAppType
} from '../../utils/evaluation';

interface JudgeProjectsViewProps {
  onSelectProjectForEvaluation: (project: Project) => void;
}

export const JudgeProjectsView: React.FC<JudgeProjectsViewProps> = ({
  onSelectProjectForEvaluation
}) => {
  const { currentUser } = useAuth();
  const [assignedProjects, setAssignedProjects] = useState<Project[]>(() => getProjectsForJudge());
  const [myEvaluations, setMyEvaluations] = useState(() =>
    currentUser ? getEvaluationsByJudge(currentUser.email) : []
  );
  const settings = getSystemSettings();

  useEffect(() => {
    const refresh = () => {
      setAssignedProjects(getProjectsForJudge());
      if (currentUser) {
        setMyEvaluations(getEvaluationsByJudge(currentUser.email));
      }
    };
    window.addEventListener('biin_projects_updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('biin_projects_updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [currentUser]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return assignedProjects.filter(p => {
      if (p.status && p.status !== 'active') return false;
      if (!matchesAppType(p.applicationType, filterType)) return false;
      if (!matchesCategory(p.headCategory, filterCategory)) return false;
      if (q) {
        const hay = [
          p.title,
          p.solutionName,
          p.applicationId,
          p.projectCode,
          p.teamOrOrgName,
          p.representativeName,
          p.description,
          p.projectOverview,
          p.problemStatement,
          p.solutionSummary
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [assignedProjects, searchQuery, filterType, filterCategory]);

  const getAppTypeIcon = (type: string) => {
    const canonical = canonicalAppType(type);
    switch (canonical) {
      case 'Student': return GraduationCap;
      case 'Organization': return Building2;
      case 'Student -Tertiary (University Level)': return University;
      default: return Users;
    }
  };

  const getAppTypeColor = (type: string) => {
    const canonical = canonicalAppType(type);
    switch (canonical) {
      case 'Student': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
      case 'Organization': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
      case 'Student -Tertiary (University Level)': return 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20';
      default: return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 mb-2">
            <Filter className="h-3.5 w-3.5" />
            <span>Category-Based Evaluation</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Projects for Evaluation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse nominated projects across Application Types and Head Categories. Select any project to enter or update your scoring.
          </p>
        </div>

        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-4 text-center shrink-0">
          <p className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300">Matching Projects</p>
          <p className="font-heading text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{filteredProjects.length}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 h-full w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search projects by title, code, participant, representative..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="w-full sm:w-auto rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="All">All Application Types</option>
          <option value="Student">Student</option>
          <option value="Student -Tertiary (University Level)">Student -Tertiary (University Level)</option>
          <option value="Organization">Organization</option>
          <option value="Individual/Group">Individual/Group</option>
        </select>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="w-full sm:w-auto rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="All">All Head Categories</option>
          {HEAD_CATEGORIES.map(hc => (
            <option key={hc.code} value={hc.code}>
              {hc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <FolderGit2 className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No matching projects found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search query, application type, or head category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map(project => {
            const AppTypeIcon = getAppTypeIcon(project.applicationType);
            const category = HEAD_CATEGORIES.find(
              h => h.code === project.headCategory || h.name.toLowerCase() === (project.headCategory || '').toLowerCase()
            );
            const evalItem = myEvaluations.find(e => e.projectId === project.id);
            const isEvaluated = Boolean(evalItem);

            return (
              <div
                key={project.id}
                className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md hover:shadow-xl transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className={`inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${getAppTypeColor(project.applicationType)}`}>
                      <AppTypeIcon className="h-3.5 w-3.5" />
                      <span>{project.applicationType}</span>
                    </span>

                    <span className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${isEvaluated ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20'}`}>
                      {isEvaluated ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      <span>{isEvaluated ? 'Evaluated' : 'Pending'}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{project.applicationId} · {project.projectCode}</p>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <p><span className="text-slate-400">Participant:</span> <strong className="text-slate-800 dark:text-slate-200">{project.teamOrOrgName}</strong></p>
                    <p><span className="text-slate-400">Representative:</span> {project.representativeName}</p>
                    <p><span className="text-slate-400">Category:</span> {category?.name || project.headCategory}</p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  {isEvaluated && evalItem && (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-2.5 border border-emerald-200 dark:border-emerald-500/20 text-xs">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">My Converted Score:</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {(evalItem.convertedScore ?? evalItem.percentage ?? 0).toFixed(1)} / 100
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => onSelectProjectForEvaluation(project)}
                    disabled={settings.evaluationsLocked}
                    className={`w-full inline-flex items-center justify-center space-x-2 rounded-2xl py-3 text-xs font-bold transition-all ${isEvaluated ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-600 hover:text-white' : 'btn-primary text-white shadow-lg'} disabled:opacity-50`}
                  >
                    <Eye className="h-4 w-4" />
                    <span>{isEvaluated ? 'Review / Edit Score' : 'Evaluate Project'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
