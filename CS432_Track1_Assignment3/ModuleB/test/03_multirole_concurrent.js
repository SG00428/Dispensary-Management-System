// ═══════════════════════════════════════════════════════════════════════════
// Test 3 — Multi-Role Concurrent Access (Isolation)
//
// WHAT: 8 different roles all hit their respective endpoints at the same time.
// WHY:  Validates that concurrent requests from different roles don't
//       interfere with each other — each gets the correct data scoped to
//       their permissions, with no cross-contamination.
// ═══════════════════════════════════════════════════════════════════════════

const { request, login, TestResults } = require('./config');

async function run() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Test 3 — Multi-Role Concurrent Access (Isolation)         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const R = new TestResults('Multi-Role Concurrent Access');

  // ── Phase 1: Login all roles concurrently ─────────────────────────────────
  console.log('  Logging in all 8 roles concurrently...\n');

  const roles = ['superadmin', 'admin', 'doctor', 'faculty', 'nurse', 'pharmacist', 'technician', 'student'];
  const loginStart = performance.now();
  const tokens = {};

  const loginPromises = roles.map(async role => {
    const token = await login(role);
    tokens[role] = token;
    return { role, token };
  });

  const loginResults = await Promise.all(loginPromises);
  const loginElapsed = performance.now() - loginStart;

  R.add(
    'All 8 roles logged in concurrently',
    loginResults.length === 8,
    `${loginResults.length} logins in ${loginElapsed.toFixed(0)}ms`,
    loginElapsed
  );

  // ── Phase 2: Concurrent reads — each role hits its accessible endpoints ───
  console.log('  Firing concurrent requests from all roles...\n');

  const concurrentTasks = [
    // SuperAdmin — sees everything
    request('GET', '/members', null, tokens.superadmin)
      .then(r => ({ role: 'superadmin', endpoint: '/members', ...r })),
    request('GET', '/staff', null, tokens.superadmin)
      .then(r => ({ role: 'superadmin', endpoint: '/staff', ...r })),

    // Admin — sees everything
    request('GET', '/members', null, tokens.admin)
      .then(r => ({ role: 'admin', endpoint: '/members', ...r })),
    request('GET', '/appointments', null, tokens.admin)
      .then(r => ({ role: 'admin', endpoint: '/appointments', ...r })),

    // Doctor — sees own appointments only
    request('GET', '/appointments', null, tokens.doctor)
      .then(r => ({ role: 'doctor', endpoint: '/appointments', ...r })),
    request('GET', '/members', null, tokens.doctor)
      .then(r => ({ role: 'doctor', endpoint: '/members', ...r })),

    // Student — sees own profile only
    request('GET', '/members', null, tokens.student)
      .then(r => ({ role: 'student', endpoint: '/members', ...r })),

    // Nurse — reads appointments
    request('GET', '/appointments', null, tokens.nurse)
      .then(r => ({ role: 'nurse', endpoint: '/appointments', ...r })),

    // Pharmacist — reads inventory
    request('GET', '/inventory', null, tokens.pharmacist)
      .then(r => ({ role: 'pharmacist', endpoint: '/inventory', ...r })),

    // Technician — blocked from inventory
    request('GET', '/inventory', null, tokens.technician)
      .then(r => ({ role: 'technician', endpoint: '/inventory (blocked)', ...r })),

    // Faculty — own members only
    request('GET', '/members', null, tokens.faculty)
      .then(r => ({ role: 'faculty', endpoint: '/members', ...r })),

    // Student — blocked from staff
    request('GET', '/staff', null, tokens.student)
      .then(r => ({ role: 'student', endpoint: '/staff (blocked)', ...r })),
  ];

  const allResults = await Promise.all(concurrentTasks);

  // ── Phase 3: Validate role-based scoping ──────────────────────────────────
  console.log('  Validating role-based data scoping...\n');

  for (const r of allResults) {
    console.log(`    ${r.role.padEnd(14)} ${r.endpoint.padEnd(25)} → ${r.status} (${r.elapsed.toFixed(0)}ms)`);
  }
  console.log('');

  // SuperAdmin sees all members (260+)
  const saMembers = allResults.find(r => r.role === 'superadmin' && r.endpoint === '/members');
  R.add(
    'SuperAdmin sees all members',
    saMembers?.ok && (saMembers?.data?.count >= 200 || saMembers?.data?.data?.length >= 200),
    `count = ${saMembers?.data?.count || saMembers?.data?.data?.length}`,
    saMembers?.elapsed
  );

  // Student sees only own record (count = 1)
  const stuMembers = allResults.find(r => r.role === 'student' && r.endpoint === '/members');
  const stuCount = stuMembers?.data?.count || stuMembers?.data?.data?.length;
  R.add(
    'Student sees only own profile (count=1)',
    stuMembers?.ok && stuCount === 1,
    `count = ${stuCount}`,
    stuMembers?.elapsed
  );

  // Technician is blocked from inventory
  const techInv = allResults.find(r => r.role === 'technician');
  R.add(
    'Technician blocked from inventory',
    techInv?.status === 403,
    `status = ${techInv?.status}`,
    techInv?.elapsed
  );

  // Student is blocked from staff
  const stuStaff = allResults.find(r => r.role === 'student' && r.endpoint.includes('staff'));
  R.add(
    'Student blocked from staff list',
    stuStaff?.status === 403,
    `status = ${stuStaff?.status}`,
    stuStaff?.elapsed
  );

  // Doctor sees only own appointments
  const docAppts = allResults.find(r => r.role === 'doctor' && r.endpoint === '/appointments');
  const adminAppts = allResults.find(r => r.role === 'admin' && r.endpoint === '/appointments');
  if (docAppts?.ok && adminAppts?.ok) {
    const docCount   = docAppts.data?.count || docAppts.data?.data?.length || 0;
    const adminCount = adminAppts.data?.count || adminAppts.data?.data?.length || 0;
    R.add(
      'Doctor sees fewer appointments than admin',
      docCount < adminCount,
      `doctor=${docCount}, admin=${adminCount}`,
    );
  }

  // All requests completed without 500 errors
  const serverErrors = allResults.filter(r => r.status >= 500);
  R.add(
    'No 500 server errors under concurrent load',
    serverErrors.length === 0,
    `${serverErrors.length} server errors`,
  );

  // ── Phase 4: Cross-role write isolation ───────────────────────────────────
  // Student should NOT be able to book for another member
  console.log('  Testing cross-role write isolation...\n');

  const crossBook = await request('POST', '/appointments', {
    MemberID: 99,  // Not the student's own ID
    DoctorID: 1,
    AppointmentDate: '2031-07-01',
    AppointmentTime: '09:00:00',
    Symptoms: 'Cross-role test',
    Priority: 'Normal',
  }, tokens.student);

  R.add(
    'Student cannot book for another member',
    !crossBook.ok,
    `status=${crossBook.status}, msg=${crossBook.data?.error || crossBook.data?.message}`,
    crossBook.elapsed
  );

  // Technician cannot add inventory
  const techAdd = await request('POST', '/inventory', {
    MedicineID: 1,
    BatchNumber: 'TECH-HACK',
    Quantity: 999,
    ManufactureDate: '2025-01-01',
    ExpiryDate: '2028-01-01',
    Location: 'Hack Shelf',
    PurchasePrice: 1,
    ReorderLevel: 10,
  }, tokens.technician);

  R.add(
    'Technician cannot add inventory',
    !techAdd.ok && techAdd.status === 403,
    `status=${techAdd.status}`,
    techAdd.elapsed
  );

  return R.summary();
}

run().catch(err => { console.error('FATAL:', err); process.exit(1); });
