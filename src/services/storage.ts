import type { User, Project, Evaluation, DashboardStats, Room, SystemSettings, AuditLog, JudgeAssignment } from '../types';
import { ADMIN_CONFIG } from '../config/authConfig';
import { matchesAppType, matchesCategory, canonicalAppType, canonicalHeadCategory } from '../utils/evaluation';
import { api } from './api';

export const USERS_KEY = 'biin_portal_users';
export const CURRENT_USER_KEY = 'biin_portal_current_user';
export const PROJECTS_KEY = 'biin_portal_projects';
export const EVALUATIONS_KEY = 'biin_portal_evaluations';
export const ASSIGNMENTS_KEY = 'biin_portal_judge_assignments';
export const ROOMS_KEY = 'biin_portal_rooms';
export const SETTINGS_KEY = 'biin_portal_settings';
export const AUDIT_LOGS_KEY = 'biin_portal_audit_logs';
export const REMOVED_JUDGE_EMAILS_KEY = 'biin_removed_judge_emails';

export const getRemovedJudgeEmails = (): string[] => {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REMOVED_JUDGE_EMAILS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isJudgeEmailRemoved = (email: string): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return getRemovedJudgeEmails().includes(clean);
};

export const addRemovedJudgeEmail = (email: string): void => {
  if (!email || (typeof window === 'undefined' && typeof localStorage === 'undefined')) return;
  const clean = email.trim().toLowerCase();
  const current = getRemovedJudgeEmails();
  if (!current.includes(clean)) {
    current.push(clean);
    localStorage.setItem(REMOVED_JUDGE_EMAILS_KEY, JSON.stringify(current));
  }
};

export const clearRemovedJudgeEmail = (email: string): void => {
  if (!email || (typeof window === 'undefined' && typeof localStorage === 'undefined')) return;
  const clean = email.trim().toLowerCase();
  const current = getRemovedJudgeEmails().filter(e => e !== clean);
  localStorage.setItem(REMOVED_JUDGE_EMAILS_KEY, JSON.stringify(current));
};

export const normalizeEmail = (email?: string): string => {
  return (email || '').trim().toLowerCase();
};

/**
 * Normalizes and deduplicates an array of users by clean email.
 * Ensures exactly ONE fixed Admin matching ADMIN_CONFIG.EMAIL,
 * and exactly ONE canonical record per Judge email.
 * Preserves approved status over pending status, preserves passwords,
 * room numbers, and IDs.
 */
export const normalizeAndDeduplicateUsers = (rawUsers: User[]): User[] => {
  const cleanAdminEmail = normalizeEmail(ADMIN_CONFIG.EMAIL);
  const removedEmails = getRemovedJudgeEmails();

  const adminUser: User = {
    id: 'admin-fixed-1',
    fullName: ADMIN_CONFIG.NAME,
    email: ADMIN_CONFIG.EMAIL,
    password: ADMIN_CONFIG.PASSWORD,
    role: 'admin',
    status: 'approved',
    createdAt: '2026-07-01T08:00:00Z'
  };

  const judgeMap = new Map<string, User>();

  for (const u of rawUsers) {
    if (!u.email) continue;
    const clean = normalizeEmail(u.email);
    if (clean === cleanAdminEmail) continue;

    // Filter out removed judge emails
    if (removedEmails.includes(clean)) {
      continue;
    }

    const existing = judgeMap.get(clean);
    if (!existing) {
      judgeMap.set(clean, {
        ...u,
        email: clean,
        fullName: (u.fullName || '').trim() || 'Judge',
        role: 'judge',
        status: ((u.status || 'pending').toLowerCase() === 'approved'
          ? 'approved'
          : (u.status || 'pending').toLowerCase() === 'rejected'
          ? 'rejected'
          : 'pending')
      });
    } else {
      // Reconcile duplicates: approved takes precedence over rejected and pending
      let canonicalStatus: 'pending' | 'approved' | 'rejected' = 'pending';
      const s1 = (existing.status || 'pending').toLowerCase();
      const s2 = (u.status || 'pending').toLowerCase();
      if (s1 === 'approved' || s2 === 'approved') {
        canonicalStatus = 'approved';
      } else if (s1 === 'rejected' || s2 === 'rejected') {
        canonicalStatus = 'rejected';
      }

      judgeMap.set(clean, {
        ...existing,
        ...u,
        id: (existing.id && !existing.id.startsWith('judge-')) ? existing.id : (u.id || existing.id),
        fullName: (u.fullName || '').trim() || existing.fullName || 'Judge',
        email: clean,
        password: u.password || existing.password,
        role: 'judge',
        status: canonicalStatus,
        roomNumber: u.roomNumber || existing.roomNumber,
        createdAt: existing.createdAt || u.createdAt || new Date().toISOString()
      });
    }
  }

  return [adminUser, ...Array.from(judgeMap.values())];
};

