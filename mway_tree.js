/**
 * Multi-Way (M-Way) Search Tree Data Structure
 * 
 * Order M:
 * - Each node has at most M - 1 keys and at most M children.
 * - Keys within each node are sorted: k0 < k1 < ... < kp-1.
 * - Subtree Ti contains keys between ki-1 and ki.
 * - Non-root nodes have no minimum key requirement (unlike B-Trees).
 */

let nextMWayNodeId = 1;
export function resetMWayNodeIdCounter() {
  nextMWayNodeId = 1;
}

// ponytail: Key normalization parses numeric strings as numbers, otherwise preserves string tokens (e.g. 'E', 'L').
export function normalizeKey(key) {
  if (key === null || key === undefined) return null;
  if (typeof key === 'number') return isNaN(key) ? null : key;
  const str = String(key).trim();
  if (str === '') return null;
  if (!isNaN(Number(str))) {
    return Number(str);
  }
  return str;
}

// ponytail: Key comparison supports both numeric order and alphabetical order.
export function compareKeys(a, b) {
  const isNumA = typeof a === 'number';
  const isNumB = typeof b === 'number';
  if (isNumA && isNumB) {
    return a - b;
  }
  const strA = String(a);
  const strB = String(b);
  return strA < strB ? -1 : strA > strB ? 1 : 0;
}

export class MWayTreeNode {
  constructor(isLeaf = true, id = null, maxChildren = 4) {
    this.id = id || `mway_node_${nextMWayNodeId++}`;
    this.keys = [];
    this.children = new Array(maxChildren).fill(null);
    this.isLeaf = isLeaf;
  }

  clone() {
    const copy = new MWayTreeNode(this.isLeaf, this.id, this.children.length);
    copy.keys = [...this.keys];
    copy.children = this.children.map(ch => (ch ? ch.clone() : null));
    return copy;
  }
}

export class MWayTree {
  constructor(M = 4) {
    if (M < 3) throw new Error("M-Way tree order M must be >= 3");
    this.M = M;
    this.maxKeys = M - 1;
    this.maxChildren = M;
    this.root = new MWayTreeNode(true, null, M);
    this.steps = [];
  }

  cloneTree() {
    if (!this.root) return null;
    const cloneClean = (node) => {
      if (!node) return null;
      const copy = new MWayTreeNode(node.isLeaf, node.id, this.maxChildren);
      copy.keys = [...node.keys];
      // Filter out null branch slots for visual layout rendering
      copy.children = (node.children || [])
        .filter(Boolean)
        .map(cloneClean);
      return copy;
    };
    return cloneClean(this.root);
  }

  recordStep({ title, reason, action, rule, tip, popupMessage, highlightNodeIds = [], highlightKeyIndices = {}, statusType = 'info', actionCategory = 'general', meta = {} }) {
    const finalReason = reason || (action && rule ? `${action} ${rule}` : action || rule || '');
    this.steps.push({
      treeSnapshot: this.cloneTree(),
      title,
      action,
      rule,
      tip,
      reason: finalReason,
      popupMessage: popupMessage || action || finalReason,
      highlightNodeIds: [...highlightNodeIds],
      highlightKeyIndices: { ...highlightKeyIndices },
      statusType,
      actionCategory,
      meta: { ...meta }
    });
  }

