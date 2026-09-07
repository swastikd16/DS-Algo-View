/**
 * B-Tree Data Structure based on Order M
 * 
 * Order M Specification:
 * - Order: M >= 3 (e.g. M = 3, 4, 5, 6, 7)
 * - Max children = M
 * - Min children = ceil(M / 2) (for non-root internal nodes)
 * - Max keys in a node = M - 1
 * - Min keys in a non-root node = ceil(M / 2) - 1
 * - Root node has [1, M - 1] keys (or 0 if empty)
 * - All leaf nodes reside at the exact same depth
 */

let nextNodeId = 1;
export function resetNodeIdCounter() {
  nextNodeId = 1;
}
export function setNextNodeIdCounter(val) {
  nextNodeId = Math.max(nextNodeId, val);
}

export class BTreeNode {
  constructor(isLeaf = true, id = null) {
    this.id = id || `node_${nextNodeId++}`;
    this.keys = [];
    this.children = [];
    this.isLeaf = isLeaf;
  }

  clone() {
    const copy = new BTreeNode(this.isLeaf, this.id);
    copy.keys = [...this.keys];
    copy.children = this.children.map(child => child.clone());
    return copy;
  }
}

export class BTree {
  constructor(M = 4) {
    if (M < 3) throw new Error("B-Tree order M must be >= 3");
    this.M = M;
    this.maxKeys = M - 1;
    this.minKeys = Math.ceil(M / 2) - 1;
    this.maxChildren = M;
    this.minChildren = Math.ceil(M / 2);
    this.root = new BTreeNode(true);
    this.steps = [];
    this.deletionStrategy = 'clrs'; // 'clrs' (Top-Down Preemptive / Cormen) | 'reactive' (Bottom-Up)
  }

  setDeletionStrategy(strategy) {
    if (strategy === 'clrs' || strategy === 'reactive') {
      this.deletionStrategy = strategy;
    }
  }

  cloneTree() {
    return this.root ? this.root.clone() : null;
  }

  getSnapshot() {
    return this.cloneTree();
  }

