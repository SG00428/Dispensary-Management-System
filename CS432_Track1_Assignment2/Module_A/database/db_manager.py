from .table import Table
from .bplustree import BPlusTree


class DatabaseManager:

    def __init__(self):
        # Stores databases as {db_name: {table_name: Table instance}}
        self.databases = {}

    def create_database(self, db_name):
        """
        Create a new database with the given name.
        Initializes an empty dictionary for tables within this database.
        """
        if db_name in self.databases:
            raise ValueError(f"Database '{db_name}' already exists.")
        self.databases[db_name] = {}
        print(f"Database '{db_name}' created.")

    def delete_database(self, db_name):
        """
        Delete an existing database and all its tables.
        """
        if db_name not in self.databases:
            raise ValueError(f"Database '{db_name}' does not exist.")
        del self.databases[db_name]
        print(f"Database '{db_name}' deleted.")

    def list_databases(self):
        """
        Return a list of all database names currently managed.
        """
        return list(self.databases.keys())

   
    # table operations
    
    def create_table(self, db_name, table_name, index_key, order=4):
        """
        Create a new table within a specified database and attach a B+ Tree index.
        - index_key: field name to use as the key in the B+ Tree
        - order: B+ Tree order (max children per internal node)
        """
        self._check_db(db_name)
        if table_name in self.databases[db_name]:
            raise ValueError(f"Table '{table_name}' already exists in database '{db_name}'.")

        table = Table(table_name, index_key)
        index = BPlusTree(order=order)
        table.attach_index(index)

        self.databases[db_name][table_name] = table
        print(f"Table '{table_name}' created in database '{db_name}'.")

    def delete_table(self, db_name, table_name):
        """
        Delete a table from the specified database.
        """
        self._check_db(db_name)
        self._check_table(db_name, table_name)
        del self.databases[db_name][table_name]
        print(f"Table '{table_name}' deleted from database '{db_name}'.")

    def list_tables(self, db_name):
        """
        List all table names within a given database.
        """
        self._check_db(db_name)
        return list(self.databases[db_name].keys())

    def get_table(self, db_name, table_name):
        """
        Retrieve a Table instance from a given database.
        Useful for performing insert, update, delete, search directly on the table.
        """
        self._check_db(db_name)
        self._check_table(db_name, table_name)
        return self.databases[db_name][table_name]

   
    # record operations
  
    def insert(self, db_name, table_name, record):
        """Insert a record dict into the specified table."""
        self.get_table(db_name, table_name).insert(record)

    def search(self, db_name, table_name, key):
        """Search for a record by its index key. Returns the record or None."""
        return self.get_table(db_name, table_name).search(key)

    def delete(self, db_name, table_name, key):
        """Delete a record by its index key."""
        self.get_table(db_name, table_name).delete(key)

    def update(self, db_name, table_name, key, new_record):
        """Update an existing record identified by key with new_record data."""
        self.get_table(db_name, table_name).update(key, new_record)

    def range_query(self, db_name, table_name, start_key, end_key):
        """
        Perform a range query on the table's B+ Tree index.
        Returns list of (key, record) pairs where start_key <= key <= end_key.
        """
        table = self.get_table(db_name, table_name)
        if table.index:
            return table.index.range_query(start_key, end_key)
        # Fallback: linear scan over raw records
        return [
            (k, v) for k, v in table.records.items()
            if start_key <= k <= end_key
        ]

    def get_all(self, db_name, table_name):
        """
        Return all records from a table in sorted order by index key.
        """
        table = self.get_table(db_name, table_name)
        if table.index:
            return table.index.get_all()
        return list(table.records.items())

    
    # helpers
    
    def _check_db(self, db_name):
        """Raise an error if the database does not exist."""
        if db_name not in self.databases:
            raise ValueError(f"Database '{db_name}' does not exist.")

    def _check_table(self, db_name, table_name):
        """Raise an error if the table does not exist in the database."""
        if table_name not in self.databases[db_name]:
            raise ValueError(f"Table '{table_name}' does not exist in database '{db_name}'.")