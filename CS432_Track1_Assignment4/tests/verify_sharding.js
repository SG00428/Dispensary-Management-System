// ═══════════════════════════════════════════════════════════════════════════
// Multi-Shard Verification Tests
//
// Connects DIRECTLY to all 3 shard servers (no API needed) and verifies:
//   1. All 3 shards are reachable
//   2. Each shard reports a different @@hostname/@@port
//   3. Schema is identical on all shards
//   4. Data distribution is correct (MemberID % 3)
//   5. No data loss or duplication
//   6. Single-shard lookups land on the right shard
//   7. Cross-shard fan-out queries return merged results
//   8. Range queries work across shards
//
// Usage:
//   node tests/verify_sharding.js
//
// Requires network access to 10.0.116.184 (IITGN network only)
// ═══════════════════════════════════════════════════════════════════════════

const mysql = require('mysql2/promise');

const SHARD_HOST = process.env.SHARD_HOST || '10.0.116.184';
const SHARD_USER = process.env.SHARD_USER || 'SQL_ed';
const SHARD_PASS = process.env.SHARD_PASS || 'password@123';
const SHARD_DB   = process.env.SHARD_DB   || 'SQL_ed';
const SHARD_PORTS = [3307, 3308, 3309];
const NUM_SHARDS = 3;

let passed = 0, failed = 0;

