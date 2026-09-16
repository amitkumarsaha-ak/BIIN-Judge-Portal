import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, AlertCircle, Info, ShieldCheck, Lock } from 'lucide-react';
import type { Project, EvaluationScores, Evaluation } from '../../types';
import {
  getCriteriaForApplicationType,
  getMaxRawScoreForApplicationType,
  calculateRawTotal,
  calculateConvertedScore,
  formatScoreNumber
} from '../../utils/evaluation';
import { ProjectInfoPanel } from './ProjectInfoPanel';
import { CriteriaScorer } from './CriteriaScorer';
import { ScoreSummaryBar } from './ScoreSummaryBar';
import { ConfirmationModal } from './ConfirmationModal';
import { AlreadyEvaluatedAlert } from './AlreadyEvaluatedAlert';
import { EvaluationSuccessView } from './EvaluationSuccessView';
import {
  getEvaluationForProject,
  saveEvaluation,
  getSystemSettings,
  isProjectEvaluationLocked,
  isProjectAssignedToJudge,
  SETTINGS_KEY
} from '../../services/storage';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface ProjectEvaluationViewProps {
  project: Project;
  onBack: () => void;
  onGoToDashboard: () => void;
}

export const ProjectEvaluationView: React.FC<ProjectEvaluationViewProps> = ({
  project,
  onBack,
  onGoToDashboard
}) => {
  const { currentUser } = useAuth();
  
  const existingEvaluation = currentUser
    ? getEvaluationForProject(project.id, currentUser.email)
    : undefined;

  const activeCriteria = getCriteriaForApplicationType(project.applicationType);
  const maxRawScore = getMaxRawScoreForApplicationType(project.applicationType);

  // Initialize scores state dynamically per criteria: empty by default
  const [scores, setScores] = useState<EvaluationScores>(() => {
    const initial: EvaluationScores = {};
    activeCriteria.forEach((c) => {
      const existingVal = existingEvaluation?.scores?.[c.key];
      initial[c.key] = existingVal !== undefined ? existingVal : undefined;
    });
    return initial;
  });

  const [feedback, setFeedback] = useState<string>(existingEvaluation?.feedback ?? '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submittedEvaluation, setSubmittedEvaluation] = useState<Evaluation | null>(null);

  // Safe web-level deterrence: prevent accidental print shortcut and clear clipboard on PrintScreen in judge evaluation without blocking inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        try {
          navigator.clipboard?.writeText('');
        } catch {}
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const [, setSettings] = useState(() => getSystemSettings());

  useEffect(() => {
    let mounted = true;
    const refreshSettings = () => {
      setSettings(getSystemSettings());
    };

    api.getSettings().then(cloudSettings => {
      if (!mounted || !cloudSettings) return;
      const local = getSystemSettings();
      const merged = {
        ...local,
        ...cloudSettings,
        categoryLocks: {
          ...(local.categoryLocks || {}),
          ...(cloudSettings.categoryLocks || {})
        }
      };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      } catch { /* ignore */ }
      setSettings(merged);
    }).catch(() => {});

    window.addEventListener('biin_settings_updated', refreshSettings);
    window.addEventListener('storage', refreshSettings);
    return () => {
      mounted = false;
      window.removeEventListener('biin_settings_updated', refreshSettings);
      window.removeEventListener('storage', refreshSettings);
    };
  }, []);

  const isLocked = isProjectEvaluationLocked(project);
  const isAssigned = currentUser ? isProjectAssignedToJudge(currentUser.email, project) : false;

  const rawTotalScore = calculateRawTotal(scores, activeCriteria);
  const convertedScore = calculateConvertedScore(rawTotalScore, maxRawScore);

  const handleScoreChange = (criteriaKey: string, value: number | undefined) => {
    setValidationError(null);
    setScores((prev) => ({
      ...prev,
      [criteriaKey]: value
    }));
  };

  const handleOpenSubmissionModal = () => {
    setValidationError(null);

    if (isLocked) {
      setValidationError('Evaluation is locked for this Application Type and Head Category.');
      return;
    }

    if (!isAssigned) {
      setValidationError('You are not assigned to evaluate this project. Only assigned judges can submit scores.');
      return;
    }

    const missingCriteria = activeCriteria.filter((crit) => {
      const val = scores[crit.key];
      return val === undefined || val === null || isNaN(val);
    });

    if (missingCriteria.length > 0) {
      if (missingCriteria.length === 1) {
        setValidationError(`Please provide a mark for "${missingCriteria[0].label}" before submitting.`);
      } else {
        const missingLabels = missingCriteria.map((c) => `"${c.label}"`).join(', ');
        setValidationError(`Please provide marks for all evaluation criteria before submitting. Missing: ${missingLabels}.`);
      }
      const el = document.getElementById('evaluation-criteria-section');
      el?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    for (const crit of activeCriteria) {
      const val = scores[crit.key];
      if (val !== undefined && (val < 1 || val > 10)) {
        setValidationError(`Score for "${crit.label}" must be between 1 and 10. Zero scores are not permitted.`);
        return;
      }
    }

    if (rawTotalScore > maxRawScore) {
      setValidationError(`Total score cannot exceed maximum raw marks of ${maxRawScore}.`);
      return;
    }

    setIsModalOpen(true);
  };

  const handleConfirmSubmit = () => {
    if (!currentUser) return;

    if (isLocked) {
      setValidationError('Evaluation is locked for this Application Type and Head Category.');
      setIsModalOpen(false);
      return;
    }

    if (!isAssigned) {
      setValidationError('You are not assigned to evaluate this project.');
      setIsModalOpen(false);
      return;
    }

    const evaluationRecord: Evaluation = {
      id: existingEvaluation?.id || `eval-${Date.now()}`,
      projectId: project.id,
      judgeEmail: currentUser.email,
      judgeName: currentUser.fullName,
      roomNumber: project.roomNumber || '',
      scores,
      feedback: feedback.trim() || undefined,
      rawTotalScore,
      maxRawScore,
      convertedScore,
      totalScore: rawTotalScore,
      percentage: convertedScore,
      submittedAt: new Date().toISOString()
    };

    saveEvaluation(evaluationRecord, { email: currentUser.email, name: currentUser.fullName });
    setIsModalOpen(false);
    setSubmittedEvaluation(evaluationRecord);
  };

  if (submittedEvaluation) {
    return (
      <EvaluationSuccessView
        project={project}
        evaluation={submittedEvaluation}
        onEvaluateAnother={onBack}
        onBackToProjects={onBack}
        onGoToDashboard={onGoToDashboard}
      />
    );
  }

  return (
    <div className="space-y-8 pb-24">
      
      {/* Top Back Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 rounded-xl bg-white dark:bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700/60 shadow-sm self-start min-h-[38px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Project Selection</span>
        </button>

        <div className="flex items-center space-x-2 sm:space-x-3 text-xs self-start sm:self-auto flex-wrap">
          <span className="rounded-lg bg-indigo-50 dark:bg-indigo-500/20 px-2.5 py-1 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-semibold">
            {project.applicationType}
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-mono">
            Evaluating ID: <strong className="text-slate-900 dark:text-slate-200">{project.id}</strong>
          </span>
        </div>
      </div>

      {/* 1. Project Details Header Panel */}
      <ProjectInfoPanel project={project} />

      {/* Lock Notice Banner If Locked */}
      {isLocked && (
        <div className="flex items-center space-x-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 p-4 text-xs text-red-700 dark:text-red-300 shadow-sm">
          <Lock className="h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="font-bold">Evaluation Locked</p>
            <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
              Evaluation is locked for this Application Type and Head Category.
            </p>
          </div>
        </div>
      )}

      {/* Unassigned Notice Banner If Not Assigned to Judge */}
      {!isAssigned && (
        <div className="flex items-center space-x-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 p-4 text-xs text-amber-800 dark:text-amber-300 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-bold">Project Not Assigned to You</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
              This project is not within your assigned scope. Only judges explicitly assigned by the administrator may evaluate it.
            </p>
          </div>
        </div>
      )}

      {/* Official Scoring Guidelines Banner */}
      <div className="rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/60 p-4 sm:p-5 border border-indigo-200 dark:border-indigo-500/40 space-y-1.5 shadow-sm">
        <div className="flex items-center space-x-2 text-indigo-800 dark:text-indigo-200 font-bold text-sm">
          <Info className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <span>Official Scoring Guidelines & Rules:</span>
        </div>
        <ul className="text-xs text-indigo-900 dark:text-indigo-200 list-disc list-inside space-y-1 pl-1">
          <li>Each criterion is scored from <strong>1 to 10</strong> (zero scores are not permitted).</li>
          <li>The final score is calculated as a mark average of all judges' evaluations converted to <strong>/ 100</strong>.</li>
        </ul>
      </div>

      {/* 2. Already Evaluated Banner (If previously evaluated) */}
      {existingEvaluation && (
        <AlreadyEvaluatedAlert
          evaluation={existingEvaluation}
          onEdit={() => {
            const el = document.getElementById('evaluation-criteria-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* 3. Evaluation Criteria Section */}
      <div id="evaluation-criteria-section" className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="font-heading text-2xl font-extrabold text-slate-900 dark:text-white">
              Evaluation Criteria ({project.applicationType})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Grade each criterion (1-10 marks). Total maximum raw score is <strong>{maxRawScore}</strong> marks, automatically converted to <strong>100%</strong>.
            </p>
          </div>
          <span className="inline-flex items-center space-x-1.5 rounded-full bg-cyan-50 dark:bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
            <ShieldCheck className="h-4 w-4" />
            <span>{activeCriteria.length} Criteria Category</span>
          </span>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="flex items-center space-x-2 rounded-2xl bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Criteria Scorer Cards */}
        <div className="space-y-4">
          {activeCriteria.map((crit, index) => (
            <CriteriaScorer
              key={crit.key}
              criteria={crit}
              score={scores[crit.key]}
              onChangeScore={(val) => handleScoreChange(crit.key, val)}
              index={index}
              disabled={isLocked || !isAssigned}
            />
          ))}
        </div>

        {/* Optional Qualitative Feedback / Notes */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Judge Notes & Qualitative Feedback (Optional)
          </label>
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={isLocked || !isAssigned}
            placeholder="Enter qualitative comments, key strengths, or areas for improvement..."
            className="w-full rounded-2xl bg-slate-50 dark:bg-slate-900/90 p-4 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Evaluation Lock Banner */}
        {isLocked && (
          <div className="flex items-center space-x-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 p-4 text-xs">
            <Lock className="h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-bold text-red-700 dark:text-red-300">Evaluation Submissions Are Currently Locked</p>
              <p className="text-red-600 dark:text-red-400 mt-0.5">The administrator has locked evaluations. You can review scores but cannot submit or edit.</p>
            </div>
          </div>
        )}

        {/* Score Board / Final Score positioned directly above Submit button */}
        <ScoreSummaryBar
          totalScore={rawTotalScore}
          maxRawScore={maxRawScore}
          convertedScore={convertedScore}
        />

        {/* Submit Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleOpenSubmissionModal}
            disabled={isLocked || !isAssigned}
            className={`w-full sm:w-auto inline-flex items-center justify-center space-x-2 sm:space-x-3 rounded-2xl px-5 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-white shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[48px] ${isLocked || !isAssigned ? 'bg-slate-500' : 'btn-primary'}`}
          >
            {isLocked ? <Lock className="h-4 w-4 sm:h-5 sm:w-5" /> : !isAssigned ? <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" /> : <Send className="h-4 w-4 sm:h-5 sm:w-5" />}
            {isLocked ? (
              <span>Submissions Locked</span>
            ) : !isAssigned ? (
              <span>Not Assigned to Project</span>
            ) : (
              <>
                <span className="sm:hidden">
                  Submit Score ({formatScoreNumber(rawTotalScore)}/{maxRawScore} → {formatScoreNumber(convertedScore)}%)
                </span>
                <span className="hidden sm:inline">
                  Submit Evaluation ({formatScoreNumber(rawTotalScore)} / {maxRawScore} Raw → {formatScoreNumber(convertedScore)} / 100)
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {currentUser && (
        <ConfirmationModal
          isOpen={isModalOpen}
          project={project}
          scores={scores}
          rawTotalScore={rawTotalScore}
          maxRawScore={maxRawScore}
          convertedScore={convertedScore}
          judgeName={currentUser.fullName}
          onCancel={() => setIsModalOpen(false)}
          onConfirm={handleConfirmSubmit}
        />
      )}

    </div>
  );
};

