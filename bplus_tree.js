/**
 * B+ Tree Data Structure (Order M)
 * 
 * In a B+ Tree:
 * - Internal nodes store only routing keys (indices) and child pointers.
 * - Leaf nodes store all key records.
 * - All leaf nodes are chained sequentially in a linked list (via .next).
 * - All leaves are at the exact same depth.
 * - Max children: M. Min children (non-root internal): ceil(M/2).
 * - Max keys: M - 1. Min keys (non-root): ceil(M/2) - 1.
 */

import { normalizeKey, compareKeys } from './mway_tree.js';

let nextBPlusNodeId = 1;
export function resetBPlusNodeIdCounter() {
  nextBPlusNodeId = 1;
}

export class BPlusTreeNode {
  constructor(isLeaf = true, id = null) {
    if (id) {
      const match = String(id).match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextBPlusNodeId) {
          nextBPlusNodeId = num + 1;
        }
      }
      this.id = id;
    } else {
      this.id = `bp_node_${nextBPlusNodeId++}`;
    }
    this.keys = [];
    this.children = [];
    this.isLeaf = isLeaf;
    this.next = null; // Pointer to next leaf node
    this.nextId = null;
  }

  clone(visited = new Map()) {
    if (visited.has(this)) return visited.get(this);
    const copy = new BPlusTreeNode(this.isLeaf, this.id);
    visited.set(this, copy);
    copy.keys = [...this.keys];
    copy.children = this.children.map(ch => ch.clone(visited));
    copy.next = null;
    copy.nextId = this.next ? this.next.id : null;
    return copy;
  }
}

export class BPlusTree {
  constructor(M = 4) {
    if (M < 3) throw new Error("B+ Tree order M must be >= 3");
    this.M = M;
    this.maxKeys = M - 1;
    this.minKeys = Math.ceil(M / 2) - 1;
    this.maxChildren = M;
    this.minChildren = Math.ceil(M / 2);
    this.root = new BPlusTreeNode(true);
    this.steps = [];
  }

  getMinKey(node) {
    if (!node) return null;
    let curr = node;
    while (!curr.isLeaf) {
      if (!curr.children || curr.children.length === 0) return null;
      let nextChild = curr.children[0];
      if (nextChild.isLeaf && nextChild.keys.length === 0) {
        for (const ch of curr.children) {
          if (ch.keys.length > 0 || (!ch.isLeaf && ch.children.length > 0)) {
            nextChild = ch;
            break;
          }
        }
      }
      curr = nextChild;
    }
    return (curr.keys && curr.keys.length > 0) ? curr.keys[0] : null;
  }

  getFirstLeaf() {
    if (!this.root) return null;
    let curr = this.root;
    while (!curr.isLeaf) {
      if (!curr.children || curr.children.length === 0) return null;
      curr = curr.children[0];
    }
    return curr;
  }

  getAllLeaves() {
    const leaves = [];
    const collect = (node) => {
      if (!node) return;
      if (node.isLeaf) {
        leaves.push(node);
      } else {
        for (const ch of node.children) collect(ch);
      }
    };
    collect(this.root);
    return leaves;
  }

  relinkLeaves() {
    const leaves = this.getAllLeaves();
    for (let i = 0; i < leaves.length; i++) {
      if (i < leaves.length - 1) {
        leaves[i].next = leaves[i + 1];
        leaves[i].nextId = leaves[i + 1].id;
      } else {
        leaves[i].next = null;
        leaves[i].nextId = null;
      }
    }
  }

  updateSeparators(node = this.root) {
    if (!node || node.isLeaf) return;
    for (const child of node.children) {
      this.updateSeparators(child);
    }
    for (let i = 0; i < node.keys.length; i++) {
      if (i + 1 < node.children.length) {
        const minVal = this.getMinKey(node.children[i + 1]);
        if (minVal !== null && minVal !== undefined) {
          node.keys[i] = minVal;
        }
      }
    }
  }

  updateAncestorRouters(node, oldKey, newKey) {
    if (!node || node.isLeaf) return;
    for (let i = 0; i < node.keys.length; i++) {
      if (node.keys[i] === oldKey && newKey !== null && newKey !== undefined) {
        node.keys[i] = newKey;
      }
    }
    for (const child of node.children) {
      this.updateAncestorRouters(child, oldKey, newKey);
    }
  }