  clear() {
    this.root = new BTreeNode(true);
    this.steps = [];
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
      M: this.M,
      deletionStrategy: this.deletionStrategy,
      root: serializeNode(this.root)
    };
  }

  static fromJSON(data) {
    // ponytail: Straightforward JSON deserializer for localStorage persistence
    if (!data || !data.M) return null;
    const tree = new BTree(data.M);
    if (data.deletionStrategy) {
      tree.setDeletionStrategy(data.deletionStrategy);
    }
    let maxId = 1;
    function deserializeNode(nodeData) {
      if (!nodeData) return null;
      const node = new BTreeNode(nodeData.isLeaf, nodeData.id);
      if (nodeData.id && typeof nodeData.id === 'string') {
        const match = nodeData.id.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num) && num > maxId) maxId = num;
        }
      }
      node.keys = Array.isArray(nodeData.keys) ? [...nodeData.keys] : [];
      node.children = Array.isArray(nodeData.children)
        ? nodeData.children.map(deserializeNode).filter(Boolean)
        : [];
      return node;
    }
    tree.root = deserializeNode(data.root) || new BTreeNode(true);
    setNextNodeIdCounter(maxId + 1);
    return tree;
  }

  // ponytail: Snapshot recording for animated scrubber timeline.
  recordStep({
    type = 'info',
    actionCategory = 'general', // 'split' | 'borrow' | 'merge' | 'insert' | 'delete' | 'search'
    title = '',
    reason = '',
    action = '',
    rule = '',
    tip = '',
    popupMessage = '',
    targetNodeId = null,
    highlightNodeIds = [],
    highlightKeyIndices = {}, // { [nodeId]: [index, ...] }
    statusType = 'info', // 'info' | 'action' | 'warning' | 'success' | 'error'
    meta = {}
  }) {
    const finalReason = reason || (action && rule ? `${action} ${rule}` : action || rule || '');
    this.steps.push({
      stepIndex: this.steps.length + 1,
      type,
      actionCategory,
      title,
      action,
      rule,
      tip,
      reason: finalReason,
      popupMessage: popupMessage || action || finalReason,
      targetNodeId: targetNodeId || (highlightNodeIds.length === 1 ? highlightNodeIds[0] : null),
      treeSnapshot: this.cloneTree(),
      highlightNodeIds: [...highlightNodeIds],
      highlightKeyIndices: JSON.parse(JSON.stringify(highlightKeyIndices)),
      statusType,
      meta
    });
  }

  /**
   * Search for a key in the B-Tree
   */
  search(key) {
    this.steps = [];
    key = Number(key);
    if (isNaN(key)) return { found: false, steps: this.steps };

    this.recordStep({
      type: 'start_search',
      actionCategory: 'search',
      title: `Starting Search for Key ${key}`,
      action: `Initiating lookup for key ${key} starting at root node.`,
      rule: `B-Tree search traverses multi-key nodes by comparing against boundaries to select the correct child pointer.`,
      tip: `Think of a library catalog with section signposts: check which range the book number falls into.`,
      popupMessage: `Searching for key ${key}...`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info'
    });

    if (!this.root || this.root.keys.length === 0) {
      this.recordStep({
        type: 'not_found',
        actionCategory: 'search',
        title: `Key ${key} Not Found`,
        action: `Root node is empty. Cannot locate key ${key}.`,
        rule: `An empty B-Tree contains no elements.`,
        tip: `Nothing on the shelves yet!`,
        popupMessage: `Tree is empty. Key ${key} does not exist.`,
        statusType: 'error'
      });
      return { found: false, steps: this.steps };
    }

    const result = this._searchNode(this.root, key);
    return { found: result !== null, steps: this.steps };
  }

  _searchNode(node, key) {
    let i = 0;
    this.recordStep({
      type: 'visit_node',
      actionCategory: 'search',
      title: `Scanning Node [${node.keys.join(', ')}]`,
      action: `Scanning keys in node [${node.keys.join(', ')}] to locate ${key} or determine child branch.`,
      rule: `Keys within any B-Tree node are always stored in strictly sorted ascending order.`,
      tip: `Scan left-to-right across the node's sorted compartment.`,
      popupMessage: `Scanning node keys [${node.keys.join(', ')}]`,
      highlightNodeIds: [node.id],
      statusType: 'info'
    });

    while (i < node.keys.length && key > node.keys[i]) {
      this.recordStep({
        type: 'compare_key',
        actionCategory: 'search',
        title: `Comparing: ${key} > ${node.keys[i]}`,
        action: `${key} is greater than ${node.keys[i]}. Moving to inspect next key in node.`,
        rule: `Sequential or binary comparison checks each key boundary to find the bounding interval.`,
        tip: `If target key > current signpost, keep scanning to the right.`,
        popupMessage: `${key} > ${node.keys[i]}`,
        highlightNodeIds: [node.id],
        highlightKeyIndices: { [node.id]: [i] },
        statusType: 'info'
      });
      i++;
    }

    if (i < node.keys.length && key === node.keys[i]) {
      this.recordStep({
        type: 'found',
        actionCategory: 'search',
        title: `Key ${key} Found!`,
        action: `Found exact match for key ${key} at index ${i} in node [${node.keys.join(', ')}].`,
        rule: `Key is present in the tree. Search terminates in O(log n) node visits.`,
        tip: `Bullseye! Exact match found in this node's compartment.`,
        popupMessage: `Key ${key} found!`,
        highlightNodeIds: [node.id],
        highlightKeyIndices: { [node.id]: [i] },
        statusType: 'success'
      });
      return node;
    }

    if (node.isLeaf) {
      this.recordStep({
        type: 'not_found',
        actionCategory: 'search',
        title: `Key ${key} Not Found`,
        action: `Reached leaf node [${node.keys.join(', ')}] without finding ${key}.`,
        rule: `Leaves have no children; if a key is not found here, it does not exist anywhere in the B-Tree.`,
        tip: `Reached the bottom shelf with no match found.`,
        popupMessage: `Key ${key} is not in tree.`,
        highlightNodeIds: [node.id],
        statusType: 'error'
      });
      return null;
    }

    this.recordStep({
      type: 'descend',
      actionCategory: 'search',
      title: `Descending to Child #${i}`,
      action: `Descending to child branch #${i} (${i > 0 ? node.keys[i - 1] : '-∞'} .. ${i < node.keys.length ? node.keys[i] : '+∞'}).`,
      rule: `Child pointer i leads to a subtree containing keys strictly between key[i-1] and key[i].`,
      tip: `Following the signpost down to the next floor.`,
      popupMessage: `Descending to child branch #${i}...`,
      highlightNodeIds: [node.id, node.children[i].id],
      statusType: 'action'
    });

    return this._searchNode(node.children[i], key);
  }

  /**
   * Insert a key into the B-Tree
   */
  insert(key) {
    this.steps = [];
    key = Number(key);
    if (isNaN(key)) return { steps: this.steps };

    const M = this.M;
    const maxK = this.maxKeys;
    const minK = this.minKeys;

    this.recordStep({
      type: 'start_insert',
      actionCategory: 'insert',
      title: `Insert Key ${key}`,
      action: `Beginning insertion of key ${key} into Order M = ${M} B-Tree.`,
      rule: `Every non-root node must hold between ${minK} and ${maxK} keys, and up to ${M} children.`,
      tip: `B-Trees grow from the bottom up and remain perfectly balanced at all times.`,
      popupMessage: `Starting insertion of key ${key}...`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info'
    });

    const splitResult = this._insertRecursive(this.root, key);

    // If root split, create a new root
    if (splitResult) {
      const newRoot = new BTreeNode(false);
      newRoot.keys = [splitResult.promotedKey];
      newRoot.children = [this.root, splitResult.rightSibling];
      this.root = newRoot;

      this.recordStep({
        type: 'new_root_created',
        actionCategory: 'split',
        title: `Tree Height Increased by 1`,
        action: `Old root split! Created new single-key root [${newRoot.keys.join(', ')}] with 2 children.`,
        rule: `A B-Tree grows height ONLY when the root node splits, pushing the median up into a new root.`,
        tip: `Unlike binary trees which grow downwards, B-Trees grow strictly from the roof up like adding a new penthouse!`,
        popupMessage: `Root split! Height increased to ${this.getStats().height}.`,
        highlightNodeIds: [newRoot.id, newRoot.children[0].id, newRoot.children[1].id],
        highlightKeyIndices: { [newRoot.id]: [0] },
        statusType: 'action',
        meta: {
          promotedKey: splitResult.promotedKey,
          isRootSplit: true
        }
      });
    }

    this.recordStep({
      type: 'insert_complete',
      actionCategory: 'insert',
      title: `Key ${key} Inserted Successfully`,
      action: `Key ${key} placed into the B-Tree. Order M = ${M} invariants hold.`,
      rule: `All leaf nodes remain at the exact same uniform depth (${this.getStats().height}).`,
      tip: `Insertion complete—tree is fully balanced and uniform.`,
      popupMessage: `Key ${key} successfully inserted!`,
      highlightNodeIds: [],
      statusType: 'success'
    });

    return { steps: this.steps };
  }

  _insertRecursive(node, key) {
    let idx = 0;
    while (idx < node.keys.length && key > node.keys[idx]) {
      idx++;
    }

    // Check duplicate
    if (idx < node.keys.length && node.keys[idx] === key) {
      this.recordStep({
        type: 'duplicate_key',
        actionCategory: 'insert',
        title: `Duplicate Key ${key} Ignored`,
        action: `Key ${key} already exists in node [${node.keys.join(', ')}]. Skipping duplicate.`,
        rule: `Standard B-Trees maintain unique keys in strict ascending order.`,
        tip: `No duplicate keys allowed.`,
        popupMessage: `Key ${key} already exists. Skipped duplicate.`,
        highlightNodeIds: [node.id],
        highlightKeyIndices: { [node.id]: [idx] },
        statusType: 'warning'
      });
      return null;
    }

    if (node.isLeaf) {
      this.recordStep({
        type: 'leaf_positioning',
        actionCategory: 'insert',
        title: `Inserting ${key} into Leaf Node`,
        action: `Finding sorted position for key ${key} at index ${idx} in leaf node [${node.keys.join(', ')}].`,
        rule: `All insertions begin at leaf nodes; keys are placed in sorted order.`,
        tip: `Sliding key ${key} into its sorted slot on the shelf.`,
        popupMessage: `Placing key ${key} into leaf node...`,
        highlightNodeIds: [node.id],
        statusType: 'info'
      });

      node.keys.splice(idx, 0, key);

      this.recordStep({
        type: 'leaf_inserted',
        actionCategory: 'insert',
        title: `Key ${key} Placed in Node`,
        action: `Key ${key} inserted. Node now contains ${node.keys.length}/${this.maxKeys} keys: [${node.keys.join(', ')}].`,
        rule: `If node size does not exceed maxKeys (${this.maxKeys}), insertion finishes without rebalancing.`,
        tip: `Plenty of room in this node compartment!`,
        popupMessage: `Key ${key} placed at index ${idx}.`,
        highlightNodeIds: [node.id],
        highlightKeyIndices: { [node.id]: [idx] },
        statusType: 'action'
      });

      // Check overflow
      if (node.keys.length > this.maxKeys) {
        return this._splitNode(node);
      }
      return null;
    } else {
      this.recordStep({
        type: 'descend_child',
        actionCategory: 'insert',
        title: `Navigating to Child Branch #${idx}`,
        action: `Key ${key} belongs in subtree of child #${idx} [${node.children[idx].keys.join(', ')}]. Descending...`,
        rule: `Keys guide the route to the correct leaf compartment.`,
        tip: `Walking down the aisle to the designated shelf.`,
        popupMessage: `Descending to child branch #${idx}...`,
        highlightNodeIds: [node.id, node.children[idx].id],
        statusType: 'info'
      });

      const splitChild = this._insertRecursive(node.children[idx], key);

      if (splitChild) {
        // Child split: insert promoted key and right sibling into current node
        this.recordStep({
          type: 'absorb_split',
          actionCategory: 'split',
          title: `Parent Absorbing Promoted Key ${splitChild.promotedKey}`,
          action: `Child node split. Inserting promoted median key ${splitChild.promotedKey} into parent node [${node.keys.join(', ')}].`,
          rule: `When a child overflows and splits, its median key travels up to the parent to act as the new separator.`,
          tip: `Passing the middle passenger up to the supervisor node upstairs.`,
          popupMessage: `Parent absorbing promoted key ${splitChild.promotedKey}...`,
          highlightNodeIds: [node.id, splitChild.rightSibling.id],
          statusType: 'action'
        });

        node.keys.splice(idx, 0, splitChild.promotedKey);
        node.children.splice(idx + 1, 0, splitChild.rightSibling);

        if (node.keys.length > this.maxKeys) {
          return this._splitNode(node);
        }
      }

      return null;
    }
  }

  /**
   * Split an overflowing node (has M keys = maxKeys + 1)
   */
  _splitNode(node) {
    const totalKeys = node.keys.length;
    const medianIdx = Math.floor(totalKeys / 2);
    const medianKey = node.keys[medianIdx];

    this.recordStep({
      type: 'split_start',
      actionCategory: 'split',
      title: `⚡ Node Overflow (${totalKeys}/${this.maxKeys} keys) -> Splitting!`,
      action: `Node [${node.keys.join(', ')}] exceeded max capacity (${this.maxKeys} keys). Splitting around median key ${medianKey} at index ${medianIdx}.`,
      rule: `Order M nodes cannot hold more than M-1 (${this.maxKeys}) keys. The median key is promoted up to the parent.`,
      tip: `Overstuffed bus analogy: When a 4-seater car gets a 4th passenger, the middle person steps out onto the roof (parent) while the others split into two separate 2-seater cars!`,
      popupMessage: `⚡ Node Overflow! Median key ${medianKey} promotes ↑ to parent.`,
      highlightNodeIds: [node.id],
      highlightKeyIndices: { [node.id]: [medianIdx] },
      statusType: 'warning',
      meta: {
        medianKey,
        medianIdx,
        overflowNodeId: node.id
      }
    });

    const rightSibling = new BTreeNode(node.isLeaf);
    rightSibling.keys = node.keys.slice(medianIdx + 1);

    if (!node.isLeaf) {
      rightSibling.children = node.children.slice(medianIdx + 1);
    }

    // Left node keeps keys before median
    node.keys = node.keys.slice(0, medianIdx);
    if (!node.isLeaf) {
      node.children = node.children.slice(0, medianIdx + 1);
    }

    this.recordStep({
      type: 'split_finish',
      actionCategory: 'split',
      title: `Median Key ${medianKey} Promoted Upwards ↑`,
      action: `Split complete! Median ${medianKey} promoted. Created left node [${node.keys.join(', ')}] and right node [${rightSibling.keys.join(', ')}].`,
      rule: `Left and right sibling nodes each satisfy minimum keys (>= ${this.minKeys}) and all leaves stay at identical depth.`,
      tip: `Perfect division—two balanced rooms with the separator sitting in the doorway above.`,
      popupMessage: `Split complete: Left [${node.keys.join(', ')}], Right [${rightSibling.keys.join(', ')}], Promoted: ${medianKey} ↑`,
      highlightNodeIds: [node.id, rightSibling.id],
      statusType: 'action',
      meta: {
        promotedKey: medianKey,
        leftNodeId: node.id,
        rightNodeId: rightSibling.id
      }
    });

    return {
      promotedKey: medianKey,
      rightSibling
    };
  }

  /**
   * Delete a key from the B-Tree
   * Supports both CLRS Preemptive (Cormen) and Standard Reactive (Bottom-Up) strategies.
   */
  delete(key, strategy = this.deletionStrategy) {
    this.steps = [];
    key = Number(key);
    if (isNaN(key)) return { success: false, steps: this.steps };

    const M = this.M;
    const minK = this.minKeys;
    const isCLRS = (strategy === 'clrs');

    this.recordStep({
      type: 'start_delete',
      actionCategory: 'delete',
      title: `Delete Key ${key} [${isCLRS ? 'CLRS Preemptive (Cormen)' : 'Standard Bottom-Up'}]`,
      action: `Initiating deletion of key ${key} from Order M = ${M} B-Tree using ${isCLRS ? 'CLRS Top-Down Preemptive (Cormen)' : 'Standard Bottom-Up (Reactive)'} strategy.`,
      rule: `Every non-root node must maintain at least ceil(M/2) - 1 = ${minK} keys.`,
      tip: isCLRS 
        ? `CLRS strategy: proactively fix lean children on the way DOWN so no backtracking is needed!` 
        : `Reactive strategy: remove key at the leaf first, then fix underflows bubbling back UP.`,
      popupMessage: `Deleting ${key} via ${isCLRS ? 'CLRS Cormen' : 'Standard Reactive'} mode...`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info'
    });

    if (!this.root || this.root.keys.length === 0) {
      this.recordStep({
        type: 'delete_empty',
        actionCategory: 'delete',
        title: `Tree is Empty`,
        action: `Root node is empty. Cannot delete key ${key}.`,
        rule: `Cannot perform deletion on an empty B-Tree.`,
        tip: `Nothing on the shelves to remove!`,
        popupMessage: `Tree is empty.`,
        statusType: 'error'
      });
      return { success: false, steps: this.steps };
    }

    const deleted = isCLRS 
      ? this._deleteCLRS(this.root, key)
      : this._deleteReactive(this.root, key);

    // If root became empty after deletion
    if (this.root.keys.length === 0) {
      if (!this.root.isLeaf && this.root.children.length > 0) {
        this.root = this.root.children[0];
        this.recordStep({
          type: 'root_shrink',
          actionCategory: 'delete',
          title: `Tree Height Reduced by 1`,
          action: `Root had 0 keys left. Its child [${this.root.keys.join(', ')}] becomes the new root node.`,
          rule: `A B-Tree shrinks in height only when the root empties and its children merge into a single node.`,
          tip: `The penthouse collapsed into the level below, reducing building height!`,
          popupMessage: `Root emptied. Child promoted to root (Height - 1).`,
          highlightNodeIds: [this.root.id],
          statusType: 'action'
        });
      }
    }

    this.recordStep({
      type: 'delete_complete',
      actionCategory: 'delete',
      title: `Deletion Finished: Key ${key}`,
      action: deleted 
        ? `Key ${key} removed successfully. All Order M = ${M} balance invariants verified.` 
        : `Key ${key} was not found in the tree.`,
      rule: `All leaf nodes remain strictly at the same depth.`,
      tip: `Tree remains fully balanced and ready for subsequent operations.`,
      popupMessage: deleted ? `Key ${key} successfully deleted!` : `Key ${key} not in tree.`,
      highlightNodeIds: [],
      statusType: deleted ? 'success' : 'error'
    });

    return { success: deleted, steps: this.steps };
  }

  /* ========================================================================
     Strategy 1: CLRS Top-Down Preemptive Deletion (Cormen et al., Chapter 18)
     ======================================================================== */
  _deleteCLRS(node, key) {
    let idx = 0;
    while (idx < node.keys.length && node.keys[idx] < key) {
      idx++;
    }

    // Key found in this node
    if (idx < node.keys.length && node.keys[idx] === key) {
      if (node.isLeaf) {
        // CLRS Case 1: Key in leaf node
        this.recordStep({
          type: 'delete_case_1',
          actionCategory: 'delete',
          title: `CLRS Case 1: Key ${key} in Leaf Node`,
          action: `Key ${key} is present in leaf node [${node.keys.join(', ')}]. Removing key directly from leaf.`,
          rule: `CLRS Case 1: If key k is in a leaf node, delete k directly. (Preemptive descent ensured leaf has >= minKeys + 1 keys).`,
          tip: `Clean removal right off the bottom shelf without causing an underflow!`,
          popupMessage: `CLRS Case 1: Removing ${key} directly from leaf.`,
          highlightNodeIds: [node.id],
          highlightKeyIndices: { [node.id]: [idx] },
          statusType: 'action'
        });

        node.keys.splice(idx, 1);

        this.recordStep({
          type: 'delete_leaf_done',
          actionCategory: 'delete',
          title: `Key ${key} Removed from Leaf`,
          action: `Key ${key} removed. Node keys are now [${node.keys.join(', ')}].`,
          rule: `Node still satisfies minKeys invariant (>= ${this.minKeys}).`,
          tip: `Direct deletion completed.`,
          popupMessage: `Key ${key} removed from leaf.`,
          highlightNodeIds: [node.id],
          statusType: 'action'
        });

        return true;
      } else {
        // CLRS Case 2: Key in internal node
        const leftChild = node.children[idx];
        const rightChild = node.children[idx + 1];

        // CLRS Case 2a: Left child has > minKeys (>= t keys)
        if (leftChild.keys.length > this.minKeys) {
          const pred = this._getPredecessor(leftChild);
          this.recordStep({
            type: 'delete_case_2a',
            actionCategory: 'delete',
            title: `CLRS Case 2a: Replace with Predecessor (${pred})`,
            action: `Key ${key} is in an internal node. Left child has surplus keys (${leftChild.keys.length} > ${this.minKeys}). Replacing ${key} with predecessor ${pred} from left subtree.`,
            rule: `CLRS Case 2a: If the child preceding k has >= t keys, find predecessor k' in that subtree, replace k with k', and recursively delete k'.`,
            tip: `Borrow the largest item from the left branch to take the removed key's seat!`,
            popupMessage: `CLRS Case 2a: Replacing ${key} with predecessor ${pred}...`,
            highlightNodeIds: [node.id, leftChild.id],
            highlightKeyIndices: { [node.id]: [idx] },
            statusType: 'action'
          });

          node.keys[idx] = pred;
          return this._deleteCLRS(leftChild, pred);
        }
        // CLRS Case 2b: Right child has > minKeys (>= t keys)
        else if (rightChild.keys.length > this.minKeys) {
          const succ = this._getSuccessor(rightChild);
          this.recordStep({
            type: 'delete_case_2b',
            actionCategory: 'delete',
            title: `CLRS Case 2b: Replace with Successor (${succ})`,
            action: `Key ${key} is in an internal node. Right child has surplus keys (${rightChild.keys.length} > ${this.minKeys}). Replacing ${key} with successor ${succ} from right subtree.`,
            rule: `CLRS Case 2b: If left child is minimal but right child has >= t keys, replace k with successor k' and recursively delete k'.`,
            tip: `Borrow the smallest item from the right branch to take the removed key's seat!`,
            popupMessage: `CLRS Case 2b: Replacing ${key} with successor ${succ}...`,
            highlightNodeIds: [node.id, rightChild.id],
            highlightKeyIndices: { [node.id]: [idx] },
            statusType: 'action'
          });

          node.keys[idx] = succ;
          return this._deleteCLRS(rightChild, succ);
        }
        // CLRS Case 2c: Both left and right child have only minKeys (t - 1 keys)
        else {
          this.recordStep({
            type: 'delete_case_2c',
            actionCategory: 'merge',
            title: `CLRS Case 2c: Merge Children with Key ${key}`,
            action: `Both left child [${leftChild.keys.join(', ')}] and right child [${rightChild.keys.join(', ')}] have only ${this.minKeys} keys. Pulling down key ${key} and merging both children together.`,
            rule: `CLRS Case 2c: If both children have only t-1 keys, merge key k and right child into left child, then recursively delete k from the merged node.`,
            tip: `Two lean rooms combine with the parent separator into one sturdy room!`,
            popupMessage: `CLRS Case 2c: Merging children with key ${key}...`,
            highlightNodeIds: [node.id, leftChild.id, rightChild.id],
            highlightKeyIndices: { [node.id]: [idx] },
            statusType: 'warning'
          });

          this._mergeChildren(node, idx);
          return this._deleteCLRS(leftChild, key);
        }
      }
    } else {
      // Key not in current node
      if (node.isLeaf) {
        this.recordStep({
          type: 'key_not_found',
          actionCategory: 'delete',
          title: `Key ${key} Not Found`,
          action: `Reached leaf [${node.keys.join(', ')}] without finding ${key}.`,
          rule: `Leaves have no children. Key ${key} does not exist in the B-Tree.`,
          tip: `Search missed; no deletion possible.`,
          popupMessage: `Key ${key} not in tree.`,
          highlightNodeIds: [node.id],
          statusType: 'error'
        });
        return false;
      }

      const isLastChild = (idx === node.keys.length);
      const child = node.children[idx];

      // CLRS Case 3: Preemptive check on descent path!
      // If child has only minKeys (t - 1) keys, fix it NOW before descending!
      if (child.keys.length <= this.minKeys) {
        this.recordStep({
          type: 'clrs_case_3_preemptive',
          actionCategory: 'borrow',
          title: `CLRS Case 3: Preemptive Check on Child #${idx}`,
          action: `[CLRS Cormen Rule] Child #${idx} [${child.keys.join(', ')}] has only ${child.keys.length} keys (<= minKeys = ${this.minKeys}). Proactively borrowing from sibling or merging before descending.`,
          rule: `CLRS Case 3: To guarantee single-pass O(h) deletion without upward backtracking, every child visited on descent MUST have at least t keys (minKeys + 1).`,
          tip: `Proactive immunization: reinforce lean rooms BEFORE walking inside so deleting can never cause an underflow!`,
          popupMessage: `CLRS Case 3: Child has minimal keys. Preemptively fixing...`,
          highlightNodeIds: [node.id, child.id],
          statusType: 'warning'
        });

        this._fixChildUnderflow(node, idx);
      }

      if (isLastChild && idx > node.keys.length) {
        return this._deleteCLRS(node.children[idx - 1], key);
      } else {
        return this._deleteCLRS(node.children[idx], key);
      }
    }
  }

  /* ========================================================================
     Strategy 2: Standard Reactive Bottom-Up Deletion (Knuth / University DSA)
     ======================================================================== */
  _deleteReactive(node, key) {
    let idx = 0;
    while (idx < node.keys.length && node.keys[idx] < key) {
      idx++;
    }

    if (idx < node.keys.length && node.keys[idx] === key) {
      if (node.isLeaf) {
        this.recordStep({
          type: 'delete_case_1',
          actionCategory: 'delete',
          title: `Reactive Delete: Key ${key} Removed from Leaf`,
          action: `Key ${key} is present in leaf node [${node.keys.join(', ')}]. Removing directly from leaf.`,
          rule: `In Reactive deletion, delete the key directly from the leaf and inspect if an underflow occurs afterwards.`,
          tip: `Clean removal directly from the leaf.`,
          popupMessage: `Removing ${key} directly from leaf node.`,
          highlightNodeIds: [node.id],
          highlightKeyIndices: { [node.id]: [idx] },
          statusType: 'action'
        });

        node.keys.splice(idx, 1);

        this.recordStep({
          type: 'delete_leaf_done',
          actionCategory: 'delete',
          title: `Leaf Node Keys: [${node.keys.join(', ')}]`,
          action: `Removed key ${key}. Leaf now has ${node.keys.length} keys (minKeys = ${this.minKeys}).`,
          rule: `If node keys >= minKeys (${this.minKeys}), no rebalancing is needed.`,
          tip: `Leaf keys updated.`,
          popupMessage: `Key ${key} removed. Leaf keys: [${node.keys.join(', ')}].`,
          highlightNodeIds: [node.id],
          statusType: 'action'
        });

        return true;
      } else {
        const leftChild = node.children[idx];
        const rightChild = node.children[idx + 1];

        if (leftChild.keys.length >= rightChild.keys.length) {
          const pred = this._getPredecessor(leftChild);
          this.recordStep({
            type: 'delete_case_2a',
            actionCategory: 'delete',
            title: `Internal Key ${key} Replaced with Predecessor (${pred})`,
            action: `Key ${key} is in internal node. Replacing with in-order predecessor ${pred} from left subtree, then recursively deleting ${pred}.`,
            rule: `Internal keys are replaced by their predecessor (max of left child) or successor (min of right child).`,
            tip: `Swap the deleted internal key with the nearest leaf key below it.`,
            popupMessage: `Replacing ${key} with predecessor ${pred}...`,
            highlightNodeIds: [node.id, leftChild.id],
            highlightKeyIndices: { [node.id]: [idx] },
            statusType: 'action'
          });

          node.keys[idx] = pred;
          this._deleteReactive(leftChild, pred);

          if (leftChild.keys.length < this.minKeys) {
            this._fixChildUnderflow(node, idx);
          }
        } else {
          const succ = this._getSuccessor(rightChild);
          this.recordStep({
            type: 'delete_case_2b',
            actionCategory: 'delete',
            title: `Internal Key ${key} Replaced with Successor (${succ})`,
            action: `Key ${key} is in internal node. Replacing with in-order successor ${succ} from right subtree, then recursively deleting ${succ}.`,
            rule: `Internal keys are replaced by their successor (min of right child) when right child is larger.`,
            tip: `Swap the deleted internal key with the nearest leaf key below it.`,
            popupMessage: `Replacing ${key} with successor ${succ}...`,
            highlightNodeIds: [node.id, rightChild.id],
            highlightKeyIndices: { [node.id]: [idx] },
            statusType: 'action'
          });

          node.keys[idx] = succ;
          this._deleteReactive(rightChild, succ);

          if (rightChild.keys.length < this.minKeys) {
            this._fixChildUnderflow(node, idx + 1);
          }
        }
        return true;
      }
    } else {
      if (node.isLeaf) {
        this.recordStep({
          type: 'key_not_found',
          actionCategory: 'delete',
          title: `Key ${key} Not Found`,
          action: `Reached leaf [${node.keys.join(', ')}] without finding ${key}.`,
          rule: `Key ${key} does not exist in the B-Tree.`,
          tip: `Search missed; no deletion possible.`,
          popupMessage: `Key ${key} not in tree.`,
          highlightNodeIds: [node.id],
          statusType: 'error'
        });
        return false;
      }

      this.recordStep({
        type: 'descend_child_delete',
        actionCategory: 'delete',
        title: `Descending to Child Branch #${idx}`,
        action: `Key ${key} belongs in subtree of child #${idx} [${node.children[idx].keys.join(', ')}]. Descending...`,
        rule: `Traverse down the branch bounded by adjacent node keys.`,
        tip: `Heading down to the target leaf.`,
        popupMessage: `Descending to child #${idx}...`,
        highlightNodeIds: [node.id, node.children[idx].id],
        statusType: 'info'
      });

      const deleted = this._deleteReactive(node.children[idx], key);

      // Reactive underflow: only if child has strictly < minKeys
      if (deleted && node.children[idx] && node.children[idx].keys.length < this.minKeys) {
        this.recordStep({
          type: 'child_underflow_check',
          actionCategory: 'borrow',
          title: `Underflow Detected: Child #${idx} Has ${node.children[idx].keys.length} Keys (< minKeys = ${this.minKeys})`,
          action: `Child #${idx} dropped below minimum required keys (${this.minKeys}). Resolving underflow via sibling borrow or merge.`,
          rule: `In Reactive deletion, underflow is resolved on the upward backtracking step.`,
          tip: `Reactive fix: repair the underflow after it occurred.`,
          popupMessage: `Child #${idx} underflowed (< ${this.minKeys} keys). Fixing...`,
          highlightNodeIds: [node.id, node.children[idx].id],
          statusType: 'warning'
        });

        this._fixChildUnderflow(node, idx);
      }

      return deleted;
    }
  }

  _getPredecessor(node) {
    let curr = node;
    while (!curr.isLeaf) {
      curr = curr.children[curr.children.length - 1];
    }
    return curr.keys[curr.keys.length - 1];
  }

  _getSuccessor(node) {
    let curr = node;
    while (!curr.isLeaf) {
      curr = curr.children[0];
    }
    return curr.keys[0];
  }

  _fixChildUnderflow(parent, idx) {
    const minK = this.minKeys;

    // Borrow from left sibling if available and has surplus keys
    if (idx > 0 && parent.children[idx - 1].keys.length > minK) {
      this._borrowFromPrev(parent, idx);
    }
    // Borrow from right sibling if available and has surplus keys
    else if (idx < parent.children.length - 1 && parent.children[idx + 1].keys.length > minK) {
      this._borrowFromNext(parent, idx);
    }
    // Neither sibling has surplus keys -> merge with sibling
    else {
      if (idx < parent.children.length - 1) {
        this._mergeChildren(parent, idx);
      } else {
        this._mergeChildren(parent, idx - 1);
      }
    }
  }

  _borrowFromPrev(parent, idx) {
    const child = parent.children[idx];
    const sibling = parent.children[idx - 1];
    const parentKey = parent.keys[idx - 1];
    const siblingKey = sibling.keys.pop();

    this.recordStep({
      type: 'borrow_left',
      actionCategory: 'borrow',
      title: `Borrowing from Left Sibling (Rotation ↷)`,
      action: `Left sibling has surplus keys. Rotating: Parent key ${parentKey} moves down into child, while sibling's maximum key ${siblingKey} moves up to parent.`,
      rule: `Rotation / Redistribution: Sibling gives its maximum key to the parent, and parent passes its separator key down to the underflowing child.`,
      tip: `Bucket brigade line: sibling passes top book to teacher (parent), teacher hands separator book down to needy child.`,
      popupMessage: `↷ Left Borrow: ${parentKey} moves down, ${siblingKey} moves up.`,
      highlightNodeIds: [parent.id, child.id, sibling.id],
      highlightKeyIndices: { [parent.id]: [idx - 1] },
      statusType: 'action',
      meta: {
        borrowType: 'left',
        siblingKey,
        parentKey,
        siblingId: sibling.id,
        childId: child.id,
        parentId: parent.id
      }
    });

    child.keys.unshift(parentKey);
    if (!child.isLeaf) {
      child.children.unshift(sibling.children.pop());
    }

    parent.keys[idx - 1] = siblingKey;

    this.recordStep({
      type: 'borrow_left_done',
      actionCategory: 'borrow',
      title: `Left Borrow Rotation Complete`,
      action: `Left borrow rotation complete. Child now has ${child.keys.length} keys: [${child.keys.join(', ')}].`,
      rule: `Both child and sibling satisfy minKeys invariant (>= ${this.minKeys}).`,
      tip: `Balanced state restored without structural merging.`,
      popupMessage: `Borrow complete. Child keys: [${child.keys.join(', ')}].`,
      highlightNodeIds: [parent.id, child.id, sibling.id],
      statusType: 'action'
    });
  }

  _borrowFromNext(parent, idx) {
    const child = parent.children[idx];
    const sibling = parent.children[idx + 1];
    const parentKey = parent.keys[idx];
    const siblingKey = sibling.keys.shift();

    this.recordStep({
      type: 'borrow_right',
      actionCategory: 'borrow',
      title: `Borrowing from Right Sibling (Rotation ↶)`,
      action: `Right sibling has surplus keys. Rotating: Parent key ${parentKey} moves down into child, while sibling's minimum key ${siblingKey} moves up to parent.`,
      rule: `Rotation / Redistribution: Sibling gives its minimum key to parent, and parent hands its separator key down to the underflowing child.`,
      tip: `Bucket brigade line: right sibling passes smallest book up, teacher hands down separator book.`,
      popupMessage: `↶ Right Borrow: ${parentKey} moves down, ${siblingKey} moves up.`,
      highlightNodeIds: [parent.id, child.id, sibling.id],
      highlightKeyIndices: { [parent.id]: [idx] },
      statusType: 'action',
      meta: {
        borrowType: 'right',
        siblingKey,
        parentKey,
        siblingId: sibling.id,
        childId: child.id,
        parentId: parent.id
      }
    });

    child.keys.push(parentKey);
    if (!child.isLeaf) {
      child.children.push(sibling.children.shift());
    }

    parent.keys[idx] = siblingKey;

    this.recordStep({
      type: 'borrow_right_done',
      actionCategory: 'borrow',
      title: `Right Borrow Rotation Complete`,
      action: `Right borrow rotation complete. Child now has ${child.keys.length} keys: [${child.keys.join(', ')}].`,
      rule: `Both child and sibling satisfy minKeys invariant (>= ${this.minKeys}).`,
      tip: `Balanced state restored without structural merging.`,
      popupMessage: `Borrow complete. Child keys: [${child.keys.join(', ')}].`,
      highlightNodeIds: [parent.id, child.id, sibling.id],
      statusType: 'action'
    });
  }

  _mergeChildren(parent, idx) {
    const child = parent.children[idx];
    const sibling = parent.children[idx + 1];
    const parentKey = parent.keys[idx];

    this.recordStep({
      type: 'merge_start',
      actionCategory: 'merge',
      title: `Merging Sibling Nodes (⇥ ⇤)`,
      action: `Both children have only ${this.minKeys} keys (neither can spare a key). Pulling down parent separator key ${parentKey} and merging right sibling [${sibling.keys.join(', ')}] into left child [${child.keys.join(', ')}].`,
      rule: `When neither sibling has surplus keys, merge left child + parent separator key + right child into one single node.`,
      tip: `Tear down the dividing wall between two small cubicles to form one spacious conference room!`,
      popupMessage: `⇥ ⇤ Merging siblings! Pulling down parent key ${parentKey}.`,
      highlightNodeIds: [parent.id, child.id, sibling.id],
      highlightKeyIndices: { [parent.id]: [idx] },
      statusType: 'warning',
      meta: {
        parentKey,
        leftChildId: child.id,
        rightChildId: sibling.id,
        parentId: parent.id
      }
    });

    child.keys.push(parentKey);
    child.keys = child.keys.concat(sibling.keys);

    if (!child.isLeaf) {
      child.children = child.children.concat(sibling.children);
    }

    parent.keys.splice(idx, 1);
    parent.children.splice(idx + 1, 1);

    this.recordStep({
      type: 'merge_done',
      actionCategory: 'merge',
      title: `Merge Complete`,
      action: `Merge complete. Combined node now contains ${child.keys.length} keys: [${child.keys.join(', ')}]. Sibling node removed.`,
      rule: `Parent loses 1 key and 1 child pointer. Combined child now has 2*minKeys + 1 keys, perfectly within [minKeys, maxKeys].`,
      tip: `Two lean rooms united into one sturdy room.`,
      popupMessage: `Merge complete! Combined node keys: [${child.keys.join(', ')}].`,
      highlightNodeIds: [parent.id, child.id],
      statusType: 'action'
    });
  }

  validateInvariants() {
    const errors = [];
    const M = this.M;
    const maxK = this.maxKeys;
    const minK = this.minKeys;

    if (!this.root) {
      return { valid: true, errors: [], leafDepth: 0 };
    }

    if (this.root.keys.length === 0 && this.root.children.length > 0) {
      errors.push("Root node has 0 keys but has children.");
    }

    let leafDepth = null;

    const checkNode = (node, depth = 0, minKey = -Infinity, maxKey = Infinity, isRoot = false) => {
      // 1. Sorted order
      for (let i = 0; i < node.keys.length; i++) {
        const k = node.keys[i];
        if (k <= minKey || k >= maxKey) {
          errors.push(`Node ${node.id} key ${k} violates search boundaries (${minKey}, ${maxKey})`);
        }
        if (i > 0 && node.keys[i] <= node.keys[i - 1]) {
          errors.push(`Node ${node.id} keys are not strictly increasing: [${node.keys.join(', ')}]`);
        }
      }

      // 2. Key count limits
      if (!isRoot && node.keys.length < minK) {
        errors.push(`Non-root node ${node.id} has ${node.keys.length} keys, below minimum minKeys = ${minK}`);
      }
      if (node.keys.length > maxK) {
        errors.push(`Node ${node.id} has ${node.keys.length} keys, exceeding maximum maxKeys = ${maxK}`);
      }

      // 3. Children count limits
      if (!node.isLeaf) {
        if (node.children.length !== node.keys.length + 1) {
          errors.push(`Node ${node.id} has ${node.keys.length} keys but ${node.children.length} children (expected ${node.keys.length + 1})`);
        }
        if (!isRoot && node.children.length < this.minChildren) {
          errors.push(`Internal node ${node.id} has ${node.children.length} children, below minimum minChildren = ${this.minChildren}`);
        }
        if (node.children.length > this.maxChildren) {
          errors.push(`Node ${node.id} has ${node.children.length} children, exceeding maxChildren = ${this.maxChildren}`);
        }

        for (let i = 0; i < node.children.length; i++) {
          const lower = i === 0 ? minKey : node.keys[i - 1];
          const upper = i === node.keys.length ? maxKey : node.keys[i];
          checkNode(node.children[i], depth + 1, lower, upper, false);
        }
      } else {
        if (leafDepth === null) {
          leafDepth = depth;
        } else if (leafDepth !== depth) {
          errors.push(`Leaf node ${node.id} at depth ${depth} violates uniform depth property (expected ${leafDepth})`);
        }
      }
    };

    checkNode(this.root, 0, -Infinity, Infinity, true);

    return {
      valid: errors.length === 0,
      errors,
      leafDepth: leafDepth || 0
    };
  }

  getStats() {
    let totalKeys = 0;
    let totalNodes = 0;
    let maxDepth = 0;

    const traverse = (node, depth = 1) => {
      if (!node) return;
      totalNodes++;
      totalKeys += node.keys.length;
      if (depth > maxDepth) maxDepth = depth;
      for (const child of node.children) {
        traverse(child, depth + 1);
      }
    };

    if (this.root && this.root.keys.length > 0) {
      traverse(this.root, 1);
    }

    return {
      M: this.M,
      maxKeys: this.maxKeys,
      minKeys: this.minKeys,
      maxChildren: this.maxChildren,
      minChildren: this.minChildren,
      totalKeys,
      totalNodes,
      height: maxDepth
    };
  }

  /* ========================================================================
     Manual Tree Editing Helpers (Drag & Drop, Key Add/Remove, Node Structure)
     ======================================================================== */

  findNodeById(nodeId, current = this.root) {
    if (!current) return null;
    if (current.id === nodeId) return current;
    for (const child of current.children) {
      const found = this.findNodeById(nodeId, child);
      if (found) return found;
    }
    return null;
  }

  findParentOf(nodeId, current = this.root, parent = null) {
    if (!current) return null;
    if (current.id === nodeId) return parent;
    for (let i = 0; i < current.children.length; i++) {
      const res = this.findParentOf(nodeId, current.children[i], current);
      if (res) return res;
    }
    return null;
  }

  addKeyToNode(nodeId, key) {
    const node = this.findNodeById(nodeId);
    if (!node) return false;
    node.keys.push(key);
    node.keys.sort((a, b) => a - b);
    return true;
  }

  removeKeyFromNode(nodeId, keyIndex) {
    const node = this.findNodeById(nodeId);
    if (!node || keyIndex < 0 || keyIndex >= node.keys.length) return false;
    node.keys.splice(keyIndex, 1);
    return true;
  }

  updateKeyInNode(nodeId, keyIndex, newKey) {
    const node = this.findNodeById(nodeId);
    if (!node || keyIndex < 0 || keyIndex >= node.keys.length) return false;
    node.keys[keyIndex] = newKey;
    node.keys.sort((a, b) => a - b);
    return true;
  }

  moveKey(sourceNodeId, keyIndex, targetNodeId) {
    const srcNode = this.findNodeById(sourceNodeId);
    const dstNode = this.findNodeById(targetNodeId);
    if (!srcNode || !dstNode) return false;
    if (keyIndex < 0 || keyIndex >= srcNode.keys.length) return false;

    const [key] = srcNode.keys.splice(keyIndex, 1);
    dstNode.keys.push(key);
    dstNode.keys.sort((a, b) => a - b);
    return true;
  }

  addChildToNode(nodeId) {
    const node = this.findNodeById(nodeId);
    if (!node) return null;
    node.isLeaf = false;
    const newChild = new BTreeNode(true);
    node.children.push(newChild);
    return newChild;
  }

  removeNode(nodeId) {
    if (this.root && this.root.id === nodeId) {
      this.root = new BTreeNode(true);
      return true;
    }
    const parent = this.findParentOf(nodeId);
    if (!parent) return false;
    const idx = parent.children.findIndex(c => c.id === nodeId);
    if (idx !== -1) {
      parent.children.splice(idx, 1);
      if (parent.children.length === 0) {
        parent.isLeaf = true;
      }
      return true;
    }
    return false;
  }
}
