# Module A — Transaction Management, Concurrency Control & ACID Validation

## CS 432 Databases · Assignment 3 · Track 1

Custom **B+ Tree-based transaction engine** with full **ACID compliance**, including Write-Ahead Logging (WAL), crash recovery, and row-level locking for the Dispensary Management System.

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [System Architecture](#system-architecture)
- [Transaction Lifecycle](#transaction-lifecycle)
- [Individual Tests Explained](#individual-tests-explained)
- [Understanding the Output](#understanding-the-output)
- [ACID Validation Summary](#acid-validation-summary)
- [Troubleshooting](#troubleshooting)
- [File Structure](#file-structure)
- [Credits](#credits)
- [License](#license)

---

## Overview

Module A implements a **custom storage engine** that guarantees all four **ACID properties** without relying on external databases like MySQL.

Key features:

- Custom **B+ Tree storage engine**
- **Write-Ahead Logging (WAL)** with fsync durability
- **Undo logging** for rollback (Atomicity)
- **Crash recovery (REDO-based)**
- **Row-level locking** for concurrency control
- **Multi-relation transaction support**

### ACID Mapping

| Property    | Guarantee                                               | Validated By |
|-------------|--------------------------------------------------------|--------------|
| Atomicity   | All operations commit or rollback fully                | Test 1       |
| Consistency | Constraints always preserved                           | Test 2       |
| Isolation   | No concurrent transaction interference                 | Test 3       |
| Durability  | Data persists after crashes                            | Test 4       |
| Multi-Rel   | Cross-table transactions behave atomically             | Test 5       |

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run ACID validation suite
python test_acid.py

# 3. (Optional) Open notebook
jupyter notebook Dispensary_ACID_Report.ipynb
```

Expected output:

```
Results: 5 passed, 0 failed
```

---

## Prerequisites

### Software Requirements

| Tool   | Version | Check Command        |
|--------|--------|----------------------|
| Python | 3.8+   | `python --version`   |
| pip    | 20+    | `pip --version`      |

Optional:
- Jupyter Notebook (for visualization)

---

## Installation

```bash
# Clone repository
git clone https://github.com/Harsh-jain12/CS432_Track1_Assignment3.git
cd CS432_Track1_Assignment3/ModuleA

# Install dependencies
pip install -r requirements.txt
```

---

## Running Tests

### Option 1: Run Full ACID Suite (Recommended)

```bash
python test_acid.py
```

- Runs all 5 ACID tests sequentially
- Auto-generates:
  - `*_data/` directories
  - `*_wal.log` files

---

### Option 2: Interactive Notebook

```bash
jupyter notebook Dispensary_ACID_Report.ipynb
```

Provides:
- Step-by-step execution
- Visualization of transactions
- Lock conflicts
- Crash recovery behavior

---

## System Architecture

The system enforces a **strict invariant**:

> B+ Tree is the ONLY storage structure

### Core Components

- **BPlusTree (`bplustree.py`)**
- **Transaction (`transaction.py`)**
- **WAL (`wal.py`)**
- **LockManager (`lock_manager.py`)**
- **Table (`table.py`)**
- **DatabaseManager (`db_manager.py`)**

---

## Transaction Lifecycle

Every transaction follows:

```
BEGIN → Acquire Locks → Write WAL → Apply Change → Record Undo → COMMIT/ROLLBACK
```

---

## Individual Tests Explained

### Test 1: Atomicity
Rollback restores all changes.

### Test 2: Consistency
Invalid operations are rejected.

### Test 3: Isolation
Lock conflicts prevent concurrency issues.

### Test 4: Durability
Data persists after restart.

### Test 5: Multi-Relation
Cross-table operations succeed atomically.

---

## Understanding the Output

```
Results: 5 passed, 0 failed
```

---

## ACID Validation Summary

| Property    | Mechanism Used |
|-------------|---------------|
| Atomicity   | Undo Log      |
| Consistency | Validation    |
| Isolation   | Locks         |
| Durability  | WAL + fsync   |

---

## Troubleshooting

- Install dependencies if missing
- Delete logs/data if permission issues

---

## File Structure

```
module_a/
├── README.md
├── test_acid.py
├── database/
├── *_data/
├── *_wal.log
```

---

## Credits

CS 432 Databases — IIT Gandhinagar

---

## License

Academic project.
