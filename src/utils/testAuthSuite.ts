import {
  initializeStorage,
  saveUser,
  findUserByEmail,
  approveJudge,
  rejectJudge
} from '../services/storage';
import { ADMIN_CONFIG } from '../config/authConfig';
import type { User } from '../types';

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

export const runAuthTestSuite = () => {
  console.log('=== STARTING BIIN AUTH & JUDGE REGISTRATION TEST SUITE ===');
  (globalThis as any).localStorage.clear();
  initializeStorage();

  // Test 1: Fixed Admin user verification
  const adminUser = findUserByEmail(ADMIN_CONFIG.EMAIL);
  if (!adminUser || adminUser.role !== 'admin' || adminUser.email !== ADMIN_CONFIG.EMAIL) {
    throw new Error('Test 1 Failed: Fixed Admin account not properly initialized');
  }
  console.log('Test 1 Passed: Fixed Admin initialized properly with email', adminUser.email);

  // Test 2: Fixed Admin login check (simulate AuthContext logic)
  const verifyLogin = (email: string, pass: string): { success: boolean; role?: string; error?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Single Fixed Admin
    if (trimmedEmail === ADMIN_CONFIG.EMAIL.trim().toLowerCase()) {
      if (cleanPass !== ADMIN_CONFIG.PASSWORD && pass !== ADMIN_CONFIG.PASSWORD) {
        return { success: false, error: 'Invalid admin email or password.' };
      }
      return { success: true, role: 'admin' };
    }

    // 2. Judge check
    const existing = findUserByEmail(trimmedEmail);
    if (!existing) return { success: false, error: 'Invalid email or password.' };
    if (existing.password !== pass && existing.password !== cleanPass) return { success: false, error: 'Invalid email or password.' };
    if (existing.role === 'admin') return { success: false, error: 'Invalid email or password.' };

    if (existing.status === 'pending') {
      return { success: false, error: 'Your account is currently pending Administrator approval. Please wait for an Admin to approve your registration before logging in.' };
    }
    if (existing.status === 'rejected') {
      return { success: false, error: 'Your judge registration has been declined by the Administrator. Access is denied.' };
    }

    return { success: true, role: 'judge' };
  };

  const adminSuccess = verifyLogin(ADMIN_CONFIG.EMAIL, ADMIN_CONFIG.PASSWORD);
  if (!adminSuccess.success || adminSuccess.role !== 'admin') {
    throw new Error('Test 1.1 Failed: Fixed Admin could not log in');
  }
  console.log('Test 1.1 Passed: Fixed Admin successfully logged in');

  // Test 2: Wrong Admin credentials fail
  const wrongAdminPass = verifyLogin(ADMIN_CONFIG.EMAIL, 'wrong_password_999');
  if (wrongAdminPass.success) {
    throw new Error('Test 2 Failed: Wrong admin password unexpectedly succeeded');
  }
  console.log('Test 2 Passed: Wrong admin password correctly failed with:', wrongAdminPass.error);

  // Test 3 & 4: Judge self-registration & becomes Pending
  const newJudge: User = {
    id: `judge-${Date.now()}`,
    fullName: 'Test Candidate Judge',
    email: 'candidate.judge@biin.org',
    password: 'password123',
    role: 'judge',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  saveUser(newJudge);

  const candidateInStorage = findUserByEmail('candidate.judge@biin.org');
  if (!candidateInStorage) {
    throw new Error('Test 3 Failed: Judge registration not found in storage');
  }
  if (candidateInStorage.status !== 'pending') {
    throw new Error(`Test 4 Failed: Expected new judge status to be "pending", got "${candidateInStorage.status}"`);
  }
  console.log('Test 3 & 4 Passed: Judge registered and status is "pending"');

  // Test 5: Pending Judge cannot login
  const pendingLogin = verifyLogin('candidate.judge@biin.org', 'password123');
  if (pendingLogin.success) {
    throw new Error('Test 5 Failed: Pending judge was able to log in');
  }
  if (!pendingLogin.error?.includes('pending Administrator approval')) {
    throw new Error(`Test 5 Failed: Unexpected error message for pending judge: ${pendingLogin.error}`);
  }
  console.log('Test 5 Passed: Pending judge login denied with:', pendingLogin.error);

  // Test 6: Admin approves Judge
  approveJudge(candidateInStorage.id, { email: ADMIN_CONFIG.EMAIL, name: ADMIN_CONFIG.NAME });
  const approvedJudgeInStorage = findUserByEmail('candidate.judge@biin.org');
  if (approvedJudgeInStorage?.status !== 'approved') {
    throw new Error(`Test 6 Failed: Expected status "approved", got "${approvedJudgeInStorage?.status}"`);
  }
  console.log('Test 6 Passed: Admin approved judge, status is now "approved"');

  // Test 7: Approved Judge can login
  const approvedLogin = verifyLogin('candidate.judge@biin.org', 'password123');
  if (!approvedLogin.success || approvedLogin.role !== 'judge') {
    throw new Error('Test 7 Failed: Approved judge failed to log in');
  }
  console.log('Test 7 Passed: Approved judge successfully logged in as role "judge"');

  // Test 8: Admin rejects Judge
  rejectJudge(candidateInStorage.id, { email: ADMIN_CONFIG.EMAIL, name: ADMIN_CONFIG.NAME });
  const rejectedJudgeInStorage = findUserByEmail('candidate.judge@biin.org');
  if (rejectedJudgeInStorage?.status !== 'rejected') {
    throw new Error(`Test 8 Failed: Expected status "rejected", got "${rejectedJudgeInStorage?.status}"`);
  }
  console.log('Test 8 Passed: Admin rejected judge, status is now "rejected"');

  // Test 9: Rejected Judge cannot login
  const rejectedLogin = verifyLogin('candidate.judge@biin.org', 'password123');
  if (rejectedLogin.success) {
    throw new Error('Test 9 Failed: Rejected judge was able to log in');
  }
  if (!rejectedLogin.error?.includes('declined')) {
    throw new Error(`Test 9 Failed: Unexpected error message for rejected judge: ${rejectedLogin.error}`);
  }
  console.log('Test 9 Passed: Rejected judge login denied with:', rejectedLogin.error);

  // Test 10: Judge cannot become Admin or access Admin
  const isUserAdmin = (user: User | null): boolean => {
    return Boolean(user?.role === 'admin' && user?.email?.trim().toLowerCase() === ADMIN_CONFIG.EMAIL.trim().toLowerCase());
  };

  // Re-approve candidate and verify they are strictly NOT admin
  approveJudge(candidateInStorage.id);
  const reApproved = findUserByEmail('candidate.judge@biin.org')!;
  if (isUserAdmin(reApproved)) {
    throw new Error('Test 10 Failed: Judge evaluated as Admin');
  }

  // Attempt tampering: save a user with role 'admin'
  const hackedUser: User = {
    id: 'hacker-1',
    fullName: 'Rogue User',
    email: 'hacker@example.com',
    password: 'hack',
    role: 'admin' as any,
    status: 'approved',
    createdAt: new Date().toISOString()
  };
  saveUser(hackedUser);
  const savedHacker = findUserByEmail('hacker@example.com');
  if (savedHacker?.role === 'admin' || isUserAdmin(savedHacker || null)) {
    throw new Error('Test 10 Failed: System allowed a non-fixed admin to have admin role');
  }
  console.log('Test 10 Passed: Security verified - rogue user cannot gain Admin role');

  console.log('=== ALL 10 TESTS IN BIIN AUTH & REGISTRATION SUITE PASSED ===');
  return true;
};
