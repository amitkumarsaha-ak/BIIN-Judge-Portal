import { Router, Request, Response } from 'express';
import { assignmentDb, auditDb } from '../db/index.js';

const router = Router();

/**
 * GET /api/assignments
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await assignmentDb.getAll();
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch assignments.' });
  }
});

/**
 * GET /api/assignments/judge/:email
 */
router.get('/judge/:email', async (req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await assignmentDb.getByJudge(req.params.email);
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch assignments for judge.' });
  }
});

/**
 * POST /api/assignments
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, judgeId, judgeEmail, judgeName, applicationType, headCategory, projectIds, _actor } = req.body;

    if (!judgeEmail || !applicationType) {
      res.status(400).json({ error: 'judgeEmail and applicationType are required.' });
      return;
    }

    const assignment = {
      id: id || `asgn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      judgeId: judgeId || `judge-${judgeEmail}`,
      judgeEmail: judgeEmail.trim().toLowerCase(),
      judgeName: judgeName || 'Judge',
      applicationType,
      headCategory: headCategory || null,
      projectIds: Array.isArray(projectIds) ? projectIds : [],
      createdAt: new Date().toISOString()
    };

    const saved = await assignmentDb.create(assignment);

    if (_actor) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: _actor.email,
        actorName: _actor.name,
        action: 'ASSIGN_PROJECTS',
        targetType: 'judge',
        details: `Assigned ${applicationType}${headCategory ? ` (${headCategory})` : ''} to Judge ${saved.judgeName} (${saved.judgeEmail}).`,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save assignment.' });
  }
});

/**
 * DELETE /api/assignments/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { actor } = req.body;
    const success = await assignmentDb.delete(req.params.id);

    if (actor && success) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'DELETE_ASSIGNMENT',
        targetType: 'judge',
        details: `Removed assignment ID ${req.params.id}.`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success, message: 'Assignment deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete assignment.' });
  }
});

export default router;
