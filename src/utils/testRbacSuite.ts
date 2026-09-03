// Automated test script for RBAC Separation (Admin Panel vs Judge Panel)
import {
  initializeStorage,
  getRooms,
  addRoom,
  saveUser,
  getProjects,
  getProjectsForJudge,
  getEvaluationsByJudge,
  getSystemSettings,
  toggleEvaluationLock,
  saveEvaluation,
  getAuditLogs,
  findUserByEmail
} from '../services/storage';
import type { Room, User, Evaluation } from '../types';

// Mock localStorage if in Node environment
if (typeof (globalThis as any).localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

export const runRbacTestSuite = () => {
  console.log('=== STARTING RBAC ADMIN VS JUDGE ISOLATION TEST SUITE ===');
  initializeStorage();

  // Test 1: Default Rooms initialized
  const rooms = getRooms();
  console.log(`[PASS] Configured rooms count: ${rooms.length}`);
  if (rooms.length < 5) throw new Error('Expected at least 5 default rooms');

  // Test 2: Room 01 vs Room 02 project isolation for Judges
  const allProjects = getProjects();
  const room1Projects = getProjectsForJudge('Room 01');
  const room2Projects = getProjectsForJudge('Room 02');
  const unassignedJudgeProjects = getProjectsForJudge('');

  console.log(`[PASS] Total projects: ${allProjects.length}, Room 01 projects: ${room1Projects.length}, Room 02 projects: ${room2Projects.length}`);
  if (unassignedJudgeProjects.length !== 0) {
    throw new Error('Unassigned judge should receive 0 projects');
  }
  if (room1Projects.some(p => p.roomNumber !== 'Room 01')) {
    throw new Error('Room 01 judge received projects from another room');
  }
  if (room2Projects.some(p => p.roomNumber !== 'Room 02')) {
    throw new Error('Room 02 judge received projects from another room');
  }

  // Test 3: Judge evaluation isolation
  const judge1Evals = getEvaluationsByJudge('judge@biin.org');
  const judge2Evals = getEvaluationsByJudge('alex.mercer@biin.org');
  console.log(`[PASS] Judge 1 evals: ${judge1Evals.length}, Judge 2 evals: ${judge2Evals.length}`);
  if (judge1Evals.some(e => e.judgeEmail !== 'judge@biin.org')) {
    throw new Error('Judge 1 received evaluations from another judge');
  }

  // Test 4: Evaluation Lock Engine
  const settingsBefore = getSystemSettings();
  console.log(`[PASS] Initial evaluationsLocked: ${settingsBefore.evaluationsLocked}`);

  // Test submitting evaluation while unlocked
  const testEval: Evaluation = {
    id: `eval-rbac-${Date.now()}`,
    projectId: room1Projects[0]?.id || 'proj-org-hcc-1',
    judgeEmail: 'judge@biin.org',
    judgeName: 'Dr. Sarah Jenkins',
    scores: { uniqueness: 8, publicOrGovValue: 8, features: 8, qualityTech: 8 },
    rawTotalScore: 32,
    maxRawScore: 40,
    convertedScore: 80,
    totalScore: 32,
    percentage: 80,
    submittedAt: new Date().toISOString()
  };

  saveEvaluation(testEval, { email: 'judge@biin.org', name: 'Dr. Sarah Jenkins' });
  console.log('[PASS] Submission while unlocked succeeded.');

  // Lock evaluations
  toggleEvaluationLock(true, { email: 'admin@biin.org', name: 'BIIN Administrator' });
  const settingsLocked = getSystemSettings();
  if (!settingsLocked.evaluationsLocked) {
    throw new Error('Evaluation lock toggle failed');
  }

  // Attempt to submit while locked - MUST THROW
  let lockBlocked = false;
  try {
    saveEvaluation(testEval, { email: 'judge@biin.org', name: 'Dr. Sarah Jenkins' });
  } catch (err: any) {
    lockBlocked = true;
    console.log(`[PASS] Evaluation submission successfully blocked by lock: "${err.message}"`);
  }

  if (!lockBlocked) {
    throw new Error('Expected evaluation submission to be blocked when evaluations are locked.');
  }

  // Unlock back
  toggleEvaluationLock(false, { email: 'admin@biin.org', name: 'BIIN Administrator' });

  // Test 5: Audit Log recorded
  const auditLogs = getAuditLogs();
  console.log(`[PASS] Total audit records: ${auditLogs.length}`);
  if (auditLogs.length === 0) {
    throw new Error('Expected audit logs to be populated');
  }

  // Test 6: Create New Judge & Room via Admin
  const newRoom: Room = {
    id: `room-test-${Date.now()}`,
    roomNumber: 'Room 99',
    name: 'Room 99 — Quantum Lab',
    location: 'Lab 4',
    capacity: 20,
    createdAt: new Date().toISOString()
  };
  addRoom(newRoom, { email: 'admin@biin.org', name: 'Administrator' });

  const newJudge: User = {
    id: `judge-test-${Date.now()}`,
    fullName: 'Prof. Quantum Test',
    email: 'quantum@biin.org',
    password: 'password123',
    role: 'judge',
    roomNumber: 'Room 99',
    createdAt: new Date().toISOString()
  };
  saveUser(newJudge, { email: 'admin@biin.org', name: 'Administrator' });

  // Test 7: Admin Account Retrieval & Authentication Check
  const adminUser = findUserByEmail('admin@biin.org');
  if (!adminUser) {
    throw new Error('findUserByEmail("admin@biin.org") returned undefined');
  }
  if (adminUser.role !== 'admin' || adminUser.password !== 'admin123') {
    throw new Error('Admin user has invalid credentials or role');
  }
  console.log(`[PASS] Admin user verified: "${adminUser.fullName}" (role=${adminUser.role}, email=${adminUser.email})`);

  // Case-insensitive check
  const caseInsensitiveAdmin = findUserByEmail('  ADMIN@BIIN.ORG ');
  if (!caseInsensitiveAdmin || caseInsensitiveAdmin.email !== 'admin@biin.org') {
    throw new Error('Case-insensitive admin lookup failed');
  }
  console.log('[PASS] Case-insensitive and trimmed admin lookup passed.');

  console.log('=== ALL RBAC ADMIN VS JUDGE SEPARATION TESTS PASSED! ===');
  return true;
};

runRbacTestSuite();
