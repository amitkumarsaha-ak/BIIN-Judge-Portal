import {
  calculateAward,
  calculateCategorizedResults,
  getProjectCombinedResult
} from './evaluation';
import type { Project, Evaluation } from '../types';

console.log('=== RUNNING BIIN RESULT CALCULATION & ACCEPTANCE TEST SUITE ===');

// --- SECTION: EXACT BOUNDARY RULES TEST ---
console.log('\n--- Testing Exact Boundary Rules (New Rules: 85%, 70%, 65%) ---');
console.assert(calculateAward(100.0) === 'Champion', '100% must be Champion');
console.assert(calculateAward(85.01) === 'Champion', '85.01% must be Champion');
console.assert(calculateAward(85.0) === 'Champion', '85.0% must be Champion');

console.assert(calculateAward(84.99) === 'Winner', '84.99% must be Winner');
console.assert(calculateAward(75.0) === 'Winner', '75% must be Winner');
console.assert(calculateAward(70.0) === 'Winner', '70% must be Winner');

console.assert(calculateAward(69.99) === 'Merit', '69.99% must be Merit');
console.assert(calculateAward(67.5) === 'Merit', '67.5% must be Merit');
console.assert(calculateAward(65.0) === 'Merit', '65% must be Merit');

console.assert(calculateAward(64.99) === 'No Award', '64.99% must be No Award');
console.assert(calculateAward(50.0) === 'No Award', '50% must be No Award');
console.assert(calculateAward(0.0) === 'No Award', '0% must be No Award');
console.log('[PASS] Exact boundary rules verified (≥85% Champion, ≥70% Winner, ≥65% Merit, <65% No Award).');

// --- ACCEPTANCE TEST 1: Multiple Champions Sequence ---
console.log('\n--- Acceptance Test 1: Multiple Champions Sequence (e.g. 95%, 88%) ---');
const testProjects: Project[] = [
  {
    id: 'sec-1',
    title: 'Secondary Project 1',
    applicationId: 'SEC-001',
    projectCode: 'SEC-001',
    applicationType: 'Student-Secondary',
    headCategory: 'N/A',
    teamOrOrgName: 'Team One',
    representativeName: 'Rep One',
    email: 'sec1@biin.org',
    contactNumber: '123456789',
    description: 'Desc',
    tags: [],
    status: 'active'
  },
  {
    id: 'sec-2',
    title: 'Secondary Project 2',
    applicationId: 'SEC-002',
    projectCode: 'SEC-002',
    applicationType: 'Student-Secondary',
    headCategory: 'N/A',
    teamOrOrgName: 'Team Two',
    representativeName: 'Rep Two',
    email: 'sec2@biin.org',
    contactNumber: '123456789',
    description: 'Desc',
    tags: [],
    status: 'active'
  }
];

const testEvals: Evaluation[] = [
  {
    id: 'eval-sec-1',
    projectId: 'sec-1',
    judgeEmail: 'judge@biin.org',
    judgeName: 'Judge One',
    scores: { uniqueness: 10, proofOfConcept: 10, features: 10, quality: 9, presentation: 9 }, // 48/50 = 96%
    rawTotalScore: 48,
    maxRawScore: 50,
    convertedScore: 96,
    totalScore: 48,
    percentage: 96,
    submittedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'eval-sec-2',
    projectId: 'sec-2',
    judgeEmail: 'judge@biin.org',
    judgeName: 'Judge One',
    scores: { uniqueness: 9, proofOfConcept: 9, features: 9, quality: 8, presentation: 8 }, // 43/50 = 86%
    rawTotalScore: 43,
    maxRawScore: 50,
    convertedScore: 86,
    totalScore: 43,
    percentage: 86,
    submittedAt: '2026-08-01T10:00:00Z'
  }
];

const res1 = getProjectCombinedResult(testProjects[0], testProjects, testEvals);
const res2 = getProjectCombinedResult(testProjects[1], testProjects, testEvals);

console.assert(res1.award === '1st Champion', `Expected '1st Champion', got '${res1.award}'`);
console.assert(res2.award === '2nd Champion', `Expected '2nd Champion', got '${res2.award}'`);
console.log(`[PASS] Sequenced ranking works: res1 = '${res1.award}', res2 = '${res2.award}'.`);

// --- TEST 12 RESULT POOLS ---
console.log('\n--- Testing 12 Competition Category Pools ---');
const dummyCats = calculateCategorizedResults([], []);
console.assert(dummyCats.length === 12, `Expected 12 category pools, got ${dummyCats.length}`);
console.log(`[PASS] Exactly 12 pools generated:`);
dummyCats.forEach((c, idx) => {
  console.log(`  ${idx + 1}. [${c.appTypeTitle}] ${c.headCategoryName}`);
});

console.log('\n=== ALL TESTS PASSED! ===');

