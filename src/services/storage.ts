import type { User, Project, Evaluation, DashboardStats, Room, SystemSettings, AuditLog } from '../types';
import { PRESEEDED_JUDGES, SAMPLE_PROJECTS } from '../data/mockData';
import { ADMIN_CONFIG } from '../config/authConfig';
import { matchesAppType, matchesCategory } from '../utils/evaluation';
import { api } from './api';

export const USERS_KEY = 'biin_portal_users';
export const CURRENT_USER_KEY = 'biin_portal_current_user';
export const PROJECTS_KEY = 'biin_portal_projects';
export const EVALUATIONS_KEY = 'biin_portal_evaluations';
export const ROOMS_KEY = 'biin_portal_rooms';
export const SETTINGS_KEY = 'biin_portal_settings';
export const AUDIT_LOGS_KEY = 'biin_portal_audit_logs';

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
  autoRankingEnabled: true
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

  // Initialize & Sync Users (Ensure admin matches ADMIN_CONFIG and all default judges are approved)
  const existingUsersData = localStorage.getItem(USERS_KEY);
  const normalizedPreseeded: User[] = PRESEEDED_JUDGES.map(j => {
    if (j.role === 'admin') {
      return {
        ...j,
        email: ADMIN_CONFIG.EMAIL,
        fullName: ADMIN_CONFIG.NAME,
        password: ADMIN_CONFIG.PASSWORD,
        status: 'approved'
      };
    }
    return {
      ...j,
      status: j.status || 'approved'
    };
  });

  if (!existingUsersData) {
    localStorage.setItem(USERS_KEY, JSON.stringify(normalizedPreseeded));
  } else {
    try {
      let users: User[] = JSON.parse(existingUsersData);
      let modified = false;

      // 1. Enforce ONLY ONE Admin matching ADMIN_CONFIG.EMAIL
      const cleanAdminEmail = ADMIN_CONFIG.EMAIL.trim().toLowerCase();
      users = users.map(u => {
        if (u.email?.trim().toLowerCase() === cleanAdminEmail) {
          if (u.role !== 'admin' || u.password !== ADMIN_CONFIG.PASSWORD || u.fullName !== ADMIN_CONFIG.NAME) {
            modified = true;
            return { ...u, role: 'admin', fullName: ADMIN_CONFIG.NAME, password: ADMIN_CONFIG.PASSWORD, status: 'approved' };
          }
          return u;
        } else if (u.role === 'admin') {
          // Any other user with admin role is demoted to judge to guarantee only ONE fixed Admin
          modified = true;
          return { ...u, role: 'judge', status: u.status || 'approved' };
        }
        return u;
      });

      // Ensure Admin exists
      if (!users.some(u => u.email?.trim().toLowerCase() === cleanAdminEmail)) {
        users.unshift({
          id: 'admin-fixed-1',
          fullName: ADMIN_CONFIG.NAME,
          email: ADMIN_CONFIG.EMAIL,
          password: ADMIN_CONFIG.PASSWORD,
          role: 'admin',
          status: 'approved',
          createdAt: '2026-07-01T08:00:00Z'
        });
        modified = true;
      }

      // Ensure default mock judges have a status (default to approved)
      users = users.map(u => {
        if (u.role === 'judge' && !u.status) {
          modified = true;
          return { ...u, status: 'approved' };
        }
        return u;
      });

      if (modified) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }

      // Migrate from any legacy user keys seamlessly
      const legacyKeys = ['biin_judge_portal_users', 'biin_users'];
      for (const lk of legacyKeys) {
        const raw = localStorage.getItem(lk);
        if (raw) {
          try {
            const legacyList = JSON.parse(raw);
            if (Array.isArray(legacyList) && legacyList.length > 0) {
              for (const lu of legacyList) {
                if (lu.email) {
                  const existingIdx = users.findIndex(u => u.email?.toLowerCase() === lu.email.toLowerCase());
                  if (existingIdx >= 0) {
                    users[existingIdx] = {
                      ...lu,
                      ...users[existingIdx],
                      password: users[existingIdx].password || lu.password,
                      status: (lu.status === 'approved' || users[existingIdx].status === 'approved') ? 'approved' : (users[existingIdx].status || lu.status || 'pending')
                    };
                  } else {
                    users.push(lu);
                  }
                }
              }
              localStorage.setItem(USERS_KEY, JSON.stringify(users));
            }
          } catch {}
          localStorage.removeItem(lk);
        }
      }
    } catch {
      localStorage.setItem(USERS_KEY, JSON.stringify(normalizedPreseeded));
    }
  }

  // Initialize Projects
  if (!localStorage.getItem(PROJECTS_KEY)) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(SAMPLE_PROJECTS));
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

  // Initialize Evaluations
  if (!localStorage.getItem(EVALUATIONS_KEY)) {
    const initialEvaluations: Evaluation[] = [
      {
        id: 'eval-org-1',
        projectId: 'proj-org-hcc-1',
        judgeEmail: 'judge@biin.org',
        judgeName: 'Dr. Sarah Jenkins (Judge 1)',
        roomNumber: 'Room 01',
        scores: { uniqueness: 8, publicOrGovValue: 9, features: 8, qualityTech: 7 },
        feedback: 'Strong healthcare product with broad public value.',
        rawTotalScore: 32,
        maxRawScore: 40,
        convertedScore: 80,
        totalScore: 32,
        percentage: 80,
        submittedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'eval-org-2',
        projectId: 'proj-org-hcc-1',
        judgeEmail: 'alex.mercer@biin.org',
        judgeName: 'Prof. Alex Mercer (Judge 2)',
        roomNumber: 'Room 01',
        scores: { uniqueness: 9, publicOrGovValue: 8, features: 9, qualityTech: 8 },
        feedback: 'Very solid hardware & sensor integration.',
        rawTotalScore: 34,
        maxRawScore: 40,
        convertedScore: 85,
        totalScore: 34,
        percentage: 85,
        submittedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'eval-org-3',
        projectId: 'proj-org-hcc-1',
        judgeEmail: 'farhan.ahmed@biin.org',
        judgeName: 'Eng. Farhan Ahmed (Judge 3)',
        roomNumber: 'Room 01',
        scores: { uniqueness: 7, publicOrGovValue: 8, features: 9, qualityTech: 8 },
        feedback: 'Great execution, ready for clinical trial phase.',
        rawTotalScore: 32,
        maxRawScore: 40,
        convertedScore: 80,
        totalScore: 32,
        percentage: 80,
        submittedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'eval-stu-1',
        projectId: 'proj-stu-hcc-1',
        judgeEmail: 'judge@biin.org',
        judgeName: 'Dr. Sarah Jenkins (Judge 1)',
        roomNumber: 'Room 01',
        scores: { uniqueness: 8, proofOfConcept: 9, features: 8, quality: 9, presentation: 8 },
        feedback: 'Excellent prototype execution with clear real-world agricultural impact potential.',
        rawTotalScore: 42,
        maxRawScore: 50,
        convertedScore: 84,
        totalScore: 42,
        percentage: 84,
        submittedAt: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        id: 'eval-stu-2',
        projectId: 'proj-stu-hcc-1',
        judgeEmail: 'alex.mercer@biin.org',
        judgeName: 'Prof. Alex Mercer (Judge 2)',
        roomNumber: 'Room 01',
        scores: { uniqueness: 9, proofOfConcept: 9, features: 9, quality: 9, presentation: 9 },
        feedback: 'Outstanding presentation and well-documented soil scanning algorithms.',
        rawTotalScore: 45,
        maxRawScore: 50,
        convertedScore: 90,
        totalScore: 45,
        percentage: 90,
        submittedAt: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        id: 'eval-stu-3',
        projectId: 'proj-stu-hcc-1',
        judgeEmail: 'farhan.ahmed@biin.org',
        judgeName: 'Eng. Farhan Ahmed (Judge 3)',
        roomNumber: 'Room 01',
        scores: { uniqueness: 8, proofOfConcept: 9, features: 9, quality: 8, presentation: 9 },
        feedback: 'Impressive BLE hardware connection and mobile UI responsiveness.',
        rawTotalScore: 43,
        maxRawScore: 50,
        convertedScore: 86,
        totalScore: 43,
        percentage: 86,
        submittedAt: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ];
    localStorage.setItem(EVALUATIONS_KEY, JSON.stringify(initialEvaluations));
  }
};