export const DEFAULT_ROOMS: Room[] = [
  {
    id: 'room-1',
    roomNumber: 'Room 01',
    name: 'Room 01 — Consumer & Smart Tech',
    location: 'Building A, 2nd Floor',
    capacity: 10,
    description: 'Judging room for Consumer solutions, smart devices, and mobile apps.',
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'room-2',
    roomNumber: 'Room 02',
    name: 'Room 02 — Industrial & Robotics',
    location: 'Building A, 3rd Floor',
    capacity: 10,
    description: 'Judging room for Industrial automation, IoT sensors, and robotics.',
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'room-3',
    roomNumber: 'Room 03',
    name: 'Room 03 — Enterprise & Cloud Systems',
    location: 'Building B, 1st Floor',
    capacity: 10,
    description: 'Judging room for B2B SaaS, fintech, and enterprise workflows.',
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'room-4',
    roomNumber: 'Room 04',
    name: 'Room 04 — Community & Accessibility',
    location: 'Building B, 2nd Floor',
    capacity: 10,
    description: 'Judging room for Social impact, assistive technologies, and healthcare.',
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'room-5',
    roomNumber: 'Room 05',
    name: 'Room 05 — Public Sector & Civic Tech',
    location: 'Building C, Auditorium Hall',
    capacity: 15,
    description: 'Judging room for Smart city governance, public health, and e-gov services.',
    createdAt: '2026-08-01T08:00:00Z'
  }
];

export const DEFAULT_SETTINGS: SystemSettings = {
  evaluationsLocked: false,
  finalResultsLocked: false,
  lockedProjects: [],
  autoRankingEnabled: true,
  categoryLocks: {}
};

export const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-init-1',
    actorEmail: ADMIN_CONFIG.EMAIL,
    actorName: ADMIN_CONFIG.NAME,
    action: 'SYSTEM_INITIALIZE',
    targetType: 'settings',
    details: 'System initialized with default rooms, nominated projects, and judges.',
    timestamp: '2026-08-15T09:00:00Z'
  }
];

// Initialize default storage data
export const initializeStorage = () => {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return;

  const adminUser: User = {
    id: 'admin-fixed-1',
    fullName: ADMIN_CONFIG.NAME,
    email: ADMIN_CONFIG.EMAIL,
    password: ADMIN_CONFIG.PASSWORD,
    role: 'admin',
    status: 'approved',
    createdAt: '2026-07-01T08:00:00Z'
  };

  const existingUsersData = localStorage.getItem(USERS_KEY);
  if (!existingUsersData) {
    localStorage.setItem(USERS_KEY, JSON.stringify([adminUser]));
  } else {
    try {
      let users: User[] = JSON.parse(existingUsersData);
      if (!Array.isArray(users) || users.length === 0) {
        users = [adminUser];
      }
      const deduped = normalizeAndDeduplicateUsers(users);
      localStorage.setItem(USERS_KEY, JSON.stringify(deduped));
    } catch {
      localStorage.setItem(USERS_KEY, JSON.stringify([adminUser]));
    }
  }

  // Initialize Projects (empty by default)
  if (!localStorage.getItem(PROJECTS_KEY)) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify([]));
  }

  // Initialize Assignments (empty by default)
  if (!localStorage.getItem(ASSIGNMENTS_KEY)) {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify([]));
  }

  // Initialize Rooms
  if (!localStorage.getItem(ROOMS_KEY)) {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(DEFAULT_ROOMS));
  }

  // Initialize Settings
  if (!localStorage.getItem(SETTINGS_KEY)) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  }

  // Initialize Audit Logs
  if (!localStorage.getItem(AUDIT_LOGS_KEY)) {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(DEFAULT_AUDIT_LOGS));
  }

  // Initialize Evaluations (empty by default)
  if (!localStorage.getItem(EVALUATIONS_KEY)) {
    localStorage.setItem(EVALUATIONS_KEY, JSON.stringify([]));
  }
};

/**
 * Sync all data with the PostgreSQL REST backend
 */
export const syncWithBackend = async (): Promise<boolean> => {
  try {
    const health = await api.health();
    if (health.status !== 'online') return false;

    const [projectsRes, evalsRes, judgesRes, roomsRes, settingsRes, auditRes, assignmentsRes] = await Promise.allSettled([
      api.getProjects(),
      api.getEvaluations(),
      api.getJudges(),
      api.getRooms(),
      api.getSettings(),
      api.getAuditLogs(),
      api.getAssignments()
    ]);

    if (projectsRes.status === 'fulfilled' && Array.isArray(projectsRes.value)) {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projectsRes.value));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('biin_projects_updated'));
      }
    }

    if (evalsRes.status === 'fulfilled' && Array.isArray(evalsRes.value)) {
      localStorage.setItem(EVALUATIONS_KEY, JSON.stringify(evalsRes.value));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('biin_projects_updated'));
      }
    }

    if (judgesRes.status === 'fulfilled' && Array.isArray(judgesRes.value)) {
      const existingUsers = getUsers();
      const adminUser = existingUsers.find(u => u.role === 'admin') || {
        id: 'admin-fixed-1',
        fullName: ADMIN_CONFIG.NAME,
        email: ADMIN_CONFIG.EMAIL,
        password: ADMIN_CONFIG.PASSWORD,
        role: 'admin',
        status: 'approved',
        createdAt: '2026-07-01T08:00:00Z'
      };
      const deduped = normalizeAndDeduplicateUsers([adminUser, ...judgesRes.value]);
      localStorage.setItem(USERS_KEY, JSON.stringify(deduped));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('biin_users_updated'));
      }
    }

    if (roomsRes.status === 'fulfilled' && Array.isArray(roomsRes.value) && roomsRes.value.length > 0) {
      localStorage.setItem(ROOMS_KEY, JSON.stringify(roomsRes.value));
    }

    if (settingsRes.status === 'fulfilled' && settingsRes.value) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsRes.value));
    }

    if (auditRes.status === 'fulfilled' && Array.isArray(auditRes.value) && auditRes.value.length > 0) {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(auditRes.value));
    }

    if (assignmentsRes.status === 'fulfilled' && Array.isArray(assignmentsRes.value)) {
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignmentsRes.value));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('biin_assignments_updated'));
        window.dispatchEvent(new Event('biin_projects_updated'));
      }
    }

    return true;
  } catch {
    return false;
  }
};

