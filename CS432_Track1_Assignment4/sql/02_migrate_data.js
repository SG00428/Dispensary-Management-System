// ═══════════════════════════════════════════════════════════════════════════
// Data Migration — Distribute data from local DB to 3 remote shard servers
//
// IMPORTANT: Schema must be created on all 3 shards FIRST:
//   mysql -h 10.0.116.184 -P 3307 -u SQL_ed -p SQL_ed < 01_create_schema.sql
//   mysql -h 10.0.116.184 -P 3308 -u SQL_ed -p SQL_ed < 01_create_schema.sql
//   mysql -h 10.0.116.184 -P 3309 -u SQL_ed -p SQL_ed < 01_create_schema.sql
//
// Usage:
//   node sql/02_migrate_data.js
// ═══════════════════════════════════════════════════════════════════════════

const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// ── Source (your local DispensaryManagement) ─────────────────────────────────
const SOURCE = {
  host:     process.env.SOURCE_HOST || 'localhost',
  port:     parseInt(process.env.SOURCE_PORT || '3306'),
  user:     process.env.SOURCE_USER || 'root',
  password: process.env.SOURCE_PASS || 'Harshjain@12',
  database: process.env.SOURCE_DB   || 'DispensaryManagement',
};

// ── Remote shards ────────────────────────────────────────────────────────────
const SHARD_HOST = process.env.SHARD_HOST || '10.0.116.184';
const SHARD_USER = process.env.SHARD_USER || 'SQL_ed';
const SHARD_PASS = process.env.SHARD_PASS || 'password@123';
const SHARD_DB   = process.env.SHARD_DB   || 'SQL_ed';
const SHARD_PORTS = [3307, 3308, 3309];
const NUM_SHARDS = 3;

function getShardId(memberID) { return memberID % NUM_SHARDS; }
function log(msg) { console.log(`  ${msg}`); }
function section(title) { console.log(`\n${'═'.repeat(70)}\n  ${title}\n${'═'.repeat(70)}`); }

