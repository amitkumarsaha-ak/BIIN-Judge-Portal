import type { User, Project, Evaluation, DashboardStats, Room, SystemSettings, AuditLog } from '../types';
import { PRESEEDED_JUDGES, SAMPLE_PROJECTS } from '../data/mockData';

const USERS_KEY = 'biin_portal_users';
const CURRENT_USER_KEY = 'biin_portal_current_user';
const PROJECTS_KEY = 'biin_portal_projects';
const EVALUATIONS_KEY = 'biin_portal_evaluations';
const ROOMS_KEY = 'biin_portal_rooms';
const SETTINGS_KEY = 'biin_portal_settings';
const AUDIT_LOGS_KEY = 'biin_portal_audit_logs';

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
    actorEmail: 'admin@biin.org',
    actorName: 'BIIN Administrator',
    action: 'SYSTEM_INITIALIZE',
    targetType: 'settings',
    details: 'System initialized with default rooms, nominated projects, and judges.',
    timestamp: '2026-08-15T09:00:00Z'
  }
];

// Initialize default storage data
export const initializeStorage = () => {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return;

  // Initialize & Sync Users (Ensure admin@biin.org and all default judges are always present)
  const existingUsersData = localStorage.getItem(USERS_KEY);
  if (!existingUsersData) {
    localStorage.setItem(USERS_KEY, JSON.stringify(PRESEEDED_JUDGES));
  } else {
    try {
      const users: User[] = JSON.parse(existingUsersData);
      let modified = false;
      for (const preseeded of PRESEEDED_JUDGES) {
        const foundIndex = users.findIndex(
          u => u.email?.trim().toLowerCase() === preseeded.email.trim().toLowerCase()
        );
        if (foundIndex === -1) {
          users.push(preseeded);
          modified = true;
        } else if (preseeded.role === 'admin' && users[foundIndex].role !== 'admin') {
          // Repair admin role if altered
          users[foundIndex] = { ...users[foundIndex], role: 'admin', password: preseeded.password };
          modified = true;
        }
      }
      if (modified) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    } catch {
      localStorage.setItem(USERS_KEY, JSON.stringify(PRESEEDED_JUDGES));
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
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 200))); // keep last 200 logs
};

// --- SYSTEM SETTINGS & LOCK ENGINE ---

export const getSystemSettings = (): SystemSettings => {
  initializeStorage();
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
};

export const updateSystemSettings = (settings: SystemSettings, actor?: { email: string; name: string }): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  if (actor) {
    logAuditAction(actor.email, actor.name, 'UPDATE_SETTINGS', 'settings', `Updated system configuration & lock rules.`);
  }
};

export const toggleEvaluationLock = (locked: boolean, actor?: { email: string; name: string }): void => {
  const settings = getSystemSettings();
  settings.evaluationsLocked = locked;
  updateSystemSettings(settings, actor);
};

export const toggleFinalResultLock = (locked: boolean, actor?: { email: string; name: string }): void => {
  const settings = getSystemSettings();
  settings.finalResultsLocked = locked;
  updateSystemSettings(settings, actor);
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
  const users = getUsers();
  const found = users.find((u) => u.email?.trim().toLowerCase() === cleanEmail);
  if (found) return found;

  // Fallback check against PRESEEDED_JUDGES (guarantees admin@biin.org always works)
  const preseeded = PRESEEDED_JUDGES.find((u) => u.email?.trim().toLowerCase() === cleanEmail);
  if (preseeded) {
    users.push(preseeded);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return preseeded;
  }

  return undefined;
};

export const saveUser = (user: User, actor?: { email: string; name: string }): void => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  if (actor) {
    logAuditAction(actor.email, actor.name, 'CREATE_USER', 'judge', `Created ${user.role} user account for ${user.fullName} (${user.email}).`);
  }
};

export const updateUser = (updated: User, actor?: { email: string; name: string }): void => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === updated.id);
  if (idx >= 0) {
    users[idx] = updated;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    if (actor) {
      logAuditAction(actor.email, actor.name, 'UPDATE_USER', 'judge', `Updated details for ${updated.fullName} (${updated.email}).`);
    }
  }
};

export const deleteUser = (id: string, actor?: { email: string; name: string }): void => {
  const users = getUsers();
  const target = users.find(u => u.id === id);
  const remaining = users.filter(u => u.id !== id);
  localStorage.setItem(USERS_KEY, JSON.stringify(remaining));

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
  projects.push(project);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  if (actor) {
    logAuditAction(actor.email, actor.name, 'CREATE_PROJECT', 'project', `Created project "${project.title}" (${project.applicationId}).`);
  }
};

export const updateProject = (updated: Project, actor?: { email: string; name: string }): void => {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === updated.id);
  if (idx >= 0) {
    projects[idx] = updated;
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
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

  if (target && actor) {
    logAuditAction(actor.email, actor.name, 'DELETE_EVALUATION', 'evaluation', `Deleted evaluation submission ${id} for project ${target.projectId}.`);
  }
};

// --- SCOPED RBAC ACCESS FOR JUDGE PANEL ---

/**
 * Returns strictly ONLY active projects assigned to the Judge's assigned Room.
 * If the judge is not assigned to a room, returns an empty array.
 */
export const getProjectsForJudge = (roomNumber?: string): Project[] => {
  if (!roomNumber || !roomNumber.trim()) {
    return [];
  }
  const allProjects = getProjects();
  return allProjects.filter(
    p => p.status === 'active' && (p.roomNumber || '').toLowerCase().trim() === roomNumber.toLowerCase().trim()
  );
};

/**
 * Returns stats scoped strictly to the Judge's assigned room and their own submissions.
 */
export const getDashboardStatsForJudge = (judgeEmail: string, roomNumber?: string): DashboardStats => {
  const assignedProjects = getProjectsForJudge(roomNumber);
  const judgeEvaluations = getEvaluationsByJudge(judgeEmail);

  const totalProjects = assignedProjects.length;
  const evaluatedProjectsCount = judgeEvaluations.filter(e => 
    assignedProjects.some(p => p.id === e.projectId)
  ).length;
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
