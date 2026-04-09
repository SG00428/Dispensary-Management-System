import json
import os

from .bplustree import BPlusTree


class Table:

    def __init__(self, name, index_key, order=4):
        self.name = name
        self.index_key = index_key
        self.order = order
        self.index = BPlusTree(order=order)   # B+ Tree IS the database

    # kept for backward compatibility — no-op because index is created in __init__
    def attach_index(self, index):
        self.index = index

    # ------------------------------------------------------------------
    # CRUD — all go directly through the B+ Tree
    # ------------------------------------------------------------------

    def insert(self, record):
        key = record[self.index_key]
        self.index.insert(key, record)

    def search(self, key):
        return self.index.search(key)

    def delete(self, key):
        return self.index.delete(key)

    def update(self, key, new_record):
        return self.index.update(key, new_record)

    def get_all(self):
        return self.index.get_all()

    def range_query(self, start_key, end_key):
        return self.index.range_query(start_key, end_key)

    # ------------------------------------------------------------------
    # Persistence helpers
    # ------------------------------------------------------------------

    def save(self, directory="."):
        """Serialize this table's B+ Tree to a JSON file."""
        path = os.path.join(directory, f"{self.name}.json")
        data = {
            "name": self.name,
            "index_key": self.index_key,
            "order": self.order,
            "tree": self.index.to_dict(),
        }
        with open(path, "w") as f:
            json.dump(data, f)

    @classmethod
    def load(cls, directory, name):
        """Reconstruct a Table from its JSON file."""
        path = os.path.join(directory, f"{name}.json")
        with open(path, "r") as f:
            data = json.load(f)
        table = cls(data["name"], data["index_key"], order=data["order"])
        table.index = BPlusTree.from_dict(data["tree"])
        return table