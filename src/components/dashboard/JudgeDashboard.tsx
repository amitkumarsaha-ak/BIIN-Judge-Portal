import { Layers, CheckCircle2, Clock, Award, ArrowRight, Eye, Calendar, Sparkles, Printer, Users, FileText, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStatsForJudge, getEvaluationsByJudge, getProjects } from '../../services/storage';
import { StatsCard } from './StatsCard';
import type { Project } from '../../types';
import { getMaxRawScoreForApplicationType } from '../../utils/evaluation';

interface JudgeDashboardProps {
  onStartEvaluating: () => void;
  onSelectProjectForEvaluation: (project: Project) => void;
  onOpenCombinedReport?: (projectId?: string) => void;
  onOpenIndividualReport?: (projectId?: string) => void;
  onOpenAdminProjects?: () => void;
}

export const JudgeDashboard: React.FC<JudgeDashboardProps> = ({
  onStartEvaluating,
  onSelectProjectForEvaluation,
  onOpenCombinedReport,
  onOpenIndividualReport,
  onOpenAdminProjects
}) => {
  const { currentUser, isAdmin } = useAuth();
  if (!currentUser) return null;

  const stats = getDashboardStatsForJudge(currentUser.email);
  const judgeEvaluations = getEvaluationsByJudge(currentUser.email);
  const allProjects = getProjects();

  const evaluationRows = judgeEvaluations.map((evalItem) => {
    const proj = allProjects.find((p) => p.id === evalItem.projectId);
    return {
      evaluation: evalItem,
      project: proj
    };
  });

  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 dark:from-indigo-950 dark:via-slate-900 dark:to-slate-950 p-6 sm:p-8 border border-indigo-500/30 shadow-2xl text-white">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-10 h-48 w-48 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-400/30">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Official BIIN Judge Workspace</span>
              </span>

              {currentUser.roomNumber && (
                <span className="inline-flex items-center space-x-1 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-mono font-bold text-cyan-300 border border-cyan-400/30">
                  <span>{currentUser.roomNumber}</span>
                </span>
              )}
            </div>

            <h1 className="font-heading text-3xl font-extrabold text-white sm:text-4xl">
              Welcome, {currentUser.fullName}!
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-indigo-100/90">
              Evaluate nominated projects across Student, Organisation, and Individual/Group categories using the multi-judge 100-point converted scoring system.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {isAdmin && onOpenAdminProjects && (
              <button
                onClick={onOpenAdminProjects}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-2xl bg-violet-600 px-5 py-3.5 font-bold text-white hover:bg-violet-500 shadow-xl transition-all text-xs"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Admin Project Management</span>
              </button>
            )}

            <button
              onClick={onStartEvaluating}
              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-2xl px-6 py-3.5 font-semibold text-white shadow-xl transition-all hover:scale-105"
            >
              <span>Evaluate Projects</span>
              <ArrowRight className="h-5 w-5" />
            </button>

            {onOpenCombinedReport && (
              <button
                onClick={() => onOpenCombinedReport()}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-2xl bg-white/10 dark:bg-slate-800 px-5 py-3.5 font-semibold text-white hover:bg-white/20 dark:hover:bg-slate-700 transition-colors border border-white/20 dark:border-slate-700 text-xs"
              >
                <Users className="h-4 w-4" />
                <span>Combined Results</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value={stats.totalProjects}
          subtitle="Nominated in BIIN competition"
          icon={Layers}
          colorScheme="indigo"
        />

        <StatsCard
          title="Evaluated Projects"
          value={stats.evaluatedProjectsCount}
          subtitle={`${Math.round((stats.evaluatedProjectsCount / (stats.totalProjects || 1)) * 100)}% complete`}
          icon={CheckCircle2}
          colorScheme="emerald"
        />

        <StatsCard
          title="Remaining Projects"
          value={stats.remainingProjectsCount}
          subtitle="Awaiting your score"
          icon={Clock}
          colorScheme="amber"
        />

        <StatsCard
          title="Avg Converted Score"
          value={stats.averageScore > 0 ? `${stats.averageScore} / 100` : 'N/A'}
          subtitle="Across your submissions"
          icon={Award}
          colorScheme="cyan"
        />
      </div>

      {/* Quick Access Report Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-500/30">
            <Printer className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Multi-Judge Reports & Print Sheet</h3>
            <p className="text-xs text-slate-500">Generate individual judge results, multi-judge combined scores, and A4 printable sheets.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {isAdmin && onOpenAdminProjects && (
            <button
              onClick={onOpenAdminProjects}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-violet-500 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Project Admin</span>
            </button>
          )}

          {onOpenIndividualReport && (
            <button
              onClick={() => onOpenIndividualReport()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Individual Reports</span>
            </button>
          )}

          {onOpenCombinedReport && (
            <button
              onClick={() => onOpenCombinedReport()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Combined 3-Judge Results</span>
            </button>
          )}
        </div>
      </div>

      {/* Recent Evaluations Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900/90">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Recently Evaluated Projects</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review your raw total and converted / 100 evaluation scores</p>
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 w-fit">
            Total Completed: {judgeEvaluations.length}
          </span>
        </div>

        {evaluationRows.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <Clock className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300">No evaluations submitted yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Select an Application Type and Head Category to begin evaluating your first project.
            </p>
            <button
              onClick={onStartEvaluating}
              className="btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold text-white"
            >
              Browse Projects Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Project & Team</th>
                  <th className="px-4 py-3.5">Room</th>
                  <th className="px-4 py-3.5">Application Type</th>
                  <th className="px-4 py-3.5 text-center">Raw Score</th>
                  <th className="px-4 py-3.5 text-center">Converted Score</th>
                  <th className="px-4 py-3.5 text-right">Date</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {evaluationRows.map(({ evaluation, project }) => {
                  const maxRaw = evaluation.maxRawScore || (project ? getMaxRawScoreForApplicationType(project.applicationType) : 50);
                  const rawScore = evaluation.rawTotalScore ?? evaluation.totalScore ?? 0;
                  const converted = evaluation.convertedScore ?? evaluation.percentage ?? 0;

                  return (
                    <tr key={evaluation.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      
                      {/* Project & Team */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{project?.title || 'Unknown Project'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{project?.teamOrOrgName}</div>
                      </td>

                      {/* Room */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                          {project?.roomNumber || evaluation.roomNumber || 'Room 01'}
                        </span>
                      </td>

                      {/* Application Type */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {project?.applicationType}
                        </span>
                      </td>

                      {/* Raw Score */}
                      <td className="px-4 py-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200 text-base">
                        {rawScore.toFixed(1)} / {maxRaw}
                      </td>

                      {/* Converted Score */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-mono">
                          {converted.toFixed(1)} / 100
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
                        <div className="flex items-center justify-end space-x-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{new Date(evaluation.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {project && (
                            <button
                              onClick={() => onSelectProjectForEvaluation(project)}
                              title="Edit Evaluation"
                              className="inline-flex items-center space-x-1 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                          )}

                          {project && onOpenCombinedReport && (
                            <button
                              onClick={() => onOpenCombinedReport(project.id)}
                              title="View Combined Result"
                              className="inline-flex items-center space-x-1 rounded-lg bg-cyan-50 dark:bg-cyan-600/20 px-2.5 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 hover:bg-cyan-600 hover:text-white transition-all"
                            >
                              <Users className="h-3.5 w-3.5" />
                              <span>Result</span>
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

