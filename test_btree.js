import { BTree, BTreeNode } from './btree.js';
import assert from 'assert';

console.log("🚀 Testing B-Tree with Order M specification...");

function runTests() {
  // Test Order M = 4
  // maxKeys = 3, minKeys = ceil(4/2) - 1 = 1
  console.log("Test 1: Order M = 4 (2-3-4 tree)");
  const tree4 = new BTree(4);
  assert.strictEqual(tree4.maxKeys, 3);
  assert.strictEqual(tree4.minKeys, 1);
  assert.strictEqual(tree4.maxChildren, 4);
  assert.strictEqual(tree4.minChildren, 2);

  const keys = [10, 20, 30, 40, 50, 60, 70, 80, 90, 15, 25, 35, 45, 55, 65, 75, 85, 95];
  for (const k of keys) {
    tree4.insert(k);
    const inv = tree4.validateInvariants();
    assert.strictEqual(inv.valid, true, `Invariant failed after inserting ${k}: ${inv.errors.join('; ')}`);
  }
  console.log(`  ✓ Inserted ${keys.length} keys in M=4 tree. Height: ${tree4.getStats().height}`);

  // Deletions on M=4
  const delKeys = [40, 10, 90, 50, 20, 30, 15, 70, 80, 60, 25, 35, 45, 55, 65, 75, 85, 95];
  for (const k of delKeys) {
    tree4.delete(k);
    const inv = tree4.validateInvariants();
    assert.strictEqual(inv.valid, true, `Invariant failed after deleting ${k}: ${inv.errors.join('; ')}`);
  }
  assert.strictEqual(tree4.getStats().totalKeys, 0);
  console.log("  ✓ All deletions passed for M=4");

  // Test Order M = 3 (2-3 tree)
  // maxKeys = 2, minKeys = ceil(3/2) - 1 = 1
  console.log("Test 2: Order M = 3 (2-3 tree)");
  const tree3 = new BTree(3);
  assert.strictEqual(tree3.maxKeys, 2);
  assert.strictEqual(tree3.minKeys, 1);
  assert.strictEqual(tree3.maxChildren, 3);
  assert.strictEqual(tree3.minChildren, 2);

  const keys3 = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  for (const k of keys3) {
    tree3.insert(k);
    const inv = tree3.validateInvariants();
    assert.strictEqual(inv.valid, true, `Invariant failed M=3 after insert ${k}: ${inv.errors.join('; ')}`);
  }
  console.log(`  ✓ Inserted ${keys3.length} keys in M=3 tree`);

  // Test Order M = 5
  // maxKeys = 4, minKeys = ceil(5/2) - 1 = 2
  console.log("Test 3: Order M = 5");
  const tree5 = new BTree(5);
  assert.strictEqual(tree5.maxKeys, 4);
  assert.strictEqual(tree5.minKeys, 2);
  assert.strictEqual(tree5.maxChildren, 5);
  assert.strictEqual(tree5.minChildren, 3);

  for (let i = 1; i <= 30; i++) {
    tree5.insert(i * 3);
    const inv = tree5.validateInvariants();
    assert.strictEqual(inv.valid, true, `Invariant failed M=5 after insert ${i*3}: ${inv.errors.join('; ')}`);
  }
  // Test 4: User's exact scenario using Cormen (CLRS) Deletion
  // Tree: Root [120] -> [70], [150]
  // [70] -> [50, 60], [80, 100, 110]
  // [150] -> [130, 140], [160]
  console.log("Test 4: User scenario deleting 60 using Cormen (CLRS) Top-Down method");
  function buildUserTree() {
    const t = new BTree(4);
    const root = new BTreeNode(false, 'test_root');
    root.keys = [120];
    const n70 = new BTreeNode(false, 'test_n70');
    n70.keys = [70];
    const n150 = new BTreeNode(false, 'test_n150');
    n150.keys = [150];
    const n50_60 = new BTreeNode(true, 'test_leaf1');
    n50_60.keys = [50, 60];
    const n80_110 = new BTreeNode(true, 'test_leaf2');
    n80_110.keys = [80, 100, 110];
    const n130_140 = new BTreeNode(true, 'test_leaf3');
    n130_140.keys = [130, 140];
    const n160 = new BTreeNode(true, 'test_leaf4');
    n160.keys = [160];

    n70.children = [n50_60, n80_110];
    n150.children = [n130_140, n160];
    root.children = [n70, n150];
    t.root = root;
    return t;
  }

  const clrsTree = buildUserTree();
  assert.strictEqual(clrsTree.search(60).found, true);
  const clrsDelRes = clrsTree.delete(60, 'clrs');
  assert.strictEqual(clrsDelRes.success, true);
  assert.strictEqual(clrsTree.search(60).found, false);

  // In Cormen mode, child [70] has minKeys = 1, sibling [150] has minKeys = 1, so Cormen Case 3b merges them proactively
  const clrsHadCase3 = clrsDelRes.steps.some(s => s.type === 'clrs_case_3_preemptive');
  assert.strictEqual(clrsHadCase3, true, "Cormen CLRS mode MUST trigger Case 3 preemptive check on child [70]");
  const clrsInv = clrsTree.validateInvariants();
  assert.strictEqual(clrsInv.valid, true, `CLRS tree must satisfy all Order 4 invariants: ${clrsInv.errors.join('; ')}`);
  console.log("  ✓ Cormen (CLRS) successfully executed Case 3b merge and deleted 60!");

  // Test 5: Same scenario using Standard Reactive (Bottom-Up) Deletion
  console.log("Test 5: User scenario deleting 60 using Standard Reactive (Bottom-Up) method");
  const reactiveTree = buildUserTree();
  assert.strictEqual(reactiveTree.search(60).found, true);
  const reactiveDelRes = reactiveTree.delete(60, 'reactive');
  assert.strictEqual(reactiveDelRes.success, true);
  assert.strictEqual(reactiveTree.search(60).found, false);

  // In Reactive mode, leaf [50, 60] loses 60 leaving [50] (1 key >= minKeys = 1), so NO merge occurs!
  const reactiveHadMerge = reactiveDelRes.steps.some(s => s.actionCategory === 'merge');
  assert.strictEqual(reactiveHadMerge, false, "Reactive mode MUST NOT trigger merge because leaf [50] has 1 key >= minKeys (1)");
  const reactiveInv = reactiveTree.validateInvariants();
  assert.strictEqual(reactiveInv.valid, true, `Reactive tree must satisfy all Order 4 invariants: ${reactiveInv.errors.join('; ')}`);
  console.log("  ✓ Reactive mode successfully deleted 60 directly from leaf with ZERO merges!");

  // Test 6: B-Tree persistence roundtrip (toJSON / fromJSON)
  console.log("Test 6: B-Tree persistence serialization and restoration");
  const origTree = buildUserTree();
  const serialized = origTree.toJSON();
  const jsonStr = JSON.stringify(serialized);
  const parsed = JSON.parse(jsonStr);
  const restoredTree = BTree.fromJSON(parsed);

  assert.strictEqual(restoredTree.M, origTree.M);
  assert.strictEqual(restoredTree.deletionStrategy, origTree.deletionStrategy);
  assert.strictEqual(restoredTree.getStats().totalKeys, origTree.getStats().totalKeys);
  assert.strictEqual(restoredTree.getStats().height, origTree.getStats().height);
  assert.strictEqual(restoredTree.search(60).found, true);
  assert.strictEqual(restoredTree.search(120).found, true);
  assert.strictEqual(restoredTree.search(999).found, false);
  const restoredInv = restoredTree.validateInvariants();
  assert.strictEqual(restoredInv.valid, true);

  // Perform a deletion on restored tree to verify operations work seamlessly after restore
  const restoredDel = restoredTree.delete(60, 'clrs');
  assert.strictEqual(restoredDel.success, true);
  assert.strictEqual(restoredTree.search(60).found, false);
  console.log("  ✓ Serialization roundtrip succeeded and restored tree performs operations correctly!");

  // Test 7: Undo / Redo sequence test
  console.log("Test 7: Undo and Redo sequence verification");
  const t = new BTree(4);
  t.insert(10);
  t.insert(20);
  const snap1 = t.toJSON();
  t.insert(30);
  const snap2 = t.toJSON();

  // Undo back to snap1
  const undoTree = BTree.fromJSON(snap1);
  assert.strictEqual(undoTree.getStats().totalKeys, 2);
  assert.strictEqual(undoTree.search(30).found, false);

  // Redo back to snap2
  const redoTree = BTree.fromJSON(snap2);
  assert.strictEqual(redoTree.getStats().totalKeys, 3);
  assert.strictEqual(redoTree.search(30).found, true);
  console.log("  ✓ Undo / Redo state serialization and rollback verified!");

  console.log("\n🎉 ALL ORDER M TESTS (INCLUDING CORMEN, REACTIVE, PERSISTENCE, & UNDO/REDO) PASSED!");
}

runTests();
