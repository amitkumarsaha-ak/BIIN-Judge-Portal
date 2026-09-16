import { Router, Request, Response } from 'express';
import { evaluationDb, settingsDb, auditDb, userDb, projectDb, assignmentDb } from '../db/index.js';

const router = Router();

function canonicalAppType(type?: string): string {
  const t = (type || '').toLowerCase().trim();
  if (t.includes('tertiary') || t === 'student-tertiary') {
    return 'Student-Tertiary';
  }
  if (t === 'student' || t === 'student-secondary' || t.includes('secondary')) {
    return 'Student-Secondary';
  }
  if (t.includes('org')) {
    return 'Organisation';
  }
  if (t.includes('individual') || t.includes('group')) {
    return 'Individual or Group';
  }
  return 'Student-Secondary';
}

function matchesAppType(projectType?: string, filterType?: string): boolean {
  if (!filterType || filterType === 'All' || filterType === 'All Application Types') return true;
  if (!projectType || projectType === 'All' || projectType === 'All Application Types') return true;
  if (projectType.trim().toLowerCase() === filterType.trim().toLowerCase()) return true;
  return canonicalAppType(projectType) === canonicalAppType(filterType);
}

function matchesCategory(projectCategory?: string, filterCategory?: string, projectAppType?: string): boolean {
  if (!filterCategory || filterCategory === 'All' || filterCategory === 'All Head Category' || filterCategory === 'All Head Categories' || filterCategory === 'N/A') {
    return true;
  }
  const appType = canonicalAppType(projectAppType);
  if (appType === 'Student-Secondary' || appType === 'Individual or Group') {
    return true;
  }
  const pc = (projectCategory || '').toLowerCase().trim();
  const fc = filterCategory.toLowerCase().trim();
  if (!pc || pc === 'all' || pc === 'all head category' || pc === 'all head categories' || pc === 'all categories' || pc === 'all category' || pc === 'n/a' || pc === 'null' || pc === 'none') {
    return true;
  }
  if (pc === fc) return true;

  if (appType === 'Organisation') {
    const isFilterMerged = isOrgMergedHeadCategory(filterCategory);
    const isProjMerged = isOrgMergedHeadCategory(projectCategory);
    if (isFilterMerged && isProjMerged) {
      return true;
    }
  }

  return canonicalHeadCategory(projectCategory) === canonicalHeadCategory(filterCategory);
}

function canonicalHeadCategory(cat?: string): string {
  const c = (cat || '').toLowerCase().trim();
  if (!c || c === 'n/a' || c === 'none' || c === 'null') return 'N/A';
  if (
    c === 'hc-psg-i-c' ||
    c.includes('psg-i-c') ||
    (c.includes('public') && (c.includes('industrial') || c.includes('consumer')))
  ) {
    return 'HC-PSG-I-C';
  }
  if (c === 'hc-c' || c === 'hc-01' || c === 'hc-1' || c.includes('consumer')) return 'HC-C';
  if (c === 'hc-bs' || c === 'hc-02' || c === 'hc-2' || c.includes('business')) return 'HC-BS';
  if (c === 'hc-i' || c === 'hc-03' || c === 'hc-3' || c.includes('industrial') || c.includes('robot')) return 'HC-I';
  if (c === 'hc-psg' || c === 'hc-04' || c === 'hc-4' || c.includes('public') || c.includes('government') || c.includes('smart city') || c.includes('civic')) return 'HC-PSG';
  if (c === 'hc-ics' || c === 'hc-05' || c === 'hc-5' || c.includes('communication') || c.includes('inclusion') || c.includes('community')) return 'HC-ICS';
  return cat ? cat.trim() : 'HC-C';
}

