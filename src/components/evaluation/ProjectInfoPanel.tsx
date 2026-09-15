import React from 'react';
import { GraduationCap, Building2, Users, University, UserCheck } from 'lucide-react';
import type { Project } from '../../types';

import { canonicalAppType } from '../../utils/evaluation';

interface ProjectInfoPanelProps {
  project: Project;
}

export const ProjectInfoPanel: React.FC<ProjectInfoPanelProps> = ({ project }) => {
  const canon = canonicalAppType(project.applicationType);
  const isStudent = canon === 'Student-Secondary';
  const isStudentTertiary = canon === 'Student-Tertiary';
  const isOrg = canon === 'Organisation';

  const teamLead = project.teamLeadName || project.representativeName || '';

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-6">
      
      {/* Header Badges & Solution Name */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {project.headCategory && project.headCategory !== 'N/A' && canon !== 'Student-Secondary' && canon !== 'Individual or Group' && (
            <span className="inline-flex items-center space-x-1 rounded-full bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
              <span>{project.headCategory}</span>
            </span>
          )}

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

          {project.applicationId && (
            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {project.applicationId}
            </span>
          )}
        </div>

        <h1 className="font-heading text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
          {project.solutionName || project.title}
        </h1>

        {/* Team Lead Name & Team/Organization Info */}
        {(teamLead || project.teamOrOrgName) && (
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            {teamLead && (
              <div className="inline-flex items-center space-x-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 px-3.5 py-1.5 border border-amber-200 dark:border-amber-500/30 text-xs shadow-sm">
                <UserCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-amber-800 dark:text-amber-300 font-semibold">Team Lead Name:</span>
                <strong className="text-amber-950 dark:text-amber-100 font-bold">{teamLead}</strong>
              </div>
            )}
            {project.teamOrOrgName && (
              <div className="inline-flex items-center space-x-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 text-xs">
                <Users className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Participant / Org:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">{project.teamOrOrgName}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Project Overview */}
      <div className="space-y-2">
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
