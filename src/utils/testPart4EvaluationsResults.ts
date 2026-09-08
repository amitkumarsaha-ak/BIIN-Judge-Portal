import {
  calculateAward,
  calculateConvertedScore,
  getMaxRawScoreForApplicationType,
  getProjectCombinedResult,
  STUDENT_CRITERIA,
  STUDENT_TERTIARY_CRITERIA,
  ORGANISATION_AND_INDIVIDUAL_CRITERIA
} from './evaluation';
import type { Project, Evaluation } from '../types';

console.log('=== RUNNING PART 4 EVALUATIONS, RESULTS & AWARDS TEST SUITE ===');

// --- 1. TEST AWARD RULES (>=80 & highest, >=70, >=60) ---
console.log('\n--- 1. Testing Exact Award Rules (>= 80, >= 70, >= 60) ---');

// Champion tests:
console.assert(calculateAward(80.0, true) === 'Champion', 'Score 80.0 & highest must be Champion');
console.assert(calculateAward(85.0, true) === 'Champion', 'Score 85.0 & highest must be Champion');
console.assert(calculateAward(85.0, false) === 'Winner', 'Score 85.0 but NOT highest must be Winner');
console.assert(calculateAward(79.99, true) === 'Winner', 'Score 79.99 & highest cannot be Champion (must be >= 80)');

// Winner tests:
console.assert(calculateAward(70.0, false) === 'Winner', 'Score 70.0 must be Winner (>= 70)');
console.assert(calculateAward(75.5, false) === 'Winner', 'Score 75.5 must be Winner');
console.assert(calculateAward(69.99, false) === 'Merit', 'Score 69.99 must be Merit (>= 60 and < 70)');

// Merit tests:
console.assert(calculateAward(60.0, false) === 'Merit', 'Score 60.0 must be Merit (>= 60)');
console.assert(calculateAward(65.0, false) === 'Merit', 'Score 65.0 must be Merit');

// Below 60 tests:
console.assert(calculateAward(59.99, false) === 'Participant', 'Score 59.99 receives no Champion/Winner/Merit');
console.assert(calculateAward(45.0, false) === 'Participant', 'Score 45.0 receives no Champion/Winner/Merit');

console.log('[PASS] Exact award threshold rules verified.');

// --- 2. TEST APPLICATION TYPE CRITERIA & RAW/CONVERTED SCORING ---
console.log('\n--- 2. Testing Criteria and Max Raw Scores by Application Type ---');

// Student: 5 criteria, Max Raw 50, Converted /100
console.assert(STUDENT_CRITERIA.length === 5, 'Student has 5 criteria');
console.assert(getMaxRawScoreForApplicationType('Student') === 50, 'Student max raw is 50');
const raw41_stu = calculateConvertedScore(41, 50);
console.assert(raw41_stu === 82, `Student 41/50 should be 82%, got ${raw41_stu}`);

// Student-Tertiary: 5 criteria, Max Raw 50, Converted /100
console.assert(STUDENT_TERTIARY_CRITERIA.length === 5, 'Student-Tertiary has 5 criteria');
console.assert(getMaxRawScoreForApplicationType('Student-Tertiary') === 50, 'Student-Tertiary max raw is 50');
const raw38_ter = calculateConvertedScore(38, 50);
console.assert(raw38_ter === 76, `Student-Tertiary 38/50 should be 76%, got ${raw38_ter}`);

// Organisation & Individual: 4 criteria, Max Raw 40, Converted /100
console.assert(ORGANISATION_AND_INDIVIDUAL_CRITERIA.length === 4, 'Organisation has 4 criteria');
console.assert(getMaxRawScoreForApplicationType('Organisation') === 40, 'Organisation max raw is 40');
console.assert(getMaxRawScoreForApplicationType('Individual or Group') === 40, 'Individual max raw is 40');
const raw32_org = calculateConvertedScore(32, 40);
console.assert(raw32_org === 80, `Organisation 32/40 should be 80%, got ${raw32_org}`);

console.log('[PASS] Application Type criteria & raw/converted scoring verified.');

