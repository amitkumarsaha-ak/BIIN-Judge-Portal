// Initial seed data for BIIN Judge Portal backend

export interface SeedUser {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: 'judge' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  roomNumber?: string;
  createdAt: string;
}

export interface SeedRoom {
  id: string;
  roomNumber: string;
  name: string;
  location?: string;
  capacity?: number;
  description?: string;
  createdAt: string;
}

export interface SeedProject {
  id: string;
  title: string;
  applicationId: string;
  projectCode: string;
  applicationType: string;
  headCategory: string;
  teamOrOrgName: string;
  representativeName: string;
  teamLeadName?: string;
  members?: string[];
  email: string;
  contactNumber: string;
  institutionOrOrg?: string;
  description: string;
  problemStatement?: string;
  solutionSummary?: string;
  tags: string[];
  roomNumber?: string;
  status: 'active' | 'inactive';
}

export interface SeedAssignment {
  id: string;
  judgeId: string;
  judgeEmail: string;
  judgeName: string;
  applicationType: string;
  headCategory?: string | null;
  projectIds?: string[];
  createdAt: string;
}

export interface SeedEvaluation {
  id: string;
  projectId: string;
  judgeEmail: string;
  judgeName: string;
  scores: Record<string, number>;
  feedback?: string;
  rawTotalScore: number;
  maxRawScore: number;
  convertedScore: number;
  roomNumber?: string;
  totalScore: number;
  percentage: number;
  submittedAt: string;
}

export const SEED_ROOMS: SeedRoom[] = [
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

export const SEED_USERS: SeedUser[] = [
  {
    id: 'admin-fixed-1',
    fullName: process.env.ADMIN_NAME || 'BIIN Administrator',
    email: (process.env.ADMIN_EMAIL || 'admin@biin.org').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'admin123',
    role: 'admin',
    status: 'approved',
    createdAt: '2026-07-01T08:00:00Z'
  }
];

export const SEED_PROJECTS: SeedProject[] = [];

export const SEED_EVALUATIONS: SeedEvaluation[] = [];

export const SEED_SETTINGS = {
  id: 'global',
  evaluationsLocked: false,
  finalResultsLocked: false,
  lockedProjects: [] as string[],
  autoRankingEnabled: true
};

export const SEED_AUDIT_LOGS = [
  {
    id: 'audit-init-1',
    actorEmail: process.env.ADMIN_EMAIL || 'admin@biin.org',
    actorName: process.env.ADMIN_NAME || 'BIIN Administrator',
    action: 'SYSTEM_INITIALIZE',
    targetType: 'settings',
    details: 'System initialized with default settings and admin account.',
    timestamp: '2026-08-15T09:00:00Z'
  }
];