// Auto-trigger sync on module load in browser
if (typeof window !== 'undefined') {
  initializeStorage();
  syncWithBackend().catch(() => {});
}

// --- AUDIT LOGGING ---

export const getAuditLogs = (): AuditLog[] => {
  initializeStorage();
  const data = localStorage.getItem(AUDIT_LOGS_KEY);
  return data ? JSON.parse(data) : [];
};

export const logAuditAction = (
  actorEmail: string,
  actorName: string,
  action: string,
  targetType: 'project' | 'judge' | 'room' | 'evaluation' | 'settings' | 'auth',
  details: string
): void => {
  const logs = getAuditLogs();
  const entry: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorEmail,
    actorName,
    action,
    targetType,
    details,
    timestamp: new Date().toISOString()
  };
  logs.unshift(entry);
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 200)));

  // Forward to backend
  api.logAudit(actorEmail, actorName, action, targetType, details).catch(() => {});
};

// --- SYSTEM SETTINGS & LOCK ENGINE ---

export const getSystemSettings = (): SystemSettings => {
  initializeStorage();
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
};

export const updateSystemSettings = (settings: SystemSettings, actor?: { email: string; name: string }): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  api.updateSettings(settings, actor).catch(() => {});
  if (actor) {
    logAuditAction(actor.email, actor.name, 'UPDATE_SETTINGS', 'settings', `Updated system configuration & lock rules.`);
  }
};

export const getCategoryLockKey = (appType?: string, headCategory?: string | null): string => {
  const normType = canonicalAppType(appType);
  if (normType === 'Student-Secondary' || normType === 'Individual or Group') {
    return `${normType}___NONE`;
  }
  const normCategory = canonicalHeadCategory(headCategory || '');
  return `${normType}___${normCategory}`;
};

export const isCategoryEvaluationLocked = (appType?: string, headCategory?: string | null): boolean => {
  const settings = getSystemSettings();
  const key = getCategoryLockKey(appType, headCategory);
  return Boolean(settings.categoryLocks && settings.categoryLocks[key]);
};

export const toggleCategoryEvaluationLock = (
  appType: string,
  headCategory: string | null,
  locked: boolean,
  actor?: { email: string; name: string }
): void => {
  const settings = getSystemSettings();
  const key = getCategoryLockKey(appType, headCategory);
  if (!settings.categoryLocks) {
    settings.categoryLocks = {};
  }
  settings.categoryLocks[key] = locked;
  updateSystemSettings(settings, actor);
  if (actor) {
    logAuditAction(
      actor.email,
      actor.name,
      locked ? 'LOCK_CATEGORY_EVALUATION' : 'UNLOCK_CATEGORY_EVALUATION',
      'settings',
      `${locked ? 'Locked' : 'Unlocked'} evaluation submissions for ${appType}${headCategory ? ` (${headCategory})` : ''}.`
    );
  }
};

export const toggleEvaluationLock = (locked: boolean, actor?: { email: string; name: string }): void => {
  const settings = getSystemSettings();
  settings.evaluationsLocked = locked;
  updateSystemSettings(settings, actor);
  api.toggleEvaluationLock(locked, actor).catch(() => {});
};

export const toggleFinalResultLock = (locked: boolean, actor?: { email: string; name: string }): void => {
  const settings = getSystemSettings();
  settings.finalResultsLocked = locked;
  updateSystemSettings(settings, actor);
  api.toggleFinalResultLock(locked, actor).catch(() => {});
};

export const toggleProjectLock = (projectId: string, actor?: { email: string; name: string }): boolean => {
  const settings = getSystemSettings();
  const isCurrentlyLocked = settings.lockedProjects.includes(projectId);
  if (isCurrentlyLocked) {
    settings.lockedProjects = settings.lockedProjects.filter(id => id !== projectId);
  } else {
    settings.lockedProjects.push(projectId);
  }
  updateSystemSettings(settings, actor);
  api.toggleProjectLock(projectId, actor).catch(() => {});
  return !isCurrentlyLocked;
};

// --- ROOM SERVICES ---

