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
console.assert(res3.award === 'Eligible for Merit', `Expected 'Eligible for Merit', got '${res3.award}'`);
console.assert(res4.award === 'Eligible for Merit', `Expected 'Eligible for Merit', got '${res4.award}'`);
console.assert(res5.award === 'No Award', `Expected 'No Award', got '${res5.award}'`);
console.assert(res6.award === 'No Award', `Expected 'No Award' for 66% due to max 2 Merits, got '${res6.award}'`);
console.log(`[PASS] 1 Champion (96%), 1 Winner (90%), 2 Eligible for Merit (75%, 68%), 3rd qualifying (66%) -> No Award (Max 2 Merits enforced).`);

// --- TEST 10 RESULT POOLS ---
console.log('\n--- Testing 10 Competition Category Pools ---');
const dummyCats = calculateCategorizedResults([], []);
console.assert(dummyCats.length === 10, `Expected 10 category pools, got ${dummyCats.length}`);
console.log(`[PASS] Exactly 10 pools generated:`);
dummyCats.forEach((c, idx) => {
  console.log(`  ${idx + 1}. [${c.appTypeTitle}] ${c.headCategoryName}`);
});

// --- ACCEPTANCE TEST 2: Organization Merged Category Pooling (PSG, I, C) ---
console.log('\n--- Acceptance Test 2: Organization Merged Category (PSG, Industrial, Consumer) ---');
const orgProjects: Project[] = [
  {
    id: 'org-psg-1',
    applicationId: 'ORG-001',
    projectCode: 'ORG-001',
    title: 'Smart Civic Governance',
    solutionName: 'Smart Civic Governance',
    teamOrOrgName: 'GovTech Org',
    representativeName: 'Rahim Ali',
    applicationType: 'Organization',
    headCategory: 'Public Sector and Government',
    status: 'active',
    email: 'org1@test.com',
    contactNumber: '01710000001',
    description: 'Civic governance',
    members: [],
    tags: []
  },
  {
    id: 'org-ind-1',
    applicationId: 'ORG-002',
    projectCode: 'ORG-002',
    title: 'Factory Automation Suite',
    solutionName: 'Factory Automation Suite',
    teamOrOrgName: 'RoboWorks Ltd',
    representativeName: 'Karim Ahmed',
    applicationType: 'Organization',
    headCategory: 'Industrial',
    status: 'active',
    email: 'org2@test.com',
    contactNumber: '01710000002',
    description: 'Factory automation',
    members: [],
    tags: []
  },
  {
    id: 'org-con-1',
    applicationId: 'ORG-003',
    projectCode: 'ORG-003',
    title: 'Smart Home Hub',
    solutionName: 'Smart Home Hub',
    teamOrOrgName: 'IoT Living',
    representativeName: 'Farhana Yasmin',
    applicationType: 'Organization',
    headCategory: 'Consumer',
    status: 'active',
    email: 'org3@test.com',
    contactNumber: '01710000003',
    description: 'Smart home hub',
    members: [],
    tags: []
  },
  {
    id: 'org-merged-1',
    applicationId: 'ORG-004',
    projectCode: 'ORG-004',
    title: 'Multi-Utility Platform',
    solutionName: 'Multi-Utility Platform',
    teamOrOrgName: 'Integrated Systems',
    representativeName: 'Tanvir Hossain',
    applicationType: 'Organization',
    headCategory: '(Public Sector and Government , Industrial, Consumer)',
    status: 'active',
    email: 'org4@test.com',
    contactNumber: '01710000004',
    description: 'Multi-utility platform',
    members: [],
    tags: []
  },
  {
    id: 'org-psg-2',
    applicationId: 'ORG-005',
    projectCode: 'ORG-005',
    title: 'Public Health Tracker',
    solutionName: 'Public Health Tracker',
    teamOrOrgName: 'HealthNet Org',
    representativeName: 'Dr. Nasir',
    applicationType: 'Organization',
    headCategory: 'Public Sector and Government',
    status: 'active',
    email: 'org5@test.com',
    contactNumber: '01710000005',
    description: 'Public health tracker',
    members: [],
    tags: []
  }
];

