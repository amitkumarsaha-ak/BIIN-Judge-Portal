import { Router, Request, Response } from 'express';
import { evaluationDb, settingsDb, auditDb, userDb, projectDb, assignmentDb } from '../db/index.js';

const router = Router();

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

    // 2. Verify project assignment
    const targetProject = await projectDb.findById(evaluation.projectId);
    if (targetProject) {
      const judgeAssignments = await assignmentDb.getByJudge(evaluation.judgeEmail);
      if (judgeAssignments.length === 0) {
        res.status(403).json({ error: 'No projects have been assigned to your account. You can only evaluate projects assigned to you by the Administrator.' });
        return;
      }

      const isAssigned = judgeAssignments.some(asgn => {
        // Specific project assignment takes precedence
        if (Array.isArray(asgn.projectIds) && asgn.projectIds.length > 0) {
          const matchId = asgn.projectIds.includes(targetProject.id);
          const matchAppId = Boolean(targetProject.applicationId) && asgn.projectIds.includes(targetProject.applicationId);
          const matchCode = Boolean(targetProject.projectCode) && asgn.projectIds.includes(targetProject.projectCode);
          return matchId || matchAppId || matchCode;
        }

        const typeMatch = asgn.applicationType === 'All Application Types' || 
                          asgn.applicationType.toLowerCase() === targetProject.applicationType.toLowerCase() ||
                          asgn.applicationType.replace(/[^a-z]/gi, '') === targetProject.applicationType.replace(/[^a-z]/gi, '');
        if (!typeMatch) return false;

        const isNoCategory = targetProject.applicationType.includes('Secondary') || 
                             targetProject.applicationType.includes('Individual') || 
                             targetProject.applicationType.includes('Group');
        if (!isNoCategory && asgn.headCategory && asgn.headCategory !== 'All Head Category' && asgn.headCategory !== 'N/A') {
          const catMatch = asgn.headCategory.toLowerCase() === (targetProject.headCategory || '').toLowerCase();
          if (!catMatch) return false;
        }

        return true;
      });

      if (!isAssigned) {
        res.status(403).json({ error: 'This project is not assigned to your account. You can only evaluate projects assigned to you by the Administrator.' });
        return;
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

    // 4. Verify global and project lock state
    const settings = await settingsDb.get();
    if (settings.evaluationsLocked) {
      res.status(423).json({ error: 'All project evaluations are currently locked by the Administrator.' });
      return;
    }
    if (settings.lockedProjects && settings.lockedProjects.includes(evaluation.projectId)) {
      res.status(423).json({ error: 'Evaluations for this specific project are locked by the Administrator.' });
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
    if (settings.evaluationsLocked) {
      res.status(423).json({ error: 'All project evaluations are currently locked by the Administrator.' });
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
