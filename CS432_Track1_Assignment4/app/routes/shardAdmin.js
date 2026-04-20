// ═══════════════════════════════════════════════════════════════════════════
// Shard Admin API — Monitoring & Diagnostics for the 3 physical shards
//
// Endpoints:
//   GET /api/shards/health         — connectivity test for all 3 shards
//   GET /api/shards/stats          — row counts per table per shard
//   GET /api/shards/lookup/:id     — which shard holds a given MemberID
//   GET /api/shards/distribution   — distribution percentages
//   GET /api/shards/verify         — integrity check
// ═══════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const authModule = require('../middleware/auth');
const verifyToken = authModule.verifyToken || authModule.authenticate || authModule;
const shard = require('../config/shardRouter');
const { testAllShards } = require('../config/shardPools');

// ── GET /shards/health ──────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const status = await testAllShards();
    const allOk = status.every(s => s.ok);
    return res.json({
      ok: allOk,
      shards: status,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /shards/stats ───────────────────────────────────────────────────────
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const stats = await shard.getShardStats();
    return res.json({
      numShards: shard.NUM_SHARDS,
      shardKey: 'MemberID',
      strategy: 'hash-based (MemberID % 3)',
      shards: stats,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /shards/lookup/:memberID ────────────────────────────────────────────
router.get('/lookup/:memberID', verifyToken, async (req, res) => {
  try {
    const memberID = parseInt(req.params.memberID);
    const info = shard.getShardInfo(memberID);

    // Verify the member actually exists on the expected shard
    const rows = await shard.queryShard(
      memberID,
      'SELECT MemberID, Name, MemberType FROM Member WHERE MemberID = ?',
      [memberID]
    );

    return res.json({
      ...info,
      found: rows.length > 0,
      member: rows[0] || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /shards/distribution ────────────────────────────────────────────────
router.get('/distribution', verifyToken, async (req, res) => {
  try {
    // Get member counts per shard
    const labeled = await shard.queryAllShardsLabeled(
      'SELECT COUNT(*) AS cnt FROM Member'
    );

    const distribution = labeled.map(({ shardId, port, rows }) => ({
      shardId,
      port,
      memberCount: rows[0].cnt,
    }));

    const total = distribution.reduce((s, d) => s + d.memberCount, 0);
    distribution.forEach(d => {
      d.percentage = total > 0 ? ((d.memberCount / total) * 100).toFixed(1) + '%' : '0%';
    });

    const counts = distribution.map(d => d.memberCount);
    const avg = total / shard.NUM_SHARDS || 1;
    const skew = total > 0 ? ((Math.max(...counts) - Math.min(...counts)) / avg * 100).toFixed(1) : '0';

    return res.json({
      total,
      shardKey: 'MemberID',
      strategy: 'hash-based (MemberID % 3)',
      distribution,
      skew: skew + '%',
      skewAssessment: parseFloat(skew) < 15 ? 'Balanced' : 'Skewed',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /shards/verify ──────────────────────────────────────────────────────
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const results = [];

    for (const table of shard.SHARDED_TABLES) {
      const labeled = await shard.queryAllShardsLabeled(
        `SELECT COUNT(*) AS cnt FROM ${table}`
      );
      const counts = labeled.map(l => l.rows[0].cnt);
      const total = counts.reduce((a, b) => a + b, 0);

      results.push({
        table,
        shards: counts,
        total,
      });
    }

    return res.json({
      message: 'Per-shard row counts (total = sum across all 3 shards)',
      tables: results,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
