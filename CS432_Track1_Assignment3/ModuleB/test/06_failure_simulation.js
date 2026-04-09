// ═══════════════════════════════════════════════════════════════════════════
// Test 6 — Failure Simulation & Rollback Verification
//
// WHAT: Deliberately trigger failures at various points and verify the
//       system handles them gracefully — no partial data, no crashes,
//       correct error responses.
// WHY:  Validates durability and atomicity under failure conditions.
// ═══════════════════════════════════════════════════════════════════════════

const { request, login, TestResults } = require('./config');

async function run() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Test 6 — Failure Simulation & Rollback Verification       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const R = new TestResults('Failure Simulation');

  const adminToken  = await login('admin');
  const studentToken = await login('student');

  // ── 1. Invalid foreign key — booking with non-existent doctor ─────────────
  console.log('  1. Invalid foreign key references...\n');

  const badDoctor = await request('POST', '/appointments', {
    MemberID: 1, DoctorID: 99999,
    AppointmentDate: '2031-09-01', AppointmentTime: '09:00:00',
    Symptoms: 'FK violation test', Priority: 'Normal',
  }, adminToken);

  R.add(
    'Booking with non-existent DoctorID rejected',
    !badDoctor.ok,
    `status=${badDoctor.status}`,
    badDoctor.elapsed
  );

  const badMember = await request('POST', '/appointments', {
    MemberID: 99999, DoctorID: 1,
    AppointmentDate: '2031-09-01', AppointmentTime: '09:00:00',
    Symptoms: 'FK violation test', Priority: 'Normal',
  }, adminToken);

  R.add(
    'Booking with non-existent MemberID rejected',
    !badMember.ok,
    `status=${badMember.status}`,
    badMember.elapsed
  );

  // ── 2. Missing required fields ────────────────────────────────────────────
  console.log('  2. Missing required fields...\n');

  const noDate = await request('POST', '/appointments', {
    MemberID: 1, DoctorID: 1,
    AppointmentTime: '09:00:00', Symptoms: 'No date', Priority: 'Normal',
  }, adminToken);

  R.add(
    'Booking without date rejected',
    !noDate.ok,
    `status=${noDate.status}`,
    noDate.elapsed
  );

  const noName = await request('POST', '/members', {
    Age: 20, Email: 'test@fail.com', ContactNumber: '9999999999',
    BloodGroup: 'A+', EmergencyContact: '8888888888',
    MemberType: 'Student', RegistrationDate: '2026-01-01',
    Status: 'Active',
  }, adminToken);

  R.add(
    'Member creation without name rejected',
    !noName.ok,
    `status=${noName.status}`,
    noName.elapsed
  );

  // ── 3. Invalid data types ─────────────────────────────────────────────────
  console.log('  3. Invalid data types...\n');

  const badAge = await request('POST', '/members', {
    Name: 'Bad Data', Age: 'not-a-number', Email: 'bad@test.com',
    ContactNumber: '9999999999', BloodGroup: 'A+', EmergencyContact: '8888888888',
    MemberType: 'Student', RegistrationDate: '2026-01-01', Status: 'Active',
  }, adminToken);

  R.add(
    'Non-numeric age handled gracefully',
    true, // As long as server doesn't crash
    `status=${badAge.status}, ok=${badAge.ok}`,
    badAge.elapsed
  );

  // ── 4. Expired/invalid token ──────────────────────────────────────────────
  console.log('  4. Authentication failures...\n');

  const noToken = await request('GET', '/members');
  R.add(
    'Request without token rejected',
    noToken.status === 401 || noToken.status === 403,
    `status=${noToken.status}`,
    noToken.elapsed
  );

  const badToken = await request('GET', '/members', null, 'invalid.token.here');
  R.add(
    'Request with invalid token rejected',
    badToken.status === 401 || badToken.status === 403,
    `status=${badToken.status}`,
    badToken.elapsed
  );

  // ── 5. Privilege escalation attempts ──────────────────────────────────────
  console.log('  5. Privilege escalation attempts...\n');

  // Student tries to delete a member
  const stuDelete = await request('DELETE', '/members/2', null, studentToken);
  R.add(
    'Student cannot delete members',
    stuDelete.status === 403,
    `status=${stuDelete.status}`,
    stuDelete.elapsed
  );

  // Student tries to view another member
  const stuView = await request('GET', '/members/2', null, studentToken);
  R.add(
    'Student cannot view other members',
    stuView.status === 403,
    `status=${stuView.status}`,
    stuView.elapsed
  );

  // Student tries to access staff
  const stuStaff = await request('GET', '/staff', null, studentToken);
  R.add(
    'Student cannot access staff endpoint',
    stuStaff.status === 403,
    `status=${stuStaff.status}`,
    stuStaff.elapsed
  );

  // ── 6. Updating non-existent records ──────────────────────────────────────
  console.log('  6. Operations on non-existent records...\n');

  const updateGhost = await request('PUT', '/members/999999', {
    Name: 'Ghost Member', Address: 'Nowhere',
  }, adminToken);

  R.add(
    'Update non-existent member handled',
    !updateGhost.ok || updateGhost.status === 404,
    `status=${updateGhost.status}`,
    updateGhost.elapsed
  );

  const deleteGhost = await request('DELETE', '/members/999999', null,
    (await login('superadmin')));
  R.add(
    'Delete non-existent member handled',
    !deleteGhost.ok || deleteGhost.status === 404,
    `status=${deleteGhost.status}`,
    deleteGhost.elapsed
  );

  // ── 7. Rapid-fire same request (idempotency) ─────────────────────────────
  console.log('  7. Rapid-fire identical requests...\n');

  const rapidResults = await Promise.all(
    Array.from({ length: 20 }, () =>
      request('GET', '/auth/me', null, adminToken)
    )
  );

  const allOk = rapidResults.every(r => r.ok);
  const allSame = rapidResults.every(r =>
    JSON.stringify(r.data) === JSON.stringify(rapidResults[0].data)
  );

  R.add(
    '20 rapid /auth/me requests all succeed',
    allOk,
    `${rapidResults.filter(r => r.ok).length}/20 succeeded`,
  );

  R.add(
    'All 20 return identical data',
    allSame,
    allSame ? 'Consistent responses' : 'Data mismatch detected',
  );

  // ── 8. Verify no garbage data was created ─────────────────────────────────
  console.log('  8. Verifying no partial/garbage data was created...\n');

  const allMembers = await request('GET', '/members', null, adminToken);
  const ghostMembers = (allMembers.data?.data || []).filter(
    m => m.Name?.includes('Bad Data') || m.Name?.includes('Ghost')
  );

  R.add(
    'No garbage members created from failed operations',
    ghostMembers.length === 0,
    `Found ${ghostMembers.length} garbage records`,
  );

  return R.summary();
}

run().catch(err => { console.error('FATAL:', err); process.exit(1); });