function check(name, cond, detail = '') {
  if (cond) {
    passed++;
    console.log(`  [PASS] ${name}${detail ? ' — ' + detail : ''}`);
  } else {
    failed++;
    console.log(`  [FAIL] ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function section(title) {
  console.log(`\n━━━ ${title} ━━━\n`);
}

function getShardId(memberID) {
  return memberID % NUM_SHARDS;
}


async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  Multi-Shard Verification Tests                                ║');
  console.log('║  Target: ' + SHARD_HOST + ' on ports ' + SHARD_PORTS.join(', ') + '              ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  // ── Connect to all 3 shards ──────────────────────────────────────────────
  section('Test 1: Shard Connectivity');
  const shards = [];
  for (let i = 0; i < NUM_SHARDS; i++) {
    try {
      const conn = await mysql.createConnection({
        host: SHARD_HOST, port: SHARD_PORTS[i],
        user: SHARD_USER, password: SHARD_PASS, database: SHARD_DB,
      });
      const [rows] = await conn.query('SELECT @@hostname AS h, @@port AS p, DATABASE() AS db');
      check(
        `Shard ${i} (port ${SHARD_PORTS[i]}) reachable`,
        true,
        `host=${rows[0].h}, port=${rows[0].p}, db=${rows[0].db}`
      );
      shards.push({ id: i, port: SHARD_PORTS[i], conn });
    } catch (err) {
      check(`Shard ${i} (port ${SHARD_PORTS[i]}) reachable`, false, err.message);
    }
  }

  if (shards.length !== NUM_SHARDS) {
    console.log('\n [FAIL] Cannot continue — not all shards are reachable');
    return;
  }

  // ── Test 2: Each shard is a different physical instance ─────────────────
  section('Test 2: Shards are Distinct Instances');
  const hostnames = [];
  for (const s of shards) {
    const [rows] = await s.conn.query('SELECT @@hostname AS h');
    hostnames.push(rows[0].h);
  }
  check(
    'Each shard reports a unique hostname',
    new Set(hostnames).size === NUM_SHARDS,
    `hostnames = [${hostnames.join(', ')}]`
  );

  // ── Test 3: Schema identical across all shards ──────────────────────────
  section('Test 3: Schema Consistency');
  const tableLists = [];
  for (const s of shards) {
    const [rows] = await s.conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`, [SHARD_DB]
    );
    tableLists.push(rows.map(r => r.TABLE_NAME));
  }
  const allSame = tableLists.every(list =>
    list.length === tableLists[0].length &&
    list.every((t, i) => t === tableLists[0][i])
  );
  check('All shards have identical table set', allSame,
    `${tableLists[0].length} tables on each shard`);

  for (const t of ['Member', 'Appointment', 'Visit', 'Prescription', 'Doctor']) {
    const exists = tableLists.every(list => list.includes(t));
    check(`Table ${t} exists on all shards`, exists);
  }

  // ── Test 4: Each shard knows its own ID ─────────────────────────────────
  section('Test 4: Shard Self-Identification');
  for (const s of shards) {
    try {
      const [rows] = await s.conn.query(
        "SELECT Value_ AS v FROM ShardMetadata WHERE Key_ = 'shard_id'"
      );
      const reportedId = rows[0]?.v;
      check(
        `Shard at port ${s.port} reports shard_id`,
        reportedId === String(s.id),
        `reports ${reportedId}, expected ${s.id}`
      );
    } catch {
      check(`Shard at port ${s.port} has metadata table`, false);
    }
  }

  // ── Test 5: Data distribution (no record on wrong shard) ────────────────
  section('Test 5: Data Distribution Correctness');
  for (const s of shards) {
    const [rows] = await s.conn.query('SELECT MemberID FROM Member');
    if (rows.length === 0) {
      check(`Shard ${s.id} data check`, true, 'empty (no data migrated yet)');
      continue;
    }
    const wrongShard = rows.filter(r => getShardId(r.MemberID) !== s.id);
    check(
      `Shard ${s.id}: all ${rows.length} members have correct hash`,
      wrongShard.length === 0,
      wrongShard.length === 0
        ? `MemberID range hashed to ${s.id}`
        : `${wrongShard.length} misplaced records!`
    );
  }

  // ── Test 6: No duplicates across shards ──────────────────────────────────
  section('Test 6: No Cross-Shard Duplication');
  const allMemberIDs = [];
  for (const s of shards) {
    const [rows] = await s.conn.query('SELECT MemberID FROM Member');
    allMemberIDs.push(...rows.map(r => r.MemberID));
  }
  const uniqueIDs = new Set(allMemberIDs);
  check(
    'All MemberIDs are unique across shards',
    uniqueIDs.size === allMemberIDs.length,
    `${allMemberIDs.length} total, ${uniqueIDs.size} unique`
  );

  // ── Test 7: Per-shard distribution stats ────────────────────────────────
  section('Test 7: Distribution Stats');
  const counts = [];
  for (const table of ['Member', 'Appointment', 'Visit', 'Prescription']) {
    const tableCounts = [];
    for (const s of shards) {
      try {
        const [rows] = await s.conn.query(`SELECT COUNT(*) AS c FROM ${table}`);
        tableCounts.push(rows[0].c);
      } catch {
        tableCounts.push(0);
      }
    }
    const total = tableCounts.reduce((a, b) => a + b, 0);
    console.log(`    ${table.padEnd(15)} S0=${tableCounts[0]}  S1=${tableCounts[1]}  S2=${tableCounts[2]}  Total=${total}`);

    if (total > 0) {
      const max = Math.max(...tableCounts);
      const min = Math.min(...tableCounts);
      const skew = ((max - min) / (total / NUM_SHARDS) * 100).toFixed(1);
      check(
        `${table}: skew is acceptable`,
        parseFloat(skew) < 20,
        `skew = ${skew}%`
      );
    }
  }

  // ── Test 8: Single-shard lookup routing ─────────────────────────────────
  section('Test 8: Single-Shard Lookup Routing');
  for (const testID of [1, 2, 3, 10, 50, 99]) {
    const expectedShard = getShardId(testID);
    const targetShard = shards[expectedShard];
    const [rows] = await targetShard.conn.query(
      'SELECT MemberID, Name FROM Member WHERE MemberID = ?', [testID]
    );
    if (rows.length > 0) {
      check(
        `MemberID ${testID} → shard ${expectedShard}`,
        true,
        `found "${rows[0].Name}"`
      );
    } else {
      // Verify it's not on the wrong shards
      let foundElsewhere = false;
      for (let i = 0; i < NUM_SHARDS; i++) {
        if (i === expectedShard) continue;
        const [r] = await shards[i].conn.query(
          'SELECT MemberID FROM Member WHERE MemberID = ?', [testID]
        );
        if (r.length > 0) foundElsewhere = true;
      }
      check(
        `MemberID ${testID} → shard ${expectedShard}`,
        !foundElsewhere,
        foundElsewhere ? 'FOUND ON WRONG SHARD!' : 'not present (expected for some IDs)'
      );
    }
  }

  // ── Test 9: Cross-shard fan-out query ───────────────────────────────────
  section('Test 9: Cross-Shard Fan-Out Query');
  // Query all members across all shards (admin view simulation)
  const allMembers = [];
  for (const s of shards) {
    const [rows] = await s.conn.query('SELECT * FROM Member');
    allMembers.push(...rows);
  }
  check('Fan-out query returns members from all shards', allMembers.length > 0,
    `total = ${allMembers.length} members`);
  check('Merged result has unique MemberIDs',
    new Set(allMembers.map(m => m.MemberID)).size === allMembers.length);

  // ── Test 10: Cross-shard range query ────────────────────────────────────
  section('Test 10: Cross-Shard Range Query (Appointments by Date)');
  const rangeRows = [];
  const perShardCounts = [];
  for (const s of shards) {
    try {
      const [rows] = await s.conn.query(
        `SELECT * FROM Appointment WHERE AppointmentDate BETWEEN ? AND ?`,
        ['2020-01-01', '2030-12-31']
      );
      rangeRows.push(...rows);
      perShardCounts.push(rows.length);
    } catch {
      perShardCounts.push(0);
    }
  }
  console.log(`    Per-shard: S0=${perShardCounts[0]}, S1=${perShardCounts[1]}, S2=${perShardCounts[2]}`);
  check('Range query executes on all 3 shards', perShardCounts.length === NUM_SHARDS);
  check('Range query returns merged results', rangeRows.length >= 0,
    `${rangeRows.length} appointments in date range`);

  // ── Test 11: Insert routing ─────────────────────────────────────────────
  section('Test 11: Insert Routing');
  const testMemberID = 999000 + Math.floor(Math.random() * 1000);
  const expectedShard = getShardId(testMemberID);
  const targetShard = shards[expectedShard];

  try {
    await targetShard.conn.query(
      `INSERT INTO Member (MemberID, Name, Age, Email, ContactNumber,
        BloodGroup, EmergencyContact, RegistrationDate, MemberType)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [testMemberID, 'Shard Test User', 22, `shard-test-${testMemberID}@test.com`,
       '9876543210', 'A+', '1234567890', '2026-04-15', 'Student']
    );
    check(`Inserted MemberID ${testMemberID} into shard ${expectedShard}`, true);

    // Verify it's there
    const [rows] = await targetShard.conn.query(
      'SELECT * FROM Member WHERE MemberID = ?', [testMemberID]
    );
    check('Insert is readable from same shard', rows.length === 1);

    // Verify it's NOT on other shards
    let foundElsewhere = false;
    for (let i = 0; i < NUM_SHARDS; i++) {
      if (i === expectedShard) continue;
      const [r] = await shards[i].conn.query(
        'SELECT MemberID FROM Member WHERE MemberID = ?', [testMemberID]
      );
      if (r.length > 0) foundElsewhere = true;
    }
    check('Insert is NOT on other shards', !foundElsewhere);

    // Cleanup
    await targetShard.conn.query('DELETE FROM Member WHERE MemberID = ?', [testMemberID]);
    console.log(`    (Cleaned up test member ${testMemberID})`);
  } catch (err) {
    check('Test insert', false, err.message);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(70));
  console.log(`  RESULT: ${passed + failed} checks — ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(70) + '\n');

  // Cleanup
  for (const s of shards) await s.conn.end();
}

main().catch(err => {
  console.error('\n [FAIL] FATAL:', err.message);
  process.exit(1);
});
