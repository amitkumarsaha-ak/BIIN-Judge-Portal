import { Router, Request, Response } from 'express';
import { roomDb, projectDb, userDb, auditDb } from '../db/index.js';

const router = Router();

/**
 * GET /api/rooms
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await roomDb.getAll();
    res.json(rooms);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch rooms.' });
  }
});

/**
 * POST /api/rooms
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomNumber, name, location, capacity, description, actor } = req.body;

    if (!roomNumber || !name) {
      res.status(400).json({ error: 'roomNumber and name are required.' });
      return;
    }

    const newRoom = {
      id: `room-${Date.now()}`,
      roomNumber: roomNumber.trim(),
      name: name.trim(),
      location: location || '',
      capacity: capacity ? parseInt(capacity, 10) : 10,
      description: description || '',
      createdAt: new Date().toISOString()
    };

    const created = await roomDb.create(newRoom);

    if (actor) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'CREATE_ROOM',
        targetType: 'room',
        details: `Created new room "${created.name}" (${created.roomNumber}).`,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create room.' });
  }
});

/**
 * PUT /api/rooms/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomNumber, name, location, capacity, description, actor } = req.body;
    const existing = (await roomDb.getAll()).find(r => r.id === req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'Room not found.' });
      return;
    }

    const updated = await roomDb.update({
      ...existing,
      roomNumber: roomNumber ? roomNumber.trim() : existing.roomNumber,
      name: name ? name.trim() : existing.name,
      location: location !== undefined ? location : existing.location,
      capacity: capacity !== undefined ? parseInt(capacity, 10) : existing.capacity,
      description: description !== undefined ? description : existing.description
    });

    if (actor) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'UPDATE_ROOM',
        targetType: 'room',
        details: `Updated room details for "${updated.roomNumber}".`,
        timestamp: new Date().toISOString()
      });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update room.' });
  }
});

/**
 * DELETE /api/rooms/:id
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await roomDb.getAll();
    const target = rooms.find(r => r.id === req.params.id);

    if (!target) {
      res.status(404).json({ error: 'Room not found.' });
      return;
    }

    const success = await roomDb.delete(req.params.id);

    // Unassign projects and judges connected to this room
    const projects = await projectDb.getAll();
    for (const p of projects) {
      if (p.roomNumber === target.roomNumber) {
        await projectDb.update({ ...p, roomNumber: '' });
      }
    }

    const users = await userDb.getAll();
    for (const u of users) {
      if (u.roomNumber === target.roomNumber) {
        await userDb.update({ ...u, roomNumber: undefined });
      }
    }

    const actor = req.body.actor;
    if (actor && success) {
      await auditDb.create({
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        actorEmail: actor.email,
        actorName: actor.name,
        action: 'DELETE_ROOM',
        targetType: 'room',
        details: `Deleted room "${target.roomNumber}" and unassigned connected entities.`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success, message: 'Room deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete room.' });
  }
});

export default router;
