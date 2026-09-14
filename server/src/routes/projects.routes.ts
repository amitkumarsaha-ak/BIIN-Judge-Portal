import { Router, Request, Response } from 'express';
import { projectDb, auditDb } from '../db/index.js';

const router = Router();

/**
 * GET /api/projects
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicationType, headCategory, status } = req.query;
    let projects = await projectDb.getAll();

    if (status && status !== 'all') {
      projects = projects.filter(p => p.status === status);
    }
    if (applicationType && applicationType !== 'All' && applicationType !== 'All Application Types') {
      projects = projects.filter(p => p.applicationType === applicationType || p.applicationType === 'All Application Types');
    }
    if (headCategory && headCategory !== 'All' && headCategory !== 'All Head Category') {
      projects = projects.filter(p => p.headCategory === headCategory || p.headCategory === 'All Head Category');
    }

    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch projects.' });
  }
});

/**
 * GET /api/projects/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await projectDb.findById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve project.' });
  }
});

/**
 * POST /api/projects
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const p = req.body;
    const actor = req.body._actor;

    const titleVal = (p.solutionName || p.title || '').trim();
    const appTypeVal = p.applicationType || 'All Application Types';
    const headCatVal = p.headCategory || 'All Head Category';
    const appIdVal = (p.applicationId || `BIIN-2026-${Date.now().toString().slice(-4)}`).trim();

    if (!titleVal) {
      res.status(400).json({ error: 'Solution Name (title) is required.' });
      return;
    }

    const isNoHeadCategory = appTypeVal === 'Student-Secondary' || appTypeVal === 'Individual/Group' || appTypeVal === 'Individual or Group';
    const finalHeadCat = isNoHeadCategory ? 'N/A' : headCatVal;

    const newProject = {
      id: p.id || `proj-${Date.now()}`,
      title: titleVal,
      solutionName: titleVal,
      applicationId: appIdVal,
      projectCode: p.projectCode || appIdVal,
      applicationType: appTypeVal,
      headCategory: finalHeadCat,
      teamOrOrgName: p.teamOrOrgName || titleVal || 'Independent',
      representativeName: p.representativeName || 'Lead Contact',
      teamLeadName: p.teamLeadName || '',
      members: Array.isArray(p.members) ? p.members : [],
      email: p.email || 'contact@biin.org',
      contactNumber: p.contactNumber || 'N/A',
      institutionOrOrg: p.institutionOrOrg || '',
      description: (p.projectOverview || p.description || '').trim(),
      projectOverview: (p.projectOverview || p.description || '').trim(),
      problemStatement: p.problemStatement || '',
      solutionSummary: p.solutionSummary || '',
      tags: Array.isArray(p.tags) ? p.tags : [],
      roomNumber: p.roomNumber || '',
      status: p.status || 'active'
    };

    const created = await projectDb.create(newProject as any);

    if (actor) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'CREATE_PROJECT',
        targetType: 'project',
        details: `Created project "${created.title}" (${created.applicationId}).`,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create project.' });
  }
});

/**
 * POST /api/projects/bulk
 * Supports Excel file imports
 */
router.post('/bulk', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projects, actor } = req.body;
    if (!Array.isArray(projects)) {
      res.status(400).json({ error: 'Payload must include an array of projects.' });
      return;
    }

    const sanitizedProjects = projects.map((p, index) => {
      const title = (p.solutionName || p.title || 'Untitled Project').trim();
      const appId = (p.applicationId || `BIIN-2026-${Date.now().toString().slice(-4)}-${index}`).trim();
      const appType = p.applicationType || 'Student-Secondary';
      const isNoHeadCategory = appType === 'Student-Secondary' || appType === 'Individual/Group' || appType === 'Individual or Group';
      const headCat = isNoHeadCategory ? 'N/A' : (p.headCategory || null);
      const desc = (p.projectOverview || p.description || p.solutionSummary || 'No description').trim();

      return {
        id: p.id || `proj-${Date.now()}-${index}`,
        title,
        solutionName: title,
        applicationId: appId,
        projectCode: (p.projectCode || appId).trim(),
        applicationType: appType,
        headCategory: headCat,
        teamOrOrgName: (p.teamOrOrgName || title || 'Independent').trim(),
        representativeName: (p.representativeName || 'Lead Contact').trim(),
        teamLeadName: p.teamLeadName || '',
        members: Array.isArray(p.members) ? p.members : [],
        email: p.email || 'contact@biin.org',
        contactNumber: p.contactNumber || 'N/A',
        institutionOrOrg: p.institutionOrOrg || '',
        description: desc,
        projectOverview: desc,
        problemStatement: p.problemStatement || '',
        solutionSummary: p.solutionSummary || '',
        tags: Array.isArray(p.tags) ? p.tags : [],
        roomNumber: p.roomNumber || '',
        status: (p.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active'
      };
    });

    const insertedCount = await projectDb.bulkCreate(sanitizedProjects as any);

    if (actor) {
      try {
        await auditDb.create({
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          actorEmail: actor.email || 'admin@biin.org',
          actorName: actor.name || 'Administrator',
          action: 'BULK_IMPORT_PROJECTS',
          targetType: 'project',
          details: `Bulk imported ${insertedCount} projects into database.`,
          timestamp: new Date().toISOString()
        });
      } catch (auditErr) {
        console.warn('[Audit] Failed to log bulk import audit:', auditErr);
      }
    }

    res.json({ success: true, count: insertedCount, message: `Imported ${insertedCount} new projects.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to bulk import projects.' });
  }
});

/**
 * PUT /api/projects/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await projectDb.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const titleVal = (req.body.solutionName || req.body.title || existing.title || '').trim();
    const overviewVal = (req.body.projectOverview || req.body.description || existing.description || '').trim();

    const updated = {
      ...existing,
      ...req.body,
      title: titleVal,
      solutionName: titleVal,
      description: overviewVal,
      projectOverview: overviewVal,
      id: req.params.id
    };

    delete updated._actor;
    const result = await projectDb.update(updated);

    const actor = req.body._actor;
    if (actor) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'UPDATE_PROJECT',
        targetType: 'project',
        details: `Updated project "${result.title}" (${result.applicationId}).`,
        timestamp: new Date().toISOString()
      });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update project.' });
  }
});

/**
 * PATCH /api/projects/:id/status
 */
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await projectDb.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const nextStatus = existing.status === 'active' ? 'inactive' : 'active';
    existing.status = nextStatus;
    const result = await projectDb.update(existing);

    const actor = req.body.actor;
    if (actor) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'TOGGLE_PROJECT_STATUS',
        targetType: 'project',
        details: `Changed status of "${result.title}" to ${nextStatus}.`,
        timestamp: new Date().toISOString()
      });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle project status.' });
  }
});

/**
 * PATCH /api/projects/:id/room
 */
router.patch('/:id/room', async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomNumber, actor } = req.body;
    const existing = await projectDb.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    existing.roomNumber = (roomNumber || '').trim();
    const result = await projectDb.update(existing);

    if (actor) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'ASSIGN_PROJECT_ROOM',
        targetType: 'project',
        details: `Assigned project "${result.title}" to ${roomNumber || 'None'}.`,
        timestamp: new Date().toISOString()
      });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update project room.' });
  }
});

/**
 * DELETE /api/projects/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await projectDb.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const success = await projectDb.delete(req.params.id);

    const actor = req.body.actor;
    if (actor && success) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'DELETE_PROJECT',
        targetType: 'project',
        details: `Deleted project "${existing.title}" and purged all evaluations.`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success, message: 'Project deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete project.' });
  }
});

export default router;
