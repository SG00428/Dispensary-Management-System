try:
    from graphviz import Digraph
    _GRAPHVIZ_AVAILABLE = True
except ImportError:
    _GRAPHVIZ_AVAILABLE = False


class BPlusTreeNode:
    def __init__(self, leaf=False):
        self.leaf = leaf
        self.keys = []
        self.children = []   # leaf: parallel list of values; internal: child nodes
        self.next = None     # leaf-level linked list


class BPlusTree:

    def __init__(self, order=4):
        self.root = BPlusTreeNode(leaf=True)
        self.order = order

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def search(self, key, node=None):
        if node is None:
            node = self.root

        i = 0
        while i < len(node.keys) and key > node.keys[i]:
            i += 1

        if node.leaf:
            if i < len(node.keys) and node.keys[i] == key:
                return node.children[i]
            return None
        return self.search(key, node.children[i])

    # ------------------------------------------------------------------
    # Insert
    # ------------------------------------------------------------------

    def insert(self, key, value):
        root = self.root

        if len(root.keys) == self.order - 1:
            new_root = BPlusTreeNode(leaf=False)
            new_root.children.append(root)
            self._split_child(new_root, 0)
            self.root = new_root

        self._insert_non_full(self.root, key, value)

    def _insert_non_full(self, node, key, value):
        if node.leaf:
            i = 0
            while i < len(node.keys) and key > node.keys[i]:
                i += 1
            node.keys.insert(i, key)
            node.children.insert(i, value)
        else:
            i = 0
            while i < len(node.keys) and key > node.keys[i]:
                i += 1

            child = node.children[i]
            if len(child.keys) == self.order - 1:
                self._split_child(node, i)
                if key > node.keys[i]:
                    i += 1

            self._insert_non_full(node.children[i], key, value)

    def _split_child(self, parent, index):
        node = parent.children[index]
        new_node = BPlusTreeNode(leaf=node.leaf)
        mid = self.order // 2

        parent.keys.insert(index, node.keys[mid])
        parent.children.insert(index + 1, new_node)

        new_node.keys = node.keys[mid:]
        node.keys = node.keys[:mid]

        if node.leaf:
            new_node.children = node.children[mid:]
            node.children = node.children[:mid]
            new_node.next = node.next
            node.next = new_node
        else:
            new_node.children = node.children[mid + 1:]
            node.children = node.children[:mid + 1]

    # ------------------------------------------------------------------
    # Delete  (FIXED — full recursive implementation)
    # ------------------------------------------------------------------

    def delete(self, key):
        """Delete key from the tree.  Returns True if found & deleted."""
        deleted = self._delete(self.root, key)

        # If the root has been emptied after a merge, shrink the tree.
        if not self.root.leaf and len(self.root.keys) == 0:
            self.root = self.root.children[0]

        return deleted

    def _delete(self, node, key):
        t = self.order // 2   # minimum number of keys a node must hold

        if node.leaf:
            # Base case: try to remove from this leaf.
            if key in node.keys:
                idx = node.keys.index(key)
                node.keys.pop(idx)
                node.children.pop(idx)
                return True
            return False

        # Find the child that should contain key.
        i = 0
        while i < len(node.keys) and key > node.keys[i]:
            i += 1

        child = node.children[i]
        deleted = self._delete(child, key)

        # Fix underflow if necessary (minimum keys = t - 1).
        if len(child.keys) < t - 1:
            self._fix_underflow(node, i)

        return deleted

    def _fix_underflow(self, parent, idx):
        """Borrow from a sibling or merge when a child falls below minimum."""
        t = self.order // 2
        child = parent.children[idx]

        # Try to borrow from left sibling.
        if idx > 0:
            left = parent.children[idx - 1]
            if len(left.keys) >= t:
                self._borrow_from_left(parent, idx)
                return

        # Try to borrow from right sibling.
        if idx < len(parent.children) - 1:
            right = parent.children[idx + 1]
            if len(right.keys) >= t:
                self._borrow_from_right(parent, idx)
                return

        # Must merge.
        if idx > 0:
            self._merge(parent, idx - 1)   # merge child into left sibling
        else:
            self._merge(parent, idx)       # merge right sibling into child

    def _borrow_from_left(self, parent, idx):
        child = parent.children[idx]
        left  = parent.children[idx - 1]

        if child.leaf:
            # Move the last key/value of left into the front of child.
            child.keys.insert(0, left.keys.pop(-1))
            child.children.insert(0, left.children.pop(-1))
            parent.keys[idx - 1] = child.keys[0]
        else:
            child.keys.insert(0, parent.keys[idx - 1])
            parent.keys[idx - 1] = left.keys.pop(-1)
            child.children.insert(0, left.children.pop(-1))

    def _borrow_from_right(self, parent, idx):
        child = parent.children[idx]
        right = parent.children[idx + 1]

        if child.leaf:
            child.keys.append(right.keys.pop(0))
            child.children.append(right.children.pop(0))
            parent.keys[idx] = right.keys[0]
        else:
            child.keys.append(parent.keys[idx])
            parent.keys[idx] = right.keys.pop(0)
            child.children.append(right.children.pop(0))

    def _merge(self, parent, idx):
        """Merge parent.children[idx+1] into parent.children[idx]."""
        left  = parent.children[idx]
        right = parent.children[idx + 1]

        if not left.leaf:
            left.keys.append(parent.keys[idx])

        left.keys.extend(right.keys)
        left.children.extend(right.children)

        if left.leaf:
            left.next = right.next

        parent.keys.pop(idx)
        parent.children.pop(idx + 1)

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    def update(self, key, new_value):
        node = self.root
        while not node.leaf:
            i = 0
            while i < len(node.keys) and key > node.keys[i]:
                i += 1
            node = node.children[i]

        if key in node.keys:
            idx = node.keys.index(key)
            node.children[idx] = new_value
            return True
        return False

    # ------------------------------------------------------------------
    # Range query & full scan
    # ------------------------------------------------------------------

    def range_query(self, start_key, end_key):
        node = self.root
        while not node.leaf:
            node = node.children[0]

        results = []
        while node:
            for i, key in enumerate(node.keys):
                if key > end_key:
                    return results
                if key >= start_key:
                    results.append((key, node.children[i]))
            node = node.next
        return results

    def get_all(self):
        node = self.root
        while not node.leaf:
            node = node.children[0]

        results = []
        while node:
            for i, key in enumerate(node.keys):
                results.append((key, node.children[i]))
            node = node.next
        return results

    # ------------------------------------------------------------------
    # Serialization  (for durability — persist to / restore from disk)
    # ------------------------------------------------------------------

    def to_dict(self):
        """Convert the entire tree to a JSON-serializable dict."""
        return {"order": self.order, "root": self._node_to_dict(self.root)}

    def _node_to_dict(self, node):
        d = {"leaf": node.leaf, "keys": node.keys}
        if node.leaf:
            d["values"] = node.children
        else:
            d["children"] = [self._node_to_dict(c) for c in node.children]
        return d

    @classmethod
    def from_dict(cls, data):
        """Reconstruct a BPlusTree from a dict produced by to_dict()."""
        tree = cls(order=data["order"])
        tree.root = cls._node_from_dict(data["root"])
        cls._relink_leaves(tree.root)
        return tree

    @staticmethod
    def _node_from_dict(d):
        node = BPlusTreeNode(leaf=d["leaf"])
        node.keys = d["keys"]
        if d["leaf"]:
            node.children = d["values"]
        else:
            node.children = [BPlusTree._node_from_dict(c) for c in d["children"]]
        return node

    @staticmethod
    def _relink_leaves(node):
        """Rebuild the leaf-level linked list after deserialization."""
        leaves = []
        BPlusTree._collect_leaves(node, leaves)
        for i in range(len(leaves) - 1):
            leaves[i].next = leaves[i + 1]

    @staticmethod
    def _collect_leaves(node, acc):
        if node.leaf:
            acc.append(node)
        else:
            for child in node.children:
                BPlusTree._collect_leaves(child, acc)

    # ------------------------------------------------------------------
    # Visualization (optional — requires graphviz)
    # ------------------------------------------------------------------

    def visualize_tree(self):
        if not _GRAPHVIZ_AVAILABLE:
            raise RuntimeError("graphviz package not installed.")
        dot = Digraph()
        self._add_nodes(dot, self.root)
        self._add_edges(dot, self.root)
        return dot

    def _add_nodes(self, dot, node):
        node_id = str(id(node))
        dot.node(node_id, str(node.keys))
        if not node.leaf:
            for child in node.children:
                self._add_nodes(dot, child)

    def _add_edges(self, dot, node):
        node_id = str(id(node))
        if not node.leaf:
            for child in node.children:
                dot.edge(node_id, str(id(child)))
                self._add_edges(dot, child)
        if node.leaf and node.next:
            dot.edge(str(id(node)), str(id(node.next)), style="dashed")