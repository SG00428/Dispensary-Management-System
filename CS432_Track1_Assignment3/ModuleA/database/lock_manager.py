"""
lock_manager.py — Simple Row-Level Lock Manager

Provides basic isolation via exclusive locks on (table, key) pairs.

Design:
  - Only one transaction may hold a lock on a given (table, key) at a time.
  - Attempting to acquire a lock held by another transaction raises LockConflictError.
  - A transaction releases ALL its locks on COMMIT or ROLLBACK.

This gives serializable isolation for single-key operations.
For range queries the caller should lock each key individually before reading.
"""

import threading


class LockConflictError(Exception):
    """Raised when a lock cannot be acquired due to a conflict."""
    pass


class LockManager:

    def __init__(self):
        self._locks = {}          # (table, key) → txn_id
        self._txn_locks = {}      # txn_id → set of (table, key)
        self._mutex = threading.Lock()

    # ------------------------------------------------------------------
    # Acquire / Release
    # ------------------------------------------------------------------

    def acquire(self, txn_id, table, key):
        """
        Acquire an exclusive lock on (table, key) for txn_id.
        Raises LockConflictError if another transaction already holds it.
        Re-entrant: if the same transaction already holds the lock, this is a no-op.
        """
        lock_key = (table, key)

        with self._mutex:
            holder = self._locks.get(lock_key)

            if holder is None:
                # Lock is free — grant it.
                self._locks[lock_key] = txn_id
                self._txn_locks.setdefault(txn_id, set()).add(lock_key)

            elif holder == txn_id:
                # Same transaction — re-entrant, fine.
                pass

            else:
                raise LockConflictError(
                    f"Lock conflict: (table={table}, key={key}) "
                    f"held by txn {holder}, requested by txn {txn_id}"
                )

    def release_all(self, txn_id):
        """Release every lock held by txn_id (call on COMMIT or ROLLBACK)."""
        with self._mutex:
            for lock_key in self._txn_locks.pop(txn_id, set()):
                if self._locks.get(lock_key) == txn_id:
                    del self._locks[lock_key]

    # ------------------------------------------------------------------
    # Inspection helpers (useful for debugging / tests)
    # ------------------------------------------------------------------

    def is_locked_by(self, txn_id, table, key):
        return self._locks.get((table, key)) == txn_id

    def held_locks(self, txn_id):
        return list(self._txn_locks.get(txn_id, set()))