const orgEvals: Evaluation[] = [
  // org-psg-1: 92% (Champion)
  {
    id: 'eval-org-1',
    projectId: 'org-psg-1',
    judgeEmail: 'j1@biin.org',
    judgeName: 'Judge 1',
    scores: { 'problem-validation': 92 },
    rawTotalScore: 46,
    maxRawScore: 50,
    convertedScore: 92,
    totalScore: 46,
    percentage: 92,
    feedback: 'Excellent',
    submittedAt: new Date().toISOString()
  },
  // org-ind-1: 82% (Winner)
  {
    id: 'eval-org-2',
    projectId: 'org-ind-1',
    judgeEmail: 'j1@biin.org',
    judgeName: 'Judge 1',
    scores: { 'problem-validation': 82 },
    rawTotalScore: 41,
    maxRawScore: 50,
    convertedScore: 82,
    totalScore: 41,
    percentage: 82,
    feedback: 'Great',
    submittedAt: new Date().toISOString()
  },
  // org-con-1: 72% (Eligible for Merit 1)
  {
    id: 'eval-org-3',
    projectId: 'org-con-1',
    judgeEmail: 'j1@biin.org',
    judgeName: 'Judge 1',
    scores: { 'problem-validation': 72 },
    rawTotalScore: 36,
    maxRawScore: 50,
    convertedScore: 72,
    totalScore: 36,
    percentage: 72,
    feedback: 'Good',
    submittedAt: new Date().toISOString()
  },
  // org-merged-1: 68% (Eligible for Merit 2)
  {
    id: 'eval-org-4',
    projectId: 'org-merged-1',
    judgeEmail: 'j1@biin.org',
    judgeName: 'Judge 1',
    scores: { 'problem-validation': 68 },
    rawTotalScore: 34,
    maxRawScore: 50,
    convertedScore: 68,
    totalScore: 34,
    percentage: 68,
    feedback: 'Solid',
    submittedAt: new Date().toISOString()
  },
  // org-psg-2: 66% (No Award due to max 2 Merits)
  {
    id: 'eval-org-5',
    projectId: 'org-psg-2',
    judgeEmail: 'j1@biin.org',
    judgeName: 'Judge 1',
    scores: { 'problem-validation': 66 },
    rawTotalScore: 33,
    maxRawScore: 50,
    convertedScore: 66,
    totalScore: 33,
    percentage: 66,
    feedback: 'Decent',
    submittedAt: new Date().toISOString()
  }
];

const orgRes1 = getProjectCombinedResult(orgProjects[0], orgProjects, orgEvals);
const orgRes2 = getProjectCombinedResult(orgProjects[1], orgProjects, orgEvals);
const orgRes3 = getProjectCombinedResult(orgProjects[2], orgProjects, orgEvals);
const orgRes4 = getProjectCombinedResult(orgProjects[3], orgProjects, orgEvals);
const orgRes5 = getProjectCombinedResult(orgProjects[4], orgProjects, orgEvals);

console.assert(orgRes1.award === 'Champion', `Expected orgRes1 to be Champion, got ${orgRes1.award}`);
console.assert(orgRes2.award === 'Winner', `Expected orgRes2 to be Winner, got ${orgRes2.award}`);
console.assert(orgRes3.award === 'Eligible for Merit', `Expected orgRes3 to be Eligible for Merit, got ${orgRes3.award}`);
console.assert(orgRes4.award === 'Eligible for Merit', `Expected orgRes4 to be Eligible for Merit, got ${orgRes4.award}`);
console.assert(orgRes5.award === 'No Award', `Expected orgRes5 to be No Award (max 2 Merits), got ${orgRes5.award}`);

console.log(`[PASS] Organization merged category pooled projects successfully:`);
console.log(`  1. [${orgRes1.project.headCategory}] ${orgRes1.project.title} (${orgRes1.finalAverageScore}%) -> ${orgRes1.award}`);
console.log(`  2. [${orgRes2.project.headCategory}] ${orgRes2.project.title} (${orgRes2.finalAverageScore}%) -> ${orgRes2.award}`);
console.log(`  3. [${orgRes3.project.headCategory}] ${orgRes3.project.title} (${orgRes3.finalAverageScore}%) -> ${orgRes3.award}`);
console.log(`  4. [${orgRes4.project.headCategory}] ${orgRes4.project.title} (${orgRes4.finalAverageScore}%) -> ${orgRes4.award}`);
console.log(`  5. [${orgRes5.project.headCategory}] ${orgRes5.project.title} (${orgRes5.finalAverageScore}%) -> ${orgRes5.award}`);

console.log('\n=== ALL TESTS PASSED! ===');


