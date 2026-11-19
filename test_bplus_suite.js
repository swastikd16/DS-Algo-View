import assert from 'node:assert';
import { BPlusTree, resetBPlusNodeIdCounter } from './bplus_tree.js';

// Mulberry32 seeded PRNG for 100% reproducible randomized testing
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function assertInvariants(tree, label = '') {
  const invs = tree.validateInvariants();
  const failed = invs.filter(i => !i.valid);
  if (failed.length > 0) {
    console.error(`Invariant failures in [${label}]:`, failed);
    assert.fail(`Invariant failed: ${failed.map(f => `${f.name} (${f.detail})`).join('; ')}`);
  }
}

function getChainedLeafKeys(tree) {
  const keys = [];
  let curr = tree.getFirstLeaf();
  const visited = new Set();
  while (curr) {
    if (visited.has(curr)) throw new Error("Cycle detected in leaf chain!");
    visited.add(curr);
    keys.push(...curr.keys);
    curr = curr.next;
  }
  return keys;
}

function assertTreeMatchesSet(tree, expectedSet, label = '') {
  assertInvariants(tree, label);
  const chainedKeys = getChainedLeafKeys(tree);
  const sortedExpected = Array.from(expectedSet).sort((a, b) => a - b);
  assert.deepStrictEqual(chainedKeys, sortedExpected, `Keys in leaves must match expected set in [${label}]`);

  // Verify search
  for (const k of expectedSet) {
    const res = tree.search(k);
    assert.strictEqual(res.found, true, `Key ${k} must be found in tree in [${label}]`);
  }

  // Probe a few absent keys
  for (const probe of [0, 9999, -5, 12345]) {
    if (!expectedSet.has(probe)) {
      const res = tree.search(probe);
      assert.strictEqual(res.found, false, `Absent key ${probe} must NOT be found in [${label}]`);
    }
  }
}

console.log("=========================================");
console.log("RUNNING COMPREHENSIVE B+ TREE TEST SUITE");
console.log("=========================================\n");

// ---------------------------------------------------------
// Test 1: Basic Insertion & Multi-level Splits (Orders 3, 4, 5, 6)
// ---------------------------------------------------------
console.log("--- Test 1: Basic Insertion & Splits across Orders 3, 4, 5, 6 ---");
for (const order of [3, 4, 5, 6]) {
  resetBPlusNodeIdCounter();
  const tree = new BPlusTree(order);
  const refSet = new Set();
  const keysToInsert = [15, 25, 5, 35, 45, 55, 65, 75, 85, 2, 8, 12, 18, 22, 28, 32, 38, 42, 48];
  
  for (const k of keysToInsert) {
    tree.insert(k);
    refSet.add(k);
    assertTreeMatchesSet(tree, refSet, `Order ${order} insert ${k}`);
  }
  console.log(`✓ Order ${order} passed multi-level split insertion (${keysToInsert.length} keys, height: ${tree.getStats().height}).`);
}

// ---------------------------------------------------------
// Test 2: Duplicate Handling and Searching
// ---------------------------------------------------------
console.log("\n--- Test 2: Duplicate Handling and Searching ---");
{
  const tree = new BPlusTree(4);
  const keys = [10, 20, 30, 40, 50];
  keys.forEach(k => tree.insert(k));
  
  const statsBefore = tree.getStats().totalKeys;
  tree.insert(30); // Duplicate
  tree.insert(10); // Duplicate
  const statsAfter = tree.getStats().totalKeys;
  assert.strictEqual(statsBefore, statsAfter, "Duplicate keys must not increase key count");
  assertInvariants(tree, "Duplicates check");
  console.log("✓ Duplicate keys correctly ignored.");
}

// ---------------------------------------------------------
// Test 3: Deletion Without Underflow
// ---------------------------------------------------------
console.log("\n--- Test 3: Deletion Without Underflow ---");
{
  const tree = new BPlusTree(4);
  // Leaf will contain [10, 20, 30], delete 20 -> [10, 30], minKeys = 1, so no underflow
  [10, 20, 30].forEach(k => tree.insert(k));
  const refSet = new Set([10, 20, 30]);
  tree.delete(20);
  refSet.delete(20);
  assertTreeMatchesSet(tree, refSet, "Delete 20 without underflow");
  console.log("✓ Deletion without underflow passed.");
}

// ---------------------------------------------------------
// Test 4: Borrowing from Left and Right Leaf Siblings
// ---------------------------------------------------------
console.log("\n--- Test 4: Borrowing from Left and Right Siblings ---");
{
  // Test borrow from right sibling
  // Order 4: maxKeys = 3, minKeys = 1
  const tree1 = new BPlusTree(4);
  [10, 20, 30, 40, 50, 60].forEach(k => tree1.insert(k));
  const ref1 = new Set([10, 20, 30, 40, 50, 60]);
  // Leaves: [10, 20], [30, 40], [50, 60]
  // Delete 10, then 20 -> underflows leaf, borrows from right sibling [30, 40]
  tree1.delete(10);
  ref1.delete(10);
  assertTreeMatchesSet(tree1, ref1, "After delete 10");
  tree1.delete(20);
  ref1.delete(20);
  assertTreeMatchesSet(tree1, ref1, "After borrow from right sibling");
  console.log("✓ Borrow from right leaf sibling passed.");

  // Test borrow from left sibling
  const tree2 = new BPlusTree(4);
  [10, 20, 30, 40, 50, 60].forEach(k => tree2.insert(k));
  const ref2 = new Set([10, 20, 30, 40, 50, 60]);
  // Delete 60, then 50 -> underflow rightmost leaf, borrows from left sibling
  tree2.delete(60);
  ref2.delete(60);
  assertTreeMatchesSet(tree2, ref2, "After delete 60");
  tree2.delete(50);
  ref2.delete(50);
  assertTreeMatchesSet(tree2, ref2, "After borrow from left sibling");
  console.log("✓ Borrow from left leaf sibling passed.");
}

