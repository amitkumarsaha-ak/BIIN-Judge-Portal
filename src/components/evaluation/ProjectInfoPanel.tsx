import React from 'react';
import { Mail, Phone, Building, GraduationCap, Building2, Users, User, Globe, Hash } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectInfoPanelProps {
  project: Project;
}

export const ProjectInfoPanel: React.FC<ProjectInfoPanelProps> = ({ project }) => {
  const isStudent = project.applicationType === 'Student';
  const isOrg = project.applicationType === 'Organisation';

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-6">
      
      {/* Header Badges & Title */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center space-x-1 rounded-full bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
            <span>{project.headCategory}</span>
          </span>

          <span className="inline-flex items-center space-x-1.5 rounded-full bg-cyan-50 dark:bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
            {isStudent ? (
              <GraduationCap className="h-3.5 w-3.5" />
            ) : isOrg ? (
              <Building2 className="h-3.5 w-3.5" />
            ) : (
              <Users className="h-3.5 w-3.5" />
            )}
            <span>{project.applicationType}</span>
          </span>
        </div>

        <h1 className="font-heading text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
          {project.title}
        </h1>
      </div>

      {/* Dynamic Contact Details Grid */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/80 p-5 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
          {isStudent ? 'Student & Team Details' : isOrg ? 'Organisation Details' : 'Individual / Group Details'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          {/* 1. Name */}
          <div className="space-y-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {isStudent ? 'Student / Group Name:' : isOrg ? 'Organisation Name:' : 'Individual / Group Name:'}
            </span>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
              <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{project.teamOrOrgName}</span>
            </div>
          </div>

          {/* 2. Representative or Member(s) */}
          <div className="space-y-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {isStudent ? 'Lead Member:' : isOrg ? 'Representative Name:' : 'Lead Member:'}
            </span>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
              <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{project.representativeName}</span>
            </div>
          </div>

          {/* 3. Email */}
          <div className="space-y-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Email:</span>
            <div className="font-mono text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <Mail className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <a href={`mailto:${project.email}`} className="hover:underline text-cyan-700 dark:text-cyan-300">
                {project.email}
              </a>
            </div>
          </div>

          {/* 4. Contact Number */}
          <div className="space-y-1">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Contact Number:</span>
            <div className="font-mono text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{project.contactNumber}</span>
            </div>
          </div>

          {/* 5. Additional Institution / Registration info */}
          {project.institutionOrOrg && (
            <div className="sm:col-span-2 space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {isStudent ? 'University / Institution:' : isOrg ? 'Registration / Company Info:' : 'Affiliation:'}
              </span>
              <div className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center space-x-2">
                <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{project.institutionOrOrg}</span>
              </div>
            </div>
          )}

          {/* Members list if multiple */}
          {project.members && project.members.length > 1 && (
            <div className="sm:col-span-2 space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">All Team Members:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {project.members.map((m) => (
                  <span key={m} className="rounded bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Description & Overview */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Project Overview</h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          {project.description}
        </p>
      </div>

      {/* Problem Statement & Solution if available */}
      {project.problemStatement && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/5 p-4 border border-amber-200 dark:border-amber-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
              Problem Statement
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {project.problemStatement}
            </p>
          </div>

          <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-500/5 p-4 border border-indigo-200 dark:border-indigo-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block mb-1">
              Solution Summary
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {project.solutionSummary}
            </p>
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="flex items-center space-x-2 pt-2">
        <Hash className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">
              #{tag}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};
