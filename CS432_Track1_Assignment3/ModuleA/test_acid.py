

"""
test_acid.py — ACID Validation Tests for Module A
Dispensary Database: medicines, patients, prescriptions

Run with:  python test_acid.py
"""

import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database.db_manager import DatabaseManager
from database.lock_manager import LockConflictError

TEST_DATA_DIR = "./test_data"
TEST_LOG      = "./test_wal.log"


def fresh_db():
    """Create a clean DatabaseManager with 3 dispensary tables."""
    if os.path.exists(TEST_DATA_DIR):
        shutil.rmtree(TEST_DATA_DIR)
    if os.path.exists(TEST_LOG):
        os.remove(TEST_LOG)

    db = DatabaseManager(data_dir=TEST_DATA_DIR, log_path=TEST_LOG)
    db.create_table("medicines",     "medicine_id")
    db.create_table("patients",      "patient_id")
    db.create_table("prescriptions", "prescription_id")
    return db


# ======================================================================
# Test 1 — Atomicity: crash mid-transaction, verify full rollback
# ======================================================================

def test_atomicity_rollback():
    print("\n=== Test 1: Atomicity (Rollback) ===")
    db = fresh_db()

    # Pre-populate
    setup = db.begin_transaction()
    db.insert("medicines", {"medicine_id": 1, "name": "Paracetamol", "stock": 100, "price": 10, "category": "Painkiller"}, setup)
    db.insert("patients",  {"patient_id": 1,  "name": "Alice", "age": 30, "contact": "9999999999", "city": "Delhi"}, setup)
    db.commit(setup)

    # Start a multi-table transaction but ROLLBACK it (simulate crash)
    txn = db.begin_transaction()
    db.update("medicines",     1,   {"medicine_id": 1, "name": "Paracetamol", "stock": 90, "price": 10, "category": "Painkiller"}, txn)
    db.update("patients",      1,   {"patient_id": 1,  "name": "Alice", "age": 30, "contact": "9999999999", "city": "Delhi"}, txn)
    db.insert("prescriptions", {"prescription_id": 101, "patient_id": 1, "medicine_id": 1,
                                 "quantity": 10, "date": "2026-01-01", "amount": 100}, txn)

    # Simulate crash before commit
    db.rollback(txn)

    # Verify no partial changes remain
    medicine     = db.search("medicines",     1)
    patient      = db.search("patients",      1)
    prescription = db.search("prescriptions", 101)

    assert medicine["stock"] == 100, f"Expected stock=100, got {medicine['stock']}"
    assert patient is not None,      "Patient should still exist"
    assert prescription is None,     "Prescription should not exist after rollback"

    print("PASS: All changes rolled back correctly.")


# ======================================================================
# Test 2 — Consistency: constraints hold after each transaction
# ======================================================================

def test_consistency():
    print("\n=== Test 2: Consistency ===")
    db = fresh_db()

    setup = db.begin_transaction()
    db.insert("medicines", {"medicine_id": 2, "name": "Aspirin", "stock": 5, "price": 20, "category": "Painkiller"}, setup)
    db.insert("patients",  {"patient_id": 2,  "name": "Bob", "age": 45, "contact": "8888888888", "city": "Mumbai"}, setup)
    db.commit(setup)

    # Try to dispense more medicine than available in stock → rollback
    txn = db.begin_transaction()
    try:
        medicine = db.search("medicines", 2, txn)
        quantity_requested = 10   # more than stock of 5

        if medicine["stock"] < quantity_requested:
            raise ValueError(f"Insufficient stock: have {medicine['stock']}, need {quantity_requested}")

        db.update("medicines",     2, {**medicine, "stock": medicine["stock"] - quantity_requested}, txn)
        db.insert("prescriptions", {"prescription_id": 102, "patient_id": 2, "medicine_id": 2,
                                     "quantity": quantity_requested, "date": "2026-01-01",
                                     "amount": quantity_requested * medicine["price"]}, txn)
        db.commit(txn)
    except ValueError as e:
        print(f"  Caught expected error: {e}")
        db.rollback(txn)

    # Stock must remain unchanged
    medicine = db.search("medicines", 2)
    assert medicine["stock"] >= 0, "Stock must remain non-negative."
    assert medicine["stock"] == 5, f"Stock should be 5 (unchanged), got {medicine['stock']}"

    print(f"  Medicine stock: {medicine['stock']} (unchanged — constraint enforced)")
    print("PASS: Database remains consistent after failed transaction.")


# ======================================================================
# Test 3 — Isolation: two transactions on the same key, one wins
# ======================================================================

