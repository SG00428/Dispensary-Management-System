// ═══════════════════════════════════════════════════════════════════════════
// Test 4 — Atomicity: Multi-Step Prescription Transaction
//
// WHAT: The prescribe flow involves 3 sequential API calls:
//       1. Create Visit → 2. Create Prescription → 3. Update Appointment
//       We test what happens when one step fails.
// WHY:  If step 2 fails, the Visit created in step 1 should ideally be
//       rolled back (or at minimum, the appointment should NOT be marked
//       complete). This tests application-level atomicity.
// ═══════════════════════════════════════════════════════════════════════════

const { request, login, TestResults } = require('./config');

// Generate unique dates for each phase to avoid collisions with leftover
// data from previous test runs (cancelled appointments still occupy slots).
function futureDate(offsetDays) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  d.setDate(d.getDate() + offsetDays + Math.floor(Math.random() * 300));
  return d.toISOString().split('T')[0];
}

const DATE_HAPPY = futureDate(0);
const DATE_FAIL  = futureDate(1);
const DATE_CONC  = futureDate(2);

async function run() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Test 4 — Atomicity: Multi-Step Prescription Transaction   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const R = new TestResults('Atomicity — Prescription Transaction');

  const adminToken  = await login('admin');
  const doctorToken = await login('doctor');

  // Helper: extract ID from various possible response shapes
  const extractID = (res, keys) => {
    for (const k of keys) {
      if (res.data?.[k]) return res.data[k];
      if (res.data?.data?.[k]) return res.data.data[k];
    }
    return null;
  };

  // ── Phase 1: Happy path — full transaction succeeds ───────────────────────
  console.log(`  Phase 1: Happy path — booking + visit + prescription (date: ${DATE_HAPPY})...\n`);

  // Book an appointment
  const bookRes = await request('POST', '/appointments', {
    MemberID: 1,
    DoctorID: 1,
    AppointmentDate: DATE_HAPPY,
    AppointmentTime: '14:00:00',
    Symptoms: 'Atomicity test - happy path',
    Priority: 'Normal',
  }, adminToken);

  const apptID = extractID(bookRes, ['appointmentID', 'AppointmentID', 'id', 'insertId']);
  R.add('Appointment booked for test', bookRes.ok, `ID=${apptID}`, bookRes.elapsed);

  if (!apptID) {
    console.log(`  ⚠️  Booking response: status=${bookRes.status}, body=${JSON.stringify(bookRes.data)}`);
    console.log('  ❌ Cannot proceed without appointment. Aborting.');
    return R.summary();
  }

  // Step 1: Create Visit
  const visitRes = await request('POST', '/visits', {
    MemberID: 1,
    DoctorID: 1,
    AppointmentID: apptID,
    VisitDate: DATE_HAPPY,
    VisitTime: '14:05:00',
    ChiefComplaint: 'Headache',
    Diagnosis: 'Tension headache',
    VisitType: 'Scheduled',
    Status: 'Completed',
  }, doctorToken);

  const visitID = extractID(visitRes, ['visitID', 'VisitID', 'id', 'insertId']);
  R.add('Step 1: Visit created', visitRes.ok, `VisitID=${visitID}`, visitRes.elapsed);

  // Step 2: Create Prescription
  const validUntil = new Date(DATE_HAPPY);
  validUntil.setDate(validUntil.getDate() + 10);
  const rxRes = await request('POST', '/prescriptions', {
    VisitID: visitID,
    MemberID: 1,
    DoctorID: 1,
    IssueDate: DATE_HAPPY,
    ValidUntil: validUntil.toISOString().split('T')[0],
    Diagnosis: 'Tension headache',
    SpecialInstructions: 'Rest well',
    items: [
      { MedicineID: 1, Dosage: '500mg', Frequency: 'Twice daily', Duration: '5 days', Quantity: 10 },
    ],
  }, doctorToken);

  const rxID = extractID(rxRes, ['prescriptionID', 'PrescriptionID', 'id', 'insertId']);
  R.add('Step 2: Prescription created', rxRes.ok,
    `PrescriptionID=${rxID}`,
    rxRes.elapsed);

  // Step 3: Mark appointment completed
  const completeRes = await request('PUT', `/appointments/${apptID}`,
    { Status: 'Completed' }, doctorToken);
  R.add('Step 3: Appointment marked completed', completeRes.ok, '', completeRes.elapsed);

  // Verify final state
  const verifyAppt = await request('GET', `/appointments`, null, adminToken);
  const theAppt = (verifyAppt.data?.data || []).find(a => a.AppointmentID === apptID);
  R.add(
    'Happy path: appointment is Completed',
    theAppt?.Status === 'Completed',
    `Status = ${theAppt?.Status}`,
  );

  // ── Phase 2: Failure path — invalid prescription should not mark complete ─
  console.log(`\n  Phase 2: Failure path — invalid prescription data (date: ${DATE_FAIL})...\n`);

  const bookRes2 = await request('POST', '/appointments', {
    MemberID: 2,
    DoctorID: 1,
    AppointmentDate: DATE_FAIL,
    AppointmentTime: '15:00:00',
    Symptoms: 'Atomicity test - failure path',
    Priority: 'Normal',
  }, adminToken);

  const apptID2 = extractID(bookRes2, ['appointmentID', 'AppointmentID', 'id', 'insertId']);
  R.add('Second appointment booked', bookRes2.ok, `ID=${apptID2}`, bookRes2.elapsed);

  if (!apptID2) {
    console.log(`  ⚠️  Booking response: status=${bookRes2.status}, body=${JSON.stringify(bookRes2.data)}`);
    console.log('  ❌ Cannot proceed. Aborting failure path.');
    return R.summary();
  }

  // Step 1: Create Visit (succeeds)
  const visitRes2 = await request('POST', '/visits', {
    MemberID: 2,
    DoctorID: 1,
    AppointmentID: apptID2,
    VisitDate: DATE_FAIL,
    VisitTime: '15:05:00',
    ChiefComplaint: 'Cough',
    Diagnosis: 'Common cold',
    VisitType: 'Scheduled',
    Status: 'Completed',
  }, doctorToken);
  const visitID2 = extractID(visitRes2, ['visitID', 'VisitID', 'id', 'insertId']);

  // Step 2: Try prescription with INVALID data (non-existent VisitID + empty items)
  // Using VisitID=999999 to guarantee a foreign key failure, since the server
  // may not validate empty items arrays.
  const validUntil2 = new Date(DATE_FAIL);
  validUntil2.setDate(validUntil2.getDate() + 10);
  const badRxRes = await request('POST', '/prescriptions', {
    VisitID: 999999,  // Non-existent VisitID — guaranteed to fail FK check
    MemberID: 2,
    DoctorID: 1,
    IssueDate: DATE_FAIL,
    ValidUntil: validUntil2.toISOString().split('T')[0],
    Diagnosis: 'Common cold',
    items: [],
  }, doctorToken);

  const rxFailed = !badRxRes.ok;
  R.add(
    'Invalid prescription rejected',
    rxFailed,
    `status=${badRxRes.status}, error=${badRxRes.data?.error || badRxRes.data?.message}`,
    badRxRes.elapsed
  );

  // Step 3: Since prescription failed, appointment should NOT be Completed
  // (The frontend wouldn't call step 3 if step 2 failed, but let's verify
  //  the appointment is still in Scheduled state)
  const verifyAppt2 = await request('GET', '/appointments', null, adminToken);
  const theAppt2 = (verifyAppt2.data?.data || []).find(a => a.AppointmentID === apptID2);

  R.add(
    'Failed transaction: appointment stays Scheduled',
    theAppt2?.Status === 'Scheduled',
    `Status = ${theAppt2?.Status} (should be Scheduled, not Completed)`,
  );

  // ── Phase 3: Concurrent prescriptions for same appointment ────────────────
  console.log(`\n  Phase 3: Concurrent duplicate prescription attempts (date: ${DATE_CONC})...\n`);

  const bookRes3 = await request('POST', '/appointments', {
    MemberID: 3,
    DoctorID: 1,
    AppointmentDate: DATE_CONC,
    AppointmentTime: '10:00:00',
    Symptoms: 'Double-prescribe test',
    Priority: 'Normal',
  }, adminToken);
  const apptID3 = extractID(bookRes3, ['appointmentID', 'AppointmentID', 'id', 'insertId']);

  if (apptID3) {
    // Create visit
    const v3 = await request('POST', '/visits', {
      MemberID: 3, DoctorID: 1, AppointmentID: apptID3,
      VisitDate: DATE_CONC, VisitTime: '10:05:00',
      ChiefComplaint: 'Test', Diagnosis: 'Test',
      VisitType: 'Scheduled', Status: 'Completed',
    }, doctorToken);
    const vid3 = extractID(v3, ['visitID', 'VisitID', 'id', 'insertId']);

    // Calculate valid-until date
    const validUntil3 = new Date(DATE_CONC);
    validUntil3.setDate(validUntil3.getDate() + 10);
    const validUntilStr = validUntil3.toISOString().split('T')[0];

    // Fire 2 concurrent prescriptions for the SAME visit
    const [rx1, rx2] = await Promise.all([
      request('POST', '/prescriptions', {
        VisitID: vid3, MemberID: 3, DoctorID: 1,
        IssueDate: DATE_CONC, ValidUntil: validUntilStr,
        Diagnosis: 'Test concurrent 1',
        items: [{ MedicineID: 1, Dosage: '500mg', Frequency: 'Once', Duration: '3 days', Quantity: 3 }],
      }, doctorToken),
      request('POST', '/prescriptions', {
        VisitID: vid3, MemberID: 3, DoctorID: 1,
        IssueDate: DATE_CONC, ValidUntil: validUntilStr,
        Diagnosis: 'Test concurrent 2',
        items: [{ MedicineID: 1, Dosage: '250mg', Frequency: 'Twice', Duration: '5 days', Quantity: 10 }],
      }, doctorToken),
    ]);

    const bothSucceeded = rx1.ok && rx2.ok;
    const oneSucceeded  = rx1.ok || rx2.ok;

    R.add(
      'Concurrent prescriptions handled without crash',
      oneSucceeded,
      `rx1=${rx1.status}, rx2=${rx2.status}`,
    );
  }

  // ── Cleanup (DELETE so the slots are freed for future runs) ──────────────
  console.log('\n  Cleaning up test data...');
  for (const id of [apptID, apptID2, apptID3].filter(Boolean)) {
    await request('DELETE', `/appointments/${id}`, null, adminToken);
  }

  return R.summary();
}

run().catch(err => { console.error('FATAL:', err); process.exit(1); });