function isOrgMergedHeadCategory(cat?: string): boolean {
  if (!cat) return false;
  const c = cat.toLowerCase().trim();
  if (
    c === 'hc-psg-i-c' ||
    c.includes('psg-i-c') ||
    (c.includes('public') && (c.includes('industrial') || c.includes('consumer'))) ||
    c.includes('public sector and government')
  ) {
    return true;
  }
  const canon = canonicalHeadCategory(cat);
  return canon === 'HC-PSG' || canon === 'HC-I' || canon === 'HC-C' || canon === 'HC-PSG-I-C';
}

function getCategoryLockKey(appType?: string, headCategory?: string | null): string {
  const normType = canonicalAppType(appType);
  if (normType === 'Student-Secondary' || normType === 'Individual or Group') {
    return `${normType}___NONE`;
  }
  if (normType === 'Organisation') {
    if (isOrgMergedHeadCategory(headCategory || '')) {
      return 'Organisation___HC-PSG-I-C';
    }
  }
  const normCategory = canonicalHeadCategory(headCategory || '');
  return `${normType}___${normCategory}`;
}

function isEvaluationLocked(settings: any, project: any, projectId: string): boolean {
  if (settings.evaluationsLocked) return true;
  if (Array.isArray(settings.lockedProjects) && settings.lockedProjects.includes(projectId)) return true;
  if (!settings.categoryLocks || !project) return false;

  const key = getCategoryLockKey(project.applicationType, project.headCategory);
  if (settings.categoryLocks[key]) return true;

  // Variant check (Organisation vs Organization)
  const altKey = key.startsWith('Organisation')
    ? key.replace('Organisation', 'Organization')
    : key.replace('Organization', 'Organisation');
  if (settings.categoryLocks[altKey]) return true;

  return false;
}

/**
 * GET /api/evaluations
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const evaluations = await evaluationDb.getAll();
    res.json(evaluations);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch evaluations.' });
  }
});

/**
 * GET /api/evaluations/judge/:email
 */
router.get('/judge/:email', async (req: Request, res: Response): Promise<void> => {
  try {
    const evaluations = await evaluationDb.getByJudge(req.params.email);
    res.json(evaluations);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch judge evaluations.' });
  }
});

/**
 * GET /api/evaluations/project/:projectId
 */
router.get('/project/:projectId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { judgeEmail } = req.query;
    if (judgeEmail) {
      const evaluation = await evaluationDb.getForProject(req.params.projectId, String(judgeEmail));
      if (!evaluation) {
        res.status(404).json({ error: 'Evaluation not found for this judge and project.' });
        return;
      }
      res.json(evaluation);
      return;
    }

    const all = await evaluationDb.getAll();
    const forProject = all.filter(e => e.projectId === req.params.projectId);
    res.json(forProject);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch project evaluations.' });
  }
});

