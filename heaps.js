/**
 * Unit-2 Heaps Comprehensive Visualizer Suite
 * 
 * Implementations:
 * 1. Min Heap (Binary Min-Heap)
 * 2. Max Heap (Binary Max-Heap)
 * 3. Deap (Double-Ended Priority Queue)
 * 4. Leftist Heap (Null Path Length / s-value based)
 * 5. Skew Heap (Self-adjusting amortized priority queue)
 * 6. Binomial Heap (Eager forest of Binomial Trees)
 * 7. Lazy Binomial Heap (Deferred consolidation on Extract-Min)
 * 8. Fibonacci Heap (Circular root list, marked nodes, cascading cuts)
 */

let nextHeapNodeId = 1;
export function resetHeapNodeIdCounter() {
  nextHeapNodeId = 1;
}

export class HeapNode {
  constructor(key, id = null) {
    this.id = id || `heap_node_${nextHeapNodeId++}`;
    this.key = key;
    this.left = null;
    this.right = null;
    this.parent = null;
    this._children = [];

    // Specific heap attributes
    this.heapIndex = undefined;   // Array index for Min/Max Heap
    this.sValue = 1;              // Null path length / rank for Leftist Heap
    this.heapSide = null;         // 'min' | 'max' for Deap subtrees
    this.degree = 0;              // Degree of tree for Binomial & Fibonacci
    this.marked = false;          // Mark flag for Fibonacci Heap
    this.isForest = false;        // Multi-tree root forest container
    this.isDeapRoot = false;      // Empty root placeholder for Deap
    this.isMinRoot = false;       // Minimum root indicator
    this.heapMeta = '';           // Custom tag/badge
  }

  get isLeaf() {
    if (this._children && this._children.length > 0) return false;
    return !this.left && !this.right;
  }

  get keys() {
    if (this.isForest) return [];
    if (this.isDeapRoot) return ['DEAP'];
    return (this.key === null || this.key === undefined) ? [] : [this.key];
  }

  get children() {
    if (this._children && this._children.length > 0) {
      return this._children;
    }
    const list = [];
    if (this.left) list.push(this.left);
    if (this.right) list.push(this.right);
    return list;
  }

  set children(val) {
    this._children = val || [];
  }

  clone() {
    const copy = new HeapNode(this.key, this.id);
    copy.heapIndex = this.heapIndex;
    copy.sValue = this.sValue;
    copy.heapSide = this.heapSide;
    copy.degree = this.degree;
    copy.marked = this.marked;
    copy.isForest = this.isForest;
    copy.isDeapRoot = this.isDeapRoot;
    copy.isMinRoot = this.isMinRoot;
    copy.heapMeta = this.heapMeta;

    if (this.left) {
      copy.left = this.left.clone();
      copy.left.parent = copy;
    }
    if (this.right) {
      copy.right = this.right.clone();
      copy.right.parent = copy;
    }
    if (this._children && this._children.length > 0) {
      copy._children = this._children.map(c => {
        const cCopy = c.clone();
        cCopy.parent = copy;
        return cCopy;
      });
    }
    return copy;
  }
}

function createStepRecorder(getCloneFn) {
  const steps = [];
  return {
    steps,
    record({ title, reason, action = '', rule = '', tip = '', popupMessage, highlightNodeIds = [], highlightKeyIndices = {}, statusType = 'info', actionCategory = 'general', meta = {} }) {
      const fullReason = reason || (action && rule ? `${action} ${rule}` : (action || rule || ''));
      steps.push({
        treeSnapshot: getCloneFn(),
        title,
        reason: fullReason,
        action,
        rule,
        tip,
        popupMessage: popupMessage || reason || action || title,
        highlightNodeIds: [...highlightNodeIds],
        highlightKeyIndices: { ...highlightKeyIndices },
        statusType,
        actionCategory,
        meta: { ...meta }
      });
    }
  };
}

// ============================================================================
// 1. Min Heap (Binary Min-Heap)
// ============================================================================
export class MinHeap {
  constructor() {
    this.heap = []; // 0-based internal storage: index i, parent = floor((i-1)/2), left = 2i+1, right = 2i+2
    this.nodeIds = []; // Stable node IDs
  }

  clear() {
    this.heap = [];
    this.nodeIds = [];
  }

  getSnapshot() {
    if (this.heap.length === 0) return null;
    const build = (idx) => {
      if (idx >= this.heap.length) return null;
      const node = new HeapNode(this.heap[idx], this.nodeIds[idx]);
      node.heapIndex = idx + 1; // 1-based display for textbook conformity
      node.left = build(2 * idx + 1);
      node.right = build(2 * idx + 2);
      if (node.left) node.left.parent = node;
      if (node.right) node.right.parent = node;
      return node;
    };
    return build(0);
  }

  getStats() {
    const n = this.heap.length;
    const height = n === 0 ? 0 : Math.floor(Math.log2(n)) + 1;
    return {
      totalKeys: n,
      totalNodes: n,
      height: height,
      minKeys: n > 0 ? this.heap[0] : 0,
      maxKeys: n > 0 ? Math.max(...this.heap) : 0
    };
  }

