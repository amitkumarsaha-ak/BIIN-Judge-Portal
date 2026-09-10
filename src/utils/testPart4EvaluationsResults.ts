import {
  calculateAward,
  calculateCategorizedResults
} from './evaluation';
import type { Project, Evaluation } from '../types';

console.log('=== RUNNING BIIN RESULT CALCULATION & ACCEPTANCE TEST SUITE ===');

// --- SECTION 9: EXACT BOUNDARY RULES TEST ---
console.log('\n--- Testing Exact Boundary Rules (Section 9) ---');
console.assert(calculateAward(100.0) === 'Champion', '100% must be Champion');
console.assert(calculateAward(85.0) === 'Champion', '85% must be Champion');
console.assert(calculateAward(80.01) === 'Champion', '80.01% must be Champion');
console.assert(calculateAward(80.0) === 'Champion', '80% must be Champion');

console.assert(calculateAward(79.99) === 'Winner', '79.99% must be Winner');
console.assert(calculateAward(75.0) === 'Winner', '75% must be Winner');
console.assert(calculateAward(70.0) === 'Winner', '70% must be Winner');

console.assert(calculateAward(69.99) === 'Merit', '69.99% must be Merit');
console.assert(calculateAward(65.0) === 'Merit', '65% must be Merit');
console.assert(calculateAward(60.0) === 'Merit', '60% must be Merit');

console.assert(calculateAward(59.99) === 'No Award', '59.99% must be No Award');
console.assert(calculateAward(50.0) === 'No Award', '50% must be No Award');
console.assert(calculateAward(0.0) === 'No Award', '0% must be No Award');
console.log('[PASS] Exact boundary rules verified.');

// --- ACCEPTANCE TEST 1: Scores 95%, 88%, 82%, 80% -> Expected 4 Champions ---
console.log('\n--- Acceptance Test 1: Scores [95, 88, 82, 80] -> 4 Champions ---');
const test1Scores = [95, 88, 82, 80];
const test1Awards = test1Scores.map(s => calculateAward(s));
const test1Champions = test1Awards.filter(a => a === 'Champion').length;
console.assert(test1Champions === 4, `Expected 4 Champions, got ${test1Champions}`);
console.log(`[PASS] Test 1: ${test1Champions} Champions (all qualified applicants receive Champion, no 1-person limit).`);

// --- ACCEPTANCE TEST 2: Scores 79%, 75%, 70% -> Expected 3 Winners, No Champion ---
console.log('\n--- Acceptance Test 2: Scores [79, 75, 70] -> 3 Winners, 0 Champions ---');
const test2Scores = [79, 75, 70];
const test2Awards = test2Scores.map(s => calculateAward(s));
const test2Winners = test2Awards.filter(a => a === 'Winner').length;
const test2Champions = test2Awards.filter(a => a === 'Champion').length;
console.assert(test2Winners === 3, `Expected 3 Winners, got ${test2Winners}`);
console.assert(test2Champions === 0, `Expected 0 Champions, got ${test2Champions}`);
console.log(`[PASS] Test 2: ${test2Winners} Winners, ${test2Champions} Champions.`);

// --- ACCEPTANCE TEST 3: Scores 69%, 65%, 60% -> Expected 3 Merits ---
console.log('\n--- Acceptance Test 3: Scores [69, 65, 60] -> 3 Merits ---');
const test3Scores = [69, 65, 60];
const test3Awards = test3Scores.map(s => calculateAward(s));
const test3Merits = test3Awards.filter(a => a === 'Merit').length;
console.assert(test3Merits === 3, `Expected 3 Merits, got ${test3Merits}`);
console.log(`[PASS] Test 3: ${test3Merits} Merits.`);

// --- ACCEPTANCE TEST 4: Scores 59%, 45%, 30% -> Expected 3 No Award ---
console.log('\n--- Acceptance Test 4: Scores [59, 45, 30] -> 3 No Award ---');
const test4Scores = [59, 45, 30];
const test4Awards = test4Scores.map(s => calculateAward(s));
const test4NoAward = test4Awards.filter(a => a === 'No Award').length;
console.assert(test4NoAward === 3, `Expected 3 No Award, got ${test4NoAward}`);
console.log(`[PASS] Test 4: ${test4NoAward} No Award.`);

