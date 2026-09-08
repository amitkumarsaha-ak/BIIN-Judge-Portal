import React from 'react';
import { Award, ArrowRight, CheckCircle2, Building2, GraduationCap, Users, University } from 'lucide-react';
import type { Project, Evaluation } from '../../types';
import { getMaxRawScoreForApplicationType } from '../../utils/evaluation';

interface ProjectCardProps {
  project: Project;
  evaluation?: Evaluation;
  onEvaluate: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, evaluation, onEvaluate }) => {
  const getAppTypeIcon = (type: string) => {
    switch (type) {
      case 'Student':
        return GraduationCap;
      case 'Organisation':
        return Building2;
      case 'Student-Tertiary':
        return University;
      default:
        return Users;
    }
  };

  const AppTypeIcon = getAppTypeIcon(project.applicationType);
  const isEvaluated = Boolean(evaluation);
  const maxRawScore = evaluation?.maxRawScore || getMaxRawScoreForApplicationType(project.applicationType);
  const rawScore = evaluation ? (evaluation.rawTotalScore ?? evaluation.totalScore ?? 0) : 0;
  const converted = evaluation ? (evaluation.convertedScore ?? evaluation.percentage ?? 0) : 0;

  return (
    <div className={`group relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 ${
      isEvaluated
        ? 'bg-emerald-50/60 dark:bg-slate-900/80 border border-emerald-300 dark:border-emerald-500/30 shadow-lg shadow-emerald-950/10'
        : 'glass-panel glass-panel-hover border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
    }`}>
      
      <div>
        {/* Category & Application Type Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center space-x-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
            <span>{project.headCategory}</span>
          </span>

          <span className="inline-flex items-center space-x-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
            <AppTypeIcon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>{project.applicationType}</span>
          </span>

          {isEvaluated && (
            <span className="inline-flex items-center space-x-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 ml-auto">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Evaluated</span>
            </span>
          )}
        </div>

        {/* Project Name & Team */}
        <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
          {project.title}
        </h3>

        <div className="mt-1 flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{project.teamOrOrgName}</span>
          {project.institutionOrOrg && (
            <>
              <span>•</span>
              <span className="truncate">{project.institutionOrOrg}</span>
            </>
          )}
        </div>

        {/* Short Description */}
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
          {project.description}
        </p>

        {/* Tag pills */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700/50">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Evaluated Score Summary or Action Button */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        {isEvaluated && evaluation ? (
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Submitted Score</div>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="font-mono text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {rawScore.toFixed(1)} <span className="text-xs text-slate-500 dark:text-slate-400">/ {maxRawScore}</span>
              </span>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 font-mono">
                {converted.toFixed(1)} / 100
              </span>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500">
            Ready for evaluation
          </div>
        )}

        <button
          onClick={() => onEvaluate(project)}
          className={`inline-flex items-center space-x-2 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-md transition-all ${
            isEvaluated
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-indigo-600 hover:text-white border border-slate-300 dark:border-slate-700'
              : 'btn-primary text-white'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>{isEvaluated ? 'View / Edit Score' : 'Evaluate Project'}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

    </div>
  );
};