def test_isolation():
    print("\n=== Test 3: Isolation (Lock Conflict) ===")

    db = fresh_db()

    setup = db.begin_transaction()
    db.insert("medicines", {"medicine_id": 3, "name": "Ibuprofen", "stock": 50, "price": 15, "category": "Painkiller"}, setup)
    db.commit(setup)

    txn1 = db.begin_transaction()
    txn2 = db.begin_transaction()

    # txn1 acquires lock on medicines/key=3
    db.search("medicines", 3, txn1)

    conflict_raised = False
    try:
        # txn2 tries the same key — should be blocked
        db.search("medicines", 3, txn2)
    except LockConflictError as e:
        conflict_raised = True
        print(f"  Lock conflict detected (expected): {e}")

    db.rollback(txn1)
    db.rollback(txn2)

    assert conflict_raised, "Expected a LockConflictError but none was raised."
    print("PASS: Isolation enforced — second transaction correctly blocked.")


# ======================================================================
# Test 4 — Durability: committed data survives a restart
# ======================================================================

def test_durability():
    print("\n=== Test 4: Durability (Persist & Reload) ===")
    db = fresh_db()

    txn = db.begin_transaction()
    db.insert("medicines",     {"medicine_id": 4, "name": "Amoxicillin", "stock": 200, "price": 50, "category": "Antibiotic"}, txn)
    db.insert("patients",      {"patient_id": 4,  "name": "Carol", "age": 28, "contact": "7777777777", "city": "Chennai"}, txn)
    db.insert("prescriptions", {"prescription_id": 103, "patient_id": 4, "medicine_id": 4,
                                 "quantity": 2, "date": "2026-01-01", "amount": 100}, txn)
    db.commit(txn)

    # Simulate restart — brand new DatabaseManager, same data directory
    db2 = DatabaseManager(data_dir=TEST_DATA_DIR, log_path=TEST_LOG)
    db2.create_table("medicines",     "medicine_id")
    db2.create_table("patients",      "patient_id")
    db2.create_table("prescriptions", "prescription_id")

    medicine     = db2.search("medicines",     4)
    patient      = db2.search("patients",      4)
    prescription = db2.search("prescriptions", 103)

    assert medicine     is not None and medicine["name"]       == "Amoxicillin", "Medicine not persisted."
    assert patient      is not None and patient["name"]        == "Carol",        "Patient not persisted."
    assert prescription is not None and prescription["amount"] == 100,            "Prescription not persisted."

    print("PASS: All committed data persisted across restart.")


# ======================================================================
# Test 5 — Multi-Relation Transaction (the A3 mandatory scenario)
# Scenario: Dispense medicine to patient → update stock + insert prescription
# ======================================================================

def test_multi_relation_transaction():
    print("\n=== Test 5: Multi-Relation Transaction (Medicines + Patients + Prescriptions) ===")
    db = fresh_db()

    # Setup
    setup = db.begin_transaction()
    db.insert("medicines", {"medicine_id": 5, "name": "Cetirizine", "stock": 30, "price": 25, "category": "Antihistamine"}, setup)
    db.insert("patients",  {"patient_id": 5,  "name": "Dave", "age": 35, "contact": "6666666666", "city": "Hyderabad"}, setup)
    db.commit(setup)

    # Dispense prescription — touches all 3 tables
    txn = db.begin_transaction()
    medicine = db.search("medicines", 5, txn)
    patient  = db.search("patients",  5, txn)

    quantity     = 3
    total_amount = quantity * medicine["price"]

    db.update("medicines",     5, {**medicine, "stock": medicine["stock"] - quantity}, txn)
    db.insert("prescriptions", {
        "prescription_id": 104,
        "patient_id":      patient["patient_id"],
        "medicine_id":     medicine["medicine_id"],
        "quantity":        quantity,
        "date":            "2026-04-05",
        "amount":          total_amount
    }, txn)
    db.commit(txn)

    # Verify final state
    m  = db.search("medicines",     5)
    p  = db.search("patients",      5)
    rx = db.search("prescriptions", 104)

    assert m["stock"]   == 27,  f"Expected stock=27, got {m['stock']}"
    assert p is not None,       "Patient should exist"
    assert rx is not None,      "Prescription should exist"
    assert rx["amount"] == 75,  f"Expected amount=75, got {rx['amount']}"

    print(f"  Medicine stock: {m['stock']} (was 30, dispensed 3)")
    print(f"  Prescription:   {rx}")
    print("PASS: Multi-relation transaction committed correctly.")


# ======================================================================
# Runner
# ======================================================================

if __name__ == "__main__":
    tests = [
        test_atomicity_rollback,
        test_consistency,
        test_isolation,
        test_durability,
        test_multi_relation_transaction,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"FAIL: {test.__name__}: {e}")
            failed += 1
        except Exception as e:
            import traceback
            traceback.print_exc()
            failed += 1

    print(f"\n{'='*40}")
    print(f"Results: {passed} passed, {failed} failed")

    # Cleanup
    if os.path.exists(TEST_DATA_DIR):
        shutil.rmtree(TEST_DATA_DIR)
    if os.path.exists(TEST_LOG):
        os.remove(TEST_LOG)