  cloneTree() {
    if (!this.root) return null;
    const cloned = this.root.clone();
    const leafList = [];
    const collectLeaves = (node) => {
      if (!node) return;
      if (node.isLeaf) {
        leafList.push(node);
      } else {
        for (const ch of node.children) collectLeaves(ch);
      }
    };
    collectLeaves(cloned);
    for (let i = 0; i < leafList.length; i++) {
      if (i < leafList.length - 1) {
        leafList[i].next = leafList[i + 1];
        leafList[i].nextId = leafList[i + 1].id;
      } else {
        leafList[i].next = null;
        leafList[i].nextId = null;
      }
    }
    return cloned;
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
      action: `Starting search for key ${key} at root. Navigating routing keys to locate target leaf.`,
      rule: `In a B+ Tree, all data records live strictly in leaf nodes; internal nodes only route searches to the correct leaf.`,
      tip: `Think of a library catalog: aisle signs direct you where to go, but books only exist on the shelves!`,
      popupMessage: `Searching for ${key} at root`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'search'
    });

    if (!this.root || this.root.keys.length === 0) {
      this.recordStep({
        title: `Search Failed: Key ${key} Not Found`,
        action: `Tree is empty. Cannot locate key ${key}.`,
        rule: `An empty B+ Tree contains no records.`,
        tip: `No shelves or catalog drawers exist yet.`,
        popupMessage: `Empty tree`,
        statusType: 'error',
        actionCategory: 'search'
      });
      return { found: false, steps: this.steps };
    }

    let curr = this.root;
    while (!curr.isLeaf) {
      let idx = 0;
      while (idx < curr.keys.length && compareKeys(key, curr.keys[idx]) >= 0) {
        idx++;
      }
      this.recordStep({
        title: `Routing at Internal Node`,
        action: idx < curr.keys.length 
          ? `Key ${key} < router [${curr.keys[idx]}]. Navigating down child branch [${idx}].`
          : `Key ${key} >= largest router [${curr.keys[curr.keys.length - 1]}]. Navigating down child branch [${idx}].`,
        rule: `Internal node keys act strictly as signposts dividing the key space into disjoint child ranges.`,
        tip: `Look at the signs above the doorway to pick the right room.`,
        popupMessage: `Navigating branch [${idx}]`,
        highlightNodeIds: [curr.id, curr.children[idx].id],
        highlightKeyIndices: { [curr.id]: [Math.min(idx, curr.keys.length - 1)] },
        statusType: 'info',
        actionCategory: 'search'
      });
      curr = curr.children[idx];
    }

    // Now at leaf
    const keyIdx = curr.keys.indexOf(key);
    if (keyIdx !== -1) {
      this.recordStep({
        title: `Search Succeeded: Found ${key}`,
        action: `Key ${key} found at leaf node [${curr.id}] at slot index ${keyIdx}.`,
        rule: `All actual data records reside permanently in leaf nodes.`,
        tip: `Bullseye! Found the book sitting right on the shelf.`,
        popupMessage: `Found key ${key} in leaf!`,
        highlightNodeIds: [curr.id],
        highlightKeyIndices: { [curr.id]: [keyIdx] },
        statusType: 'success',
        actionCategory: 'search'
      });
      return { found: true, node: curr, index: keyIdx, steps: this.steps };
    } else {
      this.recordStep({
        title: `Search Failed: Key ${key} Not In Leaves`,
        action: `Reached target leaf node [${curr.id}], but key ${key} is absent from its stored records.`,
        rule: `Because each leaf covers an exact partition of keys, if it is not in this leaf, it does not exist in the tree.`,
        tip: `Checked the exact shelf where it belonged—not present.`,
        popupMessage: `Key ${key} not found`,
        highlightNodeIds: [curr.id],
        statusType: 'error',
        actionCategory: 'search'
      });
      return { found: false, steps: this.steps };
    }
  }

  insert(key) {
    this.steps = [];
    key = normalizeKey(key);
    if (key === null) return this.steps;

    this.recordStep({
      title: `Insert Initiated: Key ${key}`,
      action: `Preparing to insert key ${key} into Order-${this.M} B+ Tree.`,
      rule: `In B+ Trees, all insertions are performed exclusively into leaf nodes; internal routing keys update only when splits occur.`,
      tip: `New books always go onto the shelves first, then directory catalog cards are updated.`,
      popupMessage: `Inserting ${key}`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'insert'
    });

    if (this.root.keys.length === 0 && this.root.isLeaf) {
      this.root.keys.push(key);
      this.recordStep({
        title: `Inserted ${key} into Empty Root`,
        action: `Tree was empty. Created first leaf root containing key ${key}.`,
        rule: `A newly initialized B+ Tree begins as a single leaf root.`,
        tip: `First item placed on the bottom shelf.`,
        popupMessage: `Inserted ${key} into root leaf`,
        highlightNodeIds: [this.root.id],
        highlightKeyIndices: { [this.root.id]: [0] },
        statusType: 'success',
        actionCategory: 'insert'
      });
      return this.steps;
    }

    // Find leaf path
    const path = [];
    let curr = this.root;
    while (!curr.isLeaf) {
      path.push(curr);
      let idx = 0;
      while (idx < curr.keys.length && compareKeys(key, curr.keys[idx]) >= 0) {
        idx++;
      }
      curr = curr.children[idx];
    }

    // Check duplicate
    if (curr.keys.includes(key)) {
      this.recordStep({
        title: `Key ${key} Already Exists`,
        action: `Key ${key} is already present in leaf [${curr.id}]. Skipping duplicate.`,
        rule: `B+ Trees maintain unique primary keys in sorted order.`,
        tip: `No duplicate records allowed.`,
        popupMessage: `Duplicate key ${key}`,
        highlightNodeIds: [curr.id],
        statusType: 'warning',
        actionCategory: 'insert'
      });
      return this.steps;
    }

    // Insert key in sorted order into leaf
    curr.keys.push(key);
    curr.keys.sort(compareKeys);
    const insIdx = curr.keys.indexOf(key);

    this.recordStep({
      title: `Placed Key ${key} into Leaf`,
      action: `Placed key ${key} into sorted slot index ${insIdx} in leaf node [${curr.id}].`,
      rule: `Keys in leaf nodes are stored in strictly ascending order for fast range queries.`,
      tip: `Sliding the new item into its sorted slot on the shelf.`,
      popupMessage: `Key ${key} placed in leaf`,
      highlightNodeIds: [curr.id],
      highlightKeyIndices: { [curr.id]: [insIdx] },
      statusType: 'info',
      actionCategory: 'insert'
    });

    // Check overflow in leaf
    if (curr.keys.length > this.maxKeys) {
      this.splitLeaf(curr, path);
    } else {
      this.recordStep({
        title: `Insertion of ${key} Complete`,
        action: `Leaf [${curr.id}] now has ${curr.keys.length} keys (within allowed [${this.minKeys} .. ${this.maxKeys}]).`,
        rule: `No split required because leaf capacity was not exceeded.`,
        tip: `Clean insertion with no node splits required!`,
        popupMessage: `Insertion complete`,
        highlightNodeIds: [curr.id],
        statusType: 'success',
        actionCategory: 'insert'
      });
    }

    return this.steps;
  }

  splitLeaf(leaf, path) {
    const mid = Math.floor(leaf.keys.length / 2);
    const rightLeaf = new BPlusTreeNode(true);
    rightLeaf.keys = leaf.keys.splice(mid); // Right leaf gets second half
    
    // Leaf chain update
    rightLeaf.next = leaf.next;
    rightLeaf.nextId = rightLeaf.next ? rightLeaf.next.id : null;
    leaf.next = rightLeaf;
    leaf.nextId = rightLeaf.id;

    // In B+ Tree, the first key of the right leaf is copied up to the parent as the routing key
    const promotedKey = rightLeaf.keys[0];

    this.recordStep({
      title: `Leaf Overflow: Split Leaf Node`,
      action: `Leaf node reached ${this.M} keys (max: ${this.maxKeys}). Split into left and right leaves. Key ${promotedKey} is COPIED UP to parent.`,
      rule: `B+ Tree Leaf Split (Copy-Up): The smallest key of the right leaf is copied to the parent as a router, while ALSO REMAINING in the leaf!`,
      tip: `Notice key ${promotedKey} stays on the shelf! We only photocopied its label to put on the hallway directory above.`,
      popupMessage: `Leaf split! Index ${promotedKey} ↑`,
      highlightNodeIds: [leaf.id, rightLeaf.id],
      statusType: 'warning',
      actionCategory: 'split',
      meta: { medianKey: promotedKey }
    });

    if (leaf === this.root) {
      // Create new root
      const newRoot = new BPlusTreeNode(false);
      newRoot.keys = [promotedKey];
      newRoot.children = [leaf, rightLeaf];
      this.root = newRoot;

      this.recordStep({
        title: `New Root Created (Height + 1)`,
        action: `Root leaf split! Created new internal root node with routing key [${promotedKey}] and 2 child leaves.`,
        rule: `A B+ Tree grows taller only when the root splits, establishing a new index routing tier.`,
        tip: `First floor is full, so we built a 2nd floor reception desk to guide visitors down.`,
        popupMessage: `New internal root with router ${promotedKey}`,
        highlightNodeIds: [newRoot.id, leaf.id, rightLeaf.id],
        highlightKeyIndices: { [newRoot.id]: [0] },
        statusType: 'success',
        actionCategory: 'split'
      });
      return;
    }

    let parent = path.pop();
    this.insertIntoInternal(parent, promotedKey, rightLeaf, path);
  }

  insertIntoInternal(parent, key, rightChild, path) {
    let idx = 0;
    while (idx < parent.keys.length && compareKeys(key, parent.keys[idx]) > 0) {
      idx++;
    }
    parent.keys.splice(idx, 0, key);
    parent.children.splice(idx + 1, 0, rightChild);

    this.recordStep({
      title: `Routing Key ${key} Inserted into Parent`,
      action: `Inserted routing key [${key}] into internal parent node [${parent.id}].`,
      rule: `Internal nodes store routing separators that divide the search space between adjacent children.`,
      tip: `Updated the hallway directory signpost with the new room boundary.`,
      popupMessage: `Router ${key} added to internal node`,
      highlightNodeIds: [parent.id],
      highlightKeyIndices: { [parent.id]: [idx] },
      statusType: 'info',
      actionCategory: 'insert'
    });

    if (parent.keys.length > this.maxKeys) {
      this.splitInternal(parent, path);
    } else {
      this.recordStep({
        title: `B+ Tree Rebalanced`,
        action: `Parent node [${parent.id}] now has ${parent.keys.length} keys (<= ${this.maxKeys}).`,
        rule: `All internal and leaf nodes satisfy Order-${this.M} capacity constraints.`,
        tip: `Tree balanced and ready!`,
        popupMessage: `Tree balanced!`,
        highlightNodeIds: [parent.id],
        statusType: 'success',
        actionCategory: 'insert'
      });
    }
  }

  splitInternal(node, path) {
    const mid = Math.floor(node.keys.length / 2);
    const promotedKey = node.keys[mid]; // Moved up, not copied
    const rightNode = new BPlusTreeNode(false);

    rightNode.keys = node.keys.splice(mid + 1);
    node.keys.splice(mid, 1); // Remove promoted key from left node
    rightNode.children = node.children.splice(mid + 1);

    this.recordStep({
      title: `Internal Node Overflow: Split Node`,
      action: `Internal node reached ${this.M} keys (max: ${this.maxKeys}). Splitting internal node around median key ${promotedKey}.`,
      rule: `Internal Node Split (Push-Up): Unlike leaves, the median key of an internal node is PUSHED UP to the parent and NOT kept in the node.`,
      tip: `Internal nodes only store signposts, so the promoted key moves upstairs without leaving a duplicate behind.`,
      popupMessage: `Internal split: ${promotedKey} ↑`,
      highlightNodeIds: [node.id, rightNode.id],
      statusType: 'warning',
      actionCategory: 'split',
      meta: { medianKey: promotedKey }
    });

    if (node === this.root) {
      const newRoot = new BPlusTreeNode(false);
      newRoot.keys = [promotedKey];
      newRoot.children = [node, rightNode];
      this.root = newRoot;

      this.recordStep({
        title: `New Root Created (Height + 1)`,
        action: `Internal root split! Created new root with promoted key [${promotedKey}]. Tree height increased.`,
        rule: `Every root split adds a new level of indexing, increasing tree height by 1.`,
        tip: `Added another supervisory floor to the building!`,
        popupMessage: `New root with key ${promotedKey}`,
        highlightNodeIds: [newRoot.id],
        statusType: 'success',
        actionCategory: 'split'
      });
      return;
    }

    const parent = path.pop();
    this.insertIntoInternal(parent, promotedKey, rightNode, path);
  }

  delete(key) {
    this.steps = [];
    key = normalizeKey(key);
    if (key === null) return this.steps;

    this.recordStep({
      title: `Delete Initiated: Key ${key}`,
      action: `Preparing to delete key ${key} from B+ Tree. Navigating to its leaf node.`,
      rule: `All records reside in leaf nodes; deletions take place directly at the leaf, followed by sibling redistribution or merging if underflow occurs.`,
      tip: `Remove the book directly from the shelf first, then fix index signs if needed.`,
      popupMessage: `Deleting ${key}`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'delete'
    });

    if (!this.root || (this.root.keys.length === 0 && this.root.children.length === 0)) {
      this.recordStep({
        title: `Delete Aborted: Empty Tree`,
        action: `Tree is empty. Cannot delete key ${key}.`,
        rule: `Cannot perform deletion on an empty B+ Tree.`,
        tip: `Nothing on the shelves to remove!`,
        popupMessage: `Tree is empty`,
        statusType: 'warning',
        actionCategory: 'delete'
      });
      return this.steps;
    }

    // Traverse down to leaf
    const path = [];
    let curr = this.root;
    while (!curr.isLeaf) {
      path.push(curr);
      let idx = 0;
      while (idx < curr.keys.length && compareKeys(key, curr.keys[idx]) >= 0) {
        idx++;
      }
      curr = curr.children[idx];
    }

    const keyIdx = curr.keys.indexOf(key);
    if (keyIdx === -1) {
      this.recordStep({
        title: `Key ${key} Not Found`,
        action: `Key ${key} is not stored in leaf node [${curr.id}].`,
        rule: `Key ${key} does not exist anywhere in the B+ Tree.`,
        tip: `Search missed; no deletion possible.`,
        popupMessage: `Key ${key} not in tree`,
        highlightNodeIds: [curr.id],
        statusType: 'error',
        actionCategory: 'delete'
      });
      return this.steps;
    }

    // Remove key from leaf
    curr.keys.splice(keyIdx, 1);

    this.recordStep({
      title: `Removed Key ${key} from Leaf`,
      action: `Removed key ${key} from leaf node [${curr.id}].`,
      rule: `The record is deleted from its storage slot. If it was the first key, ancestor router keys are updated.`,
      tip: `Book taken off the shelf.`,
      popupMessage: `Removed ${key} from leaf`,
      highlightNodeIds: [curr.id],
      statusType: 'info',
      actionCategory: 'delete'
    });

    // If root is leaf
    if (curr === this.root) {
      this.recordStep({
        title: `Deletion Complete`,
        action: `Root leaf now contains ${this.root.keys.length} keys.`,
        rule: `Root leaf is allowed to hold between 0 and M-1 keys.`,
        tip: `Deletion finished.`,
        popupMessage: `Delete finished`,
        highlightNodeIds: [this.root.id],
        statusType: 'success',
        actionCategory: 'delete'
      });
      return this.steps;
    }

    // If key was the smallest key in this leaf and leaf still has keys, update routers
    if (keyIdx === 0 && curr.keys.length > 0) {
      this.updateAncestorRouters(this.root, key, curr.keys[0]);
      this.updateSeparators(this.root);
    }

    // Check underflow in leaf
    if (curr.keys.length < this.minKeys) {
      this.rebalanceLeaf(curr, path);
    } else {
      this.updateSeparators(this.root);
      this.recordStep({
        title: `Deletion Complete: Invariants Satisfied`,
        action: `Leaf [${curr.id}] has ${curr.keys.length} keys (>= minKeys ${this.minKeys}). No underflow.`,
        rule: `All non-root nodes satisfy the minimum key capacity requirement.`,
        tip: `Tree remains fully balanced!`,
        popupMessage: `Tree balanced`,
        highlightNodeIds: [curr.id],
        statusType: 'success',
        actionCategory: 'delete'
      });
    }

    return this.steps;
  }

  checkRootCollapse() {
    let collapsed = false;
    while (this.root && !this.root.isLeaf && this.root.keys.length === 0 && this.root.children.length > 0) {
      this.root = this.root.children[0];
      collapsed = true;
      this.recordStep({
        title: `Root Collapsed (Height - 1)`,
        action: `Root internal node had 0 keys left. Its child becomes the new root. Tree height decreased by 1.`,
        rule: `When the root has 0 keys left, its only remaining child becomes the new root.`,
        tip: `Top floor was empty, so the floor below became the new entrance!`,
        popupMessage: `Height decreased`,
        highlightNodeIds: [this.root.id],
        statusType: 'success',
        actionCategory: 'merge'
      });
    }
    if (this.root && !this.root.isLeaf && this.root.children.length === 0) {
      this.root = new BPlusTreeNode(true);
    }
    return collapsed;
  }

  rebalanceLeaf(leaf, path) {
    const parent = path[path.length - 1];
    const leafIdx = parent.children.indexOf(leaf);
    const leftSib = leafIdx > 0 ? parent.children[leafIdx - 1] : null;
    const rightSib = leafIdx < parent.children.length - 1 ? parent.children[leafIdx + 1] : null;

    // 1. Try borrow from left sibling
    if (leftSib && leftSib.keys.length > this.minKeys) {
      const borrowedKey = leftSib.keys.pop();
      leaf.keys.unshift(borrowedKey);
      parent.keys[leafIdx - 1] = leaf.keys[0]; // Update routing key
      this.updateSeparators(this.root);

      this.recordStep({
        title: `Underflow Repaired: Borrowed from Left Sibling`,
        action: `Leaf [${leaf.id}] underflowed. Borrowed largest key [${borrowedKey}] from left sibling; updated parent router to [${leaf.keys[0]}].`,
        rule: `Leaf Borrow: Transfer the boundary key from surplus sibling, then update the parent index to reflect the leaf's new minimum key.`,
        tip: `Borrowed a book from the neighboring shelf and updated the doorway sign!`,
        popupMessage: `Borrowed ${borrowedKey} from left leaf`,
        highlightNodeIds: [leaf.id, leftSib.id, parent.id],
        statusType: 'success',
        actionCategory: 'borrow'
      });
      return;
    }

    // 2. Try borrow from right sibling
    if (rightSib && rightSib.keys.length > this.minKeys) {
      const borrowedKey = rightSib.keys.shift();
      leaf.keys.push(borrowedKey);
      parent.keys[leafIdx] = rightSib.keys[0]; // Update routing key
      this.updateSeparators(this.root);

      this.recordStep({
        title: `Underflow Repaired: Borrowed from Right Sibling`,
        action: `Leaf [${leaf.id}] underflowed. Borrowed smallest key [${borrowedKey}] from right sibling; updated parent router to [${rightSib.keys[0]}].`,
        rule: `Leaf Borrow: Transfer the boundary key from surplus sibling, then update parent router to match right sibling's new minimum key.`,
        tip: `Borrowed the first book from the next shelf and updated the doorway sign!`,
        popupMessage: `Borrowed ${borrowedKey} from right leaf`,
        highlightNodeIds: [leaf.id, rightSib.id, parent.id],
        statusType: 'success',
        actionCategory: 'borrow'
      });
      return;
    }

    // 3. Merge with left or right sibling
    if (leftSib) {
      // Merge leaf into left sibling
      leftSib.keys.push(...leaf.keys);
      leftSib.next = leaf.next;
      parent.children.splice(leafIdx, 1);
      parent.keys.splice(leafIdx - 1, 1);
      this.relinkLeaves();
      this.updateSeparators(this.root);

      this.recordStep({
        title: `Leaf Merged with Left Sibling`,
        action: `Leaf [${leaf.id}] merged into left sibling [${leftSib.id}]. Removed separator key from parent. Sequential .next pointer re-linked.`,
        rule: `Leaf Merge: When neither sibling has surplus keys, merge leaves into one and stitch the linked list pointer so range scans remain unbroken.`,
        tip: `Consolidated two half-empty shelves into one and re-linked the sequential chain!`,
        popupMessage: `Merged leaves`,
        highlightNodeIds: [leftSib.id, parent.id],
        statusType: 'warning',
        actionCategory: 'merge'
      });
    } else if (rightSib) {
      // Merge right sibling into leaf
      leaf.keys.push(...rightSib.keys);
      leaf.next = rightSib.next;
      parent.children.splice(leafIdx + 1, 1);
      parent.keys.splice(leafIdx, 1);
      this.relinkLeaves();
      this.updateSeparators(this.root);

      this.recordStep({
        title: `Leaf Merged with Right Sibling`,
        action: `Right sibling merged into leaf [${leaf.id}]. Removed separator key from parent. Sequential .next pointer re-linked.`,
        rule: `Leaf Merge: Combine adjacent leaf records into a single node and maintain the continuous leaf chain.`,
        tip: `Consolidated two shelves into one and preserved the sequential scan chain!`,
        popupMessage: `Merged leaves`,
        highlightNodeIds: [leaf.id, parent.id],
        statusType: 'warning',
        actionCategory: 'merge'
      });
    }

    // Check parent underflow / root collapse
    if (parent === this.root) {
      this.checkRootCollapse();
      return;
    }

    if (parent.keys.length < this.minKeys) {
      path.pop();
      this.rebalanceInternal(parent, path);
    }
  }

  rebalanceInternal(node, path) {
    if (node === this.root) {
      this.checkRootCollapse();
      return;
    }
    const parent = path[path.length - 1];
    const nodeIdx = parent.children.indexOf(node);
    const leftSib = nodeIdx > 0 ? parent.children[nodeIdx - 1] : null;
    const rightSib = nodeIdx < parent.children.length - 1 ? parent.children[nodeIdx + 1] : null;

    if (leftSib && leftSib.keys.length > this.minKeys) {
      // Borrow from left sibling
      const borrowedKey = leftSib.keys.pop();
      const borrowedChild = leftSib.children.pop();
      const parentKey = parent.keys[nodeIdx - 1];

      node.keys.unshift(parentKey);
      if (borrowedChild) node.children.unshift(borrowedChild);
      parent.keys[nodeIdx - 1] = borrowedKey;
      this.updateSeparators(this.root);

      this.recordStep({
        title: `Internal Underflow: Borrowed from Left Sibling`,
        action: `Internal node borrowed router key [${borrowedKey}] from left sibling via parent key [${parentKey}].`,
        rule: `Internal Borrow: Parent key rotates down into underflowing child, while sibling's boundary key moves up to parent.`,
        tip: `Rotated guideposts between supervisory offices.`,
        popupMessage: `Borrowed from left internal sibling`,
        highlightNodeIds: [node.id, leftSib.id, parent.id],
        statusType: 'success',
        actionCategory: 'borrow'
      });
      return;
    }

    if (rightSib && rightSib.keys.length > this.minKeys) {
      // Borrow from right sibling
      const borrowedKey = rightSib.keys.shift();
      const borrowedChild = rightSib.children.shift();
      const parentKey = parent.keys[nodeIdx];

      node.keys.push(parentKey);
      if (borrowedChild) node.children.push(borrowedChild);
      parent.keys[nodeIdx] = borrowedKey;
      this.updateSeparators(this.root);

      this.recordStep({
        title: `Internal Underflow: Borrowed from Right Sibling`,
        action: `Internal node borrowed router key [${borrowedKey}] from right sibling via parent key [${parentKey}].`,
        rule: `Internal Borrow: Parent key rotates down into underflowing child, while right sibling's first key moves up to parent.`,
        tip: `Rotated guideposts between supervisory offices.`,
        popupMessage: `Borrowed from right internal sibling`,
        highlightNodeIds: [node.id, rightSib.id, parent.id],
        statusType: 'success',
        actionCategory: 'borrow'
      });
      return;
    }

    // Merge internal nodes
    if (leftSib) {
      const parentKey = parent.keys.splice(nodeIdx - 1, 1)[0];
      leftSib.keys.push(parentKey, ...node.keys);
      leftSib.children.push(...node.children);
      parent.children.splice(nodeIdx, 1);
      this.updateSeparators(this.root);

      this.recordStep({
        title: `Internal Nodes Merged`,
        action: `Internal node merged with left sibling and parent router [${parentKey}].`,
        rule: `Internal Merge: Pull down parent separator and combine left and right internal nodes into one.`,
        tip: `Merged two supervisory index rooms into one spacious office.`,
        popupMessage: `Merged internal nodes`,
        highlightNodeIds: [leftSib.id, parent.id],
        statusType: 'warning',
        actionCategory: 'merge'
      });
    } else if (rightSib) {
      const parentKey = parent.keys.splice(nodeIdx, 1)[0];
      node.keys.push(parentKey, ...rightSib.keys);
      node.children.push(...rightSib.children);
      parent.children.splice(nodeIdx + 1, 1);
      this.updateSeparators(this.root);

      this.recordStep({
        title: `Internal Nodes Merged`,
        action: `Right internal sibling merged into node with parent router [${parentKey}].`,
        rule: `Internal Merge: Pull down parent separator and combine internal nodes into one.`,
        tip: `Merged two supervisory index rooms into one.`,
        popupMessage: `Merged internal nodes`,
        highlightNodeIds: [node.id, parent.id],
        statusType: 'warning',
        actionCategory: 'merge'
      });
    }

    if (parent === this.root) {
      this.checkRootCollapse();
      return;
    }

    if (parent.keys.length < this.minKeys) {
      path.pop();
      this.rebalanceInternal(parent, path);
    }
  }

  clear() {
    this.root = new BPlusTreeNode(true);
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
      if (depth > height) height = depth;
      if (node.isLeaf) {
        totalKeys += node.keys.length;
      }
      for (const child of node.children) {
        traverse(child, depth + 1);
      }
    };
    if (this.root && (this.root.keys.length > 0 || this.root.children.length > 0)) {
      traverse(this.root, 1);
    }
    return { totalKeys, totalNodes, height, minKeys: this.minKeys, maxKeys: this.maxKeys, minChildren: this.minChildren, maxChildren: this.maxChildren };
  }

  validateInvariants() {
    const list = [];
    const addCheck = (name, valid, detail) => {
      list.push({ name, valid, detail });
    };

    if (!this.root || (this.root.isLeaf && this.root.keys.length === 0)) {
      addCheck("All actual data keys reside in leaf nodes", true, "Empty tree: 0 keys");
      addCheck("All leaf nodes reside at uniform depth", true, "Empty tree: depth 0");
      addCheck("Leaf nodes form an in-order sequential linked list", true, "Empty tree: no leaf chain");
      addCheck("Non-root nodes obey [minKeys .. maxKeys] capacity", true, "Empty tree satisfies bounds");
      addCheck("Root node obeys occupancy rules", true, "Empty leaf root is valid");
      addCheck("Keys strictly sorted within each node", true, "All node keys sorted");
      addCheck("Internal nodes have exactly keys.length + 1 children", true, "No internal nodes");
      addCheck("Separator keys equal right child subtree minimum", true, "No separators");
      addCheck("Child subtrees respect parent key ranges", true, "No range violations");
      addCheck("No duplicate keys exist in tree", true, "No duplicate keys");
      addCheck("Leaf pointer integrity", true, "No cycles or broken pointers");
      return list;
    }

    // Traverse tree to collect nodes, leaves, depths
    const allNodes = [];
    const treeLeaves = [];
    let uniformDepth = true;
    let leafDepth = -1;
    let keysSorted = true;
    let sortedErr = "";
    let childCountValid = true;
    let childCountErr = "";
    let capacityValid = true;
    let capacityErr = "";
    let separatorValid = true;
    let separatorErr = "";
    let rangeValid = true;
    let rangeErr = "";
    let recordsOnlyInLeaves = true;
    let recordsErr = "";

    const traverse = (node, depth, minBound = null, maxBound = null) => {
      if (!node) return;
      allNodes.push(node);

      // Check keys sorted
      for (let i = 0; i < node.keys.length - 1; i++) {
        if (compareKeys(node.keys[i], node.keys[i + 1]) >= 0) {
          keysSorted = false;
          sortedErr = `Node [${node.id}] keys not strictly sorted: [${node.keys.join(', ')}]`;
        }
      }

      // Check capacity
      if (node !== this.root) {
        if (node.isLeaf) {
          if (node.keys.length < this.minKeys || node.keys.length > this.maxKeys) {
            capacityValid = false;
            capacityErr = `Leaf node [${node.id}] has ${node.keys.length} keys (allowed [${this.minKeys}..${this.maxKeys}])`;
          }
        } else {
          if (node.keys.length < this.minKeys || node.keys.length > this.maxKeys) {
            capacityValid = false;
            capacityErr = `Internal node [${node.id}] has ${node.keys.length} keys (allowed [${this.minKeys}..${this.maxKeys}])`;
          }
          if (node.children.length < this.minChildren || node.children.length > this.maxChildren) {
            capacityValid = false;
            capacityErr = `Internal node [${node.id}] has ${node.children.length} children (allowed [${this.minChildren}..${this.maxChildren}])`;
          }
        }
      }

      // Check range bounds
      for (const k of node.keys) {
        if (minBound !== null && compareKeys(k, minBound) < 0) {
          rangeValid = false;
          rangeErr = `Key ${k} in node [${node.id}] is below subtree bound ${minBound}`;
        }
        if (maxBound !== null && compareKeys(k, maxBound) >= 0) {
          if (node.isLeaf) {
            rangeValid = false;
            rangeErr = `Leaf key ${k} in node [${node.id}] violates upper bound ${maxBound}`;
          }
        }
      }

      if (node.isLeaf) {
        treeLeaves.push(node);
        if (leafDepth === -1) {
          leafDepth = depth;
        } else if (leafDepth !== depth) {
          uniformDepth = false;
        }
        if (node.children && node.children.length > 0) {
          recordsOnlyInLeaves = false;
          recordsErr = `Leaf node [${node.id}] unexpectedly has children`;
        }
      } else {
        // Internal node
        if (node.children.length !== node.keys.length + 1) {
          childCountValid = false;
          childCountErr = `Internal node [${node.id}] has ${node.children.length} children for ${node.keys.length} keys (must be keys+1)`;
        }

        // Check separators
        for (let i = 0; i < node.keys.length; i++) {
          if (i + 1 < node.children.length) {
            const expectedMin = this.getMinKey(node.children[i + 1]);
            if (expectedMin !== null && compareKeys(node.keys[i], expectedMin) !== 0) {
              separatorValid = false;
              separatorErr = `Internal node [${node.id}] separator keys[${i}]=${node.keys[i]} does not match min of right child subtree (${expectedMin})`;
            }
          }
        }

        // Recurse children with bounds
        for (let i = 0; i < node.children.length; i++) {
          const childMin = i === 0 ? minBound : node.keys[i - 1];
          const childMax = i < node.keys.length ? node.keys[i] : maxBound;
          traverse(node.children[i], depth + 1, childMin, childMax);
        }
      }
    };

    traverse(this.root, 1);

    // Root occupancy check
    let rootValid = true;
    let rootErr = "";
    if (this.root.isLeaf) {
      if (this.root.keys.length > this.maxKeys) {
        rootValid = false;
        rootErr = `Leaf root [${this.root.id}] exceeds max keys ${this.maxKeys}`;
      }
    } else {
      if (this.root.keys.length < 1 || this.root.keys.length > this.maxKeys) {
        rootValid = false;
        rootErr = `Internal root [${this.root.id}] has ${this.root.keys.length} keys (allowed [1..${this.maxKeys}])`;
      }
      if (this.root.children.length < 2 || this.root.children.length > this.maxChildren) {
        rootValid = false;
        rootErr = `Internal root [${this.root.id}] has ${this.root.children.length} children (allowed [2..${this.maxChildren}])`;
      }
    }

    // Leaf linked list traversal
    const chainedLeaves = [];
    const visitedSet = new Set();
    let currLeaf = this.getFirstLeaf();
    let hasCycle = false;
    let pointerErr = "";

    while (currLeaf) {
      if (visitedSet.has(currLeaf)) {
        hasCycle = true;
        pointerErr = `Cycle detected at leaf [${currLeaf.id}] in linked list`;
        break;
      }
      visitedSet.add(currLeaf);
      chainedLeaves.push(currLeaf);
      currLeaf = currLeaf.next;
    }

    const linkedListAllOnce = !hasCycle && (chainedLeaves.length === treeLeaves.length) &&
      chainedLeaves.every((l, idx) => l === treeLeaves[idx]);

    // Check duplicate keys across leaves and sorted order
    const allLeafKeys = [];
    for (const lf of treeLeaves) {
      allLeafKeys.push(...lf.keys);
    }
    const keySet = new Set();
    let duplicateKey = null;
    let leafKeysSorted = true;
    for (let i = 0; i < allLeafKeys.length; i++) {
      const k = allLeafKeys[i];
      if (keySet.has(k)) {
        duplicateKey = k;
      }
      keySet.add(k);
      if (i > 0 && compareKeys(allLeafKeys[i - 1], k) >= 0) {
        leafKeysSorted = false;
      }
    }

    addCheck("All actual data keys reside in leaf nodes", recordsOnlyInLeaves, recordsOnlyInLeaves ? "Leaves store all keys" : recordsErr);
    addCheck("All leaf nodes reside at uniform depth", uniformDepth, uniformDepth ? `All leaves at depth ${leafDepth}` : "Leaves at non-uniform depths");
    addCheck("Leaf nodes form an in-order sequential linked list", linkedListAllOnce && leafKeysSorted, linkedListAllOnce && leafKeysSorted ? "Leaves chained sequentially in sorted order" : (pointerErr || "Linked list order does not match tree traversal"));
    addCheck("Non-root nodes obey [minKeys .. maxKeys] capacity", capacityValid, capacityValid ? `Allowed [${this.minKeys} .. ${this.maxKeys}] keys` : capacityErr);
    addCheck("Root node obeys occupancy rules", rootValid, rootValid ? "Root satisfies occupancy requirements" : rootErr);
    addCheck("Keys strictly sorted within each node", keysSorted, keysSorted ? "All node keys sorted" : sortedErr);
    addCheck("Internal nodes have exactly keys.length + 1 children", childCountValid, childCountValid ? "Child count matches keys + 1" : childCountErr);
    addCheck("Separator keys equal right child subtree minimum", separatorValid, separatorValid ? "All separators match right subtree minimum" : separatorErr);
    addCheck("Child subtrees respect parent key ranges", rangeValid, rangeValid ? "Subtree keys within router boundaries" : rangeErr);
    addCheck("No duplicate keys exist in tree", duplicateKey === null, duplicateKey === null ? "All keys unique" : `Duplicate key found: ${duplicateKey}`);
    addCheck("Leaf pointer integrity", !hasCycle, !hasCycle ? "Leaf pointers valid without cycles" : pointerErr);

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
      type: 'bplus',
      M: this.M,
      root: serializeNode(this.root)
    };
  }

  static fromJSON(data) {
    if (!data || !data.M) return null;
    const tree = new BPlusTree(data.M);
    function deserializeNode(nData) {
      if (!nData) return null;
      const node = new BPlusTreeNode(nData.isLeaf, nData.id);
      node.keys = Array.isArray(nData.keys) ? [...nData.keys] : [];
      node.children = Array.isArray(nData.children) ? nData.children.map(deserializeNode).filter(Boolean) : [];
      return node;
    }
    tree.root = deserializeNode(data.root) || new BPlusTreeNode(true);
    tree.relinkLeaves();
    return tree;
  }
}