// --- 3. TEST MULTI-JUDGE EVALUATION AGGREGATION & AVERAGE ---
console.log('\n--- 3. Testing Multi-Judge Evaluation Aggregation & Average Calculation ---');

const testProjectA: Project = {
  id: 'proj-test-a',
  title: 'Project A',
  applicationId: 'BIIN-2026-A01',
  projectCode: 'TER-HC-C-01',
  applicationType: 'Student-Tertiary',
  headCategory: 'HC-C',
  teamOrOrgName: 'Team Alpha',
  representativeName: 'Alice',
  email: 'alice@alpha.org',
  contactNumber: '123456',
  description: 'Test project for multi-judge aggregation',
  tags: ['HC-C'],
  status: 'active'
};

const testProjectB: Project = {
  id: 'proj-test-b',
  title: 'Project B',
  applicationId: 'BIIN-2026-B02',
  projectCode: 'TER-HC-C-02',
  applicationType: 'Student-Tertiary',
  headCategory: 'HC-C',
  teamOrOrgName: 'Team Beta',
  representativeName: 'Bob',
  email: 'bob@beta.org',
  contactNumber: '789012',
  description: 'Second project in same category',
  tags: ['HC-C'],
  status: 'active'
};

// Project A evaluations:
// Judge 1: 41/50 -> 82%
// Judge 2: 43/50 -> 86%
// Judge 3: 39/50 -> 78%
// Expected average: (82 + 86 + 78) / 3 = 82.0%
const evalA_J1: Evaluation = {
  id: 'eval-a-1',
  projectId: 'proj-test-a',
  judgeEmail: 'judge1@biin.org',
  judgeName: 'Judge 1',
  scores: { uniqueness: 9, proofOfConcept: 8, features: 8, quality: 8, presentation: 8 },
  rawTotalScore: 41,
  maxRawScore: 50,
  convertedScore: 82,
  totalScore: 41,
  percentage: 82,
  submittedAt: '2026-08-01T10:00:00Z',
  feedback: 'Excellent prototype'
};

const evalA_J2: Evaluation = {
  id: 'eval-a-2',
  projectId: 'proj-test-a',
  judgeEmail: 'judge2@biin.org',
  judgeName: 'Judge 2',
  scores: { uniqueness: 9, proofOfConcept: 9, features: 9, quality: 8, presentation: 8 },
  rawTotalScore: 43,
  maxRawScore: 50,
  convertedScore: 86,
  totalScore: 43,
  percentage: 86,
  submittedAt: '2026-08-01T11:00:00Z',
  feedback: 'Strong technical execution'
};

const evalA_J3: Evaluation = {
  id: 'eval-a-3',
  projectId: 'proj-test-a',
  judgeEmail: 'judge3@biin.org',
  judgeName: 'Judge 3',
  scores: { uniqueness: 8, proofOfConcept: 8, features: 8, quality: 8, presentation: 7 },
  rawTotalScore: 39,
  maxRawScore: 50,
  convertedScore: 78,
  totalScore: 39,
  percentage: 78,
  submittedAt: '2026-08-01T12:00:00Z',
  feedback: 'Good presentation'
};

// Project B evaluation:
// Judge 1: 37/50 -> 74%
const evalB_J1: Evaluation = {
  id: 'eval-b-1',
  projectId: 'proj-test-b',
  judgeEmail: 'judge1@biin.org',
  judgeName: 'Judge 1',
  scores: { uniqueness: 7, proofOfConcept: 7, features: 8, quality: 8, presentation: 7 },
  rawTotalScore: 37,
  maxRawScore: 50,
  convertedScore: 74,
  totalScore: 37,
  percentage: 74,
  submittedAt: '2026-08-01T13:00:00Z'
};

const allTestProjects = [testProjectA, testProjectB];
const allTestEvals = [evalA_J1, evalA_J2, evalA_J3, evalB_J1];

const resultA = getProjectCombinedResult(testProjectA, allTestProjects, allTestEvals);
const resultB = getProjectCombinedResult(testProjectB, allTestProjects, allTestEvals);

