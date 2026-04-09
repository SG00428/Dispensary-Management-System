"""
transaction.py — Transaction Object

Each Transaction keeps an undo log (a stack of inverse operations).
On ROLLBACK the undo log is replayed in reverse order.

Undo log entry format:
  ("INSERT",  table_name, key, None)          → undo by deleting key
  ("DELETE",  table_name, key, old_value)     → undo by re-inserting
  ("UPDATE",  table_name, key, old_value)     → undo by restoring old value
"""


class Transaction:

    # Shared counter — incremented every time a new transaction is created.
    _next_id = 1

    def __init__(self):
        self.txn_id = Transaction._next_id
        Transaction._next_id += 1
        self.active = True
        self._undo_log = []   # stack of (op, table, key, old_value)

    # ------------------------------------------------------------------
    # Undo-log helpers (called by DatabaseManager before each operation)
    # ------------------------------------------------------------------

    def record_insert(self, table_name, key):
        """Before an INSERT: undo = DELETE that key."""
        self._undo_log.append(("INSERT", table_name, key, None))

    def record_delete(self, table_name, key, old_value):
        """Before a DELETE: undo = re-INSERT the old record."""
        self._undo_log.append(("DELETE", table_name, key, old_value))

    def record_update(self, table_name, key, old_value):
        """Before an UPDATE: undo = restore the old record."""
        self._undo_log.append(("UPDATE", table_name, key, old_value))

    # ------------------------------------------------------------------
    # Undo iterator (used by DatabaseManager.rollback)
    # ------------------------------------------------------------------

    def undo_operations(self):
        """Yield undo entries in REVERSE order (LIFO)."""
        for entry in reversed(self._undo_log):
            yield entry

    def mark_done(self):
        self.active = False