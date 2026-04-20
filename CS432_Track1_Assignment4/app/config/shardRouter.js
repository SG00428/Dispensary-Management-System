// ═══════════════════════════════════════════════════════════════════════════
// Shard Router — Routes Queries to the Correct Physical Shard Server
//
// Shard Key:    MemberID
// Strategy:     Hash-based (MemberID % NUM_SHARDS)
// Shards:       3 separate MySQL servers on ports 3307, 3308, 3309
//
// This module routes each query to the appropriate physical shard by
// selecting the right connection pool. Table names stay the same on every
// shard — what changes is WHICH SERVER we connect to.
// ═══════════════════════════════════════════════════════════════════════════

const { NUM_SHARDS, getPool, getAllPools } = require('./shardPools');

// ── Tables that are sharded by MemberID ─────────────────────────────────────
const SHARDED_TABLES = [
  'Member', 'Appointment', 'Visit', 'Prescription',
  'PrescriptionItem', 'MedicalHistory', 'BillPayment',
];

// ── Tables that are replicated across all shards ────────────────────────────
// These are reference data (low-volume, read-mostly) that every shard needs.
const REPLICATED_TABLES = [
  'Doctor', 'DoctorSchedule', 'StaffEmployee', 'Medicine',
  'Inventory', 'MedicalSupplier', 'UserLogin', 'SystemRole',
  'UserRoleMapping', 'SuperAdmin',
];


// ═══════════════════════════════════════════════════════════════════════════
//  Core Routing Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the shard ID for a given MemberID using hash-based partitioning.
 * @param {number} memberID
 * @returns {number} 0, 1, or 2
 */
function getShardId(memberID) {
  return memberID % NUM_SHARDS;
}

/**
 * Get the connection pool for the shard that holds a given MemberID.
 * @param {number} memberID
 * @returns {Pool}
 */
function getShardPool(memberID) {
  return getPool(getShardId(memberID));
}

/**
 * Check whether a table is sharded.
 * @param {string} tableName
 * @returns {boolean}
 */
function isSharded(tableName) {
  return SHARDED_TABLES.includes(tableName);
}


// ═══════════════════════════════════════════════════════════════════════════
//  Query Execution Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute a query on a specific shard (by MemberID).
 * Used for single-member lookups, inserts, updates, deletes.
 *
 * @param {number} memberID  — determines which shard
 * @param {string} sql       — SQL query (no placeholders needed; table names are uniform)
 * @param {Array}  params    — query parameters
 * @returns {Promise<Array>} — query result rows
 */
async function queryShard(memberID, sql, params = []) {
  const pool = getShardPool(memberID);
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Execute a query on a specific shard by shard ID directly.
 *
 * @param {number} shardId — 0, 1, or 2
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<Array>}
 */
async function queryShardById(shardId, sql, params = []) {
  const pool = getPool(shardId);
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Execute a query on ALL shards in PARALLEL and merge the results.
 * Used for range queries, admin-level full-table reads, doctor-view
 * appointment lists, and other cross-shard operations.
 *
 * @param {string} sql    — SQL to execute on every shard
 * @param {Array}  params — query parameters (applied to each shard)
 * @returns {Promise<Array>} — flattened results from all shards
 */
async function queryAllShards(sql, params = []) {
  const pools = getAllPools();
  // Fire all queries in parallel
  const promises = pools.map(s => s.pool.query(sql, params));
  const results = await Promise.all(promises);
  // Flatten and merge
  const merged = [];
  for (const [rows] of results) {
    merged.push(...rows);
  }
  return merged;
}

/**
 * Execute a query on all shards but return per-shard results separately.
 * Useful for diagnostics, integrity checks, distribution reports.
 *
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<Array<{shardId, rows}>>}
 */
async function queryAllShardsLabeled(sql, params = []) {
  const pools = getAllPools();
  const promises = pools.map(async s => {
    const [rows] = await s.pool.query(sql, params);
    return { shardId: s.id, port: s.port, rows };
  });
  return await Promise.all(promises);
}

/**
 * Insert a record into the correct shard table.
 *
 * @param {number} memberID — determines which shard
 * @param {string} sql      — INSERT statement
 * @param {Array}  params
 * @returns {Promise<object>} — insert result with insertId
 */
async function insertIntoShard(memberID, sql, params = []) {
  const pool = getShardPool(memberID);
  const [result] = await pool.query(sql, params);
  return result;
}

/**
 * Update a record in the correct shard.
 *
 * @param {number} memberID
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<object>}
 */
async function updateInShard(memberID, sql, params = []) {
  const pool = getShardPool(memberID);
  const [result] = await pool.query(sql, params);
  return result;
}

/**
 * Delete a record from the correct shard.
 *
 * @param {number} memberID
 * @param {string} sql
 * @param {Array}  params
 * @returns {Promise<object>}
 */
async function deleteFromShard(memberID, sql, params = []) {
  const pool = getShardPool(memberID);
  const [result] = await pool.query(sql, params);
  return result;
}


// ═══════════════════════════════════════════════════════════════════════════
//  Shard Info & Stats
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get distribution statistics across all shards.
 * @returns {Promise<Array>}
 */
async function getShardStats() {
  const stats = [];
  const pools = getAllPools();
  for (const s of pools) {
    const counts = {};
    for (const table of SHARDED_TABLES) {
      try {
        const [rows] = await s.pool.query(`SELECT COUNT(*) AS cnt FROM ${table}`);
        counts[table] = rows[0].cnt;
      } catch {
        counts[table] = 'N/A';
      }
    }
    stats.push({ shardId: s.id, port: s.port, counts });
  }
  return stats;
}

/**
 * Get the shard info (metadata) for a specific MemberID.
 * @param {number} memberID
 * @returns {object}
 */
function getShardInfo(memberID) {
  const shardId = getShardId(memberID);
  const pools = getAllPools();
  return {
    memberID,
    shardId,
    port: pools[shardId].port,
    label: pools[shardId].label,
  };
}


module.exports = {
  NUM_SHARDS,
  SHARDED_TABLES,
  REPLICATED_TABLES,
  getShardId,
  getShardPool,
  isSharded,
  queryShard,
  queryShardById,
  queryAllShards,
  queryAllShardsLabeled,
  insertIntoShard,
  updateInShard,
  deleteFromShard,
  getShardStats,
  getShardInfo,
};