export const getRooms = (): Room[] => {
  initializeStorage();
  const data = localStorage.getItem(ROOMS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getRoomByNumber = (roomNumber: string): Room | undefined => {
  return getRooms().find(r => r.roomNumber.toLowerCase().trim() === roomNumber.toLowerCase().trim());
};

export const addRoom = (room: Room, actor?: { email: string; name: string }): void => {
  const rooms = getRooms();
  rooms.push(room);
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
  api.createRoom(room, actor).catch(() => {});
  if (actor) {
    logAuditAction(actor.email, actor.name, 'CREATE_ROOM', 'room', `Created new room "${room.name}" (${room.roomNumber}).`);
  }
};

export const updateRoom = (updated: Room, actor?: { email: string; name: string }): void => {
  const rooms = getRooms();
  const idx = rooms.findIndex(r => r.id === updated.id);
  if (idx >= 0) {
    rooms[idx] = updated;
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
    api.updateRoom(updated, actor).catch(() => {});
    if (actor) {
      logAuditAction(actor.email, actor.name, 'UPDATE_ROOM', 'room', `Updated room details for "${updated.roomNumber}".`);
    }
  }
};

export const deleteRoom = (id: string, actor?: { email: string; name: string }): void => {
  const rooms = getRooms();
  const target = rooms.find(r => r.id === id);
  const remaining = rooms.filter(r => r.id !== id);
  localStorage.setItem(ROOMS_KEY, JSON.stringify(remaining));

  if (target) {
    // Unassign projects assigned to this room
    const projects = getProjects().map(p => {
      if (p.roomNumber === target.roomNumber) {
        return { ...p, roomNumber: '' };
      }
      return p;
    });
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));

    // Unassign judges assigned to this room
    const users = getUsers().map(u => {
      if (u.roomNumber === target.roomNumber) {
        return { ...u, roomNumber: undefined };
      }
      return u;
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    api.deleteRoom(id, actor).catch(() => {});

    if (actor) {
      logAuditAction(actor.email, actor.name, 'DELETE_ROOM', 'room', `Deleted room "${target.roomNumber}" and unassigned connected entities.`);
    }
  }
};

// --- AUTH & USER / JUDGE SERVICES ---

export const getUsers = (): User[] => {
  initializeStorage();
  const data = localStorage.getItem(USERS_KEY);
  if (!data) return [];
  try {
    const parsed: User[] = JSON.parse(data);
    return normalizeAndDeduplicateUsers(parsed);
  } catch {
    return [];
  }
};

export const getJudges = (): User[] => {
  return getUsers().filter(u => u.role === 'judge');
};

export const findUserByEmail = (email: string): User | undefined => {
  if (!email) return undefined;
  const cleanEmail = normalizeEmail(email);

  // Single fixed admin check
  if (cleanEmail === normalizeEmail(ADMIN_CONFIG.EMAIL)) {
    return {
      id: 'admin-fixed-1',
      fullName: ADMIN_CONFIG.NAME,
      email: ADMIN_CONFIG.EMAIL,
      password: ADMIN_CONFIG.PASSWORD,
      role: 'admin',
      status: 'approved',
      createdAt: '2026-07-01T08:00:00Z'
    };
  }

  const users = getUsers();
  const found = users.find((u) => normalizeEmail(u.email) === cleanEmail);
  if (found) {
    if (found.role === 'admin' && normalizeEmail(found.email) !== normalizeEmail(ADMIN_CONFIG.EMAIL)) {
      found.role = 'judge';
    }
    return found;
  }

  return undefined;
};

export const saveUser = (user: User, actor?: { email: string; name: string }): void => {
  const users = getUsers();
  const cleanEmail = normalizeEmail(user.email);
  if (cleanEmail) {
    clearRemovedJudgeEmail(cleanEmail);
  }

  const existingIdx = users.findIndex(u => (cleanEmail && normalizeEmail(u.email) === cleanEmail) || u.id === user.id);
  const existingUser = existingIdx >= 0 ? users[existingIdx] : undefined;

  // CRITICAL: NEVER overwrite an existing approved judge to pending!
  const canonicalStatus: 'pending' | 'approved' | 'rejected' =
    existingUser?.status === 'approved'
      ? 'approved'
      : (user.status || existingUser?.status || 'pending') as 'pending' | 'approved' | 'rejected';

  const safeUser: User = {
    ...user,
    email: cleanEmail || user.email,
    role: 'judge',
    status: canonicalStatus
  };

  let updatedUsers: User[];
  if (existingIdx >= 0) {
    updatedUsers = users.map((u, i) => {
      if (i === existingIdx) {
        return {
          ...u,
          ...safeUser,
          password: safeUser.password || u.password
        };
      }
      return u;
    });
  } else {
    updatedUsers = [...users, safeUser];
  }

  const deduped = normalizeAndDeduplicateUsers(updatedUsers);
  localStorage.setItem(USERS_KEY, JSON.stringify(deduped));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('biin_users_updated'));
  }

  // Forward to backend API ONLY IF NEW USER
  if (existingIdx < 0 && !safeUser.id.startsWith('judge-remote-')) {
    api.register(safeUser.fullName, safeUser.email, safeUser.password || 'password123')
      .then(res => {
        if (res?.user?.id) {
          const current = getUsers().map(u => normalizeEmail(u.email) === cleanEmail ? { ...u, id: res.user.id } : u);
          localStorage.setItem(USERS_KEY, JSON.stringify(normalizeAndDeduplicateUsers(current)));
        }
      })
      .catch(() => {});
  }

  if (actor) {
    logAuditAction(actor.email, actor.name, existingIdx >= 0 ? 'UPDATE_USER' : 'CREATE_USER', 'judge', `Judge account for ${safeUser.fullName} (${safeUser.email}) with status "${safeUser.status}".`);
  }
};

export const approveJudge = (judgeId: string, actor?: { email: string; name: string }): void => {
  const users = getUsers();
  const cleanId = normalizeEmail(judgeId);
  const idx = users.findIndex(u => u.id === judgeId || normalizeEmail(u.email) === cleanId);
  if (idx >= 0) {
    const target = users[idx];
    target.status = 'approved';
    const deduped = normalizeAndDeduplicateUsers(users);
    localStorage.setItem(USERS_KEY, JSON.stringify(deduped));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('biin_users_updated'));
    }
    api.approveJudge(target.id, actor, target.email).catch(() => {});
    if (actor) {
      logAuditAction(actor.email, actor.name, 'APPROVE_JUDGE', 'judge', `Approved judge registration for ${target.fullName} (${target.email}).`);
    }
  }
};

