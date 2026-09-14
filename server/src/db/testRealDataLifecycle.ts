const BASE_URL = 'http://localhost:5000/api';

async function req(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function run14Scenarios() {
  console.log('====================================================');
  console.log('🚀 TESTING ALL 14 SCENARIOS (CLEAN RESET TO REAL CRUD)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- SCENARIO 1: Reset State Verification ---
  console.log('\n--- Scenario 1: Reset State Verification ---');
  const health = await req('/health');
  assert(health.ok && health.data?.database?.type === 'postgres', 'Health check reports postgres database connected');

  const adminLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@biin.org', password: 'admin123' })
  });
  assert(adminLogin.ok && adminLogin.data.user.role === 'admin', 'Admin login succeeds with admin@biin.org / admin123');

  const initProjects = await req('/projects');
  assert(Array.isArray(initProjects.data) && initProjects.data.length === 0, `Initial projects count is 0 (found ${initProjects.data?.length})`);

  const initJudges = await req('/judges');
  assert(Array.isArray(initJudges.data) && initJudges.data.length === 0, `Initial judges count is 0 (found ${initJudges.data?.length})`);

  const initEvals = await req('/evaluations');
  assert(Array.isArray(initEvals.data) && initEvals.data.length === 0, `Initial evaluations count is 0 (found ${initEvals.data?.length})`);

  const initAssign = await req('/assignments');
  assert(Array.isArray(initAssign.data) && initAssign.data.length === 0, `Initial assignments count is 0 (found ${initAssign.data?.length})`);

  // --- SCENARIO 2: Judge Registration ---
  console.log('\n--- Scenario 2: Judge Registration (Pending Approval) ---');
  const testJudgeEmail = `testjudge_${Date.now()}@example.com`;
  const regRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Dr. Test Judge',
      email: testJudgeEmail,
      password: 'password123',
      role: 'judge'
    })
  });
  assert(regRes.ok && regRes.data.user.status === 'pending', 'Judge registration succeeds with status "pending"');

  const prematureLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testJudgeEmail, password: 'password123' })
  });
  assert(!prematureLogin.ok && prematureLogin.status === 403, 'Pending judge login rejected with 403 Forbidden');

  const pendingList = await req('/judges');
  const registeredJudge = pendingList.data?.find((j: any) => j.email.toLowerCase() === testJudgeEmail.toLowerCase());
  assert(Boolean(registeredJudge) && registeredJudge.status === 'pending', 'Pending judge appears in judges list for admin review');

  // --- SCENARIO 3: Admin Approves Judge ---
  console.log('\n--- Scenario 3: Admin Approves Judge ---');
  const approveRes = await req(`/judges/${registeredJudge.id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({
      actor: { email: 'admin@biin.org', name: 'BIIN Administrator' }
    })
  });
  assert(approveRes.ok && approveRes.data.judge.status === 'approved', 'Admin successfully approves judge status to "approved"');

  const approvedLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testJudgeEmail, password: 'password123' })
  });
  assert(approvedLogin.ok && approvedLogin.data.user.status === 'approved', 'Approved judge can now log in successfully');

  // --- SCENARIO 4: Project Creation ---
  console.log('\n--- Scenario 4: Admin Creates Real Project ---');
  const newProjPayload = {
    id: `proj-${Date.now()}`,
    title: 'Autonomous Solar Water Purification',
    applicationId: 'APP-2026-001',
    category: 'Renewable Energy',
    applicationType: 'Idea/Concept Stage',
    headCategory: 'Smart Agriculture & Environment',
    roomNumber: '101',
    teamLeadName: 'Amina Rahman',
    status: 'active'
  };
  const projCreateRes = await req('/projects', {
    method: 'POST',
    body: JSON.stringify(newProjPayload)
  });
  assert(projCreateRes.ok && projCreateRes.data.title === newProjPayload.title, 'Admin creates project and response matches');

  const fetchProjects = await req('/projects');
  const foundProj = fetchProjects.data?.find((p: any) => p.id === newProjPayload.id);
  assert(Boolean(foundProj) && foundProj.teamLeadName === 'Amina Rahman', 'Created project persisted in PostgreSQL with team lead');

  // --- SCENARIO 5: Judge Project Assignment ---
  console.log('\n--- Scenario 5: Judge Project Assignment ---');
  const assignPayload = {
    judgeId: registeredJudge.id,
    judgeEmail: testJudgeEmail,
    judgeName: 'Dr. Test Judge',
    applicationType: 'Idea/Concept Stage',
    headCategory: 'Smart Agriculture & Environment',
    projectIds: [newProjPayload.id]
  };
  const assignRes = await req('/assignments', {
    method: 'POST',
    body: JSON.stringify(assignPayload)
  });
  assert(assignRes.ok, 'Admin creates judge assignment successfully');

  const fetchJudgeAssignments = await req(`/assignments/judge/${encodeURIComponent(testJudgeEmail)}`);
  assert(
    fetchJudgeAssignments.ok &&
    Array.isArray(fetchJudgeAssignments.data) &&
    fetchJudgeAssignments.data.some((a: any) => a.projectIds?.includes(newProjPayload.id)),
    'Judge assignment correctly returns the assigned project ID'
  );

  // --- SCENARIO 6: Evaluation Workflow ---
  console.log('\n--- Scenario 6: Evaluation Submission ---');
  const evalPayload = {
    id: `eval-${Date.now()}`,
    projectId: newProjPayload.id,
    judgeId: registeredJudge.id,
    judgeEmail: testJudgeEmail,
    judgeName: 'Dr. Test Judge',
    scores: {
      'Innovation & Originality': 8,
      'Technical Feasibility': 9,
      'Impact & Market Potential': 8,
      'Presentation & Q&A': 9
    },
    totalScore: 34,
    feedback: 'Excellent solar thermal design and clear community deployment plan.',
    status: 'completed',
    submittedAt: new Date().toISOString()
  };
  const evalCreateRes = await req('/evaluations', {
    method: 'POST',
    body: JSON.stringify(evalPayload)
  });
  assert(evalCreateRes.ok && evalCreateRes.data.totalScore === 34, 'Evaluation submitted successfully with total score 34');

  const evalFetch = await req(`/evaluations/project/${newProjPayload.id}`);
  assert(
    evalFetch.ok &&
    Array.isArray(evalFetch.data) &&
    evalFetch.data.length === 1 &&
    evalFetch.data[0].totalScore === 34,
    'Evaluation retrievable by project ID from PostgreSQL'
  );

  // --- SCENARIO 7: Evaluation Update ---
  console.log('\n--- Scenario 7: Evaluation Update ---');
  const updatedEvalPayload = {
    ...evalPayload,
    scores: {
      ...evalPayload.scores,
      'Presentation & Q&A': 10
    },
    totalScore: 35,
    feedback: 'Updated: Outstanding presentation with comprehensive Q&A defense.'
  };
  const evalUpdateRes = await req(`/evaluations/${evalPayload.id}`, {
    method: 'PUT',
    body: JSON.stringify(updatedEvalPayload)
  });
  assert(evalUpdateRes.ok && evalUpdateRes.data.totalScore === 35, 'Evaluation updated successfully to total score 35');

  // --- SCENARIO 8: Admin Evaluations View ---
  console.log('\n--- Scenario 8: Admin Evaluations View ---');
  const allEvals = await req('/evaluations');
  const recordedEval = allEvals.data?.find((e: any) => e.id === evalPayload.id);
  assert(
    Boolean(recordedEval) &&
    recordedEval.totalScore === 35 &&
    recordedEval.judgeName === 'Dr. Test Judge',
    'Admin sees completed evaluation with correct judge name and score 35'
  );

  // --- SCENARIO 9: Evaluation Lock ---
  console.log('\n--- Scenario 9: Evaluation Lock Verification ---');
  const lockSettingsRes = await req('/settings', {
    method: 'PUT',
    body: JSON.stringify({ evaluationsLocked: true })
  });
  assert(lockSettingsRes.ok && lockSettingsRes.data.evaluationsLocked === true, 'Admin sets global evaluationsLocked to true');

  const getSettings = await req('/settings');
  assert(getSettings.ok && getSettings.data.evaluationsLocked === true, 'Locked settings persist in database');

  // Unlock for clean state
  await req('/settings', {
    method: 'PUT',
    body: JSON.stringify({ evaluationsLocked: false })
  });

  // --- SCENARIO 10: Password Reset ---
  console.log('\n--- Scenario 10: Password Reset ---');
  const newPassword = 'newPassword456!';
  const resetRes = await req('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email: testJudgeEmail, newPassword })
  });
  assert(resetRes.ok, 'Password reset request succeeds');

  const oldPassLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testJudgeEmail, password: 'password123' })
  });
  assert(!oldPassLogin.ok, 'Login with old password fails as expected');

  const newPassLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testJudgeEmail, password: newPassword })
  });
  assert(newPassLogin.ok && newPassLogin.data.user.email.toLowerCase() === testJudgeEmail.toLowerCase(), 'Login with new password succeeds');

  // --- SCENARIO 11: Project Deletion Cascade ---
  console.log('\n--- Scenario 11: Project Deletion Cascade ---');
  const delProjRes = await req(`/projects/${newProjPayload.id}`, { method: 'DELETE' });
  assert(delProjRes.ok, 'Project deleted by admin');

  const checkProj = await req('/projects');
  assert(!checkProj.data?.some((p: any) => p.id === newProjPayload.id), 'Project no longer exists in project list');

  const checkEvalsAfterProjDel = await req(`/evaluations/project/${newProjPayload.id}`);
  assert(
    checkEvalsAfterProjDel.ok &&
    Array.isArray(checkEvalsAfterProjDel.data) &&
    checkEvalsAfterProjDel.data.length === 0,
    'Evaluations linked to deleted project are purged'
  );

  const checkAssignAfterProjDel = await req(`/assignments/judge/${encodeURIComponent(testJudgeEmail)}`);
  assert(
    checkAssignAfterProjDel.ok &&
    !checkAssignAfterProjDel.data?.some((a: any) => a.projectIds?.includes(newProjPayload.id)),
    'Deleted project ID removed from judge assignment'
  );

  // --- SCENARIO 12: Judge Deletion / Rejection ---
  console.log('\n--- Scenario 12: Judge Deletion / Rejection ---');
  const delJudgeRes = await req(`/judges/${registeredJudge.id}`, { method: 'DELETE' });
  assert(delJudgeRes.ok, 'Judge deleted by admin');

  const delJudgeLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testJudgeEmail, password: newPassword })
  });
  assert(!delJudgeLogin.ok, 'Deleted judge cannot log in');

  // Clean up any remaining assignments for test judge
  await req(`/assignments/judge/${registeredJudge.id}`, { method: 'DELETE' });

  // --- SCENARIO 13: Clean State & Admin Intact ---
  console.log('\n--- Scenario 13: Final State & Admin Verification ---');
  const finalAdminCheck = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@biin.org', password: 'admin123' })
  });
  assert(finalAdminCheck.ok && finalAdminCheck.data.user.role === 'admin', 'Admin account remains active and functional');

  const finalJudges = await req('/judges');
  assert(finalJudges.data?.length === 0, `Final judges count is 0 (found ${finalJudges.data?.length})`);

  const finalProjects = await req('/projects');
  assert(finalProjects.data?.length === 0, `Final projects count is 0 (found ${finalProjects.data?.length})`);

  // --- SCENARIO 14: Data Isolation & Security ---
  console.log('\n--- Scenario 14: Data Isolation & Password Security ---');
  // Check that no user payload ever leaks a password field
  const userCheck = finalAdminCheck.data.user;
  assert(!('password' in userCheck), 'Admin login response does NOT expose password field');

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run14Scenarios();