/**
 * POST /api/evaluations
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const evaluation = req.body;
    const actor = req.body._actor;

    if (!evaluation.projectId || !evaluation.judgeEmail || !evaluation.scores) {
      res.status(400).json({ error: 'projectId, judgeEmail, and scores are required.' });
      return;
    }

    // 1. Verify judge user approval
    const judgeUser = await userDb.findByEmail(evaluation.judgeEmail);
    if (judgeUser && judgeUser.status && judgeUser.status !== 'approved') {
      res.status(403).json({ error: 'Judge account is not approved by Administrator.' });
      return;
    }

    // 2. Verify project assignment (Administrators bypass this check)
    const isAdminUser = judgeUser?.role === 'admin' || actor?.email === 'admin@biin.org';
    const targetProject = await projectDb.findById(evaluation.projectId);

    if (!isAdminUser && targetProject) {
      const judgeAssignments = await assignmentDb.getByJudge(evaluation.judgeEmail);
      // If the administrator has configured assignments for this judge, strictly enforce them.
      // If no assignments have been configured yet, allow the approved judge to evaluate.
      if (judgeAssignments.length > 0) {
        const isAssigned = judgeAssignments.some(asgn => {
          // Specific project assignment takes precedence
          if (Array.isArray(asgn.projectIds) && asgn.projectIds.length > 0) {
            const cleanIds = asgn.projectIds.map((id: string) => String(id || '').trim().toLowerCase());
            const matchId = cleanIds.includes(String(targetProject.id || '').trim().toLowerCase());
            const matchAppId = Boolean(targetProject.applicationId) && cleanIds.includes(String(targetProject.applicationId || '').trim().toLowerCase());
            const matchCode = Boolean(targetProject.projectCode) && cleanIds.includes(String(targetProject.projectCode || '').trim().toLowerCase());
            return matchId || matchAppId || matchCode;
          }

          if (!matchesAppType(targetProject.applicationType, asgn.applicationType)) {
            return false;
          }

          if (!matchesCategory(targetProject.headCategory, asgn.headCategory, targetProject.applicationType)) {
            return false;
          }

          return true;
        });

        if (!isAssigned) {
          res.status(403).json({ error: 'This project is not assigned to your account. You can only evaluate projects assigned to you by the Administrator.' });
          return;
        }
      }
    }

    // 3. Verify scores are 1-10
    for (const [criterion, score] of Object.entries(evaluation.scores)) {
      const numScore = Number(score);
      if (isNaN(numScore) || numScore < 1 || numScore > 10) {
        res.status(400).json({
          error: `Invalid score for criterion "${criterion}": ${score}. Must be between 1 and 10.`
        });
        return;
      }
    }

    // 4. Verify global, category, and project lock state
    const settings = await settingsDb.get();
    if (isEvaluationLocked(settings, targetProject, evaluation.projectId)) {
      res.status(423).json({ error: 'Evaluations are currently locked for this category or project by the Administrator.' });
      return;
    }

    const saved = await evaluationDb.save({
      ...evaluation,
      id: evaluation.id || `eval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      submittedAt: evaluation.submittedAt || new Date().toISOString()
    });

    if (actor) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email || evaluation.judgeEmail,
        actorName: actor.name || evaluation.judgeName,
        action: 'SUBMIT_EVALUATION',
        targetType: 'evaluation',
        details: `Evaluation score ${saved.convertedScore}/100 recorded for project ${saved.projectId} by ${saved.judgeName}.`,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit evaluation.' });
  }
});

/**
 * PUT /api/evaluations/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const evalId = req.params.id;
    let evaluation = { ...req.body, id: evalId };

    // Find existing if some fields are omitted
    const all = await evaluationDb.getAll();
    const existing = all.find(e => e.id === evalId);
    if (existing) {
      evaluation = {
        ...existing,
        ...evaluation,
        id: evalId
      };
    }

    if (!evaluation.projectId || !evaluation.judgeEmail || !evaluation.scores) {
      res.status(400).json({ error: 'projectId, judgeEmail, and scores are required.' });
      return;
    }

    // Verify scores are 1-10
    for (const [criterion, score] of Object.entries(evaluation.scores)) {
      const numScore = Number(score);
      if (isNaN(numScore) || numScore < 1 || numScore > 10) {
        res.status(400).json({
          error: `Invalid score for criterion "${criterion}": ${score}. Must be between 1 and 10.`
        });
        return;
      }
    }

    // Check lock state
    const settings = await settingsDb.get();
    const targetProject = await projectDb.findById(evaluation.projectId);
    if (isEvaluationLocked(settings, targetProject, evaluation.projectId)) {
      res.status(423).json({ error: 'Evaluations are currently locked for this category or project by the Administrator.' });
      return;
    }

    const saved = await evaluationDb.save(evaluation);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update evaluation.' });
  }
});

/**
 * DELETE /api/evaluations/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await evaluationDb.delete(req.params.id);
    const actor = req.body.actor;

    if (actor && success) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'DELETE_EVALUATION',
        targetType: 'evaluation',
        details: `Deleted evaluation submission ID ${req.params.id}.`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success, message: 'Evaluation deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete evaluation.' });
  }
});

export default router;
