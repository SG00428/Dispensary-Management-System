// ═══════════════════════════════════════════════════════════════════════════
// Multi-Shard Database Connection Pools
//
// This module creates 3 separate MySQL connection pools, one per shard.
// Each shard is a physically distinct MySQL server on a different port:
//
//   Shard 0 → 10.0.116.184:3307
//   Shard 1 → 10.0.116.184:3308
//   Shard 2 → 10.0.116.184:3309
//
// All 3 shards have:
//   - Same database name: SQL_ed
//   - Same username:      SQL_ed
//   - Same password:      password@123
//   - Same schema (created identically on each)
// ═══════════════════════════════════════════════════════════════════════════

const mysql = require('mysql2/promise');

const SHARD_HOST = process.env.SHARD_HOST || '10.0.116.184';
const SHARD_USER = process.env.SHARD_USER || 'SQL_ed';
const SHARD_PASS = process.env.SHARD_PASS || 'password@123';
const SHARD_DB   = process.env.SHARD_DB   || 'SQL_ed';

// ── Shard Configuration ────────────────────────────────────────────────────
const SHARD_CONFIG = [
  { id: 0, host: SHARD_HOST, port: 3307, label: 'Shard 0 (port 3307)' },
  { id: 1, host: SHARD_HOST, port: 3308, label: 'Shard 1 (port 3308)' },
  { id: 2, host: SHARD_HOST, port: 3309, label: 'Shard 2 (port 3309)' },
];

const NUM_SHARDS = SHARD_CONFIG.length;

// ── Create one connection pool per shard ───────────────────────────────────
const shardPools = SHARD_CONFIG.map(cfg => ({
  id: cfg.id,
  label: cfg.label,
  port: cfg.port,
  pool: mysql.createPool({
    host:            cfg.host,
    port:            cfg.port,
    user:            SHARD_USER,
    password:        SHARD_PASS,
    database:        SHARD_DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit:      0,
    multipleStatements: false,
  }),
}));

/**
 * Get the connection pool for a specific shard ID.
 * @param {number} shardId — 0, 1, or 2
 * @returns {Pool}
 */
function getPool(shardId) {
  if (shardId < 0 || shardId >= NUM_SHARDS) {
    throw new Error(`Invalid shard ID: ${shardId}. Must be 0–${NUM_SHARDS - 1}.`);
  }
  return shardPools[shardId].pool;
}

/**
 * Get all shard pools (used for fan-out queries).
 * @returns {Array}
 */
function getAllPools() {
  return shardPools;
}

/**
 * Test connectivity to all shards. Returns a status object.
 * @returns {Promise<Array>}
 */
async function testAllShards() {
  const results = [];
  for (const s of shardPools) {
    try {
      const [rows] = await s.pool.query('SELECT @@hostname AS host, @@port AS port');
      results.push({
        shardId: s.id,
        label:   s.label,
        port:    s.port,
        ok:      true,
        hostname: rows[0].host,
        actualPort: rows[0].port,
      });
    } catch (err) {
      results.push({
        shardId: s.id,
        label:   s.label,
        port:    s.port,
        ok:      false,
        error:   err.message,
      });
    }
  }
  return results;
}

/**
 * Close all shard connection pools (used for graceful shutdown).
 */
async function closeAllPools() {
  for (const s of shardPools) {
    await s.pool.end();
  }
}

module.exports = {
  NUM_SHARDS,
  SHARD_CONFIG,
  getPool,
  getAllPools,
  testAllShards,
  closeAllPools,
};
