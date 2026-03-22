from graphviz import Digraph


class BPlusTreeNode:
    def __init__(self, leaf=False):
        self.leaf = leaf
        self.keys = []
        self.children = []  # Stores values in leaf nodes, child pointers in internal nodes
        self.next = None    # Points to next leaf node (for range queries)


class BPlusTree:

    def __init__(self, order=4):
        self.root = BPlusTreeNode(True)
        self.order = order


    # SEARCH

    def search(self, key, node=None):
        """Search for a key in the B+ tree. Return the associated value if found, else None."""

        if node is None:
            node = self.root

        i = 0
        if node.leaf:
            # Leaf: find exact match position
            while i < len(node.keys) and key > node.keys[i]:
                i += 1
            if i < len(node.keys) and node.keys[i] == key:
                return node.children[i]
            return None

        # Internal node: key >= separator means go right
        while i < len(node.keys) and key >= node.keys[i]:
            i += 1

        return self.search(key, node.children[i])

    
    # INSERT
   
    def insert(self, key, value):
        """
        Insert key-value pair into the B+ tree.
        Handle root splitting if necessary.
        Maintain sorted order and balance properties.
        """
        root = self.root

        if len(root.keys) == self.order - 1:
            new_root = BPlusTreeNode(leaf=False)
            new_root.children.append(self.root)
            self._split_child(new_root, 0)
            self.root = new_root

        self._insert_non_full(self.root, key, value)

    def _insert_non_full(self, node, key, value):
        """Recursive helper to insert into a non-full node.
        Split child nodes if they become full during insertion."""

        if node.leaf:
            i = 0
            while i < len(node.keys) and key > node.keys[i]:
                i += 1
            node.keys.insert(i, key)
            node.children.insert(i, value)

        else:
            i = 0
            while i < len(node.keys) and key >= node.keys[i]:
                i += 1

            child = node.children[i]

            if len(child.keys) == self.order - 1:
                self._split_child(node, i)
                if key >= node.keys[i]:
                    i += 1

            self._insert_non_full(node.children[i], key, value)

    def _split_child(self, parent, index):
        """
        Split the child at the given index in parent.
        For leaves: preserve the linked list structure and copy the middle key to the parent.
        For internal nodes: promote the middle key and split the children.
        """
        node = parent.children[index]
        new_node = BPlusTreeNode(leaf=node.leaf)
        mid = self.order // 2

        if node.leaf:
            # Copy mid key up to parent (leaf keeps it too)
            parent.keys.insert(index, node.keys[mid])
            parent.children.insert(index + 1, new_node)

            new_node.keys = node.keys[mid:]
            new_node.children = node.children[mid:]
            node.keys = node.keys[:mid]
            node.children = node.children[:mid]

            # Maintain leaf linked list
            new_node.next = node.next
            node.next = new_node

        else:
            # Promote mid key up to parent (internal node does NOT keep it)
            parent.keys.insert(index, node.keys[mid])
            parent.children.insert(index + 1, new_node)

            new_node.keys = node.keys[mid + 1:]
            new_node.children = node.children[mid + 1:]
            node.keys = node.keys[:mid]
            node.children = node.children[:mid + 1]


    # DELETE
   
    def delete(self, key):
        """
        Delete key from the B+ tree.
        Handle underflow by borrowing from siblings or merging nodes.
        Update the root if it becomes empty.
        Return True if deletion succeeded, False otherwise.
        """
        if not self.root.keys:
            return False

        result = self._delete(self.root, key)

        # If root became empty and has a child, shrink tree height
        if not self.root.leaf and len(self.root.keys) == 0:
            self.root = self.root.children[0]

        return result

    def _delete(self, node, key):
        """Recursive helper for deletion. Handle leaf and internal nodes.
        Ensure all nodes maintain minimum keys after deletion."""

        min_keys = (self.order - 1) // 2  # Minimum keys a non-root node must have

        if node.leaf:
            if key in node.keys:
                idx = node.keys.index(key)
                node.keys.pop(idx)
                node.children.pop(idx)
                return True
            return False

        # Find the child subtree to descend into
        i = 0
        while i < len(node.keys) and key >= node.keys[i]:
            i += 1

        # Check if this child has enough keys; if not, fix it first
        if len(node.children[i].keys) <= min_keys:
            self._fill_child(node, i)
            # After fill, re-find position because keys may have shifted
            i = 0
            while i < len(node.keys) and key >= node.keys[i]:
                i += 1

        return self._delete(node.children[i], key)

    def _fill_child(self, node, index):
        """Ensure child at given index has enough keys by borrowing from siblings or merging."""

        if index > 0 and len(node.children[index - 1].keys) > (self.order - 1) // 2:
            self._borrow_from_prev(node, index)
        elif index < len(node.children) - 1 and len(node.children[index + 1].keys) > (self.order - 1) // 2:
            self._borrow_from_next(node, index)
        else:
            if index < len(node.children) - 1:
                self._merge(node, index)
            else:
                self._merge(node, index - 1)

    def _borrow_from_prev(self, node, index):
        """Borrow a key from the left sibling to prevent underflow."""

        child = node.children[index]
        sibling = node.children[index - 1]

        if child.leaf:
            # Move last key/value of sibling into front of child
            child.keys.insert(0, sibling.keys.pop())
            child.children.insert(0, sibling.children.pop())
            # Update parent separator key to new first key of child
            node.keys[index - 1] = child.keys[0]
        else:
            # Pull parent separator key down into child
            child.keys.insert(0, node.keys[index - 1])
            child.children.insert(0, sibling.children.pop())
            # Push last key of sibling up to parent
            node.keys[index - 1] = sibling.keys.pop()

    def _borrow_from_next(self, node, index):
        """Borrow a key from the right sibling to prevent underflow."""

        child = node.children[index]
        sibling = node.children[index + 1]

        if child.leaf:
            # Move first key/value of sibling to end of child
            child.keys.append(sibling.keys.pop(0))
            child.children.append(sibling.children.pop(0))
            # Update parent separator key to new first key of sibling
            node.keys[index] = sibling.keys[0]
        else:
            # Pull parent separator key down into child
            child.keys.append(node.keys[index])
            child.children.append(sibling.children.pop(0))
            # Push first key of sibling up to parent
            node.keys[index] = sibling.keys.pop(0)

    def _merge(self, node, index):
        """Merge child at index with its right sibling. Update parent keys."""

        left = node.children[index]
        right = node.children[index + 1]

        if left.leaf:
            # Merge right into left, maintain linked list
            left.keys += right.keys
            left.children += right.children
            left.next = right.next
        else:
            # Pull separator key from parent down, then merge
            left.keys.append(node.keys[index])
            left.keys += right.keys
            left.children += right.children

        # Remove separator key and right child pointer from parent
        node.keys.pop(index)
        node.children.pop(index + 1)


    # UPDATE

    def update(self, key, new_value):
        """Update value associated with an existing key. Return True if successful."""

        node = self.root

        while not node.leaf:
            i = 0
            while i < len(node.keys) and key >= node.keys[i]:
                i += 1
            node = node.children[i]

        if key in node.keys:
            idx = node.keys.index(key)
            node.children[idx] = new_value
            return True

        return False

    
    # RANGE QUERY
    
    def range_query(self, start_key, end_key):
        """
        Return all key-value pairs where start_key <= key <= end_key.
        Traverse leaf nodes using next pointers for efficient range scans.
        """
        # Locate the correct starting leaf via tree traversal
        node = self.root
        while not node.leaf:
            i = 0
            while i < len(node.keys) and start_key >= node.keys[i]:
                i += 1
            node = node.children[i]

        results = []

        while node:
            for i, key in enumerate(node.keys):
                if key > end_key:
                    return results
                if key >= start_key:
                    results.append((key, node.children[i]))
            node = node.next

        return results

    
    # GET ALL
    
    def get_all(self):
        """Return all key-value pairs in the tree using in-order traversal via leaf linked list."""

        node = self.root

        while not node.leaf:
            node = node.children[0]

        results = []

        while node:
            for i, key in enumerate(node.keys):
                results.append((key, node.children[i]))
            node = node.next

        return results

    
    # VISUALIZE
    
    def visualize_tree(self):
        """Generate Graphviz representation of the B+ tree structure."""

        dot = Digraph()
        dot.attr(rankdir='TB')
        self._add_nodes(dot, self.root)
        self._add_edges(dot, self.root)
        return dot

    def _add_nodes(self, dot, node):
        """Recursively add nodes to Graphviz object (for visualisation)."""

        node_id = str(id(node))
        label = "LEAF\n" + str(node.keys) if node.leaf else "INTERNAL\n" + str(node.keys)
        shape = "rectangle" if node.leaf else "ellipse"
        dot.node(node_id, label, shape=shape)

        if not node.leaf:
            for child in node.children:
                self._add_nodes(dot, child)

    def _add_edges(self, dot, node):
        """Add edges between nodes and dashed lines for leaf connections (for visualisation)."""

        node_id = str(id(node))

        if not node.leaf:
            for child in node.children:
                child_id = str(id(child))
                dot.edge(node_id, child_id)
                self._add_edges(dot, child)

        if node.leaf and node.next:
            dot.edge(node_id, str(id(node.next)), style="dashed", constraint="false")