export const rejectJudge = (judgeId: string, actor?: { email: string; name: string }): void => {
  const users = getUsers();
  const cleanId = normalizeEmail(judgeId);
  const idx = users.findIndex(u => u.id === judgeId || normalizeEmail(u.email) === cleanId);
  if (idx >= 0) {
    const target = users[idx];
    target.status = 'rejected';
    const deduped = normalizeAndDeduplicateUsers(users);
    localStorage.setItem(USERS_KEY, JSON.stringify(deduped));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('biin_users_updated'));
    }
    api.rejectJudge(target.id, actor, target.email).catch(() => {});
    if (actor) {
      logAuditAction(actor.email, actor.name, 'REJECT_JUDGE', 'judge', `Rejected judge registration for ${target.fullName} (${target.email}).`);
    }
  }
};

export const resetJudgePassword = (email: string, newPassword: string): boolean => {
  if (!email || !newPassword || newPassword.length < 4) return false;
  const cleanEmail = normalizeEmail(email);
  if (cleanEmail === normalizeEmail(ADMIN_CONFIG.EMAIL)) return false;

  const users = getUsers();
  let idx = users.findIndex(u => normalizeEmail(u.email) === cleanEmail);
  if (idx < 0) {
    return false;
  }

  // Strictly only approved judges can reset password! Pending or rejected cannot reset!
  const judgeStatus = (users[idx].status || 'approved').toLowerCase();
  if (users[idx].role !== 'judge' || judgeStatus !== 'approved') {
    return false;
  }

  users[idx] = { ...users[idx], password: newPassword, status: 'approved' };
  const deduped = normalizeAndDeduplicateUsers(users);
  localStorage.setItem(USERS_KEY, JSON.stringify(deduped));

  // Also clean up any legacy user keys so they never resurrect old passwords
  const legacyKeys = ['biin_judge_portal_users', 'biin_users'];
  for (const lk of legacyKeys) {
    try {
      const raw = localStorage.getItem(lk);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const lIdx = list.findIndex((u: User) => normalizeEmail(u.email) === cleanEmail);
          if (lIdx >= 0) {
            list[lIdx].password = newPassword;
            localStorage.setItem(lk, JSON.stringify(list));
          }
        }
      }
    } catch {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('biin_users_updated'));
  }
  const current = getCurrentUser();
  if (current && normalizeEmail(current.email) === cleanEmail) {
    setCurrentUserSession({ ...current, password: newPassword });
  }
  api.resetPassword(cleanEmail, newPassword).catch(() => {});
  return true;
};

export const updateUser = (updated: User, actor?: { email: string; name: string }): void => {
  const users = getUsers();
  const cleanEmail = normalizeEmail(updated.email);
  const idx = users.findIndex(u => u.id === updated.id || (cleanEmail && normalizeEmail(u.email) === cleanEmail));
  if (idx >= 0) {
    const safeUpdated: User = {
      ...updated,
      email: cleanEmail || updated.email,
      role: cleanEmail === normalizeEmail(ADMIN_CONFIG.EMAIL) ? 'admin' : 'judge'
    };
    users[idx] = safeUpdated;
    const deduped = normalizeAndDeduplicateUsers(users);
    localStorage.setItem(USERS_KEY, JSON.stringify(deduped));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('biin_users_updated'));
    }
    if (actor) {
      logAuditAction(actor.email, actor.name, 'UPDATE_USER', 'judge', `Updated details for ${safeUpdated.fullName} (${safeUpdated.email}).`);
    }
  }
};

export const deleteUser = (id: string, actor?: { email: string; name: string }): void => {
  const users = getUsers();
  const cleanId = normalizeEmail(id);
  const target = users.find(u => u.id === id || normalizeEmail(u.email) === cleanId);
  if (target && normalizeEmail(target.email) === normalizeEmail(ADMIN_CONFIG.EMAIL)) {
    return;
  }
  const cleanEmail = target ? normalizeEmail(target.email) : (id.includes('@') ? cleanId : '');
  if (cleanEmail) {
    addRemovedJudgeEmail(cleanEmail);
  }

  const remaining = users.filter(u => {
    if (u.id === id) return false;
    if (cleanEmail && normalizeEmail(u.email) === cleanEmail) return false;
    return true;
  });

  const deduped = normalizeAndDeduplicateUsers(remaining);
  localStorage.setItem(USERS_KEY, JSON.stringify(deduped));

  // Clear session if the deleted user is currently logged in
  const current = getCurrentUser();
  if (current && (current.id === id || (cleanEmail && normalizeEmail(current.email) === cleanEmail))) {
    setCurrentUserSession(null);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('biin_users_updated'));
  }

  api.deleteJudge(target?.id || id, actor, cleanEmail).catch(() => {});

  if (target && actor) {
    logAuditAction(actor.email, actor.name, 'DELETE_USER', 'judge', `Deleted ${target.role} user account for ${target.fullName} (${target.email}).`);
  }
};

export const assignJudgeToRoom = (judgeEmail: string, roomNumber: string, actor?: { email: string; name: string }): void => {
  const users = getUsers();
  const idx = users.findIndex(u => u.email.toLowerCase().trim() === judgeEmail.toLowerCase().trim());
  if (idx >= 0) {
    users[idx] = { ...users[idx], roomNumber: roomNumber.trim() };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    api.assignJudgeRoom(users[idx].id, roomNumber, actor).catch(() => {});
    if (actor) {
      logAuditAction(actor.email, actor.name, 'ASSIGN_JUDGE_ROOM', 'judge', `Assigned Judge ${users[idx].fullName} to ${roomNumber}.`);
    }
  }
};

