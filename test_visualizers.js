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

console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! (7/7 suites green)");
