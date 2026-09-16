import { Router, Request, Response } from 'express';
import { settingsDb, auditDb } from '../db/index.js';

const router = Router();

/**
 * GET /api/settings
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await settingsDb.get();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch settings.' });
  }
});

/**
 * PUT /api/settings
 */
router.put('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { evaluationsLocked, finalResultsLocked, lockedProjects, categoryLocks, autoRankingEnabled, actor } = req.body;
    let finalCategoryLocks = categoryLocks;
    if (categoryLocks && typeof categoryLocks === 'object') {
      finalCategoryLocks = { ...categoryLocks };
      for (const [k, v] of Object.entries(categoryLocks)) {
        if (k.startsWith('Organisation___')) {
          finalCategoryLocks[k.replace('Organisation___', 'Organization___')] = Boolean(v);
        } else if (k.startsWith('Organization___')) {
          finalCategoryLocks[k.replace('Organization___', 'Organisation___')] = Boolean(v);
        }
      }
    }
    const updated = await settingsDb.update({
      evaluationsLocked,
      finalResultsLocked,
      lockedProjects,
      categoryLocks: finalCategoryLocks,
      autoRankingEnabled
    });

    if (actor) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'UPDATE_SETTINGS',
        targetType: 'settings',
        details: 'Updated global system lock settings and ranking preferences.',
        timestamp: new Date().toISOString()
      });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update settings.' });
  }
});

/**
 * POST /api/settings/toggle-evaluation-lock
 */
router.post('/toggle-evaluation-lock', async (req: Request, res: Response): Promise<void> => {
  try {
    const { locked, actor } = req.body;
    const current = await settingsDb.get();
    const updated = await settingsDb.update({ evaluationsLocked: Boolean(locked) });

    if (actor) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: locked ? 'LOCK_EVALUATIONS' : 'UNLOCK_EVALUATIONS',
        targetType: 'settings',
        details: `${locked ? 'Locked' : 'Unlocked'} all evaluation submissions globally.`,
        timestamp: new Date().toISOString()
      });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle evaluation lock.' });
  }
});

/**
 * POST /api/settings/toggle-final-result-lock
 */
router.post('/toggle-final-result-lock', async (req: Request, res: Response): Promise<void> => {
  try {
    const { locked, actor } = req.body;
    const updated = await settingsDb.update({ finalResultsLocked: Boolean(locked) });

    if (actor) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: locked ? 'LOCK_FINAL_RESULTS' : 'UNLOCK_FINAL_RESULTS',
        targetType: 'settings',
        details: `${locked ? 'Locked' : 'Unlocked'} final portal results and awards.`,
        timestamp: new Date().toISOString()
      });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle final result lock.' });
  }
});

/**
 * POST /api/settings/toggle-project-lock
 */
router.post('/toggle-project-lock', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, actor } = req.body;
    if (!projectId) {
      res.status(400).json({ error: 'projectId is required.' });
      return;
    }

    const current = await settingsDb.get();
    let lockedProjects = [...(current.lockedProjects || [])];
    const isLocked = lockedProjects.includes(projectId);

    if (isLocked) {
      lockedProjects = lockedProjects.filter(id => id !== projectId);
    } else {
      lockedProjects.push(projectId);
    }

    const updated = await settingsDb.update({ lockedProjects });

    if (actor) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: !isLocked ? 'LOCK_PROJECT' : 'UNLOCK_PROJECT',
        targetType: 'settings',
        details: `${!isLocked ? 'Locked' : 'Unlocked'} evaluation access for project ${projectId}.`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, isLocked: !isLocked, settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle project lock.' });
  }
});

/**
 * POST /api/settings/toggle-category-lock
 */
router.post('/toggle-category-lock', async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, locked, actor } = req.body;
    const current = await settingsDb.get();
    const categoryLocks: Record<string, boolean> = { ...(current.categoryLocks || {}), [key]: Boolean(locked) };
    if (typeof key === 'string') {
      if (key.startsWith('Organisation___')) {
        categoryLocks[key.replace('Organisation___', 'Organization___')] = Boolean(locked);
      } else if (key.startsWith('Organization___')) {
        categoryLocks[key.replace('Organization___', 'Organisation___')] = Boolean(locked);
      }
    }
    const updated = await settingsDb.update({ categoryLocks });

    if (actor) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: locked ? 'LOCK_CATEGORY_EVALUATION' : 'UNLOCK_CATEGORY_EVALUATION',
        targetType: 'settings',
        details: `${locked ? 'Locked' : 'Unlocked'} evaluation submissions for category key "${key}".`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, isLocked: Boolean(locked), settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle category lock.' });
  }
});

export default router;
