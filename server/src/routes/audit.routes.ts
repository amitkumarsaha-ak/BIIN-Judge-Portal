import { Router, Request, Response } from 'express';
import { auditDb } from '../db/index.js';

const router = Router();

/**
 * GET /api/audit
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await auditDb.getAll();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs.' });
  }
});

/**
 * POST /api/audit
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { actorEmail, actorName, action, targetType, details } = req.body;
    if (!actorEmail || !action || !targetType || !details) {
      res.status(400).json({ error: 'actorEmail, action, targetType, and details are required.' });
      return;
    }

    const entry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorEmail,
      actorName: actorName || 'System User',
      action,
      targetType,
      details,
      timestamp: new Date().toISOString()
    };

    await auditDb.create(entry);
    res.status(201).json(entry);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to log audit event.' });
  }
});

export default router;
