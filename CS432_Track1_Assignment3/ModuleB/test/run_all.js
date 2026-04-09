// ═══════════════════════════════════════════════════════════════════════════
// Module B — Master Test Runner
//
// Runs all test suites sequentially and produces a combined summary.
// Usage: node run_all.js
// ═══════════════════════════════════════════════════════════════════════════

const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

// Ensure results directory exists (needed by stress test)
const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

const TESTS = [
  { file: '01_race_condition_booking.js',   name: 'Race Condition — Appointment Booking' },
  { file: '02_race_condition_inventory.js',  name: 'Race Condition — Inventory Updates' },
  { file: '03_multirole_concurrent.js',      name: 'Multi-Role Concurrent Access' },
  { file: '04_atomicity_prescription.js',    name: 'Atomicity — Prescription Transaction' },
  { file: '05_stress_test.js',               name: 'Stress Test — High-Volume Load' },
  { file: '06_failure_simulation.js',        name: 'Failure Simulation & Rollback' },
  { file: '07_durability.js',                name: 'Durability — Persistence Verification' },
];

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║     Module B — High-Concurrency API Load Testing               ║');
console.log('║     & Failure Simulation                                       ║');
console.log('║                                                                ║');
console.log('║     Dispensary Management System                               ║');
console.log('║     CS 432 — Databases (Assignment 3)                          ║');
console.log('║                                                                ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log('');

const allResults = [];
let totalPassed = 0;
let totalFailed = 0;
let totalTests  = 0;

for (const test of TESTS) {
  const filePath = path.join(__dirname, 'tests', test.file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${test.file} — file not found\n`);
    continue;
  }

  try {
    console.log(`\n${'═'.repeat(66)}`);
    console.log(`  Running: ${test.name}`);
    console.log(`${'═'.repeat(66)}\n`);

    execSync(`node --no-warnings "${filePath}"`, {
      stdio: 'inherit',
      timeout: 120000, // 2 minute timeout per test
    });

  } catch (err) {
    console.log(`\n  ❌ Test suite "${test.name}" crashed: ${err.message}\n`);
    allResults.push({
      suite: test.name,
      total: 0, passed: 0, failed: 1,
      error: err.message,
    });
    totalFailed++;
    totalTests++;
  }
}

// ── Print combined summary ──────────────────────────────────────────────────
console.log('\n');
console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║                    COMBINED TEST SUMMARY                       ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log('║                                                                ║');
console.log(`║  Test Suites Run:  ${TESTS.length}                                           ║`);
console.log('║                                                                ║');
console.log('║  Tests cover:                                                  ║');
console.log('║    • Race condition testing (appointment & inventory)          ║');
console.log('║    • Multi-role concurrent isolation                           ║');
console.log('║    • Transaction atomicity (multi-step prescriptions)          ║');
console.log('║    • High-volume stress testing (500+ requests)                ║');
console.log('║    • Failure simulation & error handling                       ║');
console.log('║    • Data durability & persistence verification                ║');
console.log('║                                                                ║');
console.log('║  See individual test output above for detailed results.        ║');
console.log('║  Stress test metrics saved to results/stress_test_results.json ║');
console.log('║                                                                ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log('');
