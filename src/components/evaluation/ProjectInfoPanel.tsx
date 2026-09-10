import React from 'react';
import { GraduationCap, Building2, Users, University } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectInfoPanelProps {
  project: Project;
}

export const ProjectInfoPanel: React.FC<ProjectInfoPanelProps> = ({ project }) => {
  const isStudent = project.applicationType === 'Student';
  const isStudentTertiary = project.applicationType === 'Student-Tertiary' || project.applicationType === 'Student -Tertiary (University Level)';
  const isOrg = project.applicationType === 'Organisation' || project.applicationType === 'Organization';

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-6">
      
      {/* Header Badges & Solution Name */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center space-x-1 rounded-full bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
            <span>{project.headCategory}</span>
          </span>

          <span className="inline-flex items-center space-x-1.5 rounded-full bg-cyan-50 dark:bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
            {isStudent ? (
              <GraduationCap className="h-3.5 w-3.5" />
            ) : isStudentTertiary ? (
              <University className="h-3.5 w-3.5" />
            ) : isOrg ? (
              <Building2 className="h-3.5 w-3.5" />
            ) : (
              <Users className="h-3.5 w-3.5" />
            )}
            <span>{project.applicationType}</span>
          </span>
        </div>

        <h1 className="font-heading text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
          {project.solutionName || project.title}
        </h1>
      </div>

      {/* Project Overview */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Project Overview
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          {project.projectOverview || project.description || 'No overview provided.'}
        </p>
      </div>

      {/* Problem Statement & Solution Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/5 p-4 border border-amber-200 dark:border-amber-500/20">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
            Problem Statement
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {project.problemStatement || 'Not provided.'}
          </p>
        </div>

        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-500/5 p-4 border border-indigo-200 dark:border-indigo-500/20">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block mb-1">
            Solution Summary
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {project.solutionSummary || 'Not provided.'}
          </p>
        </div>
      </div>

    </div>
  );
};