/**
 * Sync all data with the PostgreSQL REST backend
 */
export const syncWithBackend = async (): Promise<boolean> => {
  try {
    const health = await api.health();
    if (health.status !== 'online') return false;

    const [projectsRes, evalsRes, judgesRes, roomsRes, settingsRes, auditRes] = await Promise.allSettled([
      api.getProjects(),
      api.getEvaluations(),
      api.getJudges(),
      api.getRooms(),
      api.getSettings(),
      api.getAuditLogs()
    ]);

    if (projectsRes.status === 'fulfilled' && Array.isArray(projectsRes.value)) {
      const remoteProjects = projectsRes.value;
      const localProjects = getProjects();

      // Index remote projects by id and normalized applicationId
      const remoteMap = new Map<string, Project>();
      for (const rp of remoteProjects) {
        remoteMap.set(rp.id, rp);
        if (rp.applicationId) {
          remoteMap.set(`app_${rp.applicationId.trim().toLowerCase()}`, rp);
        }
      }

      // Track local-only projects that need to be pushed to remote backend
      const localOnlyProjects: Project[] = [];
      const mergedProjects: Project[] = [...remoteProjects];

      for (const lp of localProjects) {
        const foundInRemote = remoteMap.has(lp.id) || (lp.applicationId && remoteMap.has(`app_${lp.applicationId.trim().toLowerCase()}`));
        if (!foundInRemote) {
          // CRITICAL: Keep locally added project so it is never lost!
          mergedProjects.push(lp);
          localOnlyProjects.push(lp);
        }
      }

      localStorage.setItem(PROJECTS_KEY, JSON.stringify(mergedProjects));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('biin_projects_updated'));
      }

      // Asynchronously sync local-only projects to the backend
      if (localOnlyProjects.length > 0) {
        Promise.allSettled(localOnlyProjects.map(p => api.createProject(p))).catch(() => {});
      }
    }

    if (evalsRes.status === 'fulfilled' && Array.isArray(evalsRes.value)) {
      const remoteEvals = evalsRes.value;
      const localEvals = getEvaluations();

      const evalKey = (e: Evaluation) => `${e.projectId}___${(e.judgeEmail || '').toLowerCase().trim()}`;
      const mergedMap = new Map<string, Evaluation>();

      // 1. Add remote evaluations
      for (const re of remoteEvals) {
        mergedMap.set(evalKey(re), re);
      }

      // 2. Merge local evaluations: preserve local submissions not yet on server
      const localOnlyEvals: Evaluation[] = [];
      for (const le of localEvals) {
        const key = evalKey(le);
        if (!mergedMap.has(key)) {
          // CRITICAL: Keep local evaluation submission so it is never lost!
          mergedMap.set(key, le);
          localOnlyEvals.push(le);
        } else {
          // If present on both, keep the newer submission
          const remoteEval = mergedMap.get(key)!;
          const localTime = new Date(le.updatedAt || le.submittedAt || 0).getTime();
          const remoteTime = new Date(remoteEval.updatedAt || remoteEval.submittedAt || 0).getTime();
          if (localTime > remoteTime) {
            mergedMap.set(key, le);
            localOnlyEvals.push(le);
          }
        }
      }

      const mergedEvaluations = Array.from(mergedMap.values());
      localStorage.setItem(EVALUATIONS_KEY, JSON.stringify(mergedEvaluations));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('biin_projects_updated'));
      }

      // Asynchronously sync local-only evaluations to the backend
      if (localOnlyEvals.length > 0) {
        Promise.allSettled(localOnlyEvals.map(e => api.saveEvaluation(e))).catch(() => {});
      }
    }
    if (judgesRes.status === 'fulfilled' && Array.isArray(judgesRes.value)) {
      const existingUsers = getUsers();
      const existingAdmins = existingUsers.filter(u => u.role === 'admin');
      
      // Merge remote judges while keeping existing passwords if known locally
      const mergedJudges = judgesRes.value.map(remoteJudge => {
        const localJudge = existingUsers.find(
          u => u.id === remoteJudge.id || u.email?.toLowerCase() === remoteJudge.email?.toLowerCase()
        );
        const isApproved = localJudge?.status === 'approved' || remoteJudge.status === 'approved';
        return {
          ...remoteJudge,
          status: isApproved ? 'approved' : (remoteJudge.status || localJudge?.status || 'pending'),
          password: localJudge?.password || remoteJudge.password
        };
      });

      // Keep any local pending judges that haven't synced to remote yet
      const localOnlyJudges = existingUsers.filter(
        u => u.role === 'judge' && !judgesRes.value.some(r => r.id === u.id || r.email?.toLowerCase() === u.email?.toLowerCase())
      );

      const combined = [...existingAdmins, ...mergedJudges, ...localOnlyJudges];
      localStorage.setItem(USERS_KEY, JSON.stringify(combined));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('biin_users_updated'));
      }

      // Sync local-only judges to backend asynchronously
      if (localOnlyJudges.length > 0) {
        Promise.allSettled(
          localOnlyJudges.map(j => api.register(j.fullName, j.email, j.password || 'password123'))
        ).catch(() => {});
      }

      // For any judges that are approved locally, ensure backend knows they are approved
      for (const j of combined) {
        if (j.role === 'judge' && j.status === 'approved') {
          const remoteJ = judgesRes.value.find(r => r.id === j.id || r.email?.toLowerCase() === j.email?.toLowerCase());
          if (remoteJ && remoteJ.status !== 'approved') {
            api.approveJudge(remoteJ.id || j.id).catch(() => {});
          }
        }
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
  return data ? JSON.parse(data) : [];
};

