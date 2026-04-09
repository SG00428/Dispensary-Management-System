# Module B — High-Concurrency API Load Testing & Failure Simulation

## CS 432 Databases · Assignment 3 · Track 1

Concurrency and stress testing suite for the Dispensary Management System. Seven test scripts
comprising **65 individual test cases** validate all four ACID properties at the application
layer.

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Test Suite Architecture](#test-suite-architecture)
- [Individual Tests Explained](#individual-tests-explained)
- [Understanding the Output](#understanding-the-output)
- [Results Interpretation](#results-interpretation)
- [Troubleshooting](#troubleshooting)
- [Extending the Suite](#extending-the-suite)
- [File Structure](#file-structure)

---

## Overview

This test suite validates the Dispensary Management System's behavior under concurrent
multi-user workloads and failure conditions. Each test targets one or more ACID properties:

| Property    | What It Guarantees                                    | Validated By |
|-------------|-------------------------------------------------------|--------------|
| **Atomicity**   | Operations complete fully or rollback entirely    | Test 4, 6    |
| **Consistency** | Data remains valid; constraints enforced          | Test 3, 6    |
| **Isolation**   | Concurrent ops don't interfere with each other    | Test 1, 2, 3 |
| **Durability**  | Committed data persists across reads & load       | Test 5, 7    |

The suite uses **native Node.js 18+ `fetch`** and **`Promise.all()`** for concurrency — no
external testing frameworks. Each script is self-contained, produces structured pass/fail
output, and measures per-request latency.

---

## Quick Start

```bash
# 1. Start the API server
cd app && node server.js

# 2. Set passwords for all test users (run once)
node tests/00_setup.js

# 3. Run all 7 test suites
node run_all.js
```

Expected outcome: **65/65 checks pass** in under 7 seconds.

---

## Prerequisites

### Software Requirements

| Tool    | Version | How to Check                 |
|---------|---------|------------------------------|
| Node.js | 18.0+   | `node --version`             |
| MySQL   | 8.0+    | `mysql --version`            |
| npm     | 8.0+    | `npm --version`              |

Node.js 18+ is required because the suite uses the **native `fetch` API** (available without
imports from Node 18 onwards).

### Database Setup

The tests assume the full database is loaded:

```bash
# Load schema, base data, auth system
mysql -u root -p < sql/DispensaryManagement.sql
mysql -u root -p DispensaryManagement < sql/Dispensary_Management_Insert.sql
mysql -u root -p DispensaryManagement < sql/auth_system.sql

# Load large seed dataset (required for stress test)
mysql -u root -p DispensaryManagement < sql/seed_data.sql
mysql -u root -p DispensaryManagement < sql/doctor_schedule_migration.sql
```

### Server Requirements

- The Express API server must be running on `http://localhost:3000` (or set `BASE_URL` env var).
- Server must be accessible, healthy (`GET /api/health` returns 200), and connected to MySQL.

---

## Installation

No installation required. All test scripts use only Node.js built-ins:

```bash
# Clone the repo (if not already done)
git clone https://github.com/Shreyas-Dharmatti/dispensary-management.git
cd dispensary-management

# Navigate to module B
cd module_b

# That's it — no npm install needed for the tests
```

---

## Running Tests

### Option 1: Run All Tests (Recommended)

```bash
node run_all.js
```

Runs all 7 test scripts sequentially, prints combined summary, saves metrics to
`results/stress_test_results.json`.

### Option 2: Run Individual Tests

```bash
# Race condition on appointment slot
node tests/01_race_condition_booking.js

# Race condition on inventory quantity
node tests/02_race_condition_inventory.js

# Multi-role concurrent isolation
node tests/03_multirole_concurrent.js

# Transaction atomicity (prescription flow)
node tests/04_atomicity_prescription.js

# 500-request stress test
node tests/05_stress_test.js

# Failure simulation and rollback
node tests/06_failure_simulation.js

# Durability and persistence
node tests/07_durability.js
```

### Option 3: Override Base URL

```bash
BASE_URL=http://192.168.1.100:3000/api node run_all.js
```

### Setup Script (One-Time)

Before the first test run, provision passwords for all 8 test user accounts:

```bash
node tests/00_setup.js
```

This sets passwords for: SuperAdmin, Admin, Doctor, Faculty, Nurse, Pharmacist, Technician,
Student. The credentials are hardcoded in `tests/config.js` for reproducibility.

---

## Test Suite Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     run_all.js                           │
│  (master runner — executes each test script via execSync)│
└────────────────────┬─────────────────────────────────────┘
                     │
      ┌──────────────┼──────────────┬──────────────┐
      │              │              │              │
      ▼              ▼              ▼              ▼
 ┌────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
 │Test 1-3│   │ Test 4   │   │ Test 5   │   │ Test 6-7 │
 │Isolation│   │Atomicity │   │Durability│   │Consist./ │
 │         │   │          │   │  +Perf.  │   │Durability│
 └────┬────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
      │             │              │              │
      └─────────────┴──────────────┴──────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │   config.js  │
                   │              │
                   │ • request()  │  ← native fetch wrapper
                   │ • login()    │  ← JWT acquisition
                   │ • USERS      │  ← 8 test accounts
                   │ • TestResults│  ← pass/fail tracking
                   └──────┬───────┘
                          │ HTTP
                          ▼
                   ┌──────────────┐
                   │  Express API │
                   │ (localhost:  │
                   │    3000)     │
                   └──────┬───────┘
                          │ SQL
                          ▼
                   ┌──────────────┐
                   │   MySQL 8.0  │
                   │   (InnoDB)   │
                   └──────────────┘
```

### Concurrency Model

Tests achieve concurrency using Node.js's non-blocking I/O:

```js
// Fire N requests in parallel, wait for all to resolve
const promises = [];
for (let i = 0; i < 10; i++) {
  promises.push(request('POST', '/appointments', body, token));
}
const results = await Promise.all(promises);
```

Even though Node.js is single-threaded, all 10 HTTP requests are dispatched to the OS TCP
stack simultaneously. The Express server and MySQL connection pool then process them in
parallel, exercising real concurrency behavior.

---

## Individual Tests Explained

### Test 1: Race Condition — Appointment Booking

**File:** `tests/01_race_condition_booking.js`

**Scenario:** 10 concurrent users attempt to book the same doctor, date, and time slot.

**What it validates:**
- Server correctly serializes concurrent writes
- Exactly one booking succeeds (with proper slot-locking)
- Failed bookings return clear "slot already booked" errors
- No duplicate AppointmentIDs
- Database count matches accepted bookings

**ACID Property:** Isolation

**Key Implementation Detail:** Uses randomized future dates and times per run to avoid
collisions with leftover data from previous test runs.

---

### Test 2: Race Condition — Inventory Updates

**File:** `tests/02_race_condition_inventory.js`

**Scenario:** 15 concurrent PUT requests update the quantity of the same inventory batch.
Requests alternate between Admin and Pharmacist tokens.

**What it validates:**
- All updates processed without server crashes
- Final quantity is always a valid value (last-write-wins, never corrupted)
- Status field remains consistent
- Batch metadata (medicine name, location) not corrupted
- Sequential write-then-read returns correct value

**ACID Property:** Isolation

---

### Test 3: Multi-Role Concurrent Access

**File:** `tests/03_multirole_concurrent.js`

**Scenario:** All 8 user roles log in concurrently, then fire 12 parallel requests across
different endpoints. Each role accesses endpoints matching their permission level.

**What it validates:**
- SuperAdmin sees all 260 members; Student sees only own record (count=1)
- Technician blocked from `/inventory` with HTTP 403
- Student blocked from `/staff` with HTTP 403
- Doctor sees fewer appointments than Admin (own-patient filtering)
- Zero 500 server errors under concurrent load
- Cross-role write isolation (Student can't book for others)

**ACID Property:** Isolation

---

### Test 4: Atomicity — Prescription Transaction

**File:** `tests/04_atomicity_prescription.js`

**Scenario:** Validates the 3-step prescription workflow behaves atomically:
1. Create Visit → 2. Create Prescription → 3. Mark Appointment Completed

Three phases:
- **Happy path:** All 3 steps succeed, appointment becomes Completed.
- **Failure path:** Step 2 fails (invalid VisitID=999999), appointment stays Scheduled.
- **Concurrent path:** Two parallel prescriptions for same visit — both handled safely.

**What it validates:**
- Successful transaction updates all three tables
- Failed step 2 prevents step 3 from executing
- Appointment status doesn't advance without successful prescription
- Concurrent prescriptions don't crash the server

**ACID Property:** Atomicity

---

### Test 5: Stress Test — High-Volume Load

**File:** `tests/05_stress_test.js`

**Scenario:** Fires 500 HTTP requests with 50-way concurrency. Workload mix:
- 25% GET /members (125 requests)
- 20% GET /doctors (100)
- 20% GET /appointments (100)
- 15% GET /prescriptions (75)
- 10% GET /inventory (50)
- 10% GET /auth/me (50)

**What it measures:**
- Throughput (requests/second)
- Latency percentiles: P50, P90, P95, P99
- Error rate
- Post-stress data integrity

**Target thresholds:**
- Throughput > 10 req/s ✓
- Error rate < 5% ✓
- P95 latency < 2000ms ✓
- P99 latency < 5000ms ✓

**Output:** Metrics saved to `results/stress_test_results.json`

**ACID Property:** Durability (data remains correct under sustained load)

---

### Test 6: Failure Simulation & Rollback

**File:** `tests/06_failure_simulation.js`

**Scenario:** 8 categories of deliberate failure injection:

1. **Invalid FK references** (DoctorID=99999, MemberID=99999)
2. **Missing required fields** (booking without date, member without name)
3. **Invalid data types** (Age = "not-a-number")
4. **Authentication failures** (missing token, invalid JWT)
5. **Privilege escalation** (Student trying admin operations)
6. **Nonexistent records** (PUT/DELETE on ID 999999)
7. **Idempotency** (20 rapid identical requests)
8. **Garbage data check** (no leftover records from failed ops)

**What it validates:**
- Every failure returns appropriate HTTP error code (400/401/403/404/500)
- Server never crashes
- No partial/garbage data left in database

**ACID Property:** Consistency

---

### Test 7: Durability — Persistence Verification

**File:** `tests/07_durability.js`

**Scenario:** Full CRUD lifecycle cycles for Members, Inventory, and Appointments:
- Create record with known values
- Immediate read-after-write comparison (field-by-field)
- Partial update
- Re-read to confirm updates persisted AND non-updated fields unchanged
- 10 sequential reads to verify consistency

**What it validates:**
- Written data matches read data exactly
- Updates affect only specified fields
- Status transitions persist correctly
- 10 sequential reads return byte-identical data

**ACID Property:** Durability

---

## Understanding the Output

Each test produces structured console output:

```
╔══════════════════════════════════════════════════════════════╗
║  Test 1 — Race Condition: Concurrent Appointment Booking   ║
╚══════════════════════════════════════════════════════════════╝

  Test date: 2031-06-26 (randomized per run)
  Firing 10 concurrent booking requests for 2031-06-26 13:00:00...

  Results: 1 succeeded, 9 rejected

    Member 1: BOOKED     -- AppointmentID 560 (26ms)
    Member 2: REJECTED   -- This slot is already booked ... (26ms)
    ...

  At least one booking succeeded — 1 bookings accepted - SUCCESSFUL
  Exactly one booking for contested slot - SUCCESSFUL
  Database appointment count matches accepted bookings — DB has 1, expected 1 - SUCCESSFUL
  No duplicate appointment IDs — 1 appointments, 1 unique IDs - SUCCESSFUL

━━━ Race Condition — Appointment Booking: 4/4 passed, 0 failed (0.39s) ━━━
```

### Final Summary

After `run_all.js` finishes, you'll see a combined summary box showing all 7 suites
executed and a reminder that stress test metrics are saved to
`results/stress_test_results.json`.

---

## Results Interpretation

### Expected Results (All Passing)

| # | Test Suite                       | Checks | Typical Time |
|---|----------------------------------|--------|--------------|
| 1 | Race Condition — Booking         | 4/4    | ~0.4s        |
| 2 | Race Condition — Inventory       | 6/6    | ~0.6s        |
| 3 | Multi-Role Concurrent Access     | 9/9    | ~2.2s        |
| 4 | Atomicity — Prescription Tx      | 9/9    | ~0.7s        |
| 5 | Stress Test — High-Volume Load   | 8/8    | ~1.1s        |
| 6 | Failure Simulation & Rollback    | 15/15  | ~0.9s        |
| 7 | Durability — Persistence         | 14/14  | ~0.7s        |
|   | **TOTAL**                        | **65/65** | **~6.6s** |

### Stress Test Results Format

`results/stress_test_results.json`:

```json
{
  "totalRequests": 500,
  "concurrency": 50,
  "totalTimeMs": 755.62,
  "throughputRPS": 661.7,
  "errorRate": 0,
  "latency": {
    "avg": 71.73,
    "min": 15.45,
    "p50": 76.71,
    "p90": 87.29,
    "p95": 94.02,
    "p99": 98.00,
    "max": 103.53
  },
  "errors": 0,
  "errorsByEndpoint": {}
}
```

---

## Troubleshooting

### "ECONNREFUSED" on login

**Cause:** Server isn't running.
**Fix:** Start the server with `cd app && node server.js`.

### "Login failed" errors

**Cause:** Passwords haven't been set for the test users.
**Fix:** Run `node tests/00_setup.js` first.

### "Slot already booked" even on first run

**Cause:** Leftover test data from previous runs.
**Fix:** Tests use randomized dates/times, so this should be rare. If it happens, clear
test data manually:
```sql
DELETE FROM Appointment WHERE Symptoms LIKE '%test%' OR Symptoms LIKE '%Atomicity%';
```

### "ID=undefined" in test output

**Cause:** API response structure doesn't match expected key.
**Fix:** Check server logs. Response body is printed when extraction fails — verify the
correct key name and update the `extractID` fallbacks in the test.

### Stress test latencies are high (>500ms)

**Cause:** Database connection pool too small, or system under other load.
**Fix:** Check `app/config/db.js` pool settings. Increase `connectionLimit` to 20+ for
better concurrency.

### "Cannot find module 'results/...'" error

**Cause:** Results directory doesn't exist.
**Fix:** Tests create it automatically. If missing, run `mkdir results` manually.

---

## Extending the Suite

### Adding a New Test

1. Create `tests/08_your_test.js`:
```js
const { request, login, TestResults } = require('./config');

async function run() {
  console.log('Test 8 — Your Test Name');
  const R = new TestResults('Your Test');
  const token = await login('admin');

  // Your test logic here
  const res = await request('GET', '/endpoint', null, token);
  R.add('Description', res.ok, `status=${res.status}`, res.elapsed);

  return R.summary();
}

run().catch(err => { console.error('FATAL:', err); process.exit(1); });
```

2. Add it to `run_all.js`:
```js
const TESTS = [
  // ... existing tests ...
  { file: '08_your_test.js', name: 'Your Test Name' },
];
```

### Adding a New Test User

Edit `tests/config.js`:
```js
const USERS = {
  // ... existing users ...
  yourRole: { userLoginID: 99, username: 'YOUR_USER', password: 'Your@1234' },
};
```

Also update `tests/00_setup.js` to set the password for that user.

---

## File Structure

```
module_b/
├── README.md                             ← This file
├── run_all.js                            ← Master test runner
├── tests/
│   ├── config.js                         ← Shared HTTP helpers & credentials
│   ├── 00_setup.js                       ← One-time password provisioning
│   ├── 01_race_condition_booking.js      ← Concurrent booking test
│   ├── 02_race_condition_inventory.js    ← Concurrent inventory updates
│   ├── 03_multirole_concurrent.js        ← Multi-role isolation
│   ├── 04_atomicity_prescription.js      ← Transaction atomicity
│   ├── 05_stress_test.js                 ← High-volume load test
│   ├── 06_failure_simulation.js          ← Failure injection
│   └── 07_durability.js                  ← Persistence verification
└── results/
    ├── stress_test_results.json          ← Latency metrics (generated)
```

---

## ACID Validation Summary

| Property    | Mechanism                                          | Tests |
|-------------|----------------------------------------------------|-------|
| Atomicity   | Stop-on-failure in prescription workflow           | 4, 6  |
| Consistency | MySQL constraints + API validation + RBAC          | 3, 6  |
| Isolation   | InnoDB row-level locking + JWT-scoped sessions     | 1, 2, 3 |
| Durability  | InnoDB WAL + read-after-write verification         | 5, 7  |

All four ACID properties have dedicated test coverage. The full mapping is documented in
Section 8 of `ModuleB_Report.pdf`.

---

## Credits

**Team Members:**
- Harsh Jain (22110093)
- Shreyas Dharmatti (21110202)
- Sneha Gautam (22110255)
- Anushika Mishra (22110029)
- Kandarp Jani (22110104)

**Course:** CS 432 Databases, Semester II 2025–2026
**Instructor:** Prof. Yogesh K Meena
**Institution:** Indian Institute of Technology Gandhinagar

---

## License

Academic project. All rights reserved by the team members and IIT Gandhinagar.
