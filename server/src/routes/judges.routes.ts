import { Router, Request, Response } from 'express';
import { userDb, auditDb } from '../db/index.js';

const router = Router();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@biin.org').toLowerCase().trim();

/**
 * GET /api/judges
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await userDb.getAll();
    const judges = users
      .filter(u => u.role === 'judge')
      .map(({ password: _, ...judge }) => judge);
    res.json(judges);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch judges.' });
  }
});

/**
 * PATCH /api/judges/:id/approve
 */
router.patch('/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (await userDb.findById(req.params.id)) || (await userDb.findByEmail(req.params.id));
    if (!user) {
      res.status(404).json({ error: 'Judge not found.' });
      return;
    }

    const updated = await userDb.update({ id: user.id, status: 'approved' });
    const actor = req.body.actor;

    if (actor && updated) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'APPROVE_JUDGE',
        targetType: 'judge',
        details: `Approved judge registration for ${updated.fullName} (${updated.email}).`,
        timestamp: new Date().toISOString()
      });
    }

    const { password: _, ...safeJudge } = updated!;
    res.json({ success: true, judge: safeJudge });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to approve judge.' });
  }
});

/**
 * PATCH /api/judges/:id/reject
 */
router.patch('/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (await userDb.findById(req.params.id)) || (await userDb.findByEmail(req.params.id));
    if (!user) {
      res.status(404).json({ error: 'Judge not found.' });
      return;
    }

    const updated = await userDb.update({ id: user.id, status: 'rejected' });
    const actor = req.body.actor;

    if (actor && updated) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'REJECT_JUDGE',
        targetType: 'judge',
        details: `Rejected judge registration for ${updated.fullName} (${updated.email}).`,
        timestamp: new Date().toISOString()
      });
    }

    const { password: _, ...safeJudge } = updated!;
    res.json({ success: true, judge: safeJudge });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reject judge.' });
  }
});

/**
 * PATCH /api/judges/:id/room
 */
router.patch('/:id/room', async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomNumber, actor } = req.body;
    const user = (await userDb.findById(req.params.id)) || (await userDb.findByEmail(req.params.id));
    if (!user) {
      res.status(404).json({ error: 'Judge not found.' });
      return;
    }

    const updated = await userDb.update({ id: user.id, roomNumber: (roomNumber || '').trim() });

    if (actor && updated) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'ASSIGN_JUDGE_ROOM',
        targetType: 'judge',
        details: `Assigned Judge ${updated.fullName} to ${roomNumber || 'unassigned'}.`,
        timestamp: new Date().toISOString()
      });
    }

    const { password: _, ...safeJudge } = updated!;
    res.json({ success: true, judge: safeJudge });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to assign judge room.' });
  }
});

/**
 * DELETE /api/judges/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (await userDb.findById(req.params.id)) || (await userDb.findByEmail(req.params.id));
    if (!user) {
      res.status(404).json({ error: 'Judge not found.' });
      return;
    }

    // Protect Admin account
    if (user.email.toLowerCase().trim() === ADMIN_EMAIL || user.role === 'admin') {
      res.status(403).json({ error: 'System administrator account cannot be removed.' });
      return;
    }

    const success = await userDb.delete(user.id);
    const actor = req.body.actor;

    if (actor && success) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'DELETE_USER',
        targetType: 'judge',
        details: `Deleted judge account for ${user.fullName} (${user.email}).`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success, message: 'Judge deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete judge.' });
  }
});

export default router;
