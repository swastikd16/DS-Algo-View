/**
 * Automated Test Suite for all Data Structures:
 * - B-Tree (existing)
 * - B+ Tree
 * - M-Way Search Tree
 * - AVL Tree
 * - Red-Black Tree
 * - Splay Tree
 * - Trie
 */

import assert from 'assert';
import { BTree } from './btree.js';
import { BPlusTree } from './bplus_tree.js';
import { MWayTree } from './mway_tree.js';
import { AVLTree, RedBlackTree, SplayTree } from './bst_trees.js';
import { Trie } from './trie.js';
import {
  MinHeap,
  MaxHeap,
  Deap,
  LeftistHeap,
  SkewHeap,
  BinomialHeap,
  LazyBinomialHeap,
  FibonacciHeap
} from './heaps.js';

console.log("Starting comprehensive Data Structure test suite...\n");

// 1. AVL Tree Tests
console.log("=== Test 1: AVL Tree ===");
const avl = new AVLTree();
// Trigger LL, RR, LR, RL rotations
[10, 20, 30, 40, 50, 25].forEach(k => avl.insert(k));
const avlStats = avl.getStats();
console.log("AVL Stats after inserts:", avlStats);
assert(avlStats.totalKeys === 6, "AVL should have 6 keys");
assert(Math.abs(avlStats.balanceFactor) <= 1, "AVL root balance factor must be <= 1");
let avlInvariants = avl.validateInvariants();
assert(avlInvariants.every(inv => inv.valid), "All AVL invariants must hold");

// Test delete
avl.delete(40);
assert(avl.getStats().totalKeys === 5, "AVL should have 5 keys after delete");
assert(avl.validateInvariants().every(inv => inv.valid), "AVL invariants must hold after delete");
console.log("✓ AVL Tree passed.\n");

// 2. Red-Black Tree Tests
console.log("=== Test 2: Red-Black Tree ===");
const rb = new RedBlackTree();
[10, 20, 30, 15, 25, 5, 1].forEach(k => rb.insert(k));
const rbStats = rb.getStats();
console.log("Red-Black Stats:", rbStats);
assert(rbStats.totalKeys === 7, "Red-Black should have 7 keys");
let rbInvariants = rb.validateInvariants();
assert(rbInvariants.every(inv => inv.valid), "All Red-Black properties must hold");

// Delete black node triggering fixup
rb.delete(20);
assert(rb.validateInvariants().every(inv => inv.valid), "Red-Black properties must hold after delete");
console.log("✓ Red-Black Tree passed.\n");

// 3. Splay Tree Tests
console.log("=== Test 3: Splay Tree ===");
const splay = new SplayTree();
[50, 30, 70, 20, 40].forEach(k => splay.insert(k));
assert(splay.root.key === 40, "Last inserted key 40 should be at root");
splay.search(20);
assert(splay.root.key === 20, "Searched key 20 must be splayed to root");
splay.delete(20);
assert(splay.getStats().totalKeys === 4, "Splay should have 4 keys after delete");
assert(splay.validateInvariants().every(inv => inv.valid), "Splay invariants must hold");
console.log("✓ Splay Tree passed.\n");

// 4. B+ Tree Tests
console.log("=== Test 4: B+ Tree ===");
const bp = new BPlusTree(4);
[10, 20, 30, 40, 50, 60, 70, 25].forEach(k => bp.insert(k));
const bpStats = bp.getStats();
console.log("B+ Tree Stats:", bpStats);
assert(bpStats.totalKeys === 8, "B+ Tree must store all 8 keys in leaves");
assert(bp.validateInvariants().every(inv => inv.valid), "B+ Tree invariants must hold");

// Test search in leaf
const bpSearch = bp.search(25);
assert(bpSearch.found === true, "Key 25 must be found in B+ leaf");

// Test delete
bp.delete(40);
assert(bp.getStats().totalKeys === 7, "B+ Tree should have 7 keys after delete");
assert(bp.validateInvariants().every(inv => inv.valid), "B+ Tree invariants must hold after delete");
console.log("✓ B+ Tree passed.\n");

// 5. M-Way Search Tree Tests
console.log("=== Test 5: M-Way Search Tree ===");
const mway = new MWayTree(4);
const mwayKeys = [10, 20, 5, 6, 12, 30, 7, 17, 3, 16, 22, 25, 35, 45, 1, 2, 8, 9, 11, 40];
mwayKeys.forEach(k => {
  const steps = mway.insert(k);
  // Verify all snapshots are valid and non-sparse
  steps.forEach(st => {
    if (st.treeSnapshot) {
      const verify = (node) => {
        if (!node) return;
        assert(Array.isArray(node.children), "node.children must be an array");
        node.children.forEach(ch => {
          assert(ch !== undefined && ch !== null, "Children in snapshot must never be null or undefined");
          verify(ch);
        });
      };
      verify(st.treeSnapshot);
    }
  });
});
const mwayStats = mway.getStats();
console.log("M-Way Stats after 20 inserts:", mwayStats);
assert(mwayStats.totalKeys === 20, "M-Way should have 20 keys");
assert(mway.validateInvariants().every(inv => inv.valid), "M-Way invariants must hold");