  search(key) {
    this.steps = [];
    key = normalizeKey(key);
    if (key === null) return { found: false, steps: this.steps };
    this.recordStep({
      title: `Search Initiated: Key ${key}`,
      action: `Searching for key ${key} starting from the root node.`,
      rule: `In an M-Way Search Tree of order M, each node holds up to M-1 sorted keys bounding up to M subtrees.`,
      tip: `Like comparing against multiple doors in a hallway to choose which room to enter.`,
      popupMessage: `Searching for ${key}`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'search'
    });

    if (!this.root || this.root.keys.length === 0) {
      this.recordStep({
        title: `Search Failed: Empty Tree`,
        action: `Tree is empty. Cannot locate key ${key}.`,
        rule: `An empty search tree contains no keys.`,
        tip: `No doors or hallway exists yet.`,
        popupMessage: `Empty tree`,
        statusType: 'error',
        actionCategory: 'search'
      });
      return { found: false, steps: this.steps };
    }

    let curr = this.root;
    while (curr) {
      const idx = curr.keys.indexOf(key);
      if (idx !== -1) {
        this.recordStep({
          title: `Search Succeeded: Found Key ${key}`,
          action: `Key ${key} found in node [${curr.id}] at slot [${idx}].`,
          rule: `Key is present in the tree. Search terminates successfully.`,
          tip: `Bullseye! Exact match found inside this node.`,
          popupMessage: `Found ${key} in node!`,
          highlightNodeIds: [curr.id],
          highlightKeyIndices: { [curr.id]: [idx] },
          statusType: 'success',
          actionCategory: 'search'
        });
        return { found: true, node: curr, index: idx, steps: this.steps };
      }

      // Find child branch
      let childIdx = 0;
      while (childIdx < curr.keys.length && compareKeys(key, curr.keys[childIdx]) > 0) {
        childIdx++;
      }

      if (curr.isLeaf || !curr.children[childIdx]) {
        this.recordStep({
          title: `Search Failed: Key ${key} Not Found`,
          action: `Reached terminal path in node [${curr.id}]. Branch [${childIdx}] does not exist.`,
          rule: `If the bounding child pointer is null, the key cannot exist anywhere in the tree.`,
          tip: `The door indicated by the signpost is missing; key not found.`,
          popupMessage: `Key ${key} not in tree`,
          highlightNodeIds: [curr.id],
          statusType: 'error',
          actionCategory: 'search'
        });
        return { found: false, steps: this.steps };
      }

      this.recordStep({
        title: `Branching to Child [${childIdx}]`,
        action: childIdx < curr.keys.length
          ? `Key ${key} < [${curr.keys[childIdx]}]. Navigating down child branch [${childIdx}].`
          : `Key ${key} > [${curr.keys[curr.keys.length - 1]}]. Navigating down rightmost child branch [${childIdx}].`,
        rule: `Subtree Ti contains all keys strictly between key[i-1] and key[i].`,
        tip: `Following the interval signpost down to the next branch.`,
        popupMessage: `Branching to child [${childIdx}]`,
        highlightNodeIds: [curr.id, curr.children[childIdx].id],
        statusType: 'info',
        actionCategory: 'search'
      });

      curr = curr.children[childIdx];
    }

    return { found: false, steps: this.steps };
  }

