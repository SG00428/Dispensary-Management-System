"""
  - begin_transaction() → returns a Transaction object
  - commit(txn)         → flushes WAL, saves tables to disk
  - rollback(txn)       → replays undo log to reverse all changes
  - crash_recovery()    → replays WAL on startup to restore committed state

Usage example:
    db = DatabaseManager(data_dir="./data")
    db.crash_recovery()        # always call first

    db.create_table("users",    "user_id")
    db.create_table("products", "product_id")
    db.create_table("orders",   "order_id")

    txn = db.begin_transaction()
    try:
        db.insert("users",    {"user_id": 1, "name": "Alice", "balance": 500}, txn)
        db.update("products", 42, {"product_id": 42, "stock": 9},              txn)
        db.insert("orders",   {"order_id": 100, "user_id": 1, "amount": 50},   txn)
        db.commit(txn)
    except Exception as e:
        db.rollback(txn)
        raise
"""

import os
import json

from .table import Table
from .bplustree import BPlusTree
from .transaction import Transaction
from .lock_manager import LockManager, LockConflictError
from .wal import WAL


class DatabaseManager:

    def __init__(self, data_dir="./data", log_path="wal.log"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)

        self.tables = {}
        self._wal = WAL(log_path=log_path)
        self._lock_mgr = LockManager()

    # ------------------------------------------------------------------
    # Table management
    # ------------------------------------------------------------------

    def create_table(self, name, index_key, order=4):
        """Create a new table (or load it from disk if it already exists)."""
        table_path = os.path.join(self.data_dir, f"{name}.json")
        if os.path.exists(table_path):
            table = Table.load(self.data_dir, name)
        else:
            table = Table(name, index_key, order=order)
        self.tables[name] = table

    # ------------------------------------------------------------------
    # Transaction lifecycle
    # ------------------------------------------------------------------

    def begin_transaction(self):
        txn = Transaction()
        self._wal.log_begin(txn.txn_id)
        return txn

    def commit(self, txn):
        """Commit: write COMMIT to WAL, then persist all tables to disk."""
        if not txn.active:
            raise RuntimeError(f"Transaction {txn.txn_id} is not active.")

        self._wal.log_commit(txn.txn_id)

        # Persist every table so durability holds across restarts.
        for table in self.tables.values():
            table.save(self.data_dir)

        self._lock_mgr.release_all(txn.txn_id)
        txn.mark_done()

    def rollback(self, txn):
        """Rollback: replay the undo log in reverse order."""
        if not txn.active:
            raise RuntimeError(f"Transaction {txn.txn_id} is not active.")

        for (op, table_name, key, old_value) in txn.undo_operations():
            table = self.tables.get(table_name)
            if table is None:
                continue

            if op == "INSERT":
                # Undo an insert → delete the key
                table.delete(key)
            elif op == "DELETE":
                # Undo a delete → re-insert the old record
                if old_value is not None:
                    table.insert(old_value)
            elif op == "UPDATE":
                # Undo an update → restore the old record
                if old_value is not None:
                    table.update(key, old_value)

        self._wal.log_rollback(txn.txn_id)
        self._lock_mgr.release_all(txn.txn_id)
        txn.mark_done()

    # ------------------------------------------------------------------
    # CRUD — all accept an optional txn for transactional use
    # ------------------------------------------------------------------

    def insert(self, table_name, record, txn=None):
        table = self.tables[table_name]
        key = record[table.index_key]

        if txn:
            self._lock_mgr.acquire(txn.txn_id, table_name, key)
            self._wal.log_insert(txn.txn_id, table_name, key, record)
            txn.record_insert(table_name, key)

        table.insert(record)

    def search(self, table_name, key, txn=None):
        table = self.tables[table_name]

        if txn:
            self._lock_mgr.acquire(txn.txn_id, table_name, key)

        return table.search(key)

    def delete(self, table_name, key, txn=None):
        table = self.tables[table_name]

        if txn:
            old_value = table.search(key)
            self._lock_mgr.acquire(txn.txn_id, table_name, key)
            self._wal.log_delete(txn.txn_id, table_name, key, old_value)
            txn.record_delete(table_name, key, old_value)

        table.delete(key)

    def update(self, table_name, key, new_record, txn=None):
        table = self.tables[table_name]

        if txn:
            old_value = table.search(key)
            self._lock_mgr.acquire(txn.txn_id, table_name, key)
            self._wal.log_update(txn.txn_id, table_name, key, new_record, old_value)
            txn.record_update(table_name, key, old_value)

        table.update(key, new_record)

    # ------------------------------------------------------------------
    # Crash recovery — call once at startup
    # ------------------------------------------------------------------

    def crash_recovery(self):
        """
        Replay the WAL to bring the database to a consistent state.

        Strategy (REDO only — using the WAL as the source of truth):
          1. Collect all txn_ids that have a COMMIT record.
          2. Replay INSERT / DELETE / UPDATE only for committed transactions.
          3. Ignore (undo by omission) any incomplete transactions.
        """
        records = self._wal.read_log()

        # Step 1: find committed txn_ids
        committed = {r["txn_id"] for r in records if r["op"] == "COMMIT"}

        # Step 2: group operations by txn_id in order
        ops_by_txn = {}
        for r in records:
            if r["op"] in ("INSERT", "DELETE", "UPDATE"):
                ops_by_txn.setdefault(r["txn_id"], []).append(r)

        # Step 3: re-apply committed transactions
        for txn_id, ops in ops_by_txn.items():
            if txn_id not in committed:
                print(f"[Recovery] Skipping incomplete txn {txn_id}")
                continue

            print(f"[Recovery] Replaying committed txn {txn_id}")
            for r in ops:
                table_name = r.get("table")
                key        = r.get("key")
                value      = r.get("value")

                if table_name not in self.tables:
                    print(f"[Recovery] Warning: table '{table_name}' not found, skipping.")
                    continue

                table = self.tables[table_name]

                if r["op"] == "INSERT":
                    # Only insert if not already present (idempotency).
                    if table.search(key) is None:
                        table.insert(value)

                elif r["op"] == "DELETE":
                    table.delete(key)

                elif r["op"] == "UPDATE":
                    if table.search(key) is not None:
                        table.update(key, value)

        print("[Recovery] Done.")