mway.delete(40);
assert(mway.getStats().totalKeys === 19, "M-Way should have 19 keys after delete");
assert(mway.validateInvariants().every(inv => inv.valid), "M-Way invariants must hold after delete");
console.log("✓ M-Way Search Tree passed (zero undefined children across all snapshots).\n");

// 5b. M-Way Search Tree (Order 3 with Alphabetic Keys: E, L, Q, W, B, H, I, C, P, Z, X, S, F)
console.log("=== Test 5b: M-Way Search Tree (Order 3 with Alphabets) ===");
const mwayAlpha = new MWayTree(3);
const examKeys = ['E', 'L', 'Q', 'W', 'B', 'H', 'I', 'C', 'P', 'Z', 'X', 'S', 'F'];
examKeys.forEach(k => {
  const steps = mwayAlpha.insert(k);
  assert(steps.length > 0, `Insert step should be recorded for ${k}`);
});
const alphaStats = mwayAlpha.getStats();
console.log("M-Way Order 3 Alpha Stats:", alphaStats);
assert(alphaStats.totalKeys === 13, "M-Way tree should have exactly 13 alphabet keys");
assert(mwayAlpha.root.keys.join(',') === 'E,L', "Root node of Order-3 M-Way tree must be [E, L]");
assert(mwayAlpha.validateInvariants().every(inv => inv.valid), "All M-Way invariants must hold for alphabet keys");

// Search tests
examKeys.forEach(k => {
  const sRes = mwayAlpha.search(k);
  assert(sRes.found === true, `Key ${k} must be found in M-Way tree`);
});
assert(mwayAlpha.search('M').found === false, "Key 'M' should not be found");

// Delete test
mwayAlpha.delete('F');
assert(mwayAlpha.getStats().totalKeys === 12, "Key count must be 12 after deleting 'F'");
assert(mwayAlpha.validateInvariants().every(inv => inv.valid), "Invariants must hold after delete");
console.log("✓ M-Way Search Tree (Alphabet keys) passed.\n");

// 6. Trie Tests
console.log("=== Test 6: Trie ===");
const trie = new Trie();
const words = ["apple", "app", "application", "bat", "batch", "ball"];
words.forEach(w => trie.insert(w));
const trieStats = trie.getStats();
console.log("Trie Stats:", trieStats);
assert(trieStats.totalWords === 6, "Trie should have 6 registered words");
assert(trie.search("apple").found === true, "Word 'apple' must be found");
assert(trie.search("app").found === true, "Word 'app' must be found");
assert(trie.search("appl").found === false, "'appl' is only a prefix, not a full word");
assert(trie.search("appl").isPrefix === true, "'appl' prefix must be recognized");

trie.delete("apple");
assert(trie.search("apple").found === false, "'apple' must be deleted");
assert(trie.search("application").found === true, "'application' must still exist");
assert(trie.search("app").found === true, "'app' must still exist");
assert(trie.validateInvariants().every(inv => inv.valid), "Trie invariants must hold");
console.log("✓ Trie passed.\n");

// 7. Serialization Tests
console.log("=== Test 7: Serialization & Deserialization ===");
const avlJSON = avl.toJSON();
const restoredAVL = AVLTree.fromJSON(avlJSON);
assert(restoredAVL.getStats().totalKeys === avl.getStats().totalKeys, "Restored AVL key count matches");

const bpJSON = bp.toJSON();
const restoredBP = BPlusTree.fromJSON(bpJSON);
assert(restoredBP.getStats().totalKeys === bp.getStats().totalKeys, "Restored B+ key count matches");

const trieJSON = trie.toJSON();
const restoredTrie = Trie.fromJSON(trieJSON);
assert(restoredTrie.getStats().totalWords === trie.getStats().totalWords, "Restored Trie word count matches");
console.log("✓ Serialization round-trip passed for all structures.\n");

// 8. Unit-2 Heaps Comprehensive Tests
console.log("=== Test 8: Unit-2 Heaps Suite ===");

// 8a. MinHeap
const minH = new MinHeap();
[30, 10, 20, 5, 12, 40].forEach(k => minH.insert(k));
assert.strictEqual(minH.heap[0], 5, "MinHeap root must be minimum (5)");
assert(minH.validateInvariants().every(inv => inv.valid), "All MinHeap invariants must hold");
minH.extractMin();
assert.strictEqual(minH.heap[0], 10, "MinHeap root must be 10 after extracting 5");
assert(minH.validateInvariants().every(inv => inv.valid), "Invariants hold after extractMin");
console.log("✓ MinHeap passed.");

// 8b. MaxHeap
const maxH = new MaxHeap();
[10, 50, 30, 20, 60, 15].forEach(k => maxH.insert(k));
assert.strictEqual(maxH.heap[0], 60, "MaxHeap root must be maximum (60)");
assert(maxH.validateInvariants().every(inv => inv.valid), "All MaxHeap invariants must hold");
maxH.extractMax();
assert.strictEqual(maxH.heap[0], 50, "MaxHeap root must be 50 after extracting 60");
assert(maxH.validateInvariants().every(inv => inv.valid), "Invariants hold after extractMax");
console.log("✓ MaxHeap passed.");