  insert(key) {
    this.steps = [];
    key = normalizeKey(key);
    if (key === null) return this.steps;

    this.recordStep({
      title: `Insert Initiated: Key ${key}`,
      action: `Preparing to insert key ${key} into Order-${this.M} M-Way Search Tree.`,
      rule: `In an M-Way Tree, nodes hold up to ${this.maxKeys} keys and ${this.maxChildren} subtrees. Unlike B-Trees, there is no forced minimum key count or bottom-up split.`,
      tip: `Think of multi-slot shelves: place items into open slots; if a shelf fills up, sprout a new sub-shelf below it!`,
      popupMessage: `Inserting ${key}`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'insert'
    });

    if (this.root.keys.length === 0) {
      this.root.keys.push(key);
      this.recordStep({
        title: `Inserted Key ${key} into Empty Root`,
        action: `Tree was empty. Placed key ${key} as initial root key.`,
        rule: `The first inserted element initializes the root node.`,
        tip: `First book on the new multi-slot shelf.`,
        popupMessage: `Inserted ${key} into root`,
        highlightNodeIds: [this.root.id],
        highlightKeyIndices: { [this.root.id]: [0] },
        statusType: 'success',
        actionCategory: 'insert'
      });
      return this.steps;
    }

    let curr = this.root;
    while (curr) {
      if (curr.keys.includes(key)) {
        this.recordStep({
          title: `Duplicate Key ${key}`,
          action: `Key ${key} already exists in node [${curr.id}]. Skipping duplicate.`,
          rule: `M-Way Search Trees maintain strictly unique keys in sorted order.`,
          tip: `No duplicate keys allowed.`,
          popupMessage: `Duplicate key ${key}`,
          highlightNodeIds: [curr.id],
          statusType: 'warning',
          actionCategory: 'insert'
        });
        return this.steps;
      }

      // If node has space and is leaf, or if there's no suitable child branch
      let childIdx = 0;
      while (childIdx < curr.keys.length && compareKeys(key, curr.keys[childIdx]) > 0) {
        childIdx++;
      }

      if (curr.isLeaf) {
        if (curr.keys.length < this.maxKeys) {
          curr.keys.push(key);
          curr.keys.sort(compareKeys);
          const idx = curr.keys.indexOf(key);

          this.recordStep({
            title: `Key ${key} Inserted into Node`,
            action: `Node [${curr.id}] had available capacity (${curr.keys.length}/${this.maxKeys} keys). Placed key ${key} in sorted order.`,
            rule: `If a leaf has fewer than M-1 keys, insert the key directly without rebalancing.`,
            tip: `Slid key into an open slot on the existing shelf.`,
            popupMessage: `Key ${key} placed in node`,
            highlightNodeIds: [curr.id],
            highlightKeyIndices: { [curr.id]: [idx] },
            statusType: 'success',
            actionCategory: 'insert'
          });
          return this.steps;
        } else {
          // Leaf node is full, must sprout a new child node!
          const newChild = new MWayTreeNode(true, null, this.maxChildren);
          newChild.keys = [key];
          curr.isLeaf = false;
          curr.children[childIdx] = newChild;

          this.recordStep({
            title: `Node Full: Created New Subtree for ${key}`,
            action: `Node [${curr.id}] is full with ${this.maxKeys} keys. Sprouted a new child node at branch [${childIdx}] to accommodate key ${key}.`,
            rule: `Unlike B-Trees, M-Way Trees do NOT split nodes upward when full. Instead, a new child node is simply attached below at the appropriate interval pointer.`,
            tip: `Shelf is full, so we hang a new sub-shelf directly underneath!`,
            popupMessage: `Created new child node for ${key}`,
            highlightNodeIds: [curr.id, newChild.id],
            statusType: 'success',
            actionCategory: 'insert'
          });
          return this.steps;
        }
      } else {
        // Internal node: if child slot is missing, create it
        if (!curr.children[childIdx]) {
          const newChild = new MWayTreeNode(true, null, this.maxChildren);
          newChild.keys = [key];
          curr.children[childIdx] = newChild;

          this.recordStep({
            title: `Created Child Node at Branch [${childIdx}]`,
            action: `Branch [${childIdx}] was empty. Created a new child node containing key ${key}.`,
            rule: `When an internal node lacks a child at the required interval, a new leaf node is attached there.`,
            tip: `Created a brand new sub-compartment for this range.`,
            popupMessage: `New child node created`,
            highlightNodeIds: [curr.id, newChild.id],
            statusType: 'success',
            actionCategory: 'insert'
          });
          return this.steps;
        }

        // Otherwise branch down
        this.recordStep({
          title: `Traversing Down Branch [${childIdx}]`,
          action: `Node [${curr.id}] is internal. Navigating to child branch [${childIdx}].`,
          rule: `Traverse down the branch bounded by adjacent node keys.`,
          tip: `Heading down the designated aisle.`,
          popupMessage: `Branching down [${childIdx}]`,
          highlightNodeIds: [curr.id, curr.children[childIdx].id],
          statusType: 'info',
          actionCategory: 'insert'
        });
        curr = curr.children[childIdx];
      }
    }

    return this.steps;
  }