  validateInvariants() {
    const errors = [];
    for (let i = 0; i < this.heap.length; i++) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < this.heap.length && this.heap[i] > this.heap[left]) {
        errors.push(`Min-heap violated at index ${i + 1}: ${this.heap[i]} > left child ${this.heap[left]}`);
      }
      if (right < this.heap.length && this.heap[i] > this.heap[right]) {
        errors.push(`Min-heap violated at index ${i + 1}: ${this.heap[i]} > right child ${this.heap[right]}`);
      }
    }
    return [
      { name: 'Min-Heap Property', detail: 'Parent ≤ Children for all nodes', valid: errors.length === 0 },
      { name: 'Complete Binary Tree', detail: 'Filled sequentially left-to-right', valid: true }
    ];
  }

  insert(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    const id = `min_node_${nextHeapNodeId++}`;
    this.heap.push(key);
    this.nodeIds.push(id);
    let curr = this.heap.length - 1;

    rec.record({
      title: `Insert Key ${key}`,
      action: `Appended ${key} at complete binary tree index ${curr + 1}`,
      rule: 'In a complete binary tree, new elements are placed at the first available leaf position.',
      tip: 'Heapify-Up (Swim/Bubble-Up) will now compare this new element with its parent.',
      highlightNodeIds: [id],
      statusType: 'info',
      actionCategory: 'insert'
    });

    while (curr > 0) {
      const parent = Math.floor((curr - 1) / 2);
      rec.record({
        title: `Compare with Parent`,
        action: `Comparing child ${this.heap[curr]} (idx ${curr + 1}) with parent ${this.heap[parent]} (idx ${parent + 1})`,
        rule: this.heap[curr] < this.heap[parent] 
          ? `Violation: Child ${this.heap[curr]} < Parent ${this.heap[parent]}. Swap is required!` 
          : `Valid: Child ${this.heap[curr]} ≥ Parent ${this.heap[parent]}. Invariant satisfied.`,
        tip: 'Min-Heap property requires parent to be less than or equal to both children.',
        highlightNodeIds: [this.nodeIds[curr], this.nodeIds[parent]],
        statusType: this.heap[curr] < this.heap[parent] ? 'warning' : 'success',
        actionCategory: 'heapify'
      });

      if (this.heap[curr] < this.heap[parent]) {
        // Swap values and IDs
        [this.heap[curr], this.heap[parent]] = [this.heap[parent], this.heap[curr]];
        [this.nodeIds[curr], this.nodeIds[parent]] = [this.nodeIds[parent], this.nodeIds[curr]];
        curr = parent;

        rec.record({
          title: `Swapped with Parent`,
          action: `Swapped ${key} upward to position ${curr + 1}`,
          rule: 'Child moves up to restore min-heap ordering.',
          highlightNodeIds: [this.nodeIds[curr]],
          statusType: 'success',
          actionCategory: 'swap'
        });
      } else {
        break;
      }
    }

    rec.record({
      title: `Insertion Complete`,
      action: `Key ${key} settled into final position ${curr + 1}`,
      rule: 'Min-heap property holds throughout the entire tree.',
      highlightNodeIds: [this.nodeIds[curr]],
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  delete(val) {
    if (this.heap.length === 0) return [];
    if (val === undefined || val === null || Number(val) === this.heap[0]) {
      return this.extractMin();
    }

    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    const idx = this.heap.indexOf(key);

    if (idx === -1) {
      rec.record({
        title: `Key ${key} Not Found`,
        action: `Searched entire heap, key ${key} is not present`,
        rule: 'Cannot delete a non-existent element.',
        statusType: 'danger',
        actionCategory: 'delete'
      });
      return rec.steps;
    }

    rec.record({
      title: `Located Key ${key}`,
      action: `Found key ${key} at index ${idx + 1}`,
      rule: 'Replace key with the last element of the heap and restore invariants.',
      highlightNodeIds: [this.nodeIds[idx]],
      statusType: 'warning',
      actionCategory: 'delete'
    });

    const last = this.heap.pop();
    const lastId = this.nodeIds.pop();

    if (idx < this.heap.length) {
      this.heap[idx] = last;
      this.nodeIds[idx] = lastId;

      rec.record({
        title: `Replaced with Last Element`,
        action: `Moved last element ${last} to index ${idx + 1}`,
        rule: 'The heap size is reduced by 1, preserving complete binary tree structure.',
        highlightNodeIds: [this.nodeIds[idx]],
        statusType: 'info',
        actionCategory: 'heapify'
      });

      this._sink(idx, rec);
    }

    rec.record({
      title: `Deletion Complete`,
      action: `Successfully deleted key ${key}`,
      rule: 'Min-heap invariants restored.',
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  extractMin() {
    if (this.heap.length === 0) return [];
    const rec = createStepRecorder(() => this.getSnapshot());
    const minVal = this.heap[0];

    rec.record({
      title: `Extract-Min: Found Minimum ${minVal}`,
      action: `Root element ${minVal} is the global minimum in the heap`,
      rule: 'In a Min-Heap, the minimum element always resides at the root (index 1).',
      tip: 'To remove the root, replace it with the last element and sink downward.',
      highlightNodeIds: [this.nodeIds[0]],
      statusType: 'warning',
      actionCategory: 'delete'
    });

    if (this.heap.length === 1) {
      this.heap.pop();
      this.nodeIds.pop();
      rec.record({
        title: `Heap is now Empty`,
        action: `Extracted last element ${minVal}`,
        rule: 'Heap contains 0 elements.',
        statusType: 'info',
        actionCategory: 'general'
      });
      return rec.steps;
    }

    const lastVal = this.heap.pop();
    const lastId = this.nodeIds.pop();
    this.heap[0] = lastVal;
    this.nodeIds[0] = lastId;

    rec.record({
      title: `Moved Last Element to Root`,
      action: `Replaced root with last element ${lastVal}`,
      rule: 'Complete binary tree shape is preserved. Next, Heapify-Down (Sink) will find its proper place.',
      highlightNodeIds: [this.nodeIds[0]],
      statusType: 'info',
      actionCategory: 'heapify'
    });

    this._sink(0, rec);

    rec.record({
      title: `Extract-Min Finished`,
      action: `Extracted minimum ${minVal}. New root is ${this.heap[0]}`,
      rule: 'Min-heap property restored.',
      highlightNodeIds: this.heap.length > 0 ? [this.nodeIds[0]] : [],
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  _sink(idx, rec) {
    const n = this.heap.length;
    let curr = idx;

    while (true) {
      const left = 2 * curr + 1;
      const right = 2 * curr + 2;
      let smallest = curr;

      if (left < n && this.heap[left] < this.heap[smallest]) {
        smallest = left;
      }
      if (right < n && this.heap[right] < this.heap[smallest]) {
        smallest = right;
      }

      if (smallest === curr) {
        break;
      }

      rec.record({
        title: `Sink: Child is Smaller`,
        action: `Child ${this.heap[smallest]} (idx ${smallest + 1}) < Current ${this.heap[curr]} (idx ${curr + 1})`,
        rule: 'Min-Heap requires swapping with the smaller of the two children to preserve heap order.',
        highlightNodeIds: [this.nodeIds[curr], this.nodeIds[smallest]],
        statusType: 'warning',
        actionCategory: 'heapify'
      });

      [this.heap[curr], this.heap[smallest]] = [this.heap[smallest], this.heap[curr]];
      [this.nodeIds[curr], this.nodeIds[smallest]] = [this.nodeIds[smallest], this.nodeIds[curr]];
      curr = smallest;

      rec.record({
        title: `Swapped Downward`,
        action: `Moved downward to position ${curr + 1}`,
        rule: 'Heap property satisfied at parent level.',
        highlightNodeIds: [this.nodeIds[curr]],
        statusType: 'info',
        actionCategory: 'swap'
      });
    }
  }

  search(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    let foundIdx = -1;

    for (let i = 0; i < this.heap.length; i++) {
      if (this.heap[i] === key) {
        foundIdx = i;
        break;
      }
    }

    if (foundIdx !== -1) {
      rec.record({
        title: `Found Key ${key}`,
        action: `Key ${key} located at array index ${foundIdx + 1}`,
        rule: 'Heap search takes O(n) worst-case time as heaps are partially ordered, not strictly sorted like BSTs.',
        highlightNodeIds: [this.nodeIds[foundIdx]],
        statusType: 'success',
        actionCategory: 'search'
      });
    } else {
      rec.record({
        title: `Key ${key} Not Found`,
        action: `Scanned all ${this.heap.length} elements, key is absent`,
        rule: 'Key is not in the heap.',
        statusType: 'danger',
        actionCategory: 'search'
      });
    }

    return rec.steps;
  }

  toJSON() {
    return { heap: [...this.heap], nodeIds: [...this.nodeIds] };
  }

  static fromJSON(data) {
    const h = new MinHeap();
    if (data && Array.isArray(data.heap)) {
      h.heap = [...data.heap];
      h.nodeIds = Array.isArray(data.nodeIds) ? [...data.nodeIds] : data.heap.map(() => `min_node_${nextHeapNodeId++}`);
    }
    return h;
  }
}

// ============================================================================
// 2. Max Heap (Binary Max-Heap)
// ============================================================================
export class MaxHeap {
  constructor() {
    this.heap = [];
    this.nodeIds = [];
  }

  clear() {
    this.heap = [];
    this.nodeIds = [];
  }

  getSnapshot() {
    if (this.heap.length === 0) return null;
    const build = (idx) => {
      if (idx >= this.heap.length) return null;
      const node = new HeapNode(this.heap[idx], this.nodeIds[idx]);
      node.heapIndex = idx + 1;
      node.left = build(2 * idx + 1);
      node.right = build(2 * idx + 2);
      if (node.left) node.left.parent = node;
      if (node.right) node.right.parent = node;
      return node;
    };
    return build(0);
  }

  getStats() {
    const n = this.heap.length;
    const height = n === 0 ? 0 : Math.floor(Math.log2(n)) + 1;
    return {
      totalKeys: n,
      totalNodes: n,
      height: height,
      minKeys: n > 0 ? Math.min(...this.heap) : 0,
      maxKeys: n > 0 ? this.heap[0] : 0
    };
  }

  validateInvariants() {
    const errors = [];
    for (let i = 0; i < this.heap.length; i++) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < this.heap.length && this.heap[i] < this.heap[left]) {
        errors.push(`Max-heap violated at index ${i + 1}: ${this.heap[i]} < left child ${this.heap[left]}`);
      }
      if (right < this.heap.length && this.heap[i] < this.heap[right]) {
        errors.push(`Max-heap violated at index ${i + 1}: ${this.heap[i]} < right child ${this.heap[right]}`);
      }
    }
    return [
      { name: 'Max-Heap Property', detail: 'Parent ≥ Children for all nodes', valid: errors.length === 0 },
      { name: 'Complete Binary Tree', detail: 'Filled sequentially left-to-right', valid: true }
    ];
  }

  insert(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    const id = `max_node_${nextHeapNodeId++}`;
    this.heap.push(key);
    this.nodeIds.push(id);
    let curr = this.heap.length - 1;

    rec.record({
      title: `Insert Key ${key}`,
      action: `Appended ${key} at complete binary tree index ${curr + 1}`,
      rule: 'In a complete binary tree, new elements are placed at the next available leaf slot.',
      tip: 'Heapify-Up (Swim) will compare the key with its parent and swap if key > parent.',
      highlightNodeIds: [id],
      statusType: 'info',
      actionCategory: 'insert'
    });

    while (curr > 0) {
      const parent = Math.floor((curr - 1) / 2);
      rec.record({
        title: `Compare with Parent`,
        action: `Comparing child ${this.heap[curr]} (idx ${curr + 1}) with parent ${this.heap[parent]} (idx ${parent + 1})`,
        rule: this.heap[curr] > this.heap[parent]
          ? `Violation: Child ${this.heap[curr]} > Parent ${this.heap[parent]}. Swap required!`
          : `Valid: Child ${this.heap[curr]} ≤ Parent ${this.heap[parent]}. Invariant satisfied.`,
        tip: 'Max-Heap property requires parent to be greater than or equal to both children.',
        highlightNodeIds: [this.nodeIds[curr], this.nodeIds[parent]],
        statusType: this.heap[curr] > this.heap[parent] ? 'warning' : 'success',
        actionCategory: 'heapify'
      });

      if (this.heap[curr] > this.heap[parent]) {
        [this.heap[curr], this.heap[parent]] = [this.heap[parent], this.heap[curr]];
        [this.nodeIds[curr], this.nodeIds[parent]] = [this.nodeIds[parent], this.nodeIds[curr]];
        curr = parent;

        rec.record({
          title: `Swapped with Parent`,
          action: `Swapped ${key} upward to position ${curr + 1}`,
          rule: 'Child promotes upward to restore max-heap ordering.',
          highlightNodeIds: [this.nodeIds[curr]],
          statusType: 'success',
          actionCategory: 'swap'
        });
      } else {
        break;
      }
    }

    rec.record({
      title: `Insertion Complete`,
      action: `Key ${key} settled into final position ${curr + 1}`,
      rule: 'Max-heap property holds throughout.',
      highlightNodeIds: [this.nodeIds[curr]],
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  delete(val) {
    if (this.heap.length === 0) return [];
    if (val === undefined || val === null || Number(val) === this.heap[0]) {
      return this.extractMax();
    }

    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    const idx = this.heap.indexOf(key);

    if (idx === -1) {
      rec.record({
        title: `Key ${key} Not Found`,
        action: `Searched entire heap, key ${key} is not present`,
        rule: 'Cannot delete a non-existent element.',
        statusType: 'danger',
        actionCategory: 'delete'
      });
      return rec.steps;
    }

    rec.record({
      title: `Located Key ${key}`,
      action: `Found key ${key} at index ${idx + 1}`,
      rule: 'Replace key with the last element of the heap and restore invariants.',
      highlightNodeIds: [this.nodeIds[idx]],
      statusType: 'warning',
      actionCategory: 'delete'
    });

    const last = this.heap.pop();
    const lastId = this.nodeIds.pop();

    if (idx < this.heap.length) {
      this.heap[idx] = last;
      this.nodeIds[idx] = lastId;

      rec.record({
        title: `Replaced with Last Element`,
        action: `Moved last element ${last} to index ${idx + 1}`,
        rule: 'Heap size reduced by 1.',
        highlightNodeIds: [this.nodeIds[idx]],
        statusType: 'info',
        actionCategory: 'heapify'
      });

      this._sink(idx, rec);
    }

    rec.record({
      title: `Deletion Complete`,
      action: `Successfully deleted key ${key}`,
      rule: 'Max-heap invariants restored.',
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  extractMax() {
    if (this.heap.length === 0) return [];
    const rec = createStepRecorder(() => this.getSnapshot());
    const maxVal = this.heap[0];

    rec.record({
      title: `Extract-Max: Found Maximum ${maxVal}`,
      action: `Root element ${maxVal} is the global maximum in the heap`,
      rule: 'In a Max-Heap, the maximum element always resides at the root (index 1).',
      tip: 'Replace the root with the last element and sink downward.',
      highlightNodeIds: [this.nodeIds[0]],
      statusType: 'warning',
      actionCategory: 'delete'
    });

    if (this.heap.length === 1) {
      this.heap.pop();
      this.nodeIds.pop();
      rec.record({
        title: `Heap is now Empty`,
        action: `Extracted last element ${maxVal}`,
        rule: 'Heap contains 0 elements.',
        statusType: 'info',
        actionCategory: 'general'
      });
      return rec.steps;
    }

    const lastVal = this.heap.pop();
    const lastId = this.nodeIds.pop();
    this.heap[0] = lastVal;
    this.nodeIds[0] = lastId;

    rec.record({
      title: `Moved Last Element to Root`,
      action: `Replaced root with last element ${lastVal}`,
      rule: 'Complete binary tree shape preserved. Now sinking to restore max-heap order.',
      highlightNodeIds: [this.nodeIds[0]],
      statusType: 'info',
      actionCategory: 'heapify'
    });

    this._sink(0, rec);

    rec.record({
      title: `Extract-Max Finished`,
      action: `Extracted maximum ${maxVal}. New root is ${this.heap[0]}`,
      rule: 'Max-heap property restored.',
      highlightNodeIds: this.heap.length > 0 ? [this.nodeIds[0]] : [],
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  _sink(idx, rec) {
    const n = this.heap.length;
    let curr = idx;

    while (true) {
      const left = 2 * curr + 1;
      const right = 2 * curr + 2;
      let largest = curr;

      if (left < n && this.heap[left] > this.heap[largest]) {
        largest = left;
      }
      if (right < n && this.heap[right] > this.heap[largest]) {
        largest = right;
      }

      if (largest === curr) {
        break;
      }

      rec.record({
        title: `Sink: Child is Larger`,
        action: `Child ${this.heap[largest]} (idx ${largest + 1}) > Current ${this.heap[curr]} (idx ${curr + 1})`,
        rule: 'Max-Heap requires swapping with the larger child to restore max-heap ordering.',
        highlightNodeIds: [this.nodeIds[curr], this.nodeIds[largest]],
        statusType: 'warning',
        actionCategory: 'heapify'
      });

      [this.heap[curr], this.heap[largest]] = [this.heap[largest], this.heap[curr]];
      [this.nodeIds[curr], this.nodeIds[largest]] = [this.nodeIds[largest], this.nodeIds[curr]];
      curr = largest;

      rec.record({
        title: `Swapped Downward`,
        action: `Moved downward to position ${curr + 1}`,
        rule: 'Max-heap property satisfied at parent level.',
        highlightNodeIds: [this.nodeIds[curr]],
        statusType: 'info',
        actionCategory: 'swap'
      });
    }
  }

  search(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    let foundIdx = -1;

    for (let i = 0; i < this.heap.length; i++) {
      if (this.heap[i] === key) {
        foundIdx = i;
        break;
      }
    }

    if (foundIdx !== -1) {
      rec.record({
        title: `Found Key ${key}`,
        action: `Key ${key} located at array index ${foundIdx + 1}`,
        rule: 'Heap lookup completed in O(n) time.',
        highlightNodeIds: [this.nodeIds[foundIdx]],
        statusType: 'success',
        actionCategory: 'search'
      });
    } else {
      rec.record({
        title: `Key ${key} Not Found`,
        action: `Scanned all ${this.heap.length} elements, key is absent`,
        rule: 'Key is not in the heap.',
        statusType: 'danger',
        actionCategory: 'search'
      });
    }

    return rec.steps;
  }

  toJSON() {
    return { heap: [...this.heap], nodeIds: [...this.nodeIds] };
  }

  static fromJSON(data) {
    const h = new MaxHeap();
    if (data && Array.isArray(data.heap)) {
      h.heap = [...data.heap];
      h.nodeIds = Array.isArray(data.nodeIds) ? [...data.nodeIds] : data.heap.map(() => `max_node_${nextHeapNodeId++}`);
    }
    return h;
  }
}

// ============================================================================
// 3. Deap (Double-Ended Priority Queue)
// ============================================================================
/**
 * Deap Structure (Horowitz & Sahni definition):
 * Complete binary tree where:
 * - Position 1 (root) has NO element (empty placeholder).
 * - Left subtree of root (position 2) is a Min-Heap.
 * - Right subtree of root (position 3) is a Max-Heap.
 * - Dual Correspondence: For node i in Min-Heap, corresponding node j in Max-Heap is:
 *     j = i + 2^(floor(lg i) - 1).
 *     If j does not exist (j > n), j = floor(j / 2).
 *     Invariant: deap[i] <= deap[j].
 */
export class Deap {
  constructor() {
    // 1-based indexing: index 1 is unused/empty root. Elements at 2 .. n
    this.deap = [null, null];
    this.nodeIds = [null, 'deap_root'];
  }

  clear() {
    this.deap = [null, null];
    this.nodeIds = [null, 'deap_root'];
  }

  getSnapshot() {
    const n = this.deap.length - 1;
    if (n < 2) {
      // Empty Deap
      const root = new HeapNode(null, 'deap_root');
      root.isDeapRoot = true;
      return root;
    }

    const build = (idx) => {
      if (idx > n) return null;
      const node = new HeapNode(this.deap[idx], this.nodeIds[idx]);
      node.heapIndex = idx;
      if (idx === 1) {
        node.isDeapRoot = true;
      } else {
        node.heapSide = this._isMinSubtree(idx) ? 'min' : 'max';
      }
      node.left = build(2 * idx);
      node.right = build(2 * idx + 1);
      if (node.left) node.left.parent = node;
      if (node.right) node.right.parent = node;
      return node;
    };

    return build(1);
  }

  _isMinSubtree(idx) {
    if (idx < 2) return false;
    let curr = idx;
    while (curr > 3) {
      curr = Math.floor(curr / 2);
    }
    return curr === 2;
  }

  _getCorrespondingMaxIndex(i, n) {
    const level = Math.floor(Math.log2(i));
    let j = i + Math.pow(2, level - 1);
    if (j > n) {
      j = Math.floor(j / 2);
    }
    return j;
  }

  _getCorrespondingMinIndex(j) {
    const level = Math.floor(Math.log2(j));
    return j - Math.pow(2, level - 1);
  }

  getStats() {
    const n = this.deap.length - 2; // Actual keys count
    const totalNodes = this.deap.length - 1; // including empty root
    const height = n <= 0 ? 0 : Math.floor(Math.log2(totalNodes)) + 1;
    const minKeys = n > 0 && this.deap[2] !== undefined ? this.deap[2] : 0;
    const maxKeys = n > 1 && this.deap[3] !== undefined ? this.deap[3] : minKeys;
    return {
      totalKeys: Math.max(0, n),
      totalNodes: Math.max(0, totalNodes),
      height: height,
      minKeys: minKeys,
      maxKeys: maxKeys
    };
  }

  validateInvariants() {
    const n = this.deap.length - 1;
    const errors = [];
    for (let i = 2; i <= n; i++) {
      if (this._isMinSubtree(i)) {
        // Min-heap property with children
        const l = 2 * i, r = 2 * i + 1;
        if (l <= n && this.deap[i] > this.deap[l]) {
          errors.push(`Min-heap violated at idx ${i} (${this.deap[i]} > child ${this.deap[l]})`);
        }
        if (r <= n && this.deap[i] > this.deap[r]) {
          errors.push(`Min-heap violated at idx ${i} (${this.deap[i]} > child ${this.deap[r]})`);
        }
        // Correspondence with Max-Heap partner
        const j = this._getCorrespondingMaxIndex(i, n);
        if (j <= n && this.deap[i] > this.deap[j]) {
          errors.push(`Deap correspondence violated: Min[${i}]=${this.deap[i]} > Max[${j}]=${this.deap[j]}`);
        }
      } else {
        // Max-heap property with children
        const l = 2 * i, r = 2 * i + 1;
        if (l <= n && this.deap[i] < this.deap[l]) {
          errors.push(`Max-heap violated at idx ${i} (${this.deap[i]} < child ${this.deap[l]})`);
        }
        if (r <= n && this.deap[i] < this.deap[r]) {
          errors.push(`Max-heap violated at idx ${i} (${this.deap[i]} < child ${this.deap[r]})`);
        }
      }
    }
    return [
      { name: 'Root is Empty', detail: 'Position 1 holds no data (Deap root marker)', valid: true },
      { name: 'Min-Heap Subtree', detail: 'Left subtree root (idx 2) satisfies Min-Heap', valid: errors.length === 0 },
      { name: 'Max-Heap Subtree', detail: 'Right subtree root (idx 3) satisfies Max-Heap', valid: errors.length === 0 },
      { name: 'Dual Correspondence', detail: 'deap[min_node] ≤ deap[max_partner] holds', valid: errors.length === 0 }
    ];
  }

  insert(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    const id = `deap_node_${nextHeapNodeId++}`;
    const n = this.deap.length; // New element will occupy index n
    this.deap.push(key);
    this.nodeIds.push(id);

    if (n === 2) {
      rec.record({
        title: `Insert First Element: ${key}`,
        action: `Placed ${key} at index 2 (root of Min-Heap subtree)`,
        rule: 'In a Deap, the first element goes to position 2.',
        highlightNodeIds: [id],
        statusType: 'success',
        actionCategory: 'insert'
      });
      return rec.steps;
    }

    if (n === 3) {
      // Second element: compare with index 2
      if (this.deap[2] > this.deap[3]) {
        [this.deap[2], this.deap[3]] = [this.deap[3], this.deap[2]];
        [this.nodeIds[2], this.nodeIds[3]] = [this.nodeIds[3], this.nodeIds[2]];
      }
      rec.record({
        title: `Insert Second Element: ${key}`,
        action: `Min-Heap root is ${this.deap[2]} (idx 2), Max-Heap root is ${this.deap[3]} (idx 3)`,
        rule: 'Correspondence deap[2] ≤ deap[3] established.',
        highlightNodeIds: [this.nodeIds[2], this.nodeIds[3]],
        statusType: 'success',
        actionCategory: 'insert'
      });
      return rec.steps;
    }

    rec.record({
      title: `Insert Key ${key} at Position ${n}`,
      action: `Appended ${key} temporarily at position ${n} (${this._isMinSubtree(n) ? 'Min-Heap side' : 'Max-Heap side'})`,
      rule: 'Determine whether new position belongs to Min-Heap or Max-Heap and verify cross-correspondence.',
      highlightNodeIds: [id],
      statusType: 'info',
      actionCategory: 'insert'
    });

    if (this._isMinSubtree(n)) {
      // Position n is in Min-Heap
      const j = this._getCorrespondingMaxIndex(n, n - 1);
      rec.record({
        title: `Cross-Check with Max-Heap Partner`,
        action: `Comparing candidate ${key} at Min[${n}] with Max partner ${this.deap[j]} at Max[${j}]`,
        rule: key > this.deap[j] 
          ? `Candidate ${key} > Max partner ${this.deap[j]}! Must move key into Max-Heap and bubble up.`
          : `Candidate ${key} ≤ Max partner ${this.deap[j]}. Valid! Bubble up within Min-Heap.`,
        highlightNodeIds: [id, this.nodeIds[j]],
        statusType: key > this.deap[j] ? 'warning' : 'info',
        actionCategory: 'heapify'
      });

      if (key > this.deap[j]) {
        // Swap into max-heap side at j
        this.deap[n] = this.deap[j];
        this.nodeIds[n] = this.nodeIds[j];
        this.deap[j] = key;
        this.nodeIds[j] = id;

        rec.record({
          title: `Moved Key to Max-Heap`,
          action: `Swapped key ${key} to position ${j} in Max-Heap`,
          rule: 'Now heapify-up within Max-Heap.',
          highlightNodeIds: [this.nodeIds[j]],
          statusType: 'info',
          actionCategory: 'swap'
        });

        this._bubbleUpMax(j, rec);
      } else {
        this._bubbleUpMin(n, rec);
      }
    } else {
      // Position n is in Max-Heap
      const i = this._getCorrespondingMinIndex(n);
      rec.record({
        title: `Cross-Check with Min-Heap Partner`,
        action: `Comparing candidate ${key} at Max[${n}] with Min partner ${this.deap[i]} at Min[${i}]`,
        rule: key < this.deap[i]
          ? `Candidate ${key} < Min partner ${this.deap[i]}! Must move key into Min-Heap and bubble up.`
          : `Candidate ${key} ≥ Min partner ${this.deap[i]}. Valid! Bubble up within Max-Heap.`,
        highlightNodeIds: [id, this.nodeIds[i]],
        statusType: key < this.deap[i] ? 'warning' : 'info',
        actionCategory: 'heapify'
      });

      if (key < this.deap[i]) {
        this.deap[n] = this.deap[i];
        this.nodeIds[n] = this.nodeIds[i];
        this.deap[i] = key;
        this.nodeIds[i] = id;

        rec.record({
          title: `Moved Key to Min-Heap`,
          action: `Swapped key ${key} to position ${i} in Min-Heap`,
          rule: 'Now heapify-up within Min-Heap.',
          highlightNodeIds: [this.nodeIds[i]],
          statusType: 'info',
          actionCategory: 'swap'
        });

        this._bubbleUpMin(i, rec);
      } else {
        this._bubbleUpMax(n, rec);
      }
    }

    rec.record({
      title: `Deap Insertion Completed`,
      action: `Key ${key} inserted and all Deap invariants hold`,
      rule: 'Min-Heap, Max-Heap, and Dual-Correspondence satisfied.',
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  _bubbleUpMin(startIdx, rec) {
    let curr = startIdx;
    while (curr > 2) {
      const parent = Math.floor(curr / 2);
      if (this.deap[curr] < this.deap[parent]) {
        [this.deap[curr], this.deap[parent]] = [this.deap[parent], this.deap[curr]];
        [this.nodeIds[curr], this.nodeIds[parent]] = [this.nodeIds[parent], this.nodeIds[curr]];
        curr = parent;

        rec.record({
          title: `Min-Heap Bubble-Up`,
          action: `Swapped upward in Min-Heap to index ${curr}`,
          rule: 'Parent in Min-Heap must be ≤ Child.',
          highlightNodeIds: [this.nodeIds[curr]],
          statusType: 'success',
          actionCategory: 'swap'
        });
      } else {
        break;
      }
    }
  }

  _bubbleUpMax(startIdx, rec) {
    let curr = startIdx;
    while (curr > 3) {
      const parent = Math.floor(curr / 2);
      if (this.deap[curr] > this.deap[parent]) {
        [this.deap[curr], this.deap[parent]] = [this.deap[parent], this.deap[curr]];
        [this.nodeIds[curr], this.nodeIds[parent]] = [this.nodeIds[parent], this.nodeIds[curr]];
        curr = parent;

        rec.record({
          title: `Max-Heap Bubble-Up`,
          action: `Swapped upward in Max-Heap to index ${curr}`,
          rule: 'Parent in Max-Heap must be ≥ Child.',
          highlightNodeIds: [this.nodeIds[curr]],
          statusType: 'success',
          actionCategory: 'swap'
        });
      } else {
        break;
      }
    }
  }

  delete(val) {
    if (this.deap.length <= 2) return [];
    if (val === undefined || val === null || Number(val) === this.deap[2]) {
      return this.deleteMin();
    }
    if (this.deap.length > 3 && Number(val) === this.deap[3]) {
      return this.deleteMax();
    }
    // Delete arbitrary key by extracting min/max or linear search
    return this.deleteMin();
  }

  deleteMin() {
    if (this.deap.length <= 2) return [];
    const rec = createStepRecorder(() => this.getSnapshot());
    const minVal = this.deap[2];

    rec.record({
      title: `Delete-Min: Minimum Key is ${minVal}`,
      action: `Min-Heap root at position 2 is the global minimum in Deap`,
      rule: 'In a Deap, the minimum is always at index 2.',
      highlightNodeIds: [this.nodeIds[2]],
      statusType: 'warning',
      actionCategory: 'delete'
    });

    if (this.deap.length === 3) {
      this.deap.pop();
      this.nodeIds.pop();
      rec.record({
        title: `Deap is now Empty`,
        action: `Removed sole element ${minVal}`,
        rule: 'Deap has no elements.',
        statusType: 'info',
        actionCategory: 'general'
      });
      return rec.steps;
    }

    const lastVal = this.deap.pop();
    const lastId = this.nodeIds.pop();
    const n = this.deap.length - 1;

    // Filter down in Min-Heap from position 2
    let curr = 2;
    while (2 * curr <= n) {
      let child = 2 * curr;
      if (child + 1 <= n && this.deap[child + 1] < this.deap[child]) {
        child = child + 1;
      }
      this.deap[curr] = this.deap[child];
      this.nodeIds[curr] = this.nodeIds[child];
      curr = child;
    }

    // Place last element at leaf position curr and check correspondence
    this.deap[curr] = lastVal;
    this.nodeIds[curr] = lastId;

    const partner = this._getCorrespondingMaxIndex(curr, n);
    if (partner <= n && this.deap[curr] > this.deap[partner]) {
      [this.deap[curr], this.deap[partner]] = [this.deap[partner], this.deap[curr]];
      [this.nodeIds[curr], this.nodeIds[partner]] = [this.nodeIds[partner], this.nodeIds[curr]];
      this._bubbleUpMax(partner, rec);
    } else {
      this._bubbleUpMin(curr, rec);
    }

    rec.record({
      title: `Delete-Min Completed`,
      action: `Extracted minimum ${minVal}. Invariants restored.`,
      rule: 'Min-Heap order and dual correspondence preserved.',
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  deleteMax() {
    if (this.deap.length <= 2) return [];
    if (this.deap.length === 3) return this.deleteMin();

    const rec = createStepRecorder(() => this.getSnapshot());
    const maxVal = this.deap[3];

    rec.record({
      title: `Delete-Max: Maximum Key is ${maxVal}`,
      action: `Max-Heap root at position 3 is the global maximum in Deap`,
      rule: 'In a Deap, the maximum is always at index 3.',
      highlightNodeIds: [this.nodeIds[3]],
      statusType: 'warning',
      actionCategory: 'delete'
    });

    const lastVal = this.deap.pop();
    const lastId = this.nodeIds.pop();
    const n = this.deap.length - 1;

    let curr = 3;
    while (2 * curr <= n) {
      let child = 2 * curr;
      if (child + 1 <= n && this.deap[child + 1] > this.deap[child]) {
        child = child + 1;
      }
      this.deap[curr] = this.deap[child];
      this.nodeIds[curr] = this.nodeIds[child];
      curr = child;
    }

    this.deap[curr] = lastVal;
    this.nodeIds[curr] = lastId;

    const partner = this._getCorrespondingMinIndex(curr);
    if (partner >= 2 && this.deap[curr] < this.deap[partner]) {
      [this.deap[curr], this.deap[partner]] = [this.deap[partner], this.deap[curr]];
      [this.nodeIds[curr], this.nodeIds[partner]] = [this.nodeIds[partner], this.nodeIds[curr]];
      this._bubbleUpMin(partner, rec);
    } else {
      this._bubbleUpMax(curr, rec);
    }

    rec.record({
      title: `Delete-Max Completed`,
      action: `Extracted maximum ${maxVal}. Invariants restored.`,
      rule: 'Max-Heap order and dual correspondence preserved.',
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  search(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    let foundIdx = -1;

    for (let i = 2; i < this.deap.length; i++) {
      if (this.deap[i] === key) {
        foundIdx = i;
        break;
      }
    }

    if (foundIdx !== -1) {
      rec.record({
        title: `Found Key ${key}`,
        action: `Key ${key} located at position ${foundIdx} (${this._isMinSubtree(foundIdx) ? 'Min-Heap side' : 'Max-Heap side'})`,
        rule: 'Deap search inspected element.',
        highlightNodeIds: [this.nodeIds[foundIdx]],
        statusType: 'success',
        actionCategory: 'search'
      });
    } else {
      rec.record({
        title: `Key ${key} Not Found`,
        action: `Key ${key} is not in the Deap`,
        rule: 'Not present.',
        statusType: 'danger',
        actionCategory: 'search'
      });
    }

    return rec.steps;
  }

  toJSON() {
    return { deap: [...this.deap], nodeIds: [...this.nodeIds] };
  }

  static fromJSON(data) {
    const d = new Deap();
    if (data && Array.isArray(data.deap)) {
      d.deap = [...data.deap];
      d.nodeIds = Array.isArray(data.nodeIds) ? [...data.nodeIds] : data.deap.map((_, i) => i <= 1 ? (i === 1 ? 'deap_root' : null) : `deap_node_${nextHeapNodeId++}`);
    }
    return d;
  }
}

// ============================================================================
// 4. Leftist Heap (Null Path Length based)
// ============================================================================
export class LeftistHeap {
  constructor() {
    this.root = null;
  }

  clear() {
    this.root = null;
  }

  getSnapshot() {
    return this.root ? this.root.clone() : null;
  }

  getStats() {
    let count = 0;
    const traverse = (n) => {
      if (!n) return;
      count++;
      traverse(n.left);
      traverse(n.right);
    };
    traverse(this.root);
    return {
      totalKeys: count,
      totalNodes: count,
      height: this.root ? this.root.sValue : 0,
      minKeys: this.root ? this.root.key : 0,
      maxKeys: this.root ? this.root.sValue : 0
    };
  }

  validateInvariants() {
    let heapValid = true;
    let leftistValid = true;

    const check = (node) => {
      if (!node) return 0;
      if (node.left && node.key > node.left.key) heapValid = false;
      if (node.right && node.key > node.right.key) heapValid = false;
      const sl = node.left ? node.left.sValue : 0;
      const sr = node.right ? node.right.sValue : 0;
      if (sl < sr) leftistValid = false;
      check(node.left);
      check(node.right);
      return 1 + sr;
    };
    check(this.root);

    return [
      { name: 'Min-Heap Property', detail: 'Parent key ≤ Children keys', valid: heapValid },
      { name: 'Leftist Property', detail: 's(left) ≥ s(right) for all nodes', valid: leftistValid },
      { name: 'S-Value Formula', detail: 's(x) = 1 + s(x.right)', valid: true }
    ];
  }

  insert(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    const newNode = new HeapNode(key, `leftist_node_${nextHeapNodeId++}`);
    newNode.sValue = 1;

    rec.record({
      title: `Insert Key ${key}`,
      action: `Created new single-node Leftist Heap with key ${key} and s-value = 1`,
      rule: 'In a Leftist Heap, insert is performed as a merge of current heap with the single-node heap.',
      highlightNodeIds: [newNode.id],
      statusType: 'info',
      actionCategory: 'insert'
    });

    this.root = this._merge(this.root, newNode, rec);

    rec.record({
      title: `Insertion Completed`,
      action: `Merged key ${key} into Leftist Heap. Root is now ${this.root.key}`,
      rule: 'All leftist and min-heap properties verified.',
      highlightNodeIds: [this.root.id],
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  delete(val) {
    if (!this.root) return [];
    // Standard priority queue operation is Extract-Min
    return this.extractMin();
  }

  extractMin() {
    if (!this.root) return [];
    const rec = createStepRecorder(() => this.getSnapshot());
    const minVal = this.root.key;

    rec.record({
      title: `Extract-Min: Minimum is ${minVal}`,
      action: `Root node holds minimum value ${minVal}`,
      rule: 'Extract-Min removes the root and merges its left and right subtrees.',
      highlightNodeIds: [this.root.id],
      statusType: 'warning',
      actionCategory: 'delete'
    });

    const leftSubtree = this.root.left;
    const rightSubtree = this.root.right;
    if (leftSubtree) leftSubtree.parent = null;
    if (rightSubtree) rightSubtree.parent = null;

    this.root = this._merge(leftSubtree, rightSubtree, rec);

    rec.record({
      title: `Extract-Min Completed`,
      action: `Extracted ${minVal}. Merged left and right subtrees.`,
      rule: 'New root established with valid leftist properties.',
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  _merge(h1, h2, rec) {
    if (!h1) return h2;
    if (!h2) return h1;

    if (h1.key > h2.key) {
      [h1, h2] = [h2, h1];
    }

    rec.record({
      title: `Leftist Merge: Roots ${h1.key} & ${h2.key}`,
      action: `Root ${h1.key} ≤ ${h2.key}. Recursively merging right child of ${h1.key} with ${h2.key}`,
      rule: 'Leftist heaps merge along the right spine because the shortest path to an external node is always on the right.',
      highlightNodeIds: [h1.id, h2.id],
      statusType: 'info',
      actionCategory: 'merge'
    });

    h1.right = this._merge(h1.right, h2, rec);
    if (h1.right) h1.right.parent = h1;

    const sLeft = h1.left ? h1.left.sValue : 0;
    const sRight = h1.right ? h1.right.sValue : 0;

    if (sLeft < sRight) {
      rec.record({
        title: `Leftist Violation: Swap Subtrees`,
        action: `At node ${h1.key}: s(left)=${sLeft} < s(right)=${sRight}. Swapping left and right children!`,
        rule: 'Leftist property mandates s(left) ≥ s(right) at every node.',
        highlightNodeIds: [h1.id],
        statusType: 'warning',
        actionCategory: 'swap'
      });

      [h1.left, h1.right] = [h1.right, h1.left];
    }

    h1.sValue = 1 + (h1.right ? h1.right.sValue : 0);

    rec.record({
      title: `Updated S-Value`,
      action: `Node ${h1.key} s-value = 1 + s(right) = ${h1.sValue}`,
      rule: 'S-value equals shortest distance to an external (null) node.',
      highlightNodeIds: [h1.id],
      statusType: 'info',
      actionCategory: 'heapify'
    });

    return h1;
  }

  search(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    let found = null;

    const traverse = (node) => {
      if (!node || found) return;
      if (node.key === key) {
        found = node;
        return;
      }
      traverse(node.left);
      traverse(node.right);
    };
    traverse(this.root);

    if (found) {
      rec.record({
        title: `Found Key ${key}`,
        action: `Located key ${key} with s-value = ${found.sValue}`,
        rule: 'Found in Leftist Heap.',
        highlightNodeIds: [found.id],
        statusType: 'success',
        actionCategory: 'search'
      });
    } else {
      rec.record({
        title: `Key ${key} Not Found`,
        action: `Searched entire leftist heap, key ${key} is absent`,
        rule: 'Not present.',
        statusType: 'danger',
        actionCategory: 'search'
      });
    }

    return rec.steps;
  }

  toJSON() {
    const serialize = (n) => {
      if (!n) return null;
      return {
        key: n.key,
        id: n.id,
        sValue: n.sValue,
        left: serialize(n.left),
        right: serialize(n.right)
      };
    };
    return { root: serialize(this.root) };
  }

  static fromJSON(data) {
    const h = new LeftistHeap();
    const deserialize = (d) => {
      if (!d) return null;
      const n = new HeapNode(d.key, d.id);
      n.sValue = d.sValue || 1;
      n.left = deserialize(d.left);
      n.right = deserialize(d.right);
      if (n.left) n.left.parent = n;
      if (n.right) n.right.parent = n;
      return n;
    };
    if (data && data.root) {
      h.root = deserialize(data.root);
    }
    return h;
  }
}

// ============================================================================
// 5. Skew Heap (Self-adjusting amortized priority queue)
// ============================================================================
export class SkewHeap {
  constructor() {
    this.root = null;
  }

  clear() {
    this.root = null;
  }

  getSnapshot() {
    return this.root ? this.root.clone() : null;
  }

  getStats() {
    let count = 0;
    const traverse = (n) => {
      if (!n) return;
      count++;
      traverse(n.left);
      traverse(n.right);
    };
    traverse(this.root);
    return {
      totalKeys: count,
      totalNodes: count,
      height: count > 0 ? Math.floor(Math.log2(count)) + 1 : 0,
      minKeys: this.root ? this.root.key : 0,
      maxKeys: count
    };
  }

  validateInvariants() {
    let heapValid = true;
    const check = (node) => {
      if (!node) return;
      if (node.left && node.key > node.left.key) heapValid = false;
      if (node.right && node.key > node.right.key) heapValid = false;
      check(node.left);
      check(node.right);
    };
    check(this.root);

    return [
      { name: 'Min-Heap Property', detail: 'Parent key ≤ Children keys', valid: heapValid },
      { name: 'Self-Adjusting Nature', detail: 'Unconditional swap on every merge step', valid: true },
      { name: 'No S-Values Needed', detail: 'Amortized O(log n) performance without rank tracking', valid: true }
    ];
  }

  insert(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    const newNode = new HeapNode(key, `skew_node_${nextHeapNodeId++}`);

    rec.record({
      title: `Insert Key ${key}`,
      action: `Created single node with key ${key}`,
      rule: 'Skew Heap insertion merges the new single node into the current heap.',
      highlightNodeIds: [newNode.id],
      statusType: 'info',
      actionCategory: 'insert'
    });

    this.root = this._merge(this.root, newNode, rec);

    rec.record({
      title: `Insertion Completed`,
      action: `Merged ${key} into Skew Heap. Root is now ${this.root.key}`,
      rule: 'Skew Heap property holds.',
      highlightNodeIds: [this.root.id],
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  delete(val) {
    if (!this.root) return [];
    return this.extractMin();
  }

  extractMin() {
    if (!this.root) return [];
    const rec = createStepRecorder(() => this.getSnapshot());
    const minVal = this.root.key;

    rec.record({
      title: `Extract-Min: Minimum is ${minVal}`,
      action: `Root node holds minimum value ${minVal}`,
      rule: 'Extract-Min removes root and merges its left and right subtrees.',
      highlightNodeIds: [this.root.id],
      statusType: 'warning',
      actionCategory: 'delete'
    });

    const leftSubtree = this.root.left;
    const rightSubtree = this.root.right;
    if (leftSubtree) leftSubtree.parent = null;
    if (rightSubtree) rightSubtree.parent = null;

    this.root = this._merge(leftSubtree, rightSubtree, rec);

    rec.record({
      title: `Extract-Min Completed`,
      action: `Extracted ${minVal}. Merged left and right subtrees with unconditional swaps.`,
      rule: 'New root established.',
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  _merge(h1, h2, rec) {
    if (!h1) return h2;
    if (!h2) return h1;

    if (h1.key > h2.key) {
      [h1, h2] = [h2, h1];
    }

    rec.record({
      title: `Skew Merge: Compare Roots`,
      action: `Root ${h1.key} ≤ ${h2.key}. Recursive merge with right child of ${h1.key}`,
      rule: 'Skew Heap recursively merges right child and unconditionally swaps left and right subtrees.',
      highlightNodeIds: [h1.id, h2.id],
      statusType: 'info',
      actionCategory: 'merge'
    });

    const mergedRight = this._merge(h1.right, h2, rec);

    // Unconditional swap: left becomes the merged result, right becomes old left
    rec.record({
      title: `Unconditional Swap of Children`,
      action: `At node ${h1.key}: unconditionally swapping left and right subtrees`,
      rule: 'Unlike Leftist Heaps that compare s-values, Skew Heaps unconditionally swap at every merge step!',
      highlightNodeIds: [h1.id],
      statusType: 'warning',
      actionCategory: 'swap'
    });

    h1.right = h1.left;
    h1.left = mergedRight;
    if (h1.left) h1.left.parent = h1;
    if (h1.right) h1.right.parent = h1;

    return h1;
  }

  search(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    let found = null;

    const traverse = (node) => {
      if (!node || found) return;
      if (node.key === key) {
        found = node;
        return;
      }
      traverse(node.left);
      traverse(node.right);
    };
    traverse(this.root);

    if (found) {
      rec.record({
        title: `Found Key ${key}`,
        action: `Located key ${key} in Skew Heap`,
        rule: 'Found.',
        highlightNodeIds: [found.id],
        statusType: 'success',
        actionCategory: 'search'
      });
    } else {
      rec.record({
        title: `Key ${key} Not Found`,
        action: `Key ${key} is absent from Skew Heap`,
        rule: 'Not present.',
        statusType: 'danger',
        actionCategory: 'search'
      });
    }

    return rec.steps;
  }

  toJSON() {
    const serialize = (n) => {
      if (!n) return null;
      return {
        key: n.key,
        id: n.id,
        left: serialize(n.left),
        right: serialize(n.right)
      };
    };
    return { root: serialize(this.root) };
  }

  static fromJSON(data) {
    const h = new SkewHeap();
    const deserialize = (d) => {
      if (!d) return null;
      const n = new HeapNode(d.key, d.id);
      n.left = deserialize(d.left);
      n.right = deserialize(d.right);
      if (n.left) n.left.parent = n;
      if (n.right) n.right.parent = n;
      return n;
    };
    if (data && data.root) {
      h.root = deserialize(data.root);
    }
    return h;
  }
}

// ============================================================================
// 6. Binomial Heap (Eager forest of Binomial Trees)
// ============================================================================
export class BinomialHeap {
  constructor() {
    // Array of tree roots, strictly in ascending order of degree
    this.trees = [];
  }

  clear() {
    this.trees = [];
  }

  getSnapshot() {
    if (this.trees.length === 0) return null;
    const forestRoot = new HeapNode(null, 'forest_root');
    forestRoot.isForest = true;
    const minRoot = this._findMinRoot();
    forestRoot.children = this.trees.map(t => {
      const cloned = t.clone();
      if (minRoot && t.key === minRoot.key) {
        cloned.isMinRoot = true;
      }
      return cloned;
    });
    return forestRoot;
  }

  _findMinRoot() {
    if (this.trees.length === 0) return null;
    let min = this.trees[0];
    for (let i = 1; i < this.trees.length; i++) {
      if (this.trees[i].key < min.key) {
        min = this.trees[i];
      }
    }
    return min;
  }

  getStats() {
    let count = 0;
    const countNodes = (n) => {
      count++;
      (n.children || []).forEach(countNodes);
    };
    this.trees.forEach(countNodes);
    const minRoot = this._findMinRoot();
    return {
      totalKeys: count,
      totalNodes: count,
      height: this.trees.length,
      minKeys: minRoot ? minRoot.key : 0,
      maxKeys: this.trees.length > 0 ? Math.max(...this.trees.map(t => t.degree)) : 0
    };
  }

  validateInvariants() {
    const degrees = this.trees.map(t => t.degree);
    const isSortedDegrees = degrees.every((d, i) => i === 0 || d > degrees[i - 1]);
    let heapOrdered = true;

    const checkHeap = (node) => {
      (node.children || []).forEach(child => {
        if (node.key > child.key) heapOrdered = false;
        checkHeap(child);
      });
    };
    this.trees.forEach(checkHeap);

    return [
      { name: 'Min-Heap Ordered Trees', detail: 'Parent key ≤ Children keys in every Binomial Tree', valid: heapOrdered },
      { name: 'Unique Degrees', detail: 'At most one Binomial Tree B_k of each degree (Binary representation of n)', valid: isSortedDegrees },
      { name: 'Ascending Root List', detail: 'Degrees strictly increasing: B0, B1, B2...', valid: isSortedDegrees }
    ];
  }

  insert(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    const newNode = new HeapNode(key, `binom_node_${nextHeapNodeId++}`);
    newNode.degree = 0;
    newNode.children = [];

    rec.record({
      title: `Insert Key ${key}`,
      action: `Created Binomial Tree B_0 with single key ${key}`,
      rule: 'An insertion in Binomial Heap is a Union of the heap with a B_0 tree.',
      highlightNodeIds: [newNode.id],
      statusType: 'info',
      actionCategory: 'insert'
    });

    this._union([newNode], rec);

    rec.record({
      title: `Insertion Completed`,
      action: `Key ${key} merged into Binomial Heap`,
      rule: 'All binomial trees linked and consolidated.',
      highlightNodeIds: [newNode.id],
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  _link(b1, b2, rec) {
    // Make smaller root parent of larger root
    if (b1.key > b2.key) {
      [b1, b2] = [b2, b1];
    }

    rec.record({
      title: `Link Two B_${b1.degree} Trees`,
      action: `Root ${b1.key} ≤ ${b2.key}. Making B_${b2.degree} (root ${b2.key}) the leftmost child of B_${b1.degree} (root ${b1.key})`,
      rule: 'Linking two binomial trees of degree k yields a binomial tree of degree k+1.',
      highlightNodeIds: [b1.id, b2.id],
      statusType: 'warning',
      actionCategory: 'link'
    });

    b2.parent = b1;
    // In standard textbook CLRS, new child is prepended to preserve decreasing degrees order
    b1.children = [b2, ...b1.children];
    b1.degree += 1;

    rec.record({
      title: `Formed Tree B_${b1.degree}`,
      action: `New root ${b1.key} now has degree ${b1.degree} with ${Math.pow(2, b1.degree)} total nodes`,
      rule: 'Binomial tree invariants preserved.',
      highlightNodeIds: [b1.id],
      statusType: 'success',
      actionCategory: 'heapify'
    });

    return b1;
  }

  _union(newRoots, rec) {
    // 1. Merge the two root lists into sorted order of degree (like merge in mergesort)
    let merged = [];
    let i = 0, j = 0;
    while (i < this.trees.length && j < newRoots.length) {
      if (this.trees[i].degree <= newRoots[j].degree) {
        merged.push(this.trees[i++]);
      } else {
        merged.push(newRoots[j++]);
      }
    }
    while (i < this.trees.length) merged.push(this.trees[i++]);
    while (j < newRoots.length) merged.push(newRoots[j++]);

    this.trees = merged;

    if (merged.length <= 1) return;

    rec.record({
      title: `Merged Root Lists by Degree`,
      action: `Combined root lists in non-decreasing degree order: [${merged.map(t => 'B' + t.degree).join(', ')}]`,
      rule: 'Now scan root list and link adjacent trees of identical degree (analogous to binary addition with carries).',
      statusType: 'info',
      actionCategory: 'merge'
    });

    // 2. Link trees of equal degree
    let prev = null;
    let curr = 0;

    while (curr < this.trees.length - 1) {
      let x = this.trees[curr];
      let next = this.trees[curr + 1];
      let nextNext = (curr + 2 < this.trees.length) ? this.trees[curr + 2] : null;

      // Case 1: degrees are different, or 3 consecutive trees have the same degree (carry forward)
      if (x.degree !== next.degree || (nextNext && nextNext.degree === x.degree)) {
        prev = curr;
        curr++;
      } else {
        // Case 2: x.degree === next.degree, link x and next
        const linked = this._link(x, next, rec);
        this.trees.splice(curr, 2, linked);
        // Do not advance curr; check if linked tree now matches next tree's degree
      }
    }
  }

  delete(val) {
    if (this.trees.length === 0) return [];
    return this.extractMin();
  }

  extractMin() {
    if (this.trees.length === 0) return [];
    const rec = createStepRecorder(() => this.getSnapshot());

    // 1. Find min root
    let minIdx = 0;
    for (let i = 1; i < this.trees.length; i++) {
      if (this.trees[i].key < this.trees[minIdx].key) {
        minIdx = i;
      }
    }

    const minRoot = this.trees[minIdx];
    rec.record({
      title: `Extract-Min: Found Minimum ${minRoot.key}`,
      action: `Tree B_${minRoot.degree} root ${minRoot.key} is the minimum among all roots`,
      rule: 'In a Binomial Heap, the global minimum is always at the root of one of the binomial trees.',
      highlightNodeIds: [minRoot.id],
      statusType: 'warning',
      actionCategory: 'delete'
    });

    // 2. Remove minRoot from root list
    this.trees.splice(minIdx, 1);

    // 3. Children of minRoot form a new Binomial Heap; reverse so degrees are ascending
    const children = minRoot.children.reverse();
    children.forEach(c => { c.parent = null; });

    rec.record({
      title: `Disassembled B_${minRoot.degree}`,
      action: `Removed root ${minRoot.key}. Its children become a new Binomial Heap: [${children.map(c => 'B' + c.degree).join(', ')}]`,
      rule: 'A binomial tree B_k minus its root decomposes into binomial trees B_0, B_1, ..., B_{k-1}.',
      statusType: 'info',
      actionCategory: 'merge'
    });

    // 4. Union the children with the remaining trees
    this._union(children, rec);

    rec.record({
      title: `Extract-Min Completed`,
      action: `Extracted ${minRoot.key}. Binomial Heap union finished.`,
      rule: 'Unique degrees property restored.',
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  search(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    let found = null;

    const traverse = (node) => {
      if (!node || found) return;
      if (node.key === key) {
        found = node;
        return;
      }
      (node.children || []).forEach(traverse);
    };
    this.trees.forEach(traverse);

    if (found) {
      rec.record({
        title: `Found Key ${key}`,
        action: `Key ${key} located inside tree with degree ${found.degree}`,
        rule: 'Found in Binomial Heap.',
        highlightNodeIds: [found.id],
        statusType: 'success',
        actionCategory: 'search'
      });
    } else {
      rec.record({
        title: `Key ${key} Not Found`,
        action: `Key ${key} is absent from Binomial Heap`,
        rule: 'Not present.',
        statusType: 'danger',
        actionCategory: 'search'
      });
    }

    return rec.steps;
  }

  toJSON() {
    const serializeNode = (n) => ({
      key: n.key,
      id: n.id,
      degree: n.degree,
      children: (n.children || []).map(serializeNode)
    });
    return { trees: this.trees.map(serializeNode) };
  }

  static fromJSON(data) {
    const bh = new BinomialHeap();
    const deserializeNode = (d) => {
      const n = new HeapNode(d.key, d.id);
      n.degree = d.degree || 0;
      n.children = Array.isArray(d.children) ? d.children.map(deserializeNode) : [];
      n.children.forEach(c => { c.parent = n; });
      return n;
    };
    if (data && Array.isArray(data.trees)) {
      bh.trees = data.trees.map(deserializeNode);
    }
    return bh;
  }
}

// ============================================================================
// 7. Lazy Binomial Heap (Deferred consolidation on Extract-Min)
// ============================================================================
export class LazyBinomialHeap {
  constructor() {
    // Unconsolidated root list: multiple trees of the same degree can co-exist
    this.trees = [];
  }

  clear() {
    this.trees = [];
  }

  getSnapshot() {
    if (this.trees.length === 0) return null;
    const forestRoot = new HeapNode(null, 'forest_root');
    forestRoot.isForest = true;
    const minRoot = this._findMinRoot();
    forestRoot.children = this.trees.map(t => {
      const cloned = t.clone();
      if (minRoot && t.key === minRoot.key) {
        cloned.isMinRoot = true;
      }
      return cloned;
    });
    return forestRoot;
  }

  _findMinRoot() {
    if (this.trees.length === 0) return null;
    let min = this.trees[0];
    for (let i = 1; i < this.trees.length; i++) {
      if (this.trees[i].key < min.key) {
        min = this.trees[i];
      }
    }
    return min;
  }

  getStats() {
    let count = 0;
    const countNodes = (n) => {
      count++;
      (n.children || []).forEach(countNodes);
    };
    this.trees.forEach(countNodes);
    const minRoot = this._findMinRoot();
    return {
      totalKeys: count,
      totalNodes: count,
      height: this.trees.length,
      minKeys: minRoot ? minRoot.key : 0,
      maxKeys: this.trees.length // number of roots in lazy list
    };
  }

  validateInvariants() {
    let heapOrdered = true;
    const checkHeap = (node) => {
      (node.children || []).forEach(child => {
        if (node.key > child.key) heapOrdered = false;
        checkHeap(child);
      });
    };
    this.trees.forEach(checkHeap);

    return [
      { name: 'Min-Heap Ordered Trees', detail: 'Parent key ≤ Children keys in all trees', valid: heapOrdered },
      { name: 'Lazy O(1) Insertion', detail: 'Roots added lazily without immediate degree pairing', valid: true },
      { name: 'Consolidation on Extract-Min', detail: 'Trees consolidated when minimum is extracted', valid: true }
    ];
  }

  insert(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    const newNode = new HeapNode(key, `lazy_node_${nextHeapNodeId++}`);
    newNode.degree = 0;
    newNode.children = [];

    // Lazy insert: simply prepend to root list in O(1) time
    this.trees.push(newNode);

    rec.record({
      title: `Lazy Insert Key ${key}`,
      action: `Appended single node ${key} (B_0) to root list in O(1) time`,
      rule: 'In a Lazy Binomial Heap, insertions and unions take O(1) worst-case time by deferring consolidation.',
      tip: 'Notice that multiple trees of the same degree are allowed in the root list until Extract-Min is called!',
      highlightNodeIds: [newNode.id],
      statusType: 'success',
      actionCategory: 'insert'
    });

    return rec.steps;
  }

  delete(val) {
    if (this.trees.length === 0) return [];
    return this.extractMin();
  }

  extractMin() {
    if (this.trees.length === 0) return [];
    const rec = createStepRecorder(() => this.getSnapshot());

    // 1. Locate min root
    let minIdx = 0;
    for (let i = 1; i < this.trees.length; i++) {
      if (this.trees[i].key < this.trees[minIdx].key) {
        minIdx = i;
      }
    }

    const minRoot = this.trees[minIdx];
    rec.record({
      title: `Extract-Min: Found Minimum ${minRoot.key}`,
      action: `Minimum root is ${minRoot.key} with degree ${minRoot.degree}`,
      rule: 'Remove minimum root, promote all its children to root list, then consolidate.',
      highlightNodeIds: [minRoot.id],
      statusType: 'warning',
      actionCategory: 'delete'
    });

    this.trees.splice(minIdx, 1);
    const children = minRoot.children || [];
    children.forEach(c => { c.parent = null; });
    this.trees.push(...children);

    rec.record({
      title: `Promoted Children to Root List`,
      action: `Added ${children.length} children of ${minRoot.key} to root list`,
      rule: 'All roots now await consolidation by degree.',
      statusType: 'info',
      actionCategory: 'merge'
    });

    // 2. Consolidate roots using degree table
    this._consolidate(rec);

    rec.record({
      title: `Extract-Min & Consolidation Complete`,
      action: `Extracted ${minRoot.key}. Consolidated into [${this.trees.map(t => 'B' + t.degree).join(', ')}]`,
      rule: 'At most one tree per degree remains after consolidation.',
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  _consolidate(rec) {
    const table = []; // degree table
    const roots = [...this.trees];
    this.trees = [];

    rec.record({
      title: `Consolidation Step: Linking Equal Degrees`,
      action: `Processing ${roots.length} roots across degree table`,
      rule: 'Iterate through all roots; if another tree of degree d exists, link them and carry over to degree d+1.',
      statusType: 'info',
      actionCategory: 'heapify'
    });

    for (let root of roots) {
      let d = root.degree;
      while (table[d]) {
        let other = table[d];
        table[d] = null;

        rec.record({
          title: `Degree Collision at d = ${d}`,
          action: `Found two trees of degree ${d}: root ${root.key} and root ${other.key}`,
          rule: 'Link them so the smaller root becomes the parent.',
          highlightNodeIds: [root.id, other.id],
          statusType: 'warning',
          actionCategory: 'link'
        });

        if (root.key > other.key) {
          [root, other] = [other, root];
        }

        other.parent = root;
        root.children = [other, ...root.children];
        root.degree += 1;
        d = root.degree;

        rec.record({
          title: `Linked into Degree ${root.degree}`,
          action: `New combined tree B_${root.degree} with root ${root.key}`,
          rule: 'Now checking degree table at slot ' + d,
          highlightNodeIds: [root.id],
          statusType: 'info',
          actionCategory: 'heapify'
        });
      }
      table[d] = root;
    }

    // Reconstruct root list sorted by degree
    for (let i = 0; i < table.length; i++) {
      if (table[i]) {
        this.trees.push(table[i]);
      }
    }
  }

  search(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    let found = null;

    const traverse = (node) => {
      if (!node || found) return;
      if (node.key === key) {
        found = node;
        return;
      }
      (node.children || []).forEach(traverse);
    };
    this.trees.forEach(traverse);

    if (found) {
      rec.record({
        title: `Found Key ${key}`,
        action: `Key ${key} located in Lazy Binomial Heap`,
        rule: 'Found.',
        highlightNodeIds: [found.id],
        statusType: 'success',
        actionCategory: 'search'
      });
    } else {
      rec.record({
        title: `Key ${key} Not Found`,
        action: `Key ${key} is absent`,
        rule: 'Not present.',
        statusType: 'danger',
        actionCategory: 'search'
      });
    }

    return rec.steps;
  }

  toJSON() {
    const serializeNode = (n) => ({
      key: n.key,
      id: n.id,
      degree: n.degree,
      children: (n.children || []).map(serializeNode)
    });
    return { trees: this.trees.map(serializeNode) };
  }

  static fromJSON(data) {
    const lbh = new LazyBinomialHeap();
    const deserializeNode = (d) => {
      const n = new HeapNode(d.key, d.id);
      n.degree = d.degree || 0;
      n.children = Array.isArray(d.children) ? d.children.map(deserializeNode) : [];
      n.children.forEach(c => { c.parent = n; });
      return n;
    };
    if (data && Array.isArray(data.trees)) {
      lbh.trees = data.trees.map(deserializeNode);
    }
    return lbh;
  }
}

// ============================================================================
// 8. Fibonacci Heap (Fredman & Tarjan amortized priority queue)
// ============================================================================
export class FibonacciHeap {
  constructor() {
    this.trees = []; // root list
    this.minNode = null;
    this.totalCount = 0;
  }

  clear() {
    this.trees = [];
    this.minNode = null;
    this.totalCount = 0;
  }

  getSnapshot() {
    if (this.trees.length === 0) return null;
    const forestRoot = new HeapNode(null, 'forest_root');
    forestRoot.isForest = true;
    forestRoot.children = this.trees.map(t => {
      const cloned = t.clone();
      if (this.minNode && t.key === this.minNode.key) {
        cloned.isMinRoot = true;
      }
      return cloned;
    });
    return forestRoot;
  }

  getStats() {
    return {
      totalKeys: this.totalCount,
      totalNodes: this.totalCount,
      height: this.trees.length,
      minKeys: this.minNode ? this.minNode.key : 0,
      maxKeys: this.trees.length > 0 ? Math.max(...this.trees.map(t => t.degree)) : 0
    };
  }

  validateInvariants() {
    let heapOrdered = true;
    const checkHeap = (node) => {
      (node.children || []).forEach(child => {
        if (node.key > child.key) heapOrdered = false;
        checkHeap(child);
      });
    };
    this.trees.forEach(checkHeap);

    return [
      { name: 'Min-Heap Ordered Trees', detail: 'Parent key ≤ Children keys for all trees', valid: heapOrdered },
      { name: 'Marked Node Invariant', detail: 'Non-root node is marked if it lost a child since becoming child of parent', valid: true },
      { name: 'O(1) Insertion & Union', detail: 'Lazy addition to circular root list', valid: true }
    ];
  }

  insert(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    const newNode = new HeapNode(key, `fib_node_${nextHeapNodeId++}`);
    newNode.degree = 0;
    newNode.marked = false;
    newNode.children = [];

    this.trees.push(newNode);
    this.totalCount++;

    if (!this.minNode || key < this.minNode.key) {
      this.minNode = newNode;
    }

    rec.record({
      title: `Fibonacci Insert: ${key}`,
      action: `Added node ${key} to root list in O(1) amortized time`,
      rule: 'Fibonacci heaps insert elements in O(1) time without restructuring.',
      tip: `Current minimum pointer is at ${this.minNode.key}.`,
      highlightNodeIds: [newNode.id],
      statusType: 'success',
      actionCategory: 'insert'
    });

    return rec.steps;
  }

  delete(val) {
    if (!this.minNode) return [];
    if (val === undefined || val === null || Number(val) === this.minNode.key) {
      return this.extractMin();
    }
    // Decrease key to negative infinity then extract min
    return this.decreaseKey(Number(val), -999999);
  }

  extractMin() {
    if (!this.minNode) return [];
    const rec = createStepRecorder(() => this.getSnapshot());
    const z = this.minNode;

    rec.record({
      title: `Extract-Min: Found Minimum ${z.key}`,
      action: `Minimum root is ${z.key} with degree ${z.degree}`,
      rule: 'In Fibonacci Heaps, Extract-Min promotes all children of the min node to the root list, then consolidates.',
      highlightNodeIds: [z.id],
      statusType: 'warning',
      actionCategory: 'delete'
    });

    // 1. Promote children of z to root list
    const children = z.children || [];
    children.forEach(c => {
      c.parent = null;
      c.marked = false;
      this.trees.push(c);
    });

    // 2. Remove z from root list
    const zIdx = this.trees.findIndex(t => t.id === z.id);
    if (zIdx !== -1) {
      this.trees.splice(zIdx, 1);
    }
    this.totalCount--;

    if (this.trees.length === 0) {
      this.minNode = null;
      rec.record({
        title: `Heap is now Empty`,
        action: `Extracted last element ${z.key}`,
        rule: 'Fibonacci Heap contains 0 nodes.',
        statusType: 'info',
        actionCategory: 'general'
      });
      return rec.steps;
    }

    rec.record({
      title: `Promoted Children to Root List`,
      action: `Removed ${z.key}. ${children.length} children promoted to root list.`,
      rule: 'Now starting degree consolidation.',
      statusType: 'info',
      actionCategory: 'merge'
    });

    // 3. Consolidate
    this._consolidate(rec);

    rec.record({
      title: `Extract-Min Completed`,
      action: `Extracted ${z.key}. New minimum is ${this.minNode.key}.`,
      rule: 'Degree consolidation complete. At most one tree of each degree in root list.',
      highlightNodeIds: [this.minNode.id],
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  _consolidate(rec) {
    const maxDegree = Math.max(10, Math.floor(Math.log2(this.totalCount + 1) * 2) + 2);
    const A = new Array(maxDegree).fill(null);
    const roots = [...this.trees];

    for (let w of roots) {
      let x = w;
      let d = x.degree;

      while (A[d]) {
        let y = A[d];
        if (x.key > y.key) {
          [x, y] = [y, x];
        }

        rec.record({
          title: `Consolidate: Trees of Equal Degree ${d}`,
          action: `Roots ${x.key} and ${y.key} both have degree ${d}. Linking ${y.key} under ${x.key}`,
          rule: 'Make the node with larger key a child of the smaller key.',
          highlightNodeIds: [x.id, y.id],
          statusType: 'warning',
          actionCategory: 'link'
        });

        // Link y as child of x
        const yIdx = this.trees.findIndex(t => t.id === y.id);
        if (yIdx !== -1) this.trees.splice(yIdx, 1);

        y.parent = x;
        x.children = [y, ...x.children];
        x.degree += 1;
        y.marked = false;

        A[d] = null;
        d++;
      }
      A[d] = x;
    }

    // Rebuild root list and find min
    this.trees = [];
    this.minNode = null;

    for (let i = 0; i < A.length; i++) {
      if (A[i]) {
        this.trees.push(A[i]);
        if (!this.minNode || A[i].key < this.minNode.key) {
          this.minNode = A[i];
        }
      }
    }
  }

  decreaseKey(val, newKey) {
    const key = Number(val);
    const targetKey = Number(newKey);
    const rec = createStepRecorder(() => this.getSnapshot());

    let targetNode = null;
    const findNode = (n) => {
      if (!n || targetNode) return;
      if (n.key === key) {
        targetNode = n;
        return;
      }
      (n.children || []).forEach(findNode);
    };
    this.trees.forEach(findNode);

    if (!targetNode) {
      rec.record({
        title: `Key ${key} Not Found`,
        action: `Cannot decrease key: ${key} not in heap`,
        statusType: 'danger',
        actionCategory: 'general'
      });
      return rec.steps;
    }

    if (targetKey > targetNode.key) {
      rec.record({
        title: `Invalid Decrease-Key`,
        action: `New key ${targetKey} > current key ${targetNode.key}`,
        rule: 'Decrease-key only allows decreasing the value, not increasing.',
        statusType: 'danger',
        actionCategory: 'general'
      });
      return rec.steps;
    }

    targetNode.key = targetKey;

    rec.record({
      title: `Decreased Key from ${key} to ${targetKey}`,
      action: `Updated key value to ${targetKey}`,
      rule: 'If key < parent.key, cut child and execute cascading cuts.',
      highlightNodeIds: [targetNode.id],
      statusType: 'warning',
      actionCategory: 'heapify'
    });

    const parent = targetNode.parent;
    if (parent && targetNode.key < parent.key) {
      this._cut(targetNode, parent, rec);
      this._cascadingCut(parent, rec);
    }

    if (targetNode.key < this.minNode.key) {
      this.minNode = targetNode;
    }

    rec.record({
      title: `Decrease-Key Completed`,
      action: `Key decreased to ${targetKey}. Min pointer is at ${this.minNode.key}`,
      rule: 'Fibonacci heap invariants preserved.',
      highlightNodeIds: [targetNode.id],
      statusType: 'success',
      actionCategory: 'general'
    });

    return rec.steps;
  }

  _cut(x, y, rec) {
    // Remove x from y's child list
    y.children = (y.children || []).filter(c => c.id !== x.id);
    y.degree = Math.max(0, y.degree - 1);
    x.parent = null;
    x.marked = false;
    this.trees.push(x);

    rec.record({
      title: `Cut: Moved ${x.key} to Root List`,
      action: `Cut node ${x.key} from parent ${y.key} and added to root list`,
      rule: 'Violation resolved by making the subtree an independent root.',
      highlightNodeIds: [x.id, y.id],
      statusType: 'warning',
      actionCategory: 'cut'
    });
  }

  _cascadingCut(y, rec) {
    const z = y.parent;
    if (z) {
      if (!y.marked) {
        y.marked = true;
        rec.record({
          title: `Marked Node ${y.key}`,
          action: `Node ${y.key} lost a child. Marked = true`,
          rule: 'A node is marked when it loses its first child. If it loses a second child, it will be cut as well.',
          highlightNodeIds: [y.id],
          statusType: 'info',
          actionCategory: 'heapify'
        });
      } else {
        rec.record({
          title: `Cascading Cut at ${y.key}`,
          action: `Node ${y.key} was already marked! Second child lost, triggering cascading cut up the tree.`,
          rule: 'Cascading cuts guarantee that subtree sizes remain exponential in degree, ensuring O(1) amortized bounds.',
          highlightNodeIds: [y.id, z.id],
          statusType: 'danger',
          actionCategory: 'cut'
        });
        this._cut(y, z, rec);
        this._cascadingCut(z, rec);
      }
    }
  }

  search(val) {
    const key = Number(val);
    const rec = createStepRecorder(() => this.getSnapshot());
    let found = null;

    const traverse = (node) => {
      if (!node || found) return;
      if (node.key === key) {
        found = node;
        return;
      }
      (node.children || []).forEach(traverse);
    };
    this.trees.forEach(traverse);

    if (found) {
      rec.record({
        title: `Found Key ${key}`,
        action: `Key ${key} found (degree ${found.degree}, marked: ${found.marked})`,
        rule: 'Found in Fibonacci Heap.',
        highlightNodeIds: [found.id],
        statusType: 'success',
        actionCategory: 'search'
      });
    } else {
      rec.record({
        title: `Key ${key} Not Found`,
        action: `Key ${key} is absent from Fibonacci Heap`,
        rule: 'Not present.',
        statusType: 'danger',
        actionCategory: 'search'
      });
    }

    return rec.steps;
  }

  toJSON() {
    const serializeNode = (n) => ({
      key: n.key,
      id: n.id,
      degree: n.degree,
      marked: n.marked,
      children: (n.children || []).map(serializeNode)
    });
    return {
      trees: this.trees.map(serializeNode),
      minKey: this.minNode ? this.minNode.key : null,
      totalCount: this.totalCount
    };
  }

  static fromJSON(data) {
    const fh = new FibonacciHeap();
    const deserializeNode = (d) => {
      const n = new HeapNode(d.key, d.id);
      n.degree = d.degree || 0;
      n.marked = Boolean(d.marked);
      n.children = Array.isArray(d.children) ? d.children.map(deserializeNode) : [];
      n.children.forEach(c => { c.parent = n; });
      return n;
    };
    if (data && Array.isArray(data.trees)) {
      fh.trees = data.trees.map(deserializeNode);
      fh.totalCount = data.totalCount || fh.trees.length;
      if (data.minKey !== null) {
        fh.minNode = fh.trees.find(t => t.key === data.minKey) || fh.trees[0] || null;
      }
    }
    return fh;
  }
}
