# Assignment 4: Sharding of the Dispensary Management System

## CS 432 Databases · Track 1 · Team SQL_ed

Horizontal data partitioning across **3 distinct MySQL shard servers** running on
ports 3307, 3308, and 3309 of the IITGN-provided shard host.

## Video Link : https://drive.google.com/drive/folders/16LBndKv99nr28VuTpxa6RlGkc-hHJj1x

---

## Table of Contents

- [Overview](#overview)
- [Shard Infrastructure](#shard-infrastructure)
- [Quick Start](#quick-start)
- [Sharding Design](#sharding-design)
- [Implementation Details](#implementation-details)
- [Query Routing](#query-routing)
- [File Structure](#file-structure)
- [Running the Verification Tests](#running-the-verification-tests)
- [Scalability Analysis](#scalability-analysis)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Dispensary Management System database has been sharded horizontally across **3 separate
MySQL server instances**, each running on a different port. Each shard is a fully independent
MySQL process with its own data files, connection pool, and storage engine. The application
routes every query to the correct shard based on a **shard key** (`MemberID`).

### Shard Infrastructure

| Shard | Host | Port | Database | Username |
|---|---|---|---|---|
| Shard 0 | `10.0.116.184` | `3307` | `SQL_ed` | `SQL_ed` |
| Shard 1 | `10.0.116.184` | `3308` | `SQL_ed` | `SQL_ed` |
| Shard 2 | `10.0.116.184` | `3309` | `SQL_ed` | `SQL_ed` |

**phpMyAdmin access:**
- Shard 0: http://10.0.116.184:8080
- Shard 1: http://10.0.116.184:8081
- Shard 2: http://10.0.116.184:8082

**Network requirement:** The shard servers are accessible only from the IITGN network.
You must be on campus or VPN to reach them.

---

## Quick Start

### Step 1: Create the schema on all 3 shards

Connect to each shard via `mysql` CLI and run the schema script:

```bash
mysql -h 10.0.116.184 -P 3307 -u SQL_ed -p SQL_ed < sql/01_create_schema.sql
mysql -h 10.0.116.184 -P 3308 -u SQL_ed -p SQL_ed < sql/01_create_schema.sql
mysql -h 10.0.116.184 -P 3309 -u SQL_ed -p SQL_ed < sql/01_create_schema.sql
```

When prompted, enter the password: `password@123`

### Step 2: Migrate your existing data

The migration script reads from your local Dispensary database and distributes records
to the 3 remote shards based on the MemberID hash:

```bash
# Set source DB connection (your local Dispensary instance)
export SOURCE_HOST=localhost
export SOURCE_USER=root
export SOURCE_PASS=your_local_password
export SOURCE_DB=DispensaryManagement

# Run the migration
node sql/02_migrate_data.js
```

Expected output:
```
[PASS] Connected to source: localhost:3306/DispensaryManagement
[PASS] Shard 0 (port 3307): <hostname>:3307
[PASS] Shard 1 (port 3308): <hostname>:3308
[PASS] Shard 2 (port 3309): <hostname>:3309
  ...
  Member             |    260 |   87 |   87 |   86 |   260 | [PASS]
  Appointment        |    530 |  177 |  177 |  176 |   530 | [PASS]
  [PASS] MIGRATION COMPLETE — all sharded data accounted for
```

### Step 3: Start the sharded application server

Copy these files into your Dispensary app directory:

```bash
cp app/config/shardPools.js     <your-app>/config/
cp app/config/shardRouter.js    <your-app>/config/
cp app/routes/sharded_members.js     <your-app>/routes/
cp app/routes/sharded_appointments.js <your-app>/routes/
cp app/routes/shardAdmin.js          <your-app>/routes/
cp app/server_sharded.js        <your-app>/
```

Then start the server:
```bash
cd <your-app> && node server_sharded.js
```

You should see:
```
  Testing connectivity to all 3 shards...
  [PASS] Shard 0 (port 3307): <hostname>:3307
  [PASS] Shard 1 (port 3308): <hostname>:3308
  [PASS] Shard 2 (port 3309): <hostname>:3309
  Server running on http://localhost:3000
```

### Step 4: Run the verification tests

```bash
node tests/verify_sharding.js
```

The tests connect directly to all 3 shard servers and verify connectivity, schema
consistency, distribution correctness, no duplicates, and routing behavior.

---

## Sharding Design

### Shard Key: `MemberID`

`MemberID` was selected as the shard key because:

| Criterion | Assessment |
|---|---|
| **High Cardinality** | 260 distinct values; scales linearly with enrolment |
| **Query-Aligned** | Present in 80%+ of API queries (appointments, prescriptions, visits) |
| **Stable** | Assigned at registration; never changes |

### Partitioning Strategy: Hash-Based

```
shard_id = MemberID % 3
```

| MemberID | shard_id | Goes to |
|---|---|---|
| 1 | 1 | Shard 1 (port 3308) |
| 2 | 2 | Shard 2 (port 3309) |
| 3 | 0 | Shard 0 (port 3307) |
| 4 | 1 | Shard 1 (port 3308) |
| ... | ... | ... |

This produces **near-perfect distribution**: with 260 members, shards get 87/87/86
(<1.2% skew).

### Sharded vs Replicated Tables

**Sharded tables (data partitioned across shards):**
- `Member` — central entity, partitioned by MemberID
- `Appointment` — linked to Member by MemberID
- `Visit` — linked to Member
- `Prescription` — linked to Member
- `PrescriptionItem` — follows parent Prescription's shard
- `MedicalHistory` — 1:1 with Member
- `BillPayment` — follows parent Visit's shard

**Replicated tables (full copy on every shard):**
- `Doctor`, `DoctorSchedule` — needed by all shards for joins
- `StaffEmployee` — administrative reference data
- `Medicine`, `Inventory`, `MedicalSupplier` — shared catalogue
- `UserLogin` — auth reference data

These are replicated rather than sharded because they're low-volume reference data that
every shard needs for joins (e.g., doctor info when listing appointments).

---

## Implementation Details

The assignments requirements were to do this on **3 physically distinct MySQL servers**, this implementation was designed:

| New (multi-server) |
|---|
| 3 separate pools, one per shard server |
| Plain `Member` table on every shard |
| `getShardPool(id)` returns connection pool |
| Different connection, same table |

The conceptual model is hash the MemberID, route to the right destination
but the destination is a **different physical server** instead of a different table
on the same server.

### Connection Pools (`shardPools.js`)

The application maintains 3 separate `mysql2` connection pools, one per shard:

```js
const shardPools = [
  { id: 0, port: 3307, pool: mysql.createPool({ host, port: 3307, ... }) },
  { id: 1, port: 3308, pool: mysql.createPool({ host, port: 3308, ... }) },
  { id: 2, port: 3309, pool: mysql.createPool({ host, port: 3309, ... }) },
];
```

Each pool maintains up to 10 concurrent connections to its specific shard server.

### Shard Router (`shardRouter.js`)

The router exposes functions that internally select the correct pool:

| Function | Purpose |
|---|---|
| `getShardId(memberID)` | Returns 0, 1, or 2 |
| `getShardPool(memberID)` | Returns the pool for that member's shard |
| `queryShard(memberID, sql, params)` | Runs query on one shard |
| `queryAllShards(sql, params)` | Runs query on all 3 shards in **parallel**, merges |
| `queryAllShardsLabeled(sql, params)` | Same as above but keeps per-shard labels |
| `insertIntoShard(memberID, sql, params)` | Inserts into the correct shard |
| `updateInShard(memberID, sql, params)` | Updates in the correct shard |
| `deleteFromShard(memberID, sql, params)` | Deletes from the correct shard |

Note that table names are now **uniform across shards** — every shard has a table called
`Member`, `Appointment`, etc. The router decides which **server** to send the query to,
not which table.

---

## Query Routing

### Single-Shard Lookup

```js
// Student MemberID = 1, hash → shard 1
const rows = await shard.queryShard(
  1,
  'SELECT * FROM Member WHERE MemberID = ?',
  [1]
);
// Connects to 10.0.116.184:3308 only
```

### Cross-Shard Fan-Out (Admin View)

```js
// Admin: see all members from every shard
const rows = await shard.queryAllShards(
  'SELECT * FROM Member ORDER BY MemberID'
);
// Connects to ALL 3 shards in parallel, merges results
```

### Cross-Shard Range Query

```js
// Date range: appointments between 2025-01-01 and 2026-12-31
const rows = await shard.queryAllShards(
  'SELECT a.*, d.Name FROM Appointment a JOIN Doctor d ON a.DoctorID = d.DoctorID ' +
  'WHERE a.AppointmentDate BETWEEN ? AND ?',
  ['2025-01-01', '2026-12-31']
);
// Each shard runs the query independently → fan-out + merge
```

### Insert Routing

```js
// New member with MemberID = 263, hash → shard 1
await shard.insertIntoShard(
  263,
  'INSERT INTO Member (MemberID, Name, ...) VALUES (?, ?, ...)',
  [263, 'New User', ...]
);
// Inserts into 10.0.116.184:3308
```

---

## File Structure

```
assignment4/
├── README.md                              ← This file
├── Assignment4_Report.tex                 ← LaTeX source
├── results/
│   └── Assignment4_Report.pdf             ← Submission report
├── sql/
│   ├── 01_create_schema.sql               ← Run on each shard manually
│   └── 02_migrate_data.js                 ← Distributes data to all 3 shards
├── app/
│   ├── server_sharded.js                  ← Multi-shard server entry point
│   ├── config/
│   │   ├── shardPools.js                  ← 3 connection pools (one per shard)
│   │   └── shardRouter.js                 ← Routing logic
│   └── routes/
│       ├── sharded_members.js             ← Member CRUD with shard routing
│       ├── sharded_appointments.js        ← Appointment CRUD + cross-shard range
│       └── shardAdmin.js                  ← Health, stats, distribution APIs
└── tests/
    └── verify_sharding.js                 ← Direct connectivity + correctness tests
```

---

## Running the Verification Tests

```bash
# Make sure you're on the IITGN network
node tests/verify_sharding.js
```

### What's Verified

| # | Test | What It Checks |
|---|---|---|
| 1 | Shard Connectivity | All 3 shards reachable on ports 3307/3308/3309 |
| 2 | Distinct Instances | Each shard reports a unique `@@port` |
| 3 | Schema Consistency | All shards have the same table set |
| 4 | Self-Identification | Each shard has its own `shard_id` in `ShardMetadata` |
| 5 | Distribution Correctness | No member is on the wrong shard (verified by hash) |
| 6 | No Duplication | All MemberIDs are unique across shards |
| 7 | Distribution Stats | Skew < 20% across all sharded tables |
| 8 | Single-Shard Lookup | Specific MemberIDs are found on the expected shard |
| 9 | Cross-Shard Fan-Out | Querying all shards returns merged unique results |
| 10 | Range Query | Date range query works across all 3 shards |
| 11 | Insert Routing | New inserts land on the correct shard, not on others |

---

## Scalability Analysis

### Horizontal vs Vertical Scaling

| Aspect | Vertical | Horizontal (Sharding) |
|---|---|---|
| Approach | Bigger single server | More smaller servers |
| Cost curve | Exponential | Linear |
| Ceiling | One machine's hardware limits | Practically unlimited |
| Failure mode | Single point of failure | Partial degradation |

Our 3-shard setup demonstrates this in practice: even on commodity hardware, we can serve
3 separate MySQL processes that each handle ~1/3 of the data. Adding a 4th shard would
require rehashing roughly 25% of records but no fundamental architecture change.

### CAP Theorem Trade-offs

**Consistency.** Each shard is internally consistent (InnoDB ACID guarantees within a
single MySQL instance). However, cross-shard consistency is NOT automatic: if we wanted
a transaction that spans MemberID 1 (shard 1) and MemberID 2 (shard 2), we'd need a
distributed transaction protocol (two-phase commit) — which we don't implement. Our
design accepts **per-shard consistency**, which is sufficient for the dispensary's
single-member-at-a-time workflows.

**Availability.** If shard 1 (port 3308) goes down, members with `MemberID % 3 == 1`
become inaccessible — but members on shards 0 and 2 keep working. This is **partial
availability**: better than a monolithic single server (where the entire system fails),
but worse than a fully replicated cluster (which would tolerate any single failure).

**Partition Tolerance.** Our hash-based routing is fully deterministic. If the network
partition isolates shard 2 from the application server, the router immediately knows
which queries will fail (any MemberID where `% 3 == 2`) without timing out or returning
incorrect data. We could extend this with a fallback that returns partial results from
reachable shards.

### Trade-offs in This Implementation

**Wins:**
- 3× the connection capacity (each shard has its own pool)
- Reads scale linearly for single-member queries
- Inserts distribute evenly across shards
- Data isolation per shard (a runaway query on shard 1 doesn't impact shard 0)

**Costs:**
- Cross-shard queries require fan-out (3 round trips instead of 1)
- Schema changes must be applied to all 3 shards manually
- No referential integrity across shards (FKs only work within a single shard)
- Adding a 4th shard requires rehashing and migration
- Distributed transactions not supported

---

## Troubleshooting

### "ECONNREFUSED" or "Cannot connect" to shard

You're not on the IITGN network. The shard servers (`10.0.116.184`) are only accessible
from inside the campus network. Connect via VPN or the campus WiFi.

### "Access denied for user 'SQL_ed'"

Verify the password is `password@123` and the database is `SQL_ed` (case-sensitive).

### "Table 'SQL_ed.Member' doesn't exist"

Run the schema creation script on each shard:
```bash
mysql -h 10.0.116.184 -P 3307 -u SQL_ed -p SQL_ed < sql/01_create_schema.sql
mysql -h 10.0.116.184 -P 3308 -u SQL_ed -p SQL_ed < sql/01_create_schema.sql
mysql -h 10.0.116.184 -P 3309 -u SQL_ed -p SQL_ed < sql/01_create_schema.sql
```

### Migration script fails midway

Re-run it. The migration is idempotent: it deletes all sharded data first, then
re-inserts. Replicated tables are also cleared and re-inserted.

### Verification test reports "members on wrong shard"

This means a row exists where `MemberID % 3 != actual_shard`. Re-run the migration:
```bash
node sql/02_migrate_data.js
```

### "MySQL has gone away" during long operations

The default `wait_timeout` may be too short. Increase the connection pool's
`connectionLimit` or split the migration into smaller batches.

---

## Credits

**Team Members (SQL_ed):**
- Harsh Jain (22110093)
- Shreyas Dharmatti (21110202)
- Sneha Gautam (22110255)
- Anushika Mishra (22110029)
- Kandarp Jani (22110104)

**Course:** CS 432 Databases, Semester II 2025–2026
**Instructor:** Prof. Yogesh K Meena
**Institution:** Indian Institute of Technology Gandhinagar
