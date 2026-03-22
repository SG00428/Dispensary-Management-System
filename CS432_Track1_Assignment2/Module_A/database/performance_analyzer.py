import random
import time
import tracemalloc
import matplotlib.pyplot as plt
from .bplustree import BPlusTree
from .bruteforce import BruteForceDB


class PerformanceAnalyzer:

    # BENCHMARK: INSERT

    def benchmark_insert(self, n):
        """Measure insertion time for n random keys in both structures."""
        tree  = BPlusTree(order=4)
        brute = BruteForceDB()
        keys  = random.sample(range(1, n * 10), n)

        start = time.perf_counter()
        for k in keys:
            tree.insert(k, k)
        tree_time = time.perf_counter() - start

        start = time.perf_counter()
        for k in keys:
            brute.insert(k, k)
        brute_time = time.perf_counter() - start

        return tree_time, brute_time

    

    # BENCHMARK: SEARCH

    def benchmark_search(self, tree, brute, keys):
        """
        Measure search time using pre-built structures and keys.
        """
        search_keys = random.sample(keys, min(500, len(keys)))

        start = time.perf_counter()
        for k in search_keys:
            tree.search(k)
        tree_time = time.perf_counter() - start

        start = time.perf_counter()
        for k in search_keys:
            brute.search(k)
        brute_time = time.perf_counter() - start

        return tree_time, brute_time

    
    # BENCHMARK: DELETE

    def benchmark_delete(self, tree, brute, keys):
  
        delete_keys = random.sample(keys, min(300, len(keys)))

        start = time.perf_counter()
        for k in delete_keys:
            tree.delete(k)
        tree_time = time.perf_counter() - start

        start = time.perf_counter()
        for k in delete_keys:
            brute.delete(k)
        brute_time = time.perf_counter() - start

        return tree_time, brute_time


    # BENCHMARK: RANGE QUERY

    def benchmark_range_query(self, tree, brute, n):

        start_key = n // 4
        end_key   = n // 2

        start = time.perf_counter()
        tree.range_query(start_key, end_key)
        tree_time = time.perf_counter() - start

        start = time.perf_counter()
        brute.range_query(start_key, end_key)
        brute_time = time.perf_counter() - start

        return tree_time, brute_time

    
    # BENCHMARK: RANDOM MIXED OPERATIONS

    def benchmark_random(self, n):
        """
        Random mix of insert / search / delete.
        Total operations are capped at 1000 regardless of n,
        so this stays fast even at n = 100,000.
        """
        OPS_CAP = 1000
        n_ops   = min(n, OPS_CAP)

        ops = (
            ["insert"] * (n_ops // 2) +
            ["search"] * (n_ops // 3) +
            ["delete"] * (n_ops // 6)
        )
        random.shuffle(ops)

        all_keys = random.sample(range(1, n * 10), n_ops)

        def run(struct):
            inserted = []
            key_iter = iter(all_keys)
            for op in ops:
                if op == "insert":
                    try:
                        k = next(key_iter)
                        struct.insert(k, k)
                        inserted.append(k)
                    except StopIteration:
                        pass
                elif op == "search" and inserted:
                    struct.search(random.choice(inserted))
                elif op == "delete" and inserted:
                    k = random.choice(inserted)
                    struct.delete(k)
                    inserted.remove(k)

        tree  = BPlusTree(order=4)
        start = time.perf_counter()
        run(tree)
        tree_time = time.perf_counter() - start

        brute = BruteForceDB()
        start = time.perf_counter()
        run(brute)
        brute_time = time.perf_counter() - start

        return tree_time, brute_time

    
    # BENCHMARK: MEMORY USAGE

    def benchmark_memory(self, n):
        """
        Peak memory (KB) for inserting n keys.
        Only called at sampled sizes inside plot_results.
        """
        keys = random.sample(range(1, n * 10), n)

        tracemalloc.start()
        tree = BPlusTree(order=4)
        for k in keys:
            tree.insert(k, k)
        _, tree_peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        tracemalloc.start()
        brute = BruteForceDB()
        for k in keys:
            brute.insert(k, k)
        _, brute_peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        return tree_peak / 1024, brute_peak / 1024

    
    # RESULTS  

    def plot_results(self, sizes):
 
        results = {
            "insert":      {"tree": [], "brute": []},
            "search":      {"tree": [], "brute": []},
            "delete":      {"tree": [], "brute": []},
            "range_query": {"tree": [], "brute": []},
            "random":      {"tree": [], "brute": []},
            "memory_kb":   {"tree": [], "brute": []},
        }


        mem_sample_indices = set(
            round(i * (len(sizes) - 1) / 9) for i in range(10)
        )
        mem_tree  = {}
        mem_brute = {}

        print(f"Running benchmarks over {len(sizes)} sizes "
              f"({sizes[0]} to {sizes[-1]}) ...")

        for idx, n in enumerate(sizes):

            # ── Build once, reuse for search / delete / range ──
            keys  = random.sample(range(1, n * 10), n)
            tree  = BPlusTree(order=4)
            brute = BruteForceDB()
            for k in keys:
                tree.insert(k, k)
                brute.insert(k, k)

            # Insert (uses fresh structures internally)
            t, b = self.benchmark_insert(n)
            results["insert"]["tree"].append(t)
            results["insert"]["brute"].append(b)

            # Search
            t, b = self.benchmark_search(tree, brute, keys)
            results["search"]["tree"].append(t)
            results["search"]["brute"].append(b)

            # Delete
            t, b = self.benchmark_delete(tree, brute, keys)
            results["delete"]["tree"].append(t)
            results["delete"]["brute"].append(b)

            # Range Query
            t, b = self.benchmark_range_query(tree, brute, n)
            results["range_query"]["tree"].append(t)
            results["range_query"]["brute"].append(b)

            # Random Mixed
            t, b = self.benchmark_random(n)
            results["random"]["tree"].append(t)
            results["random"]["brute"].append(b)

            # Memory — only at sampled indices
            if idx in mem_sample_indices:
                mt, mb = self.benchmark_memory(n)
                mem_tree[idx]  = mt
                mem_brute[idx] = mb

        # Linear-interpolate memory for non-sampled indices
        mem_indices = sorted(mem_tree.keys())
        for idx in range(len(sizes)):
            lo = max((i for i in mem_indices if i <= idx), default=mem_indices[0])
            hi = min((i for i in mem_indices if i >= idx), default=mem_indices[-1])
            if lo == hi:
                results["memory_kb"]["tree"].append(mem_tree[lo])
                results["memory_kb"]["brute"].append(mem_brute[lo])
            else:
                frac = (idx - lo) / (hi - lo)
                results["memory_kb"]["tree"].append(
                    mem_tree[lo] + frac * (mem_tree[hi] - mem_tree[lo]))
                results["memory_kb"]["brute"].append(
                    mem_brute[lo] + frac * (mem_brute[hi] - mem_brute[lo]))


        
        fig, axes = plt.subplots(2, 3, figsize=(16, 9))
        fig.suptitle("B+ Tree vs Brute Force — Performance Benchmarks", fontsize=14)

        configs = [
            ("insert",      "Insertion Time (s)",      "Insertion"),
            ("search",      "Search Time (s)",          "Exact Search"),
            ("delete",      "Deletion Time (s)",        "Deletion"),
            ("range_query", "Range Query Time (s)",     "Range Query"),
            ("random",      "Mixed Ops Time (s)",       "Random Mixed Ops"),
            ("memory_kb",   "Peak Memory (KB)",         "Memory Usage"),
        ]

        for ax, (key, ylabel, title) in zip(axes.flat, configs):
            ax.plot(sizes, results[key]["tree"],  label="B+ Tree",
                    color="steelblue")
            ax.plot(sizes, results[key]["brute"], label="Brute Force",
                    color="tomato", linestyle="--")
            ax.set_title(title)
            ax.set_xlabel("Number of Keys (n)")
            ax.set_ylabel(ylabel)
            ax.legend()
            ax.grid(True)

        plt.tight_layout()
        plt.show()

        return results