export const getCurrentUser = (): User | null => {
  initializeStorage();
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUserSession = (user: User | null): void => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// --- PROJECT SERVICES ---

export const getProjects = (): Project[] => {
  initializeStorage();
  const data = localStorage.getItem(PROJECTS_KEY);
  if (!data) return [];
  const list: Project[] = JSON.parse(data);
  return list.map(p => {
    if (p.applicationType === 'Student') {
      return {
        ...p,
        applicationType: 'Student-Secondary',
        headCategory: 'N/A'
      };
    }
    const canon = canonicalAppType(p.applicationType);
    if ((canon === 'Individual or Group' || p.applicationType === 'Individual/Group') && p.headCategory !== 'N/A') {
      return {
        ...p,
        headCategory: 'N/A'
      };
    }
    return p;
  });
};

export const getProjectById = (id: string): Project | undefined => {
  const projects = getProjects();
  return projects.find((p) => p.id === id);
};

export const addProject = (project: Project, actor?: { email: string; name: string }): void => {
  const projects = getProjects();
  const existingIdx = projects.findIndex(p => p.id === project.id || (project.applicationId && p.applicationId === project.applicationId));
  if (existingIdx >= 0) {
    projects[existingIdx] = { ...projects[existingIdx], ...project };
  } else {
    projects.push(project);
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('biin_projects_updated'));
  }
  api.createProject(project, actor)
    .then(saved => {
      if (saved && saved.id && saved.id !== project.id) {
        const cur = getProjects();
        const updated = cur.map(p => p.id === project.id ? { ...p, id: saved.id } : p);
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('biin_projects_updated'));
        }
      }
    })
    .catch(err => {
      console.warn('[Storage] Remote project creation deferred, saved locally:', err);
    });

  if (actor) {
    logAuditAction(actor.email, actor.name, 'CREATE_PROJECT', 'project', `Created project "${project.title}" (${project.applicationId}).`);
  }
};

export const addProjects = (newProjects: Project[], actor?: { email: string; name: string }): void => {
  if (newProjects.length === 0) return;
  const projects = getProjects();
  for (const np of newProjects) {
    const existingIdx = projects.findIndex(p => p.id === np.id || (np.applicationId && p.applicationId === np.applicationId));
    if (existingIdx >= 0) {
      projects[existingIdx] = { ...projects[existingIdx], ...np };
    } else {
      projects.push(np);
    }
  }
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('biin_projects_updated'));
  }
  api.bulkCreateProjects(newProjects, actor).catch(() => {
    newProjects.forEach(p => api.createProject(p, actor).catch(() => {}));
  });
  if (actor) {
    logAuditAction(actor.email, actor.name, 'BULK_IMPORT_PROJECTS', 'project', `Imported ${newProjects.length} projects via Excel.`);
  }
};

export const updateProject = (updated: Project, actor?: { email: string; name: string }): void => {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === updated.id);
  if (idx >= 0) {
    projects[idx] = updated;
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('biin_projects_updated'));
    }
    api.updateProject(updated, actor).catch(() => {});
    if (actor) {
      logAuditAction(actor.email, actor.name, 'UPDATE_PROJECT', 'project', `Updated project "${updated.title}" (${updated.applicationId}).`);
    }
  }
};

export const deleteProject = (id: string, actor?: { email: string; name: string }): void => {
  const projects = getProjects();
  const target = projects.find(p => p.id === id);
  const remaining = projects.filter((p) => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(remaining));

  // Also remove all evaluations linked to this project
  const evaluations = getEvaluations().filter((e) => e.projectId !== id);
  localStorage.setItem(EVALUATIONS_KEY, JSON.stringify(evaluations));

  // Also remove this project from all judge assignments
  const assignments = getJudgeAssignments().map((a: JudgeAssignment) => ({
    ...a,
    projectIds: (a.projectIds || []).filter((pid: string) => pid !== id)
  }));
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('biin_projects_updated'));
  }

  api.deleteProject(id, actor).catch(() => {});

  if (target && actor) {
    logAuditAction(actor.email, actor.name, 'DELETE_PROJECT', 'project', `Deleted project "${target.title}" and purged all associated evaluations.`);
  }
};

export const toggleProjectStatus = (id: string, actor?: { email: string; name: string }): void => {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx >= 0) {
    const nextStatus = projects[idx].status === 'active' ? 'inactive' : 'active';
    projects[idx] = {
      ...projects[idx],
      status: nextStatus
    };
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('biin_projects_updated'));
    }
    api.toggleProjectStatus(id, actor).catch(() => {});
    if (actor) {
      logAuditAction(actor.email, actor.name, 'TOGGLE_PROJECT_STATUS', 'project', `Changed status of "${projects[idx].title}" to ${nextStatus}.`);
    }
  }
};

export const assignProjectToRoom = (id: string, roomNumber: string, actor?: { email: string; name: string }): void => {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx >= 0) {
    projects[idx] = { ...projects[idx], roomNumber: roomNumber.trim() };
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('biin_projects_updated'));
    }
    api.assignProjectRoom(id, roomNumber, actor).catch(() => {});
    if (actor) {
      logAuditAction(actor.email, actor.name, 'ASSIGN_PROJECT_ROOM', 'project', `Assigned project "${projects[idx].title}" to ${roomNumber}.`);
    }
  }
};

