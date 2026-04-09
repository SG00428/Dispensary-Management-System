// ═══════════════════════════════════════════════════════════════════════════
// Test 5 — Stress Test: High-Volume Load Testing
//
// WHAT: Fires 500+ requests across multiple endpoints to measure throughput,
//       latency percentiles (p50, p95, p99), and error rate under heavy load.
// WHY:  Validates durability and consistency — the system must remain correct
//       and responsive even under sustained high traffic.
// ═══════════════════════════════════════════════════════════════════════════

const { request, login, TestResults } = require('./config');

const TOTAL_REQUESTS    = 500;
const CONCURRENCY_LEVEL = 50;  // How many requests in-flight at once

async function run() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Test 5 — Stress Test: 500 Requests Under High Load       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const R = new TestResults('Stress Test — High-Volume Load');

  const token = await login('admin');

  // Define the workload — a mix of read and write endpoints
  const endpoints = [
    { method: 'GET',  path: '/members',      weight: 25 },
    { method: 'GET',  path: '/doctors',       weight: 20 },
    { method: 'GET',  path: '/appointments',  weight: 20 },
    { method: 'GET',  path: '/prescriptions', weight: 15 },
    { method: 'GET',  path: '/inventory',     weight: 10 },
    { method: 'GET',  path: '/auth/me',       weight: 10 },
  ];

  // Build the full request queue based on weights
  const queue = [];
  for (const ep of endpoints) {
    const count = Math.round((ep.weight / 100) * TOTAL_REQUESTS);
    for (let i = 0; i < count; i++) {
      queue.push(ep);
    }
  }
  // Shuffle
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }

  console.log(`  Workload: ${queue.length} requests (${CONCURRENCY_LEVEL} concurrent)\n`);
  console.log(`  Endpoint mix:`);
  for (const ep of endpoints) {
    const count = queue.filter(q => q.path === ep.path).length;
    console.log(`    ${ep.method} ${ep.path.padEnd(20)} × ${count}`);
  }
  console.log('');

  // ── Execute with concurrency limiter ──────────────────────────────────────
  const latencies = [];
  const errors    = [];
  let completed   = 0;
  let idx         = 0;

  const globalStart = performance.now();

  async function worker() {
    while (idx < queue.length) {
      const myIdx = idx++;
      const ep    = queue[myIdx];
      try {
        const res = await request(ep.method, ep.path, null, token);
        latencies.push(res.elapsed);
        if (!res.ok) errors.push({ endpoint: ep.path, status: res.status });
      } catch (err) {
        errors.push({ endpoint: ep.path, error: err.message });
        latencies.push(0);
      }
      completed++;
      if (completed % 100 === 0) {
        process.stdout.write(`  Progress: ${completed}/${queue.length} requests completed\r`);
      }
    }
  }

  // Launch workers
  const workers = [];
  for (let w = 0; w < CONCURRENCY_LEVEL; w++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  const globalElapsed = performance.now() - globalStart;
  console.log(`\n  Completed ${completed} requests in ${(globalElapsed / 1000).toFixed(2)}s\n`);

  // ── Statistics ────────────────────────────────────────────────────────────
  latencies.sort((a, b) => a - b);
  const validLatencies = latencies.filter(l => l > 0);

  const avg = validLatencies.reduce((s, l) => s + l, 0) / validLatencies.length;
  const p50 = validLatencies[Math.floor(validLatencies.length * 0.50)];
  const p90 = validLatencies[Math.floor(validLatencies.length * 0.90)];
  const p95 = validLatencies[Math.floor(validLatencies.length * 0.95)];
  const p99 = validLatencies[Math.floor(validLatencies.length * 0.99)];
  const max = validLatencies[validLatencies.length - 1];
  const min = validLatencies[0];

  const rps = (completed / (globalElapsed / 1000)).toFixed(1);
  const errorRate = ((errors.length / completed) * 100).toFixed(2);

  console.log('  ┌──────────────────────────────────────────────┐');
  console.log(`  │  Throughput:   ${rps.padStart(8)} req/s               │`);
  console.log(`  │  Total Time:  ${(globalElapsed / 1000).toFixed(2).padStart(8)}s                  │`);
  console.log(`  │  Error Rate:  ${errorRate.padStart(8)}%                 │`);
  console.log('  ├──────────────────────────────────────────────┤');
  console.log(`  │  Avg Latency: ${avg.toFixed(1).padStart(8)}ms                │`);
  console.log(`  │  Min:         ${min.toFixed(1).padStart(8)}ms                │`);
  console.log(`  │  P50:         ${p50.toFixed(1).padStart(8)}ms                │`);
  console.log(`  │  P90:         ${p90.toFixed(1).padStart(8)}ms                │`);
  console.log(`  │  P95:         ${p95.toFixed(1).padStart(8)}ms                │`);
  console.log(`  │  P99:         ${p99.toFixed(1).padStart(8)}ms                │`);
  console.log(`  │  Max:         ${max.toFixed(1).padStart(8)}ms                │`);
  console.log('  └──────────────────────────────────────────────┘\n');

  // ── Assertions ────────────────────────────────────────────────────────────
  R.add(
    `All ${completed} requests completed`,
    completed === queue.length,
    `${completed}/${queue.length}`,
    globalElapsed
  );

  R.add(
    'Error rate under 5%',
    errors.length / completed < 0.05,
    `${errors.length} errors (${errorRate}%)`,
  );

  R.add(
    'P95 latency under 2000ms',
    p95 < 2000,
    `P95 = ${p95.toFixed(1)}ms`,
  );

  R.add(
    'P99 latency under 5000ms',
    p99 < 5000,
    `P99 = ${p99.toFixed(1)}ms`,
  );

  R.add(
    `Throughput above 10 req/s`,
    parseFloat(rps) > 10,
    `${rps} req/s`,
  );

  // ── Per-endpoint error breakdown ──────────────────────────────────────────
  if (errors.length > 0) {
    console.log('  Error breakdown:');
    const byEndpoint = {};
    for (const e of errors) {
      byEndpoint[e.endpoint] = (byEndpoint[e.endpoint] || 0) + 1;
    }
    for (const [ep, count] of Object.entries(byEndpoint)) {
      console.log(`    ${ep}: ${count} errors`);
    }
    console.log('');
  }

  // ── Post-stress data integrity check ──────────────────────────────────────
  console.log('  Post-stress integrity check...\n');

  const memberCheck = await request('GET', '/members', null, token);
  const doctorCheck = await request('GET', '/doctors', null, token);
  const apptCheck   = await request('GET', '/appointments', null, token);

  R.add(
    'Members endpoint still responds correctly after stress',
    memberCheck.ok && (memberCheck.data?.count > 0 || memberCheck.data?.data?.length > 0),
    `count = ${memberCheck.data?.count || memberCheck.data?.data?.length}`,
    memberCheck.elapsed
  );

  R.add(
    'Doctors endpoint still responds correctly after stress',
    doctorCheck.ok,
    `count = ${doctorCheck.data?.data?.length}`,
    doctorCheck.elapsed
  );

  R.add(
    'Appointments endpoint still responds correctly after stress',
    apptCheck.ok,
    `count = ${apptCheck.data?.count || apptCheck.data?.data?.length}`,
    apptCheck.elapsed
  );

  // ── Save raw results to JSON ──────────────────────────────────────────────
  const reportData = {
    totalRequests: completed,
    concurrency: CONCURRENCY_LEVEL,
    totalTimeMs: globalElapsed,
    throughputRPS: parseFloat(rps),
    errorRate: parseFloat(errorRate),
    latency: { avg, min, p50, p90, p95, p99, max },
    errors: errors.length,
    errorsByEndpoint: {},
  };
  for (const e of errors) {
    reportData.errorsByEndpoint[e.endpoint] = (reportData.errorsByEndpoint[e.endpoint] || 0) + 1;
  }

  const fs   = require('fs');
  const path = require('path');
  const resultsDir = path.join(__dirname, '..', 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(resultsDir, 'stress_test_results.json'),
    JSON.stringify(reportData, null, 2)
  );
  console.log('  Results saved to results/stress_test_results.json\n');

  return R.summary();
}

run().catch(err => { console.error('FATAL:', err); process.exit(1); });
