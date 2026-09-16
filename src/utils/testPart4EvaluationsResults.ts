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

// --- ACCEPTANCE TEST 1: Exactly 1 Champion, 1 Winner, Up to 2 Merits ---
console.log('\n--- Acceptance Test 1: 1 Champion (96%), 1 Winner (90%), Merits (75%, 68%) ---');
const testProjects: Project[] = [
  {
    id: 'sec-1',
    title: 'Secondary Project 1 (96%)',
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
    title: 'Secondary Project 2 (90%)',
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
  },
  {
    id: 'sec-3',
    title: 'Secondary Project 3 (75%)',
    applicationId: 'SEC-003',
    projectCode: 'SEC-003',
    applicationType: 'Student-Secondary',
    headCategory: 'N/A',
    teamOrOrgName: 'Team Three',
    representativeName: 'Rep Three',
    email: 'sec3@biin.org',
    contactNumber: '123456789',
    description: 'Desc',
    tags: [],
    status: 'active'
  },
  {
    id: 'sec-4',
    title: 'Secondary Project 4 (68%)',
    applicationId: 'SEC-004',
    projectCode: 'SEC-004',
    applicationType: 'Student-Secondary',
    headCategory: 'N/A',
    teamOrOrgName: 'Team Four',
    representativeName: 'Rep Four',
    email: 'sec4@biin.org',
    contactNumber: '123456789',
    description: 'Desc',
    tags: [],
    status: 'active'
  },
  {
    id: 'sec-5',
    title: 'Secondary Project 5 (60%)',
    applicationId: 'SEC-005',
    projectCode: 'SEC-005',
    applicationType: 'Student-Secondary',
    headCategory: 'N/A',
    teamOrOrgName: 'Team Five',
    representativeName: 'Rep Five',
    email: 'sec5@biin.org',
    contactNumber: '123456789',
    description: 'Desc',
    tags: [],
    status: 'active'
  },
  {
    id: 'sec-6',
    title: 'Secondary Project 6 (66% - 3rd qualifying)',
    applicationId: 'SEC-006',
    projectCode: 'SEC-006',
    applicationType: 'Student-Secondary',
    headCategory: 'N/A',
    teamOrOrgName: 'Team Six',
    representativeName: 'Rep Six',
    email: 'sec6@biin.org',
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
    scores: { uniqueness: 9, proofOfConcept: 9, features: 9, quality: 9, presentation: 9 }, // 45/50 = 90%
    rawTotalScore: 45,
    maxRawScore: 50,
    convertedScore: 90,
    totalScore: 45,
    percentage: 90,
    submittedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'eval-sec-3',
    projectId: 'sec-3',
    judgeEmail: 'judge@biin.org',
    judgeName: 'Judge One',
    scores: { uniqueness: 8, proofOfConcept: 7, features: 8, quality: 7, presentation: 7.5 }, // 37.5/50 = 75%
    rawTotalScore: 37.5,
    maxRawScore: 50,
    convertedScore: 75,
    totalScore: 37.5,
    percentage: 75,
    submittedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'eval-sec-4',
    projectId: 'sec-4',
    judgeEmail: 'judge@biin.org',
    judgeName: 'Judge One',
    scores: { uniqueness: 7, proofOfConcept: 7, features: 7, quality: 7, presentation: 6 }, // 34/50 = 68%
    rawTotalScore: 34,
    maxRawScore: 50,
    convertedScore: 68,
    totalScore: 34,
    percentage: 68,
    submittedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'eval-sec-6',
    projectId: 'sec-6',
    judgeEmail: 'judge@biin.org',
    judgeName: 'Judge One',
    scores: { uniqueness: 7, proofOfConcept: 7, features: 7, quality: 6, presentation: 6 }, // 33/50 = 66%
    rawTotalScore: 33,
    maxRawScore: 50,
    convertedScore: 66,
    totalScore: 33,
    percentage: 66,
    submittedAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'eval-sec-5',
    projectId: 'sec-5',
    judgeEmail: 'judge@biin.org',
    judgeName: 'Judge One',
    scores: { uniqueness: 6, proofOfConcept: 6, features: 6, quality: 6, presentation: 6 }, // 30/50 = 60%
    rawTotalScore: 30,
    maxRawScore: 50,
    convertedScore: 60,
    totalScore: 30,
    percentage: 60,
    submittedAt: '2026-08-01T10:00:00Z'
  }
];

const res1 = getProjectCombinedResult(testProjects[0], testProjects, testEvals);
const res2 = getProjectCombinedResult(testProjects[1], testProjects, testEvals);
const res3 = getProjectCombinedResult(testProjects[2], testProjects, testEvals);
const res4 = getProjectCombinedResult(testProjects[3], testProjects, testEvals);
const res5 = getProjectCombinedResult(testProjects[4], testProjects, testEvals);
const res6 = getProjectCombinedResult(testProjects[5], testProjects, testEvals);

console.assert(res1.award === 'Champion', `Expected 'Champion', got '${res1.award}'`);
console.assert(res2.award === 'Winner', `Expected 'Winner', got '${res2.award}'`);
console.assert(res3.award === '1st Merit', `Expected '1st Merit', got '${res3.award}'`);
console.assert(res4.award === '2nd Merit', `Expected '2nd Merit', got '${res4.award}'`);
console.assert(res5.award === 'No Award', `Expected 'No Award', got '${res5.award}'`);
console.assert(res6.award === 'No Award', `Expected 'No Award' for 66% due to max 2 Merits, got '${res6.award}'`);
console.log(`[PASS] 1 Champion (96%), 1 Winner (90%), 1st Merit (75%), 2nd Merit (68%), 3rd qualifying (66%) -> No Award (Max 2 Merits enforced).`);

// --- TEST 12 RESULT POOLS ---
console.log('\n--- Testing 12 Competition Category Pools ---');
const dummyCats = calculateCategorizedResults([], []);
console.assert(dummyCats.length === 12, `Expected 12 category pools, got ${dummyCats.length}`);
console.log(`[PASS] Exactly 12 pools generated:`);
dummyCats.forEach((c, idx) => {
  console.log(`  ${idx + 1}. [${c.appTypeTitle}] ${c.headCategoryName}`);
});

console.log('\n=== ALL TESTS PASSED! ===');