export const removeProjectFromRoom = (id: string, actor?: { email: string; name: string }): void => {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx >= 0) {
    const oldRoom = projects[idx].roomNumber;
    projects[idx] = { ...projects[idx], roomNumber: '' };
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('biin_projects_updated'));
    }
    api.assignProjectRoom(id, '', actor).catch(() => {});
    if (actor) {
      logAuditAction(actor.email, actor.name, 'REMOVE_PROJECT_ROOM', 'project', `Removed project "${projects[idx].title}" from ${oldRoom}.`);
    }
  }
};

// --- EVALUATION SERVICES ---

export const getEvaluations = (): Evaluation[] => {
  initializeStorage();
  const data = localStorage.getItem(EVALUATIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getEvaluationsByJudge = (judgeEmail: string): Evaluation[] => {
  const evaluations = getEvaluations();
  return evaluations.filter((e) => e.judgeEmail.toLowerCase() === judgeEmail.toLowerCase());
};

export const getEvaluationForProject = (projectId: string, judgeEmail: string): Evaluation | undefined => {
  const evaluations = getEvaluations();
  return evaluations.find(
    (e) => e.projectId === projectId && e.judgeEmail.toLowerCase() === judgeEmail.toLowerCase()
  );
};

export const saveEvaluation = (evaluation: Evaluation, actor?: { email: string; name: string }): void => {
  // Validate scores are between 1 and 10
  for (const [key, val] of Object.entries(evaluation.scores)) {
    if (typeof val !== 'number' || isNaN(val) || val < 1 || val > 10) {
      throw new Error(`Invalid evaluation score for criterion "${key}": ${val}. Score must be between 1 and 10.`);
    }
  }

  // Check category-wise evaluation lock
  const allProjects = getProjects();
  const targetProject = allProjects.find(p => p.id === evaluation.projectId);
  if (targetProject && isCategoryEvaluationLocked(targetProject.applicationType, targetProject.headCategory)) {
    throw new Error('Evaluation is locked for this Application Type and Head Category.');
  }

  // Check individual project lock
  const settings = getSystemSettings();
  if (settings.lockedProjects.includes(evaluation.projectId)) {
    throw new Error('Evaluations for this specific project are currently locked by the Administrator.');
  }

  // Check judge assignment authorization
  if (targetProject && !isProjectAssignedToJudge(evaluation.judgeEmail, targetProject)) {
    throw new Error('This project is not assigned to your account. You can only evaluate projects assigned to you by the Administrator.');
  }

  const evaluations = getEvaluations();
  const existingIndex = evaluations.findIndex(
    (e) => e.projectId === evaluation.projectId && e.judgeEmail.toLowerCase() === evaluation.judgeEmail.toLowerCase()
  );

  if (existingIndex >= 0) {
    evaluations[existingIndex] = {
      ...evaluation,
      updatedAt: new Date().toISOString()
    };
  } else {
    evaluations.push(evaluation);
  }

  localStorage.setItem(EVALUATIONS_KEY, JSON.stringify(evaluations));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('biin_projects_updated'));
  }
  
  // Forward to backend REST API
  api.saveEvaluation(evaluation, actor).catch((err) => {
    console.warn('[Storage] Remote evaluation save deferred, saved locally:', err);
  });

  if (actor) {
    logAuditAction(
      actor.email,
      actor.name,
      existingIndex >= 0 ? 'UPDATE_EVALUATION' : 'SUBMIT_EVALUATION',
      'evaluation',
      `Evaluation score ${evaluation.convertedScore}/100 recorded for project ${evaluation.projectId} by ${evaluation.judgeName}.`
    );
  }
};

export const deleteEvaluation = (id: string, actor?: { email: string; name: string }): void => {
  const evaluations = getEvaluations();
  const target = evaluations.find(e => e.id === id);
  const remaining = evaluations.filter(e => e.id !== id);
  localStorage.setItem(EVALUATIONS_KEY, JSON.stringify(remaining));

  api.deleteEvaluation(id, actor).catch(() => {});

  if (target && actor) {
    logAuditAction(actor.email, actor.name, 'DELETE_EVALUATION', 'evaluation', `Deleted evaluation submission ${id} for project ${target.projectId}.`);
  }
};

// --- JUDGE ASSIGNMENT SERVICES ---

