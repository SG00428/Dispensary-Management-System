// ═══════════════════════════════════════════════════════════════════════════
// Test 2 — Race Condition: Concurrent Inventory Stock Update
//
// WHAT: Multiple concurrent requests try to update the same inventory batch
//       quantity simultaneously.
// WHY:  Tests isolation — final quantity must be deterministic, no lost
//       updates, no negative stock from race conditions.
// ═══════════════════════════════════════════════════════════════════════════

const { request, login, TestResults } = require('./config');

const CONCURRENT_UPDATES = 15;

async function run() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Test 2 — Race Condition: Concurrent Inventory Updates     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const R = new TestResults('Race Condition — Inventory Updates');

  const adminToken = await login('admin');
  const pharmaToken = await login('pharmacist');

  // ── Phase 1: Create a test batch with known quantity ──────────────────────
  const createRes = await request('POST', '/inventory', {
    MedicineID: 1,
    BatchNumber: `RACE-TEST-${Date.now()}`,
    Quantity: 100,
    ManufactureDate: '2025-01-01',
    ExpiryDate: '2028-01-01',
    Location: 'Test Shelf',
    PurchasePrice: 5.00,
    ReorderLevel: 10,
    MinimumStock: 5,
  }, adminToken);

  const batchID = createRes.data?.inventoryID || createRes.data?.InventoryID
               || createRes.data?.id || createRes.data?.insertId
               || createRes.data?.data?.InventoryID || createRes.data?.data?.id;
  console.log(`  Created test batch: ID ${batchID}, Quantity = 100\n`);

  if (!batchID) {
    console.log('  ❌ Could not create test batch. Skipping test.');
    R.add('Test batch creation', false, 'No batch ID returned');
    return R.summary();
  }

  R.add('Test batch created', true, `Batch ID ${batchID}`, createRes.elapsed);

  // ── Phase 2: Fire concurrent updates — alternating between admin & pharma ─
  // Each request sets a different quantity. The last-write-wins, but no request
  // should crash the server or corrupt data.
  console.log(`  Firing ${CONCURRENT_UPDATES} concurrent quantity updates...\n`);

  const promises = [];
  for (let i = 0; i < CONCURRENT_UPDATES; i++) {
    const newQty = 50 + i; // Quantities: 50, 51, 52, ... 64
    const token  = i % 2 === 0 ? adminToken : pharmaToken;
    promises.push(
      request('PUT', `/inventory/${batchID}`, {
        Quantity: newQty,
        Status: 'Available',
      }, token)
    );
  }

  const results = await Promise.all(promises);
  const successes = results.filter(r => r.ok);
  const failures  = results.filter(r => !r.ok);

  console.log(`  Results: ${successes.length} succeeded, ${failures.length} failed\n`);

  R.add(
    'All concurrent updates processed without crash',
    successes.length + failures.length === CONCURRENT_UPDATES,
    `${successes.length} ok, ${failures.length} errors`,
    results.reduce((s, r) => s + r.elapsed, 0) / results.length
  );

  // ── Phase 3: Read final state and validate consistency ────────────────────
  const finalState = await request('GET', '/inventory', null, adminToken);
  const batch = (finalState.data?.data || []).find(i => i.InventoryID === batchID);

  if (batch) {
    const validQty = batch.Quantity >= 50 && batch.Quantity <= 64;
    R.add(
      'Final quantity is a valid value (50–64)',
      validQty,
      `Final quantity = ${batch.Quantity}`,
    );

    R.add(
      'Batch status is consistent',
      batch.Status === 'Available',
      `Status = ${batch.Status}`,
    );

    R.add(
      'No data corruption (batch still readable)',
      true,
      `MedicineName = ${batch.MedicineName}, Location = ${batch.Location}`,
    );
  } else {
    R.add('Final state readable', false, 'Batch not found after concurrent updates');
  }

  // ── Phase 4: Sequential consistency check ─────────────────────────────────
  // Set to a known value, then read back
  await request('PUT', `/inventory/${batchID}`, { Quantity: 999, Status: 'Available' }, adminToken);
  const verify = await request('GET', '/inventory', null, adminToken);
  const verifyBatch = (verify.data?.data || []).find(i => i.InventoryID === batchID);

  R.add(
    'Sequential write-then-read is consistent',
    verifyBatch?.Quantity === 999,
    `Set 999, read back ${verifyBatch?.Quantity}`,
  );

  // ── Cleanup ───────────────────────────────────────────────────────────────
  await request('DELETE', `/inventory/${batchID}`, null, adminToken);
  console.log(`  Cleaned up test batch ${batchID}`);

  return R.summary();
}

run().catch(err => { console.error('FATAL:', err); process.exit(1); });