export const getJudges = (): User[] => {
  return getUsers().filter(u => u.role === 'judge');
};

export const findUserByEmail = (email: string): User | undefined => {
  if (!email) return undefined;
  const cleanEmail = email.trim().toLowerCase();

  // Single fixed admin check
  if (cleanEmail === ADMIN_CONFIG.EMAIL.trim().toLowerCase()) {
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
  const found = users.find((u) => u.email?.trim().toLowerCase() === cleanEmail);
  if (found) {
    if (found.role === 'admin' && found.email?.trim().toLowerCase() !== ADMIN_CONFIG.EMAIL.trim().toLowerCase()) {
      found.role = 'judge';
    }
    return found;
  }

  // Fallback check against PRESEEDED_JUDGES
  const preseeded = PRESEEDED_JUDGES.find((u) => u.email?.trim().toLowerCase() === cleanEmail);
  if (preseeded && preseeded.role !== 'admin') {
    const judgeUser: User = {
      ...preseeded,
      status: preseeded.status || 'approved'
    };
    users.push(judgeUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return judgeUser;
  }

  return undefined;
};

export const saveUser = (user: User, actor?: { email: string; name: string }): void => {
  const users = getUsers();
  
  const safeUser: User = {
    ...user,
    role: 'judge',
    status: user.status || 'pending'
  };

  const existingIdx = users.findIndex(u => u.email?.toLowerCase() === safeUser.email?.toLowerCase() || u.id === safeUser.id);
  if (existingIdx >= 0) {
    users[existingIdx] = {
      ...users[existingIdx],
      ...safeUser,
      password: safeUser.password || users[existingIdx].password
    };
  } else {
    users.push(safeUser);
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('biin_users_updated'));
  }
  
  // Forward to backend API
  api.register(safeUser.fullName, safeUser.email, safeUser.password || 'password123').catch(() => {});

  if (actor) {
    logAuditAction(actor.email, actor.name, 'CREATE_USER', 'judge', `Registered judge account for ${safeUser.fullName} (${safeUser.email}) with status "${safeUser.status}".`);
  }
};

export const approveJudge = (judgeId: string, actor?: { email: string; name: string }): void => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === judgeId || u.email?.toLowerCase() === judgeId.toLowerCase());
  if (idx >= 0) {
    users[idx] = { ...users[idx], status: 'approved' };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('biin_users_updated'));
    }
    api.approveJudge(users[idx].id, actor).catch(() => {});
    if (actor) {
      logAuditAction(actor.email, actor.name, 'APPROVE_JUDGE', 'judge', `Approved judge registration for ${users[idx].fullName} (${users[idx].email}).`);
    }
  }
};