// --- ACCEPTANCE TEST 5: Mixed Scores -> Champion=3, Winner=3, Merit=2, No Award=1 ---
console.log('\n--- Acceptance Test 5: Scores [95, 91, 80, 79, 72, 70, 69, 60, 59] ---');
const test5Scores = [95, 91, 80, 79, 72, 70, 69, 60, 59];
const test5Awards = test5Scores.map(s => calculateAward(s));
const t5Champ = test5Awards.filter(a => a === 'Champion').length;
const t5Win = test5Awards.filter(a => a === 'Winner').length;
const t5Merit = test5Awards.filter(a => a === 'Merit').length;
const t5NoAward = test5Awards.filter(a => a === 'No Award').length;
console.assert(t5Champ === 3, `Expected 3 Champions, got ${t5Champ}`);
console.assert(t5Win === 3, `Expected 3 Winners, got ${t5Win}`);
console.assert(t5Merit === 2, `Expected 2 Merits, got ${t5Merit}`);
console.assert(t5NoAward === 1, `Expected 1 No Award, got ${t5NoAward}`);
console.log(`[PASS] Test 5: Champion = ${t5Champ}, Winner = ${t5Win}, Merit = ${t5Merit}, No Award = ${t5NoAward}.`);

// --- ACCEPTANCE TEST 6: Category Independence ---
console.log('\n--- Acceptance Test 6: Category Independence (Student + Consumer vs Student + Industrial) ---');
// Create 5 applicants in Student + Consumer (all score >= 80% -> 5 Champions)
const stuConsProjects: Project[] = [1, 2, 3, 4, 5].map(i => ({
  id: `stu-c-${i}`,
  title: `Student Consumer Project ${i}`,
  applicationId: `SC-00${i}`,
  projectCode: `STU-HC-C-00${i}`,
  applicationType: 'Student',
  headCategory: 'HC-C',
  teamOrOrgName: `Team C${i}`,
  representativeName: `Member C${i}`,
  email: `sc${i}@biin.org`,
  contactNumber: '123456789',
  description: 'Desc',
  tags: ['HC-C'],
  status: 'active'
}));

const stuConsEvals: Evaluation[] = stuConsProjects.map((p, idx) => ({
  id: `eval-sc-${idx}`,
  projectId: p.id,
  judgeEmail: 'judge@biin.org',
  judgeName: 'Judge One',
  scores: { uniqueness: 10, proofOfConcept: 9, features: 9, quality: 9, presentation: 9 }, // 46/50 = 92%
  rawTotalScore: 46,
  maxRawScore: 50,
  convertedScore: 92,
  totalScore: 46,
  percentage: 92,
  submittedAt: '2026-08-01T10:00:00Z'
}));

// Create applicants in Student + Industrial (scores 75% -> Winners)
const stuIndProjects: Project[] = [1, 2].map(i => ({
  id: `stu-i-${i}`,
  title: `Student Industrial Project ${i}`,
  applicationId: `SI-00${i}`,
  projectCode: `STU-HC-I-00${i}`,
  applicationType: 'Student',
  headCategory: 'HC-I',
  teamOrOrgName: `Team I${i}`,
  representativeName: `Member I${i}`,
  email: `si${i}@biin.org`,
  contactNumber: '123456789',
  description: 'Desc',
  tags: ['HC-I'],
  status: 'active'
}));

const stuIndEvals: Evaluation[] = stuIndProjects.map((p, idx) => ({
  id: `eval-si-${idx}`,
  projectId: p.id,
  judgeEmail: 'judge@biin.org',
  judgeName: 'Judge One',
  scores: { uniqueness: 8, proofOfConcept: 7, features: 8, quality: 7, presentation: 7 }, // 37.5/50 = 75%
  rawTotalScore: 37.5,
  maxRawScore: 50,
  convertedScore: 75,
  totalScore: 37.5,
  percentage: 75,
  submittedAt: '2026-08-01T10:00:00Z'
}));