export const getJudgeAssignments = (): JudgeAssignment[] => {
  initializeStorage();
  const raw = localStorage.getItem(ASSIGNMENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const getJudgeAssignmentsByJudge = (judgeIdentifier: string): JudgeAssignment[] => {
  const all = getJudgeAssignments();
  if (!judgeIdentifier) return [];
  const clean = normalizeEmail(judgeIdentifier);

  const users = getUsers();
  const matchedUser = users.find(u => normalizeEmail(u.email) === clean || u.id === judgeIdentifier);
  const userCleanEmail = matchedUser ? normalizeEmail(matchedUser.email) : clean;
  const userId = matchedUser ? matchedUser.id : judgeIdentifier;

  return all.filter(a => {
    const aCleanEmail = normalizeEmail(a.judgeEmail);
    return (
      aCleanEmail === clean ||
      aCleanEmail === userCleanEmail ||
      a.judgeId === userId ||
      a.judgeId === judgeIdentifier
    );
  });
};

export const isProjectAssignedToJudge = (judgeIdentifier: string, project: Project): boolean => {
  if (!judgeIdentifier || !project) return false;
  const assignments = getJudgeAssignmentsByJudge(judgeIdentifier);
  if (assignments.length === 0) return false;

  return assignments.some(asgn => {
    // 1. Application Type matching
    if (!matchesAppType(project.applicationType, asgn.applicationType)) {
      return false;
    }

    // 2. Head category matching (only for application types with head categories)
    const canon = canonicalAppType(project.applicationType);
    const isNoHeadCat = canon === 'Student-Secondary' || canon === 'Individual or Group';
    if (!isNoHeadCat && asgn.headCategory && asgn.headCategory !== 'All Head Category' && asgn.headCategory !== 'N/A') {
      if (!matchesCategory(project.headCategory, asgn.headCategory, project.applicationType)) {
        return false;
      }
    }

    // 3. Project IDs check if explicitly specified
    if (Array.isArray(asgn.projectIds) && asgn.projectIds.length > 0) {
      const matchId = asgn.projectIds.includes(project.id);
      const matchAppId = Boolean(project.applicationId) && asgn.projectIds.includes(project.applicationId);
      const matchCode = Boolean(project.projectCode) && asgn.projectIds.includes(project.projectCode);
      return matchId || matchAppId || matchCode;
    }

    return true;
  });
};

export const saveJudgeAssignment = (assignment: JudgeAssignment, actor?: { email: string; name: string }): void => {
  const current = getJudgeAssignments();
  const cleanEmail = normalizeEmail(assignment.judgeEmail);
  const safe: JudgeAssignment = {
    ...assignment,
    id: assignment.id || `asgn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    judgeEmail: cleanEmail,
    createdAt: assignment.createdAt || new Date().toISOString()
  };

  const idx = current.findIndex(a => a.id === safe.id);
  if (idx >= 0) {
    current[idx] = safe;
  } else {
    current.push(safe);
  }

  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(current));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('biin_assignments_updated'));
    window.dispatchEvent(new Event('biin_projects_updated'));
  }

  api.saveAssignment(safe, actor).catch(() => {});

  if (actor) {
    logAuditAction(
      actor.email,
      actor.name,
      'ASSIGN_PROJECTS',
      'judge',
      `Assigned ${safe.applicationType}${safe.headCategory ? ` (${safe.headCategory})` : ''} to Judge ${safe.judgeName} (${safe.judgeEmail}).`
    );
  }
};

export const deleteJudgeAssignment = (id: string, actor?: { email: string; name: string }): void => {
  const current = getJudgeAssignments();
  const target = current.find(a => a.id === id);
  const remaining = current.filter(a => a.id !== id);
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(remaining));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('biin_assignments_updated'));
    window.dispatchEvent(new Event('biin_projects_updated'));
  }

  api.deleteAssignment(id, actor).catch(() => {});

  if (target && actor) {
    logAuditAction(
      actor.email,
      actor.name,
      'DELETE_ASSIGNMENT',
      'judge',
      `Removed project assignment for Judge ${target.judgeName} (${target.applicationType}).`
    );
  }
};

// --- SCOPED RBAC ACCESS FOR JUDGE PANEL ---

/**
 * Returns active projects accessible to Judges, restricted strictly to assigned projects.
 */
export const getProjectsForJudge = (judgeEmail?: string, applicationType?: string, headCategory?: string): Project[] => {
  const allProjects = getProjects();
  const session = getCurrentUser();
  const effectiveEmail = judgeEmail || (session && session.role !== 'admin' ? session.email : undefined);

  // If judge email is provided or a judge is logged in, restrict strictly to assigned projects
  if (effectiveEmail) {
    const assignments = getJudgeAssignmentsByJudge(effectiveEmail);
    if (assignments.length === 0) {
      return []; // Unassigned judge sees no projects
    }
  } else if (!judgeEmail && session && session.role !== 'admin') {
    return [];
  }

  return allProjects.filter(p => {
    const isActive = !p.status || p.status === 'active';
    if (!isActive) return false;

    // Assignment filter
    if (effectiveEmail && !isProjectAssignedToJudge(effectiveEmail, p)) {
      return false;
    }

    if (applicationType && !matchesAppType(p.applicationType, applicationType)) return false;
    if (headCategory && !matchesCategory(p.headCategory, headCategory, p.applicationType)) return false;
    return true;
  });
};

/**
 * Returns stats for the Judge across their assigned projects and submissions.
 */
export const getDashboardStatsForJudge = (judgeEmail: string): DashboardStats => {
  const assignedProjects = getProjectsForJudge(judgeEmail);
  const judgeEvaluations = getEvaluationsByJudge(judgeEmail);

  const totalProjects = assignedProjects.length;
  const evaluatedProjectsCount = judgeEvaluations.length;
  const remainingProjectsCount = Math.max(0, totalProjects - evaluatedProjectsCount);

  let averageScore = 0;
  if (judgeEvaluations.length > 0) {
    const sumConvertedScores = judgeEvaluations.reduce(
      (acc, curr) => acc + (curr.convertedScore ?? curr.percentage ?? 0),
      0
    );
    averageScore = Number((sumConvertedScores / judgeEvaluations.length).toFixed(1));
  }

  return {
    totalProjects,
    evaluatedProjectsCount,
    remainingProjectsCount,
    averageScore
  };
};