  delete(key) {
    this.steps = [];
    key = normalizeKey(key);
    if (key === null) return this.steps;

    this.recordStep({
      title: `Delete Initiated: Key ${key}`,
      action: `Searching for key ${key} to delete from M-Way Search Tree.`,
      rule: `Deletion removes the key and preserves M-Way search intervals without B-Tree underflow borrowing/merging.`,
      tip: `Find the item and remove or swap it with the closest neighbor.`,
      popupMessage: `Deleting ${key}`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'delete'
    });

    if (!this.root || this.root.keys.length === 0) {
      this.recordStep({
        title: `Delete Aborted: Empty Tree`,
        action: `Tree is empty. Cannot delete key ${key}.`,
        rule: `Cannot delete from an empty search tree.`,
        tip: `Nothing to delete!`,
        popupMessage: `Tree is empty`,
        statusType: 'warning',
        actionCategory: 'delete'
      });
      return this.steps;
    }

    const deleted = this.deleteRecursive(this.root, key, null, -1);
    if (!deleted) {
      this.recordStep({
        title: `Key ${key} Not Found`,
        action: `Key ${key} was not found in the M-Way Search Tree.`,
        rule: `Cannot delete a non-existent key.`,
        tip: `Nothing to remove!`,
        popupMessage: `Key ${key} not in tree`,
        statusType: 'error',
        actionCategory: 'delete'
      });
    }

    return this.steps;
  }

  deleteRecursive(node, key, parent, parentChildIdx) {
    if (!node) return false;

    const keyIdx = node.keys.indexOf(key);
    if (keyIdx !== -1) {
      this.recordStep({
        title: `Located Key ${key} in Node [${node.id}]`,
        action: `Found key ${key} at index ${keyIdx}. Evaluating whether node is leaf or internal.`,
        rule: `If node is a leaf, remove directly. If internal, swap with in-order predecessor or successor.`,
        tip: `Inspect node type before deciding removal approach.`,
        popupMessage: `Found ${key} to delete`,
        highlightNodeIds: [node.id],
        highlightKeyIndices: { [node.id]: [keyIdx] },
        statusType: 'info',
        actionCategory: 'delete'
      });

      if (node.isLeaf || node.children.length === 0) {
        // Direct leaf deletion
        node.keys.splice(keyIdx, 1);
        this.recordStep({
          title: `Key ${key} Deleted from Leaf`,
          action: `Directly deleted key ${key} from leaf node [${node.id}].`,
          rule: `Leaf keys can be removed directly without rebalancing because M-Way trees have no minimum key requirement.`,
          tip: `Simple removal off the shelf!`,
          popupMessage: `Deleted ${key} from leaf`,
          highlightNodeIds: [node.id],
          statusType: 'success',
          actionCategory: 'delete'
        });

        // If node becomes empty and is not root, remove it from parent
        if (node.keys.length === 0 && parent) {
          parent.children[parentChildIdx] = null;
          if (parent.children.every(ch => !ch)) parent.isLeaf = true;
        }
        return true;
      } else {
        // Internal node deletion: replace with in-order predecessor or successor
        let leftChild = node.children[keyIdx];
        let rightChild = node.children[keyIdx + 1];

        if (leftChild) {
          // Find max in left subtree
          let predNode = leftChild;
          while (!predNode.isLeaf && predNode.children.length > 0) {
            predNode = predNode.children[predNode.children.length - 1];
          }
          const predKey = predNode.keys[predNode.keys.length - 1];

          this.recordStep({
            title: `Replacing ${key} with In-order Predecessor ${predKey}`,
            action: `Node is internal. Swapping key ${key} with in-order predecessor [${predKey}] from left subtree.`,
            rule: `Internal keys are replaced by their predecessor (maximum key in left subtree) or successor to maintain the search property.`,
            tip: `Swap with the nearest neighbor before deleting!`,
            popupMessage: `Swap ${key} with predecessor ${predKey}`,
            highlightNodeIds: [node.id, predNode.id],
            statusType: 'info',
            actionCategory: 'delete'
          });

          node.keys[keyIdx] = predKey;
          return this.deleteRecursive(leftChild, predKey, node, keyIdx);
        } else if (rightChild) {
          // Find min in right subtree
          let succNode = rightChild;
          while (!succNode.isLeaf && succNode.children.length > 0) {
            succNode = succNode.children[0];
          }
          const succKey = succNode.keys[0];

          this.recordStep({
            title: `Replacing ${key} with In-order Successor ${succKey}`,
            action: `Node is internal. Swapping key ${key} with in-order successor [${succKey}] from right subtree.`,
            rule: `Internal keys are replaced by their successor (minimum key in right subtree) when no left branch exists.`,
            tip: `Swap with the nearest neighbor before deleting!`,
            popupMessage: `Swap ${key} with successor ${succKey}`,
            highlightNodeIds: [node.id, succNode.id],
            statusType: 'info',
            actionCategory: 'delete'
          });

          node.keys[keyIdx] = succKey;
          return this.deleteRecursive(rightChild, succKey, node, keyIdx + 1);
        } else {
          // No child directly flanking, remove key
          node.keys.splice(keyIdx, 1);
          return true;
        }
      }
    }

    // Branch down
    let childIdx = 0;
    while (childIdx < node.keys.length && compareKeys(key, node.keys[childIdx]) > 0) {
      childIdx++;
    }

    if (!node.children[childIdx]) return false;
    return this.deleteRecursive(node.children[childIdx], key, node, childIdx);
  }

