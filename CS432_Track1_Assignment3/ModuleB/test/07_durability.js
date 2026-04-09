// ═══════════════════════════════════════════════════════════════════════════
// Test 7 — Durability: Data Persistence Verification
//
// WHAT: Create records, read them back, modify them, and verify that all
//       committed data persists correctly across multiple reads.
// WHY:  Validates the 'D' in ACID — once committed, data must persist
//       and be retrievable. Also tests consistency across read replicas
//       (if any) by doing immediate read-after-write.
// ═══════════════════════════════════════════════════════════════════════════

const { request, login, TestResults } = require('./config');

// Use a randomized date to avoid collision with leftover appointments
// from previous test runs.
function futureDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  d.setDate(d.getDate() + Math.floor(Math.random() * 300));
  return d.toISOString().split('T')[0];
}

const TEST_DATE = futureDate();

async function run() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Test 7 — Durability: Data Persistence Verification        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const R = new TestResults('Durability — Persistence Verification');

  const adminToken = await login('admin');

  // ── 1. Create → Read → Verify cycle for Members ──────────────────────────
  console.log('  1. Member: Create → Read → Verify...\n');

  const uniqueCode = `DUR${Date.now()}`;
  const createMember = await request('POST', '/members', {
    Name: 'Durability Test User',
    Age: 22,
    Email: `durability-${Date.now()}@test.com`,
    ContactNumber: '9876543210',
    RollNumberOrEmployeeCode: uniqueCode,
    Department: 'Testing',
    BloodGroup: 'O+',
    EmergencyContact: '1234567890',
    Address: 'Test Lab',
    RegistrationDate: '2026-01-01',
    MemberType: 'Student',
    Status: 'Active',
  }, adminToken);

  const memberID = createMember.data?.memberID || createMember.data?.MemberID
                || createMember.data?.id || createMember.data?.insertId
                || createMember.data?.data?.MemberID || createMember.data?.data?.id;
  R.add('Member created', createMember.ok, `ID=${memberID}`, createMember.elapsed);

  if (!memberID) {
    console.log('  ❌ Cannot proceed without member. Aborting.');
    return R.summary();
  }

  // Read back immediately
  const readMember = await request('GET', `/members/${memberID}`, null, adminToken);
  const m = readMember.data?.data;

  R.add('Immediate read-after-write succeeds', readMember.ok, '', readMember.elapsed);

  R.add(
    'Written data matches read data',
    m?.Name === 'Durability Test User' &&
    m?.Department === 'Testing' &&
    m?.BloodGroup === 'O+' &&
    m?.RollNumberOrEmployeeCode === uniqueCode,
    `Name=${m?.Name}, Dept=${m?.Department}, Blood=${m?.BloodGroup}`,
  );

  // ── 2. Update → Read → Verify ────────────────────────────────────────────
  console.log('  2. Member: Update → Read → Verify...\n');

  const updateRes = await request('PUT', `/members/${memberID}`, {
    Address: 'Updated Address 123',
    Department: 'Updated Department',
  }, adminToken);

  R.add('Member updated', updateRes.ok, '', updateRes.elapsed);

  const readUpdated = await request('GET', `/members/${memberID}`, null, adminToken);
  const mu = readUpdated.data?.data;

  R.add(
    'Updated fields persisted correctly',
    mu?.Address === 'Updated Address 123' && mu?.Department === 'Updated Department',
    `Address=${mu?.Address}, Dept=${mu?.Department}`,
  );

  R.add(
    'Non-updated fields unchanged',
    mu?.Name === 'Durability Test User' && mu?.BloodGroup === 'O+',
    `Name=${mu?.Name}, Blood=${mu?.BloodGroup}`,
  );

  // ── 3. Inventory: Create → Read → Update → Read ──────────────────────────
  console.log('  3. Inventory: Full CRUD persistence cycle...\n');

  const batchNum = `DUR-BATCH-${Date.now()}`;
  const createInv = await request('POST', '/inventory', {
    MedicineID: 1,
    BatchNumber: batchNum,
    Quantity: 200,
    ManufactureDate: '2025-06-01',
    ExpiryDate: '2028-06-01',
    Location: 'Durability Shelf',
    PurchasePrice: 3.50,
    ReorderLevel: 20,
  }, adminToken);

  const invID = createInv.data?.inventoryID || createInv.data?.InventoryID
             || createInv.data?.id || createInv.data?.insertId
             || createInv.data?.data?.InventoryID || createInv.data?.data?.id;
  R.add('Inventory batch created', createInv.ok, `ID=${invID}`, createInv.elapsed);

  if (invID) {
    // Update quantity
    await request('PUT', `/inventory/${invID}`, { Quantity: 150, Status: 'Available' }, adminToken);

    const readInv = await request('GET', '/inventory', null, adminToken);
    const batch = (readInv.data?.data || []).find(i => i.InventoryID === invID);

    R.add(
      'Updated inventory quantity persisted',
      batch?.Quantity === 150,
      `Quantity=${batch?.Quantity} (expected 150)`,
    );

    R.add(
      'Inventory metadata intact',
      batch?.BatchNumber === batchNum && batch?.Location === 'Durability Shelf',
      `Batch=${batch?.BatchNumber}`,
    );

    // Cleanup
    await request('DELETE', `/inventory/${invID}`, null, adminToken);
  }

  // ── 4. Appointment: Create → Read → Status Change → Read ─────────────────
  console.log('  4. Appointment: Status transition persistence...\n');

  // Use a random hour between 9-16 to reduce chance of slot collision
  const hour = 9 + Math.floor(Math.random() * 7);
  const apptTime = `${String(hour).padStart(2, '0')}:00:00`;

  const createAppt = await request('POST', '/appointments', {
    MemberID: 1, DoctorID: 1,
    AppointmentDate: TEST_DATE,
    AppointmentTime: apptTime,
    Symptoms: 'Durability test appointment',
    Priority: 'Urgent',
  }, adminToken);

  const apptID = createAppt.data?.appointmentID || createAppt.data?.AppointmentID
              || createAppt.data?.id || createAppt.data?.insertId
              || createAppt.data?.data?.AppointmentID || createAppt.data?.data?.id;
  R.add('Appointment created', createAppt.ok, `ID=${apptID} (${TEST_DATE} ${apptTime})`, createAppt.elapsed);

  if (!apptID) {
    console.log(`  ⚠️  Response: status=${createAppt.status}, body=${JSON.stringify(createAppt.data)}`);
  }

  if (apptID) {
    // Verify initial status
    const readAppt = await request('GET', '/appointments', null, adminToken);
    const appt = (readAppt.data?.data || []).find(a => a.AppointmentID === apptID);

    R.add(
      'Initial status is Scheduled',
      appt?.Status === 'Scheduled',
      `Status=${appt?.Status}`,
    );

    R.add(
      'Priority persisted correctly',
      appt?.Priority === 'Urgent',
      `Priority=${appt?.Priority}`,
    );

    // Cancel and verify
    await request('PUT', `/appointments/${apptID}`, { Status: 'Cancelled' }, adminToken);
    const readCancelled = await request('GET', '/appointments', null, adminToken);
    const cancelled = (readCancelled.data?.data || []).find(a => a.AppointmentID === apptID);

    R.add(
      'Status change to Cancelled persisted',
      cancelled?.Status === 'Cancelled',
      `Status=${cancelled?.Status}`,
    );
  }

  // ── 5. Multiple reads return consistent data ─────────────────────────────
  console.log('  5. Read consistency (10 sequential reads)...\n');

  const reads = [];
  for (let i = 0; i < 10; i++) {
    const r = await request('GET', `/members/${memberID}`, null, adminToken);
    reads.push(r.data?.data);
  }

  const allIdentical = reads.every(r =>
    r?.Name === reads[0]?.Name &&
    r?.Address === reads[0]?.Address &&
    r?.Department === reads[0]?.Department
  );

  R.add(
    '10 sequential reads return identical data',
    allIdentical,
    allIdentical ? 'All reads consistent' : 'Read inconsistency detected',
  );

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const saToken = await login('superadmin');
  await request('DELETE', `/members/${memberID}`, null, saToken);
  console.log(`  Cleaned up test member ${memberID}\n`);

  return R.summary();
}

run().catch(err => { console.error('FATAL:', err); process.exit(1); });