export const rejectJudge = (judgeId: string, actor?: { email: string; name: string }): void => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === judgeId || u.email?.toLowerCase() === judgeId.toLowerCase());
  if (idx >= 0) {
    users[idx] = { ...users[idx], status: 'rejected' };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('biin_users_updated'));
    }
    api.rejectJudge(users[idx].id, actor).catch(() => {});
    if (actor) {
      logAuditAction(actor.email, actor.name, 'REJECT_JUDGE', 'judge', `Rejected judge registration for ${users[idx].fullName} (${users[idx].email}).`);
    }
  }
};

export const resetJudgePassword = (email: string, newPassword: string): boolean => {
  const users = getUsers();
  const cleanEmail = email.trim().toLowerCase();
  const idx = users.findIndex(u => u.email?.toLowerCase() === cleanEmail);
  if (idx >= 0) {
    users[idx] = { ...users[idx], password: newPassword };
  } else {
    const preseeded = PRESEEDED_JUDGES.find(u => u.email?.toLowerCase() === cleanEmail);
    if (preseeded) {
      users.push({ ...preseeded, password: newPassword, status: 'approved' });
    } else {
      users.push({
        id: `judge-${Date.now()}`,
        fullName: cleanEmail.split('@')[0],
        email: cleanEmail,
        password: newPassword,
        role: 'judge',
        status: 'approved',
        createdAt: new Date().toISOString()
      });
    }
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // Also clean up any legacy user keys so they never resurrect old passwords
  const legacyKeys = ['biin_judge_portal_users', 'biin_users'];
  for (const lk of legacyKeys) {
    try {
      const raw = localStorage.getItem(lk);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const lIdx = list.findIndex((u: any) => u.email?.toLowerCase() === cleanEmail);
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
  if (current && current.email?.toLowerCase() === cleanEmail) {
    setCurrentUserSession({ ...current, password: newPassword });
  }
  api.resetPassword(cleanEmail, newPassword).catch(() => {});
  return true;
};

export const updateUser = (updated: User, actor?: { email: string; name: string }): void => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === updated.id);
  if (idx >= 0) {
    const safeUpdated: User = {
      ...updated,
      role: updated.email?.trim().toLowerCase() === ADMIN_CONFIG.EMAIL.trim().toLowerCase() ? 'admin' : 'judge'
    };
    users[idx] = safeUpdated;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
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
  const target = users.find(u => u.id === id);
  if (target?.email?.trim().toLowerCase() === ADMIN_CONFIG.EMAIL.trim().toLowerCase()) {
    return;
  }
  const remaining = users.filter(u => u.id !== id);
  localStorage.setItem(USERS_KEY, JSON.stringify(remaining));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('biin_users_updated'));
  }

  api.deleteJudge(id, actor).catch(() => {});

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
  return data ? JSON.parse(data) : [];
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

  // Check global evaluation lock
  const settings = getSystemSettings();
  if (settings.evaluationsLocked) {
    throw new Error('All project evaluations are currently locked by the Administrator.');
  }

  // Check individual project lock
  if (settings.lockedProjects.includes(evaluation.projectId)) {
    throw new Error('Evaluations for this specific project are currently locked by the Administrator.');
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

// --- SCOPED RBAC ACCESS FOR JUDGE PANEL ---

/**
 * Returns active projects accessible to Judges, optionally filtered by applicationType and headCategory.
 */
export const getProjectsForJudge = (applicationType?: string, headCategory?: string): Project[] => {
  const allProjects = getProjects();
  return allProjects.filter(p => {
    const isActive = !p.status || p.status === 'active';
    if (!isActive) return false;
    if (applicationType && !matchesAppType(p.applicationType, applicationType)) return false;
    if (headCategory && !matchesCategory(p.headCategory, headCategory)) return false;
    return true;
  });
};

/**
 * Returns stats for the Judge across all active projects and their own submissions.
 */
export const getDashboardStatsForJudge = (judgeEmail: string): DashboardStats => {
  const allActiveProjects = getProjects().filter(p => !p.status || p.status === 'active');
  const judgeEvaluations = getEvaluationsByJudge(judgeEmail);

  const totalProjects = allActiveProjects.length;
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
