"""
wal.py — Write-Ahead Log (WAL)

Every operation is written to a log file BEFORE it touches the B+ Tree.
On restart, the WAL is replayed:
  - COMMITTED transactions are re-applied (redo).
  - INCOMPLETE transactions are ignored (undo by omission).

Log format (one JSON object per line):
  {"txn_id": 1, "op": "INSERT", "table": "users", "key": 10, "value": {...}}
  {"txn_id": 1, "op": "COMMIT"}
  {"txn_id": 2, "op": "BEGIN"}
  ...
"""

import json
import os


class WAL:

    def __init__(self, log_path="wal.log"):
        self.log_path = log_path

    # ------------------------------------------------------------------
    # Writing to the log
    # ------------------------------------------------------------------

    def log(self, txn_id, op, table=None, key=None, value=None, old_value=None):
        """Append one log record atomically (line-buffered write + flush)."""
        record = {"txn_id": txn_id, "op": op}
        if table is not None:
            record["table"] = table
        if key is not None:
            record["key"] = key
        if value is not None:
            record["value"] = value
        if old_value is not None:
            record["old_value"] = old_value

        with open(self.log_path, "a") as f:
            f.write(json.dumps(record) + "\n")
            f.flush()
            os.fsync(f.fileno())   # force to disk — durability guarantee

    def log_begin(self, txn_id):
        self.log(txn_id, "BEGIN")

    def log_insert(self, txn_id, table, key, value):
        self.log(txn_id, "INSERT", table=table, key=key, value=value)

    def log_delete(self, txn_id, table, key, old_value):
        """old_value is stored so we can undo a delete during rollback."""
        self.log(txn_id, "DELETE", table=table, key=key, old_value=old_value)

    def log_update(self, txn_id, table, key, new_value, old_value):
        self.log(txn_id, "UPDATE", table=table, key=key,
                 value=new_value, old_value=old_value)

    def log_commit(self, txn_id):
        self.log(txn_id, "COMMIT")

    def log_rollback(self, txn_id):
        self.log(txn_id, "ROLLBACK")

    # ------------------------------------------------------------------
    # Reading the log (used by recovery)
    # ------------------------------------------------------------------

    def read_log(self):
        """Return list of all log records in order."""
        records = []
        if not os.path.exists(self.log_path):
            return records
        with open(self.log_path, "r") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        records.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass   # skip corrupted tail records
        return records

    def clear(self):
        """Truncate the log (call after a clean checkpoint)."""
        with open(self.log_path, "w") as f:
            f.truncate(0)