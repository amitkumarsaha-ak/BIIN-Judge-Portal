import React, { useState } from 'react';
import { Filter, Search, RotateCcw, AlertTriangle, Sparkles, FolderGit2 } from 'lucide-react';
import type { ApplicationType, HeadCategoryCode, Project } from '../../types';
import { ApplicationTypeSelector } from './ApplicationTypeSelector';
import { HeadCategorySelector } from './HeadCategorySelector';
import { ProjectCard } from './ProjectCard';
import { getProjects, getEvaluationsByJudge } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

interface ProjectFilterViewProps {
  onSelectProject: (project: Project) => void;
  initialType?: ApplicationType | null;
  initialCategory?: HeadCategoryCode | null;
}

export const ProjectFilterView: React.FC<ProjectFilterViewProps> = ({
  onSelectProject,
  initialType = 'Student',
  initialCategory = 'HC-C'
}) => {
  const { currentUser } = useAuth();
  const [selectedType, setSelectedType] = useState<ApplicationType | null>(initialType);
  const [selectedCategory, setSelectedCategory] = useState<HeadCategoryCode | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  const allProjects = getProjects();
  const judgeEvaluations = currentUser ? getEvaluationsByJudge(currentUser.email) : [];

  const filteredProjects = allProjects.filter((project) => {
    if (selectedType && project.applicationType !== selectedType) {
      return false;
    }
    if (selectedCategory && project.headCategory !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = project.title.toLowerCase().includes(q);
      const matchTeam = project.teamOrOrgName.toLowerCase().includes(q);
      const matchDesc = project.description.toLowerCase().includes(q);
      if (!matchTitle && !matchTeam && !matchDesc) return false;
    }

    return true;
  });

  const handleResetFilters = () => {
    setSelectedType(null);
    setSelectedCategory(null);
    setSearchQuery('');
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Title Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 mb-2">
              <FolderGit2 className="h-3.5 w-3.5" />
              <span>Project Evaluation Queue</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Select Project to Evaluate</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Choose an Application Type and Head Category to filter nominated projects for judging.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[240px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or team..."
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/90 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Step 1: Select Application Type */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <ApplicationTypeSelector
          selectedType={selectedType}
          onSelectType={(type) => setSelectedType(type)}
        />
      </div>

      {/* Step 2: Select Head Category */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <HeadCategorySelector
          selectedCategory={selectedCategory}
          onSelectCategory={(code) => setSelectedCategory(code)}
        />
      </div>

      {/* Active Filter Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <Filter className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-semibold text-slate-900 dark:text-white">Active Filters:</span>
          
          <span className="rounded-lg bg-indigo-50 dark:bg-indigo-500/20 px-2.5 py-1 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-medium">
            Type: {selectedType || 'All Types'}
          </span>

          <span className="rounded-lg bg-cyan-50 dark:bg-cyan-500/20 px-2.5 py-1 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-medium">
            Category: {selectedCategory || 'All Categories'}
          </span>

          {searchQuery && (
            <span className="rounded-lg bg-amber-50 dark:bg-amber-500/20 px-2.5 py-1 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 font-medium">
              Query: "{searchQuery}"
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
            Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </span>

          {(selectedType || selectedCategory || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Step 3: Filtered Projects Grid */}
      <div>
        <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span>Available Projects for Evaluation</span>
        </h2>

        {filteredProjects.length === 0 ? (
          /* Empty State */
          <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 dark:text-amber-400 mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No projects found for the selected category.</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
              There are currently no nominated projects matching the selected combination of{' '}
              <strong className="text-indigo-700 dark:text-indigo-300">{selectedType || 'Application Type'}</strong> and{' '}
              <strong className="text-cyan-700 dark:text-cyan-300">{selectedCategory || 'Head Category'}</strong>.
            </p>
            <button
              onClick={handleResetFilters}
              className="btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-lg"
            >
              Clear Filters & Show All Projects
            </button>
          </div>
        ) : (
          /* Project Grid */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const evalItem = judgeEvaluations.find((e) => e.projectId === project.id);
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  evaluation={evalItem}
                  onEvaluate={onSelectProject}
                />
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