// 8c. Deap
const deap = new Deap();
[10, 5, 25, 4, 30, 8, 40, 2, 50].forEach(k => deap.insert(k));
assert.strictEqual(deap.deap[2], 2, "Deap min root must be 2");
assert.strictEqual(deap.deap[3], 50, "Deap max root must be 50");
assert(deap.validateInvariants().every(inv => inv.valid), "All Deap invariants must hold");
deap.deleteMin();
assert.strictEqual(deap.deap[2], 4, "Deap min root must be 4 after deleting 2");
deap.deleteMax();
assert.strictEqual(deap.deap[3], 40, "Deap max root must be 40 after deleting 50");
assert(deap.validateInvariants().every(inv => inv.valid), "Invariants hold after deleteMin/Max");
console.log("✓ Deap passed.");

// 8d. LeftistHeap
const leftist = new LeftistHeap();
[15, 10, 25, 5, 30, 8].forEach(k => leftist.insert(k));
assert.strictEqual(leftist.root.key, 5, "LeftistHeap root must be 5");
assert(leftist.validateInvariants().every(inv => inv.valid), "All LeftistHeap invariants must hold");
leftist.extractMin();
assert.strictEqual(leftist.root.key, 8, "LeftistHeap root must be 8 after extracting 5");
console.log("✓ LeftistHeap passed.");

// 8e. SkewHeap
const skew = new SkewHeap();
[20, 10, 40, 5, 15, 30].forEach(k => skew.insert(k));
assert.strictEqual(skew.root.key, 5, "SkewHeap root must be 5");
assert(skew.validateInvariants().every(inv => inv.valid), "All SkewHeap invariants must hold");
skew.extractMin();
assert.strictEqual(skew.root.key, 10, "SkewHeap root must be 10 after extracting 5");
console.log("✓ SkewHeap passed.");

// 8f. BinomialHeap
const binom = new BinomialHeap();
[12, 7, 25, 15, 28, 33, 41, 1].forEach(k => binom.insert(k));
assert.strictEqual(binom.getStats().totalKeys, 8, "BinomialHeap must have 8 keys");
assert(binom.validateInvariants().every(inv => inv.valid), "All BinomialHeap invariants must hold");
assert.strictEqual(binom._findMinRoot().key, 1, "Min root must be 1");
binom.extractMin();
assert.strictEqual(binom.getStats().totalKeys, 7, "BinomialHeap must have 7 keys after extracting 1");
assert.strictEqual(binom._findMinRoot().key, 7, "New min root must be 7");
console.log("✓ BinomialHeap passed.");

// 8g. LazyBinomialHeap
const lazy = new LazyBinomialHeap();
[10, 20, 5, 40, 15, 30].forEach(k => lazy.insert(k));
assert.strictEqual(lazy.getStats().totalKeys, 6, "LazyBinomialHeap must have 6 keys");
lazy.extractMin();
assert.strictEqual(lazy.getStats().totalKeys, 5, "LazyBinomialHeap has 5 keys after extractMin");
assert(lazy.validateInvariants().every(inv => inv.valid), "Invariants hold after consolidation");
console.log("✓ LazyBinomialHeap passed.");

// 8h. FibonacciHeap
const fib = new FibonacciHeap();
[23, 7, 3, 17, 24, 18, 52, 38, 30, 26, 46].forEach(k => fib.insert(k));
assert.strictEqual(fib.minNode.key, 3, "Fibonacci min must be 3");
fib.extractMin();
assert.strictEqual(fib.minNode.key, 7, "Fibonacci min must be 7 after extracting 3");
fib.decreaseKey(46, 2);
assert.strictEqual(fib.minNode.key, 2, "Decreased key 46 -> 2 must become new min");
assert(fib.validateInvariants().every(inv => inv.valid), "Invariants hold");
console.log("✓ FibonacciHeap passed.\n");

// === Test 9: Dual View Array Serialization Verification ===
console.log("=== Test 9: Dual View Array Serialization ===");
const testMin = new MinHeap();
[10, 20, 5, 30].forEach(k => testMin.insert(k));
assert.strictEqual(testMin.heap[0], 5, "Min heap root at index 0 must be 5 (displayed as index 1 in UI)");
assert.strictEqual(testMin.heap.length, 4, "Heap array length must be 4");

const testDeap = new Deap();
[10, 5, 25, 4, 30].forEach(k => testDeap.insert(k));
assert(testDeap.deap.length >= 6, "Deap array must store items starting at index 2");
assert(testDeap._isMinSubtree(2), "Index 2 must be in Min subtree");
assert(!testDeap._isMinSubtree(3), "Index 3 must be in Max subtree");
console.log("✓ Dual View Array representation verified.\n");

console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! (All 15 Data Structures Green)");