// ── Helper: get column names from a table on the SHARD (target) ─────────────
async function getShardColumns(shardConn, table) {
  const [cols] = await shardConn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
     ORDER BY ORDINAL_POSITION`,
    [SHARD_DB, table]
  );
  return cols.map(c => c.COLUMN_NAME);
}

// ── Helper: sanitize values that might cause insert failures ────────────────
function sanitizeValue(colName, value) {
  // JSON columns: if the value isn't valid JSON, wrap it or null it
  if (colName === 'VitalSigns' || colName === 'VitalSignsAtArrival') {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return JSON.stringify(value);
    // It's a string — check if it's valid JSON
    const s = String(value).trim();
    if (s === '' || s === 'null' || s === 'NULL') return null;
    try { JSON.parse(s); return s; } catch {
      // Not valid JSON — wrap it as a JSON string
      return JSON.stringify(s);
    }
  }
  return value;
}

// ── Helper: migrate a table row-by-row, only using columns that exist on shard
async function migrateTable(source, shards, table, shardIdFn, label) {
  try {
    // Get columns that exist on BOTH source and shard
    const [srcCols] = await source.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION`,
      [SOURCE.database, table]
    );
    const srcColNames = srcCols.map(c => c.COLUMN_NAME);

    const shardColNames = await getShardColumns(shards[0], table);
    // Use only columns that exist in BOTH
    const commonCols = srcColNames.filter(c => shardColNames.includes(c));

    if (commonCols.length === 0) {
      log(`[WARN] ${table}: no common columns found (skipping)`);
      return;
    }

    const selectSql = `SELECT ${commonCols.map(c => `\`${c}\``).join(', ')} FROM \`${table}\``;
    const [rows] = await source.query(selectSql);

    if (rows.length === 0) {
      log(`[WARN] ${table}: 0 rows in source (skipping)`);
      return;
    }

    const placeholders = commonCols.map(() => '?').join(', ');
    const insertSql = `INSERT INTO \`${table}\` (${commonCols.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;

    if (shardIdFn === null) {
      // REPLICATE to all shards
      for (let i = 0; i < NUM_SHARDS; i++) {
        await shards[i].query('SET FOREIGN_KEY_CHECKS = 0');
        for (const row of rows) {
          try {
            const vals = commonCols.map(c => sanitizeValue(c, row[c]));
            await shards[i].query(insertSql, vals);
          } catch (e) {
            if (!e.message.includes('Duplicate')) throw e;
          }
        }
        await shards[i].query('SET FOREIGN_KEY_CHECKS = 1');
      }
      log(`[OK] ${table}: ${rows.length} rows -> all 3 shards (${label})`);
    } else {
      // SHARD by MemberID
      for (let i = 0; i < NUM_SHARDS; i++) {
        await shards[i].query('SET FOREIGN_KEY_CHECKS = 0');
      }
      const counts = [0, 0, 0];
      for (const row of rows) {
        const sid = shardIdFn(row);
        if (sid === null || sid === undefined || sid < 0 || sid >= NUM_SHARDS) continue;
        try {
          const vals = commonCols.map(c => sanitizeValue(c, row[c]));
          await shards[sid].query(insertSql, vals);
          counts[sid]++;
        } catch (e) {
          if (!e.message.includes('Duplicate')) throw e;
        }
      }
      for (let i = 0; i < NUM_SHARDS; i++) {
        await shards[i].query('SET FOREIGN_KEY_CHECKS = 1');
      }
      log(`[OK] ${table}: ${rows.length} rows -> S0=${counts[0]}, S1=${counts[1]}, S2=${counts[2]}`);
    }
  } catch (err) {
    log(`[FAIL] ${table}: ${err.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  Multi-Shard Data Migration (SQL_ed)                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  // ── Connect ─────────────────────────────────────────────────────────────
  section('Step 1: Connect to source database');
  const source = await mysql.createConnection(SOURCE);
  log(`[OK] Connected to source: ${SOURCE.host}:${SOURCE.port}/${SOURCE.database}`);

  section('Step 2: Connect to all 3 shard servers');
  const shards = [];
  for (let i = 0; i < NUM_SHARDS; i++) {
    const conn = await mysql.createConnection({
      host: SHARD_HOST, port: SHARD_PORTS[i],
      user: SHARD_USER, password: SHARD_PASS, database: SHARD_DB,
    });
    const [rows] = await conn.query('SELECT @@hostname AS h, @@port AS p');
    log(`[OK] Shard ${i} (port ${SHARD_PORTS[i]}): ${rows[0].h}:${rows[0].p}`);
    shards.push(conn);
  }

  // ── Tag shards ──────────────────────────────────────────────────────────
  section('Step 3: Tag each shard with shard_id');
  for (let i = 0; i < NUM_SHARDS; i++) {
    await shards[i].query('DELETE FROM ShardMetadata WHERE Key_ = ?', ['shard_id']);
    await shards[i].query('INSERT INTO ShardMetadata (Key_, Value_) VALUES (?, ?)', ['shard_id', String(i)]);
    log(`[OK] Shard ${i} tagged`);
  }

  // ── Clear all data ──────────────────────────────────────────────────────
  section('Step 4: Clear existing data from all shards');
  const allTables = [
    'BillPayment', 'PrescriptionItem', 'Prescription', 'MedicineDispense',
    'Visit', 'Appointment', 'EmergencyCase', 'Inventory', 'MedicalHistory',
    'DoctorSchedule', 'UserRoleMapping', 'UserLogin', 'SystemRole', 'SuperAdmin',
    'Member', 'Doctor', 'StaffEmployee', 'Medicine', 'MedicalSupplier',
  ];
  for (let i = 0; i < NUM_SHARDS; i++) {
    await shards[i].query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of allTables) {
      try { await shards[i].query(`DELETE FROM \`${t}\``); } catch {}
    }
    await shards[i].query('SET FOREIGN_KEY_CHECKS = 1');
    log(`[OK] Shard ${i}: cleared all tables`);
  }

  // ── Replicate reference tables ──────────────────────────────────────────
  section('Step 5: Replicate reference tables to all 3 shards');
  for (const t of ['Doctor', 'StaffEmployee', 'Medicine', 'MedicalSupplier',
                     'DoctorSchedule', 'Inventory', 'UserLogin', 'SystemRole',
                     'UserRoleMapping', 'SuperAdmin']) {
    await migrateTable(source, shards, t, null, 'replicated');
  }

  // ── Distribute sharded tables ───────────────────────────────────────────
  section('Step 6: Distribute sharded tables (by MemberID hash)');
  await migrateTable(source, shards, 'Member', r => getShardId(r.MemberID), 'sharded');
  await migrateTable(source, shards, 'MedicalHistory', r => getShardId(r.MemberID), 'sharded');
  await migrateTable(source, shards, 'Appointment', r => getShardId(r.MemberID), 'sharded');
  await migrateTable(source, shards, 'Visit', r => getShardId(r.MemberID), 'sharded');
  await migrateTable(source, shards, 'Prescription', r => getShardId(r.MemberID), 'sharded');

  // ── Distribute child tables (via parent join) ───────────────────────────
  section('Step 7: Distribute child tables (via parent MemberID)');

  // PrescriptionItem → get MemberID from Prescription
  try {
    const piShardCols = await getShardColumns(shards[0], 'PrescriptionItem');
    const piSelectCols = piShardCols.map(c => `pi.\`${c}\``).join(', ');
    const [piRows] = await source.query(
      `SELECT ${piSelectCols}, p.MemberID AS _MemberID
       FROM PrescriptionItem pi
       JOIN Prescription p ON pi.PrescriptionID = p.PrescriptionID`
    );
    const piInsertCols = piShardCols.map(c => `\`${c}\``).join(', ');
    const piPlaceholders = piShardCols.map(() => '?').join(', ');
    const piInsertSql = `INSERT INTO PrescriptionItem (${piInsertCols}) VALUES (${piPlaceholders})`;
    const piCounts = [0, 0, 0];
    for (let i = 0; i < NUM_SHARDS; i++) await shards[i].query('SET FOREIGN_KEY_CHECKS = 0');
    for (const row of piRows) {
      const sid = getShardId(row._MemberID);
      try {
        await shards[sid].query(piInsertSql, piShardCols.map(c => sanitizeValue(c, row[c])));
        piCounts[sid]++;
      } catch (e) { if (!e.message.includes('Duplicate')) throw e; }
    }
    for (let i = 0; i < NUM_SHARDS; i++) await shards[i].query('SET FOREIGN_KEY_CHECKS = 1');
    log(`[OK] PrescriptionItem: ${piRows.length} rows -> S0=${piCounts[0]}, S1=${piCounts[1]}, S2=${piCounts[2]}`);
  } catch (err) { log(`[FAIL] PrescriptionItem: ${err.message}`); }

  // BillPayment → get MemberID from Visit
  try {
    const bpShardCols = await getShardColumns(shards[0], 'BillPayment');
    const bpSelectCols = bpShardCols.map(c => `b.\`${c}\``).join(', ');
    const [bpRows] = await source.query(
      `SELECT ${bpSelectCols}, v.MemberID AS _MemberID
       FROM BillPayment b
       JOIN Visit v ON b.VisitID = v.VisitID`
    );
    const bpInsertCols = bpShardCols.map(c => `\`${c}\``).join(', ');
    const bpPlaceholders = bpShardCols.map(() => '?').join(', ');
    const bpInsertSql = `INSERT INTO BillPayment (${bpInsertCols}) VALUES (${bpPlaceholders})`;
    const bpCounts = [0, 0, 0];
    for (let i = 0; i < NUM_SHARDS; i++) await shards[i].query('SET FOREIGN_KEY_CHECKS = 0');
    for (const row of bpRows) {
      const sid = getShardId(row._MemberID);
      try {
        await shards[sid].query(bpInsertSql, bpShardCols.map(c => sanitizeValue(c, row[c])));
        bpCounts[sid]++;
      } catch (e) { if (!e.message.includes('Duplicate')) throw e; }
    }
    for (let i = 0; i < NUM_SHARDS; i++) await shards[i].query('SET FOREIGN_KEY_CHECKS = 1');
    log(`[OK] BillPayment: ${bpRows.length} rows -> S0=${bpCounts[0]}, S1=${bpCounts[1]}, S2=${bpCounts[2]}`);
  } catch (err) { log(`[FAIL] BillPayment: ${err.message}`); }

  // ── Verification ────────────────────────────────────────────────────────
  section('Step 8: Verify migration (row counts per shard)');
  console.log();
  console.log('  Table              | Source |  S0  |  S1  |  S2  | Total | Match');
  console.log('  ' + '-'.repeat(68));
  let allMatch = true;
  for (const table of ['Member', 'MedicalHistory', 'Appointment', 'Visit',
                         'Prescription', 'PrescriptionItem', 'BillPayment']) {
    const [srcRows] = await source.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
    const srcCount = srcRows[0].c;
    const counts = [];
    for (let i = 0; i < NUM_SHARDS; i++) {
      try {
        const [r] = await shards[i].query(`SELECT COUNT(*) AS c FROM \`${table}\``);
        counts.push(r[0].c);
      } catch { counts.push(0); }
    }
    const total = counts.reduce((a, b) => a + b, 0);
    const match = total === srcCount;
    if (!match) allMatch = false;
    console.log(
      `  ${table.padEnd(18)} | ${String(srcCount).padStart(6)} | ` +
      `${String(counts[0]).padStart(4)} | ${String(counts[1]).padStart(4)} | ${String(counts[2]).padStart(4)} | ` +
      `${String(total).padStart(5)} | ${match ? 'OK' : 'FAIL'}`
    );
  }
  console.log();
  console.log('  Replicated tables (identical on all 3 shards):');
  console.log('  ' + '-'.repeat(68));
  for (const table of ['Doctor', 'DoctorSchedule', 'StaffEmployee', 'Medicine', 'Inventory', 'UserLogin']) {
    try {
      const [srcRows] = await source.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
      const srcCount = srcRows[0].c;
      const counts = [];
      for (let i = 0; i < NUM_SHARDS; i++) {
        const [r] = await shards[i].query(`SELECT COUNT(*) AS c FROM \`${table}\``);
        counts.push(r[0].c);
      }
      const ok = counts.every(c => c === srcCount);
      if (!ok) allMatch = false;
      console.log(
        `  ${table.padEnd(18)} | ${String(srcCount).padStart(6)} | ` +
        `${String(counts[0]).padStart(4)} | ${String(counts[1]).padStart(4)} | ${String(counts[2]).padStart(4)} | ` +
        `      | ${ok ? 'OK' : 'FAIL'}`
      );
    } catch {}
  }

  console.log('\n' + '═'.repeat(70));
  console.log(allMatch
    ? '  MIGRATION COMPLETE - all data accounted for'
    : '  MIGRATION HAD MISMATCHES - review above');
  console.log('═'.repeat(70) + '\n');

  await source.end();
  for (const s of shards) await s.end();
}

main().catch(err => { console.error('\n[FATAL]', err.message); process.exit(1); });
