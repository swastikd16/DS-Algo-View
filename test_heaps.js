import assert from 'assert';
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

console.log("Starting Unit-2 Heaps Verification Test Suite...\n");

// 1. MinHeap
console.log("=== Test 1: MinHeap ===");
const minH = new MinHeap();
[30, 10, 20, 5, 12, 40].forEach(k => minH.insert(k));
assert.strictEqual(minH.heap[0], 5, "MinHeap root must be minimum (5)");
let invs = minH.validateInvariants();
assert(invs.every(inv => inv.valid), "All MinHeap invariants must hold");
minH.extractMin();
assert.strictEqual(minH.heap[0], 10, "MinHeap root must be 10 after extracting 5");
assert(minH.validateInvariants().every(inv => inv.valid), "Invariants hold after extractMin");
console.log("✓ MinHeap passed.\n");

// 2. MaxHeap
console.log("=== Test 2: MaxHeap ===");
const maxH = new MaxHeap();
[10, 50, 30, 20, 60, 15].forEach(k => maxH.insert(k));
assert.strictEqual(maxH.heap[0], 60, "MaxHeap root must be maximum (60)");
assert(maxH.validateInvariants().every(inv => inv.valid), "All MaxHeap invariants must hold");
maxH.extractMax();
assert.strictEqual(maxH.heap[0], 50, "MaxHeap root must be 50 after extracting 60");
assert(maxH.validateInvariants().every(inv => inv.valid), "Invariants hold after extractMax");
console.log("✓ MaxHeap passed.\n");

// 3. Deap
console.log("=== Test 3: Deap (Double-Ended Priority Queue) ===");
const deap = new Deap();
const deapKeys = [10, 5, 25, 4, 30, 8, 40, 2, 50];
deapKeys.forEach(k => deap.insert(k));
assert(deap.deap[2] === 2, "Deap min root (pos 2) must be minimum 2");
assert(deap.deap[3] === 50, "Deap max root (pos 3) must be maximum 50");
assert(deap.validateInvariants().every(inv => inv.valid), "All Deap invariants must hold");
deap.deleteMin();
assert(deap.deap[2] === 4, "Deap min root must be 4 after deleting 2");
assert(deap.validateInvariants().every(inv => inv.valid), "Invariants hold after deleteMin");
deap.deleteMax();
assert(deap.deap[3] === 40, "Deap max root must be 40 after deleting 50");
assert(deap.validateInvariants().every(inv => inv.valid), "Invariants hold after deleteMax");
console.log("✓ Deap passed.\n");

// 4. LeftistHeap
console.log("=== Test 4: LeftistHeap ===");
const leftist = new LeftistHeap();
[15, 10, 25, 5, 30, 8].forEach(k => leftist.insert(k));
assert.strictEqual(leftist.root.key, 5, "LeftistHeap root must be 5");
assert(leftist.validateInvariants().every(inv => inv.valid), "All LeftistHeap invariants must hold");
leftist.extractMin();
assert.strictEqual(leftist.root.key, 8, "LeftistHeap root must be 8 after extracting 5");
assert(leftist.validateInvariants().every(inv => inv.valid), "Invariants hold after extractMin");
console.log("✓ LeftistHeap passed.\n");

// 5. SkewHeap
console.log("=== Test 5: SkewHeap ===");
const skew = new SkewHeap();
[20, 10, 40, 5, 15, 30].forEach(k => skew.insert(k));
assert.strictEqual(skew.root.key, 5, "SkewHeap root must be 5");
assert(skew.validateInvariants().every(inv => inv.valid), "All SkewHeap invariants must hold");
skew.extractMin();
assert.strictEqual(skew.root.key, 10, "SkewHeap root must be 10 after extracting 5");
assert(skew.validateInvariants().every(inv => inv.valid), "Invariants hold after extractMin");
console.log("✓ SkewHeap passed.\n");

// 6. BinomialHeap
console.log("=== Test 6: BinomialHeap ===");
const binom = new BinomialHeap();
[12, 7, 25, 15, 28, 33, 41, 1].forEach(k => binom.insert(k));
assert.strictEqual(binom.getStats().totalKeys, 8, "BinomialHeap must have 8 keys");
assert(binom.validateInvariants().every(inv => inv.valid), "All BinomialHeap invariants must hold");
assert.strictEqual(binom._findMinRoot().key, 1, "Min root must be 1");
binom.extractMin();
assert.strictEqual(binom.getStats().totalKeys, 7, "BinomialHeap must have 7 keys after extracting 1");
assert.strictEqual(binom._findMinRoot().key, 7, "New min root must be 7");
assert(binom.validateInvariants().every(inv => inv.valid), "Invariants hold after extractMin");
console.log("✓ BinomialHeap passed.\n");

// 7. LazyBinomialHeap
console.log("=== Test 7: LazyBinomialHeap ===");
const lazy = new LazyBinomialHeap();
[10, 20, 5, 40, 15, 30].forEach(k => lazy.insert(k));
assert.strictEqual(lazy.getStats().totalKeys, 6, "LazyBinomialHeap must have 6 keys");
assert(lazy.validateInvariants().every(inv => inv.valid), "Invariants hold");
lazy.extractMin(); // triggers consolidation
assert.strictEqual(lazy.getStats().totalKeys, 5, "LazyBinomialHeap has 5 keys after extractMin");
assert(lazy.validateInvariants().every(inv => inv.valid), "Invariants hold after consolidation");
console.log("✓ LazyBinomialHeap passed.\n");

// 8. FibonacciHeap
console.log("=== Test 8: FibonacciHeap ===");
const fib = new FibonacciHeap();
[23, 7, 3, 17, 24, 18, 52, 38, 30, 26, 46].forEach(k => fib.insert(k));
assert.strictEqual(fib.minNode.key, 3, "Fibonacci min must be 3");
assert(fib.validateInvariants().every(inv => inv.valid), "Invariants hold");
fib.extractMin(); // triggers consolidation
assert.strictEqual(fib.minNode.key, 7, "Fibonacci min must be 7 after extracting 3");
assert(fib.validateInvariants().every(inv => inv.valid), "Invariants hold after extractMin");
// Test decrease key & cascading cut
fib.decreaseKey(46, 2);
assert.strictEqual(fib.minNode.key, 2, "Decreased key 46 -> 2 must become new min");
assert(fib.validateInvariants().every(inv => inv.valid), "Invariants hold after decreaseKey");
console.log("✓ FibonacciHeap passed.\n");

console.log("🎉 All 8 Unit-2 Heap tests passed successfully!");