console.log(`Project A Final Average: ${resultA.finalAverageScore}%, Award: ${resultA.award}, Highest: ${resultA.isHighestInCategory}`);
console.log(`Project B Final Average: ${resultB.finalAverageScore}%, Award: ${resultB.award}, Highest: ${resultB.isHighestInCategory}`);

console.assert(resultA.finalAverageScore === 82, 'Project A final average must be 82%');
console.assert(resultA.isHighestInCategory === true, 'Project A must be highest in category');
console.assert(resultA.award === 'Champion', 'Project A must receive Champion');

console.assert(resultB.finalAverageScore === 74, 'Project B final average must be 74%');
console.assert(resultB.isHighestInCategory === false, 'Project B is not highest');
console.assert(resultB.award === 'Winner', 'Project B must receive Winner (>= 70%)');

console.assert(resultA.judgesEvaluations.length === 3, 'Project A must show all 3 judges');
console.assert(resultA.judgesEvaluations[0].convertedScore === 82, 'Judge 1 converted is 82%');
console.assert(resultA.judgesEvaluations[1].convertedScore === 86, 'Judge 2 converted is 86%');
console.assert(resultA.judgesEvaluations[2].convertedScore === 78, 'Judge 3 converted is 78%');

console.log('[PASS] Multi-judge aggregation and Champion designation verified.');

// --- 4. TEST TIE-HANDLING FOR HIGHEST IN CATEGORY ---
console.log('\n--- 4. Testing Tie-Handling for Highest Score in Category ---');

const testProjectC: Project = {
  ...testProjectB,
  id: 'proj-test-c',
  title: 'Project C'
};

// Project C also gets 82% average, tying with Project A!
const evalC_J1: Evaluation = {
  ...evalA_J1,
  id: 'eval-c-1',
  projectId: 'proj-test-c'
};
const evalC_J2: Evaluation = {
  ...evalA_J2,
  id: 'eval-c-2',
  projectId: 'proj-test-c'
};
const evalC_J3: Evaluation = {
  ...evalA_J3,
  id: 'eval-c-3',
  projectId: 'proj-test-c'
};

const tieProjects = [testProjectA, testProjectC];
const tieEvals = [evalA_J1, evalA_J2, evalA_J3, evalC_J1, evalC_J2, evalC_J3];

const resultA_tie = getProjectCombinedResult(testProjectA, tieProjects, tieEvals);
const resultC_tie = getProjectCombinedResult(testProjectC, tieProjects, tieEvals);

console.assert(resultA_tie.finalAverageScore === 82 && resultC_tie.finalAverageScore === 82, 'Both tied at 82');
console.assert(resultA_tie.award === 'Champion' && resultC_tie.award === 'Champion', 'Both tied projects >=80 must get Champion');
console.log('[PASS] Tie-handling for Champion verified.');

// --- 5. TEST HIGHEST TO LOWEST SORTING IN RESULTS ---
console.log('\n--- 5. Testing Results Highest to Lowest Sorting ---');

const testProjectD: Project = {
  ...testProjectA,
  id: 'proj-test-d',
  title: 'Project D'
};
const evalD: Evaluation = {
  ...evalA_J1,
  id: 'eval-d-1',
  projectId: 'proj-test-d',
  rawTotalScore: 27,
  convertedScore: 54,
  percentage: 54
};

const sortingProjects = [testProjectB, testProjectA, testProjectD];
const sortingEvals = [evalA_J1, evalA_J2, evalA_J3, evalB_J1, evalD];

const listResults = sortingProjects.map(p => getProjectCombinedResult(p, sortingProjects, sortingEvals));
listResults.sort((a, b) => b.finalAverageScore - a.finalAverageScore);

console.assert(listResults[0].project.id === 'proj-test-a', 'First must be Project A (82%)');
console.assert(listResults[1].project.id === 'proj-test-b', 'Second must be Project B (74%)');
console.assert(listResults[2].project.id === 'proj-test-d', 'Third must be Project D (54%)');

console.log('[PASS] Highest to Lowest sorting verified:');
listResults.forEach((r, i) => console.log(`  #${i + 1}: ${r.project.title} — ${r.finalAverageScore}% (${r.award})`));

console.log('\n=== ALL PART 4 VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