  clear() {
    this.root = new MWayTreeNode(true);
    this.steps = [];
  }

  getSnapshot() {
    return this.cloneTree();
  }

  getStats() {
    let totalKeys = 0;
    let totalNodes = 0;
    let height = 0;

    const traverse = (node, depth) => {
      if (!node) return;
      totalNodes++;
      totalKeys += node.keys.length;
      if (depth > height) height = depth;
      for (const ch of node.children) {
        if (ch) traverse(ch, depth + 1);
      }
    };
    if (this.root && this.root.keys.length > 0) {
      traverse(this.root, 1);
    }
    return { totalKeys, totalNodes, height, maxKeys: this.maxKeys, maxChildren: this.maxChildren };
  }

  validateInvariants() {
    const list = [
      { name: "Every node has at most M - 1 keys", valid: true, detail: `<= ${this.maxKeys} keys` },
      { name: "Every node has at most M children", valid: true, detail: `<= ${this.maxChildren} children` },
      { name: "Keys in all nodes are strictly sorted", valid: true, detail: "Ascending order" },
      { name: "Subtrees strictly partition keys (BST property)", valid: true, detail: "Left < Parent < Right" }
    ];

    if (!this.root || this.root.keys.length === 0) return list;

    let validMaxKeys = true;
    let validMaxChildren = true;
    let validSorting = true;

    const check = (node) => {
      if (!node) return;
      if (node.keys.length > this.maxKeys) validMaxKeys = false;
      if (node.children.length > this.maxChildren) validMaxChildren = false;
      for (let i = 0; i < node.keys.length - 1; i++) {
        if (compareKeys(node.keys[i], node.keys[i + 1]) >= 0) validSorting = false;
      }
      for (const ch of node.children) if (ch) check(ch);
    };
    check(this.root);
    list[0].valid = validMaxKeys;
    list[1].valid = validMaxChildren;
    list[2].valid = validSorting;
    return list;
  }

  toJSON() {
    function serializeNode(node) {
      if (!node) return null;
      return {
        id: node.id,
        keys: [...node.keys],
        isLeaf: node.isLeaf,
        children: node.children.map(serializeNode)
      };
    }
    return {
      type: 'mway',
      M: this.M,
      root: serializeNode(this.root)
    };
  }

  static fromJSON(data) {
    if (!data || !data.M) return null;
    const tree = new MWayTree(data.M);
    function deserializeNode(nData) {
      if (!nData) return null;
      const node = new MWayTreeNode(nData.isLeaf, nData.id);
      node.keys = Array.isArray(nData.keys) ? [...nData.keys] : [];
      node.children = Array.isArray(nData.children) ? nData.children.map(deserializeNode).filter(Boolean) : [];
      return node;
    }
    tree.root = deserializeNode(data.root) || new MWayTreeNode(true);
    return tree;
  }
}
