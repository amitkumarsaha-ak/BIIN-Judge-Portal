import React, { useState, useMemo } from 'react';
import {
  FolderGit2, Search, CheckCircle2, Clock,
  Eye, DoorOpen, AlertTriangle, Building2, GraduationCap, Users
} from 'lucide-react';
import type { Project, ApplicationType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  getProjectsForJudge, getEvaluationsByJudge, getSystemSettings
} from '../../services/storage';
import { HEAD_CATEGORIES } from '../../data/mockData';

interface JudgeProjectsViewProps {
  onSelectProjectForEvaluation: (project: Project) => void;
}

export const JudgeProjectsView: React.FC<JudgeProjectsViewProps> = ({
  onSelectProjectForEvaluation
}) => {
  const { currentUser } = useAuth();
  const roomNumber = currentUser?.roomNumber;
  const hasRoom = Boolean(roomNumber && roomNumber.trim());

  const assignedProjects = getProjectsForJudge(roomNumber);
  const myEvaluations = currentUser ? getEvaluationsByJudge(currentUser.email) : [];
  const settings = getSystemSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ApplicationType | 'All'>('All');

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return assignedProjects.filter(p => {
      if (filterType !== 'All' && p.applicationType !== filterType) return false;
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
  }, [assignedProjects, searchQuery, filterType]);

  const getAppTypeIcon = (type: ApplicationType) => {
    switch (type) {
      case 'Student': return GraduationCap;
      case 'Organisation': return Building2;
      default: return Users;
    }
  };

  const getAppTypeColor = (type: ApplicationType) => {
    switch (type) {
      case 'Student': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
      case 'Organisation': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
      default: return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
    }
  };

  if (!hasRoom) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center border border-amber-200 dark:border-amber-500/30 bg-white dark:bg-slate-900 shadow-xl space-y-3">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
        <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white">Awaiting Room Assignment</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Your judge profile has not been assigned to a judging room by the Administrator. Please contact the coordinator to be assigned to an arena.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 mb-2">
            <DoorOpen className="h-3.5 w-3.5" />
            <span>Assigned Judging Arena: {roomNumber}</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Assigned Projects
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Projects assigned to your room for evaluation. Select any project to enter or update your scoring.
          </p>
        </div>

        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-4 text-center shrink-0">
          <p className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300">Projects in Room</p>
          <p className="font-heading text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{assignedProjects.length}</p>
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
            placeholder="Search assigned projects by title, code, participant..."
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as ApplicationType | 'All')}
          className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="All">All Application Types</option>
          <option value="Student">Student</option>
          <option value="Organisation">Organisation</option>
          <option value="Individual or Group">Individual or Group</option>
        </select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <FolderGit2 className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No projects found in this room</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map(project => {
            const AppTypeIcon = getAppTypeIcon(project.applicationType);
            const category = HEAD_CATEGORIES.find(h => h.code === project.headCategory);
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
