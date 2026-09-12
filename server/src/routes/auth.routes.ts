import { Router, Request, Response } from 'express';
import { userDb, auditDb } from '../db/index.js';

const router = Router();

// Fixed Admin configuration
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@biin.org').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'BIIN Administrator';

/**
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check fixed Admin credentials
    if (cleanEmail === ADMIN_EMAIL) {
      if (password === ADMIN_PASSWORD || password.trim() === ADMIN_PASSWORD) {
        const adminUser = {
          id: 'admin-fixed-1',
          fullName: ADMIN_NAME,
          email: ADMIN_EMAIL,
          role: 'admin' as const,
          status: 'approved' as const,
          createdAt: '2026-07-01T08:00:00Z'
        };

        await auditDb.create({
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          actorEmail: adminUser.email,
          actorName: adminUser.fullName,
          action: 'LOGIN',
          targetType: 'auth',
          details: 'Admin authenticated successfully.',
          timestamp: new Date().toISOString()
        });

        res.json({ success: true, user: adminUser });
        return;
      } else {
        res.status(401).json({ error: 'Invalid password for Administrator account.' });
        return;
      }
    }

    // 2. Check Judge user
    const user = await userDb.findByEmail(cleanEmail);

    if (!user) {
      res.status(404).json({ error: 'No user account found with this email address.' });
      return;
    }

    if (user.password !== password && user.password !== password.trim()) {
      res.status(401).json({ error: 'Invalid password. Please verify your credentials.' });
      return;
    }

    // Check approval status for judges
    if (user.role === 'judge') {
      if (user.status === 'pending') {
        res.status(403).json({
          error: 'Your judge registration is awaiting Administrator approval.',
          status: 'pending'
        });
        return;
      }
      if (user.status === 'rejected') {
        res.status(403).json({
          error: 'Your judge application was rejected. Contact the portal administrator.',
          status: 'rejected'
        });
        return;
      }
    }

    const { password: _, ...safeUser } = user;

    await auditDb.create({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorEmail: safeUser.email,
      actorName: safeUser.fullName,
      action: 'LOGIN',
      targetType: 'auth',
      details: `Judge ${safeUser.fullName} logged in.`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal authentication error' });
  }
});

/**
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ error: 'Full name, email, and password are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Prevent registering with admin email
    if (cleanEmail === ADMIN_EMAIL) {
      res.status(400).json({ error: 'This email is reserved for system administration.' });
      return;
    }

    const existing = await userDb.findByEmail(cleanEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const newJudge = {
      id: `judge-${Date.now()}`,
      fullName: fullName.trim(),
      email: cleanEmail,
      password,
      role: 'judge' as const,
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };

    await userDb.create(newJudge);

    await auditDb.create({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorEmail: newJudge.email,
      actorName: newJudge.fullName,
      action: 'REGISTER',
      targetType: 'judge',
      details: `Registered judge account for ${newJudge.fullName} (pending approval).`,
      timestamp: new Date().toISOString()
    });

    const { password: _, ...safeUser } = newJudge;
    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Waiting for Admin approval.',
      user: safeUser
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal registration error' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.query.email as string;
    if (!email) {
      res.status(400).json({ error: 'Email query parameter is required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail === ADMIN_EMAIL) {
      res.json({
        id: 'admin-fixed-1',
        fullName: ADMIN_NAME,
        email: ADMIN_EMAIL,
        role: 'admin',
        status: 'approved',
        createdAt: '2026-07-01T08:00:00Z'
      });
      return;
    }

    const user = await userDb.findByEmail(cleanEmail);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      res.status(400).json({ error: 'Email and new password are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Protect fixed Admin account
    if (cleanEmail === ADMIN_EMAIL) {
      res.status(403).json({ error: 'Administrator credentials are configured via system environment settings and cannot be reset through this form.' });
      return;
    }

    if (newPassword.length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters long.' });
      return;
    }

    const user = await userDb.findByEmail(cleanEmail);
    if (!user) {
      res.status(404).json({ error: 'No judge account found with this email address.' });
      return;
    }

    const updated = await userDb.updatePassword(cleanEmail, newPassword);
    if (!updated) {
      res.status(500).json({ error: 'Failed to update password in database.' });
      return;
    }

    await auditDb.create({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorEmail: cleanEmail,
      actorName: user.fullName,
      action: 'RESET_PASSWORD',
      targetType: 'auth',
      details: `Password was reset for judge ${user.fullName} (${cleanEmail}).`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Password has been successfully updated.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error while resetting password.' });
  }
});

export default router;
