
class Table:

    def __init__(self, name, index_key):
        self.name = name            # Table name
        self.index_key = index_key  # Field used as the B+ Tree index key
        self.records = {}           # Raw record store: {key: record_dict}
        self.index = None           # B+ Tree index (attached separately)

    
    # index
    
    def attach_index(self, index):
        """Attach a B+ Tree index to this table."""
        self.index = index

    
    # validate
    
    def validate_record(self, record):
        """
        Validate that the given record is a dict and contains the index key.
        Raises ValueError with a clear message if validation fails.
        """
        if not isinstance(record, dict):
            raise ValueError(f"Record must be a dictionary, got {type(record).__name__}.")
        if self.index_key not in record:
            raise ValueError(
                f"Record is missing the index key '{self.index_key}'. "
                f"Provided keys: {list(record.keys())}"
            )
        if record[self.index_key] is None:
            raise ValueError(f"Index key '{self.index_key}' cannot be None.")

    
    # Insert
    
    def insert(self, record):
        """
        Insert a new record into the table.
        The record must be a dict containing the index_key field.
        Raises ValueError if a record with the same key already exists.
        """
        self.validate_record(record)
        key = record[self.index_key]

        if key in self.records:
            raise ValueError(
                f"Record with key '{key}' already exists in table '{self.name}'. "
                f"Use update() to modify it."
            )

        self.records[key] = record

        if self.index:
            self.index.insert(key, record)


    def search(self, key):
        """
        Search for a single record by its index key.
        Uses the B+ Tree index if available, else falls back to dict lookup.
        Returns the record dict, or None if not found.
        """
        if self.index:
            return self.index.search(key)
        return self.records.get(key)

    def get(self, key):
        """Alias for search() — retrieve a single record by its index key."""
        return self.search(key)

    def get_all(self):
        """
        Retrieve all records in sorted order by index key.
        Uses the B+ Tree leaf linked list if index is available.
        Returns a list of (key, record) tuples.
        """
        if self.index:
            return self.index.get_all()
        return sorted(self.records.items(), key=lambda x: x[0])

   
    def update(self, key, new_record):
        """
        Update an existing record identified by key with new_record data.
        The new_record must still contain the same index key.
        Raises KeyError if the record does not exist.
        """
        if key not in self.records:
            raise KeyError(f"No record with key '{key}' found in table '{self.name}'.")

        self.validate_record(new_record)

        if new_record[self.index_key] != key:
            raise ValueError(
                f"Cannot change the index key from '{key}' to "
                f"'{new_record[self.index_key]}'. Delete and re-insert instead."
            )

        self.records[key] = new_record

        if self.index:
            self.index.update(key, new_record)

   
    def delete(self, key):
        """
        Delete a record from the table by its index key.
        Removes from both the raw record store and the B+ Tree index.
        Raises KeyError if the record does not exist.
        """
        if key not in self.records:
            raise KeyError(f"No record with key '{key}' found in table '{self.name}'.")

        del self.records[key]

        if self.index:
            self.index.delete(key)

   
    def range_query(self, start_value, end_value):
        """
        Perform a range query using the index key.
        Returns list of (key, record) pairs where start_value <= key <= end_value.
        Uses the B+ Tree index for O(log n + k) traversal if available,
        else falls back to a linear scan over raw records.
        """
        if self.index:
            return self.index.range_query(start_value, end_value)

        return [
            (k, v) for k, v in self.records.items()
            if start_value <= k <= end_value
        ]

    
    # utility functions
    
    def count(self):
        """Return the total number of records in the table."""
        return len(self.records)

    def __repr__(self):
        return (
            f"Table(name='{self.name}', "
            f"index_key='{self.index_key}', "
            f"records={self.count()})"
        )