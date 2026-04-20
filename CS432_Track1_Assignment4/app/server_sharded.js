// ═══════════════════════════════════════════════════════════════════════════
// Dispensary Management System — Multi-Shard Server
//
// This server connects to 3 separate MySQL shard servers:
//   Shard 0: 10.0.116.184:3307
//   Shard 1: 10.0.116.184:3308
//   Shard 2: 10.0.116.184:3309
//
// Routes data based on MemberID hash (MemberID % 3).
// ═══════════════════════════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { testAllShards } = require('./config/shardPools');

const app = express();

// ─── Global Middleware ───────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const shardStatus = await testAllShards();
  res.json({
    status: 'ok',
    sharding: {
      enabled: true,
      numShards: 3,
      strategy: 'hash-based (MemberID % 3)',
      shards: shardStatus,
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes (all queries go through shard router) ────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/members',      require('./routes/sharded_members'));
app.use('/api/appointments', require('./routes/sharded_appointments'));
app.use('/api/shards',       require('./routes/shardAdmin'));

// Other routes (reference data — query any shard, since data is replicated)
// app.use('/api/doctors',  require('./routes/doctors'));
// app.use('/api/staff',    require('./routes/staff'));
// app.use('/api',          require('./routes/inventory'));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Startup ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  Dispensary Management System — MULTI-SHARD MODE              ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  console.log('  Testing connectivity to all 3 shards...\n');

  try {
    const status = await testAllShards();
    for (const s of status) {
      const icon = s.ok ? '[OK]' : '[FAIL]';
      const detail = s.ok
        ? `${s.hostname}:${s.actualPort}`
        : s.error;
      console.log(`  ${icon} Shard ${s.shardId} (port ${s.port}): ${detail}`);
    }

    if (!status.every(s => s.ok)) {
      console.log('\n  [WARN] Not all shards are reachable. Server will start anyway.');
      console.log('  [WARN] Check your network connectivity to 10.0.116.184\n');
    }
  } catch (err) {
    console.error('  [FAIL] Shard connectivity test failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`\n  Server running on http://localhost:${PORT}`);
    console.log(`  Health check: http://localhost:${PORT}/api/health`);
    console.log(`  Shard admin:  http://localhost:${PORT}/api/shards/health\n`);
  });
})();