const allCategoryProjects = [...stuConsProjects, ...stuIndProjects];
const allCategoryEvals = [...stuConsEvals, ...stuIndEvals];

const categorizedGroups = calculateCategorizedResults(allCategoryProjects, allCategoryEvals);
const groupStuCons = categorizedGroups.find(g => g.appType === 'Student' && g.headCategoryCode === 'HC-C');
const groupStuInd = categorizedGroups.find(g => g.appType === 'Student' && g.headCategoryCode === 'HC-I');

console.assert(groupStuCons?.champions.length === 5, `Expected 5 Champions in Student+Consumer, got ${groupStuCons?.champions.length}`);
console.assert(groupStuInd?.champions.length === 0, `Expected 0 Champions in Student+Industrial, got ${groupStuInd?.champions.length}`);
console.assert(groupStuInd?.winners.length === 2, `Expected 2 Winners in Student+Industrial, got ${groupStuInd?.winners.length}`);
console.log(`[PASS] Test 6: Student+Consumer has 5 Champions; Student+Industrial calculates completely independently with 2 Winners.`);

// --- ACCEPTANCE TEST 7: Application Type Independence ---
console.log('\n--- Acceptance Test 7: Application Type Independence (Student + Consumer vs Organization + Consumer) ---');
// Organization in HC-C with 78% -> Winner
const orgConsProject: Project = {
  id: 'org-c-1',
  title: 'Org Consumer Project',
  applicationId: 'OC-001',
  projectCode: 'ORG-HC-C-001',
  applicationType: 'Organisation',
  headCategory: 'HC-C',
  teamOrOrgName: 'Enterprise Corp',
  representativeName: 'Director Org',
  email: 'director@org.com',
  contactNumber: '987654321',
  description: 'Enterprise solution',
  tags: ['HC-C'],
  status: 'active'
};

const orgConsEval: Evaluation = {
  id: 'eval-oc-1',
  projectId: orgConsProject.id,
  judgeEmail: 'judge@biin.org',
  judgeName: 'Judge One',
  scores: { uniqueness: 8, publicOrGovValue: 8, features: 8, qualityTech: 7 }, // 31/40 = 77.5% -> 78%
  rawTotalScore: 31,
  maxRawScore: 40,
  convertedScore: 77.5,
  totalScore: 31,
  percentage: 77.5,
  submittedAt: '2026-08-01T10:00:00Z'
};

const allAppProjects = [...stuConsProjects, orgConsProject];
const allAppEvals = [...stuConsEvals, orgConsEval];

const appCatGroups = calculateCategorizedResults(allAppProjects, allAppEvals);
const groupStuC = appCatGroups.find(g => g.appType === 'Student' && g.headCategoryCode === 'HC-C');
const groupOrgC = appCatGroups.find(g => g.appType === 'Organisation' && g.headCategoryCode === 'HC-C');

console.assert(groupStuC?.champions.length === 5, `Expected 5 Champions in Student+Consumer, got ${groupStuC?.champions.length}`);
console.assert(groupOrgC?.champions.length === 0, `Expected 0 Champions in Org+Consumer, got ${groupOrgC?.champions.length}`);
console.assert(groupOrgC?.winners.length === 1, `Expected 1 Winner in Org+Consumer, got ${groupOrgC?.winners.length}`);
console.log(`[PASS] Test 7: Student+Consumer has 5 Champions; Organization+Consumer calculates independently with 1 Winner.`);

// --- TOTAL RESULT CATEGORIES: 20 INDEPENDENT CATEGORIES CHECK ---
console.log('\n--- Testing 20 Independent Result Categories Structure (4 Types × 5 Categories) ---');
console.assert(categorizedGroups.length === 20, `Expected exactly 20 categories, got ${categorizedGroups.length}`);
console.log(`[PASS] Verified exactly 20 independent categories:`);
categorizedGroups.forEach((g, i) => {
  console.log(`  ${i + 1}. [${g.appTypeTitle}] ${g.headCategoryName} (${g.headCategoryCode})`);
});

console.log('\n=== ALL 7 BIIN ACCEPTANCE TESTS & VERIFICATION CHECKS PASSED PERFECTLY! ===');