// ---------------------------------------------------------
// Test 5: Leaf Merging (Left, Middle, Right)
// ---------------------------------------------------------
console.log("\n--- Test 5: Leaf Merging ---");
{
  const tree = new BPlusTree(4);
  const keys = [10, 20, 30, 40, 50, 60, 70, 80];
  keys.forEach(k => tree.insert(k));
  const ref = new Set(keys);

  // Sequentially delete to trigger merges
  for (const k of [80, 70, 60, 50]) {
    tree.delete(k);
    ref.delete(k);
    assertTreeMatchesSet(tree, ref, `After merging delete of ${k}`);
  }
  console.log("✓ Leaf merging passed.");
}

// ---------------------------------------------------------
// Test 6: Internal Node Borrowing, Merging, & Recursive Underflow
// ---------------------------------------------------------
console.log("\n--- Test 6: Internal Node Rebalancing & Recursive Underflow ---");
{
  for (const order of [3, 4, 5]) {
    const tree = new BPlusTree(order);
    const keys = [];
    for (let i = 1; i <= 30; i++) keys.push(i * 10);
    keys.forEach(k => tree.insert(k));
    const ref = new Set(keys);

    // Delete odd index keys to trigger widespread rebalancing and internal underflows
    for (let i = 1; i <= 30; i += 2) {
      const k = i * 10;
      tree.delete(k);
      ref.delete(k);
      assertTreeMatchesSet(tree, ref, `Order ${order} internal rebalance delete ${k}`);
    }
    console.log(`✓ Order ${order} internal rebalancing & recursive underflow passed.`);
  }
}

// ---------------------------------------------------------
// Test 7: Root Collapse & Full Tree Clear via Deletions
// ---------------------------------------------------------
console.log("\n--- Test 7: Root Collapse & Delete All Keys ---");
{
  for (const order of [3, 4, 5, 6]) {
    const tree = new BPlusTree(order);
    const keys = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    keys.forEach(k => tree.insert(k));
    const ref = new Set(keys);

    for (const k of keys) {
      tree.delete(k);
      ref.delete(k);
      assertTreeMatchesSet(tree, ref, `Order ${order} delete-all key ${k}`);
    }

    assert.strictEqual(tree.root.isLeaf, true, "Empty tree root must be a leaf");
    assert.strictEqual(tree.root.keys.length, 0, "Empty tree root must have 0 keys");
    assert.strictEqual(tree.search(10).found, false, "Search in empty tree must return found: false");
    console.log(`✓ Order ${order} root collapse down to valid empty tree passed.`);
  }
}

// ---------------------------------------------------------
// Test 8: Serialization, Deserialization, & Unique Node IDs
// ---------------------------------------------------------
console.log("\n--- Test 8: Serialization, Deserialization, & Unique IDs ---");
{
  const tree = new BPlusTree(4);
  [10, 20, 30, 40, 50, 60, 70, 80, 90].forEach(k => tree.insert(k));
  const ref = new Set([10, 20, 30, 40, 50, 60, 70, 80, 90]);

  const json = tree.toJSON();
  const restored = BPlusTree.fromJSON(json);
  assertTreeMatchesSet(restored, ref, "Restored tree from JSON");

  // Verify node ID uniqueness on new insertions into restored tree
  const existingNodeIds = new Set();
  const collectIds = (n) => {
    if (!n) return;
    existingNodeIds.add(n.id);
    (n.children || []).forEach(collectIds);
  };
  collectIds(restored.root);

  // Insert more keys to cause new node creation
  [15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115, 125].forEach(k => {
    restored.insert(k);
    ref.add(k);
  });
  assertTreeMatchesSet(restored, ref, "Restored tree after new insertions");

  const newNodeIds = new Set();
  const collectNewIds = (n) => {
    if (!n) return;
    assert(!newNodeIds.has(n.id), `Duplicate node ID ${n.id} found in tree`);
    newNodeIds.add(n.id);
    (n.children || []).forEach(collectNewIds);
  };
  collectNewIds(restored.root);
  console.log(`✓ Serialization round-trip & node ID uniqueness verified (${newNodeIds.size} total nodes).`);
}

// ---------------------------------------------------------
// Test 9: Randomized Stress Test (Orders 3, 4, 5, 6)
// ---------------------------------------------------------
console.log("\n--- Test 9: Randomized Stress Test with Reproducible Seeds ---");
for (const order of [3, 4, 5, 6]) {
  const rng = mulberry32(12345 + order);
  const tree = new BPlusTree(order);
  const refSet = new Set();
  const numOps = 100;

  for (let op = 0; op < numOps; op++) {
    const isInsert = refSet.size === 0 || rng() < 0.6;
    if (isInsert) {
      const key = Math.floor(rng() * 100) + 1;
      tree.insert(key);
      refSet.add(key);
    } else {
      const arr = Array.from(refSet);
      const key = arr[Math.floor(rng() * arr.length)];
      tree.delete(key);
      refSet.delete(key);
    }
    // Verify invariants and exact leaf key match after EVERY single operation
    assertTreeMatchesSet(tree, refSet, `Order ${order} Op #${op}`);
  }
  console.log(`✓ Order ${order} passed ${numOps} randomized operations with 100% invariant checks after every step.`);
}

console.log("\n=========================================");
console.log("ALL B+ TREE TESTS PASSED SUCCESSFULLY! ✓");
console.log("=========================================\n");
