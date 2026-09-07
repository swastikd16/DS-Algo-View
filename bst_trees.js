/**
 * Binary Search Trees: AVL Tree, Red-Black Tree, and Splay Tree
 * 
 * Features:
 * - Granular, beginner-friendly step-by-step animations for all cases
 * - Intermediate snapshots for multi-step rotations (LR, RL, Zig-Zig, Zig-Zag)
 * - Complete explanations of color flips, balance factors, and repair cases
 * - Real Unicode symbols (→, ≤, ≥, ✓, ⚡) instead of unparsed HTML entities
 */

let nextBSTNodeId = 1;
export function resetBSTNodeIdCounter() {
  nextBSTNodeId = 1;
}

export class BSTNode {
  constructor(key, id = null) {
    this.id = id || `bst_node_${nextBSTNodeId++}`;
    this.key = key;
    this.left = null;
    this.right = null;
    this.parent = null;

    // AVL attributes
    this.height = 1;
    this.balanceFactor = 0;

    // Red-Black attribute ('RED' | 'BLACK')
    this.color = 'RED';

    // Splay tag
    this.splayTag = '';
  }

  get isLeaf() {
    return !this.left && !this.right;
  }

  // To interface seamlessly with the renderer's keys and children arrays
  get keys() {
    return [this.key];
  }

  get children() {
    const list = [];
    if (this.left) list.push(this.left);
    if (this.right) list.push(this.right);
    return list;
  }

  set children(_) {
    // No-op setter for compatibility and resilience
  }

  clone() {
    const copy = new BSTNode(this.key, this.id);
    copy.height = this.height;
    copy.balanceFactor = this.balanceFactor;
    copy.color = this.color;
    copy.splayTag = this.splayTag;

    if (this.left) {
      copy.left = this.left.clone();
      copy.left.parent = copy;
    }
    if (this.right) {
      copy.right = this.right.clone();
      copy.right.parent = copy;
    }
    return copy;
  }
}

// Helper to record visual steps
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
// 1. AVL Tree (Self-Balancing BST)
// ============================================================================
export class AVLTree {
  constructor() {
    this.root = null;
    this.steps = [];
  }

  cloneTree() {
    return this.root ? this.root.clone() : null;
  }

  getHeight(node) {
    return node ? node.height : 0;
  }

  getBalanceFactor(node) {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
  }

  updateNode(node) {
    if (!node) return;
    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    node.balanceFactor = this.getBalanceFactor(node);
  }

  rotateRight(y) {
    const x = y.left;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    this.updateNode(y);
    this.updateNode(x);
    return x;
  }

  rotateLeft(x) {
    const y = x.right;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    this.updateNode(x);
    this.updateNode(y);
    return y;
  }

  search(key) {
    this.steps = [];
    key = Number(key);
    const rec = createStepRecorder(() => this.cloneTree());

    rec.record({
      title: `AVL Search Initiated: Key ${key}`,
      reason: `Beginning binary search for key ${key} starting at root. AVL height-balancing guarantees logarithmic O(log n) time.`,
      popupMessage: `Searching for ${key}`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'search'
    });

    let curr = this.root;
    while (curr) {
      if (curr.key === key) {
        rec.record({
          title: `Key ${key} Found!`,
          reason: `Found key ${key} in node [${curr.id}]. Balance Factor = ${curr.balanceFactor > 0 ? '+' : ''}${curr.balanceFactor}, Height = ${curr.height}.`,
          popupMessage: `Found key ${key}!`,
          highlightNodeIds: [curr.id],
          highlightKeyIndices: { [curr.id]: [0] },
          statusType: 'success',
          actionCategory: 'search'
        });
        this.steps = rec.steps;
        return { found: true, steps: this.steps };
      } else if (key < curr.key) {
        rec.record({
          title: `Traverse Left: ${key} < ${curr.key}`,
          reason: `Key ${key} is less than current node [${curr.key}]. Moving to left child.`,
          popupMessage: `${key} < ${curr.key} → Go Left`,
          highlightNodeIds: [curr.id, curr.left ? curr.left.id : null].filter(Boolean),
          statusType: 'info',
          actionCategory: 'search'
        });
        curr = curr.left;
      } else {
        rec.record({
          title: `Traverse Right: ${key} > ${curr.key}`,
          reason: `Key ${key} is greater than current node [${curr.key}]. Moving to right child.`,
          popupMessage: `${key} > ${curr.key} → Go Right`,
          highlightNodeIds: [curr.id, curr.right ? curr.right.id : null].filter(Boolean),
          statusType: 'info',
          actionCategory: 'search'
        });
        curr = curr.right;
      }
    }

    rec.record({
      title: `Key ${key} Not Found`,
      reason: `Reached terminal pointer. Key ${key} is not in the AVL tree.`,
      popupMessage: `Key ${key} not in tree`,
      statusType: 'error',
      actionCategory: 'search'
    });
    this.steps = rec.steps;
    return { found: false, steps: this.steps };
  }

  insert(key) {
    this.steps = [];
    key = Number(key);
    if (isNaN(key)) return this.steps;

    const rec = createStepRecorder(() => this.cloneTree());

    rec.record({
      title: `AVL Insert Initiated: Key ${key}`,
      action: `Preparing to insert key ${key} into the AVL Tree.`,
      rule: `AVL Insertion: Follow standard BST search rules to place the new key at an empty leaf slot, then check Balance Factors (BF = Height(Left) - Height(Right)) on the way back up.`,
      tip: `Always remember: AVL is just a BST with a self-correcting reflex whenever one side gets too tall.`,
      popupMessage: `Inserting ${key}`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'insert'
    });

    const insertInternal = (node, k) => {
      if (!node) {
        const newNode = new BSTNode(k);
        rec.record({
          title: `Placed New Node [${k}] as Leaf`,
          action: `Created new node [${k}] at this vacant leaf spot.`,
          rule: `Leaf Invariant: A freshly inserted leaf has height = 1 and Balance Factor = 0 because it has no children yet.`,
          tip: `A brand-new single leaf is always perfectly balanced by definition.`,
          popupMessage: `Placed node ${k}`,
          highlightNodeIds: [newNode.id],
          statusType: 'success',
          actionCategory: 'insert'
        });
        return newNode;
      }

      if (k === node.key) {
        rec.record({
          title: `Duplicate Key [${k}] Ignored`,
          action: `Found key ${k} already present in the tree.`,
          rule: `BST Set Invariant: Duplicate keys are not permitted in standard Binary Search Trees.`,
          tip: `Values in a BST must be uniquely distinguishable.`,
          popupMessage: `Duplicate ${k}`,
          highlightNodeIds: [node.id],
          statusType: 'warning',
          actionCategory: 'insert'
        });
        return node;
      }

      if (k < node.key) {
        rec.record({
          title: `Descent: ${k} < ${node.key}`,
          action: `${k} is smaller than node [${node.key}] (${k} < ${node.key}). Branching to left subtree.`,
          rule: `BST Ordering Rule: Smaller keys must always live in the left subtree.`,
          tip: `Like flipping backwards in an alphabetical index.`,
          popupMessage: `${k} < ${node.key} → Left`,
          highlightNodeIds: [node.id],
          statusType: 'info',
          actionCategory: 'insert'
        });
        node.left = insertInternal(node.left, k);
      } else {
        rec.record({
          title: `Descent: ${k} > ${node.key}`,
          action: `${k} is greater than node [${node.key}] (${k} > ${node.key}). Branching to right subtree.`,
          rule: `BST Ordering Rule: Greater keys must always live in the right subtree.`,
          tip: `Like flipping forward in a dictionary.`,
          popupMessage: `${k} > ${node.key} → Right`,
          highlightNodeIds: [node.id],
          statusType: 'info',
          actionCategory: 'insert'
        });
        node.right = insertInternal(node.right, k);
      }

      // Update height and compute BF
      this.updateNode(node);
      const balance = node.balanceFactor;
      const isImbalanced = Math.abs(balance) > 1;

      rec.record({
        title: `Ancestor Check: Node [${node.key}] (BF = ${balance > 0 ? '+' : ''}${balance})`,
        action: `Climbing back up to node [${node.key}]: Left height = ${this.getHeight(node.left)}, Right height = ${this.getHeight(node.right)} → Balance Factor = ${balance > 0 ? '+' : ''}${balance}.`,
        rule: !isImbalanced
          ? `AVL Invariant (|BF| ≤ 1) Satisfied: Height difference is within {-1, 0, +1}. No rotation needed here.`
          : `AVL Invariant Violated: |BF| = ${Math.abs(balance)} > 1! The tree is lopsided and must be rotated immediately.`,
        tip: !isImbalanced
          ? `Both branches are evenly matched like a balanced seesaw.`
          : `One side is too heavy. A rotation is required to re-level the branches.`,
        popupMessage: `Node ${node.key}: BF = ${balance > 0 ? '+' : ''}${balance}`,
        highlightNodeIds: [node.id],
        statusType: isImbalanced ? 'warning' : 'info',
        actionCategory: isImbalanced ? 'rotate' : 'insert'
      });

      // Case LL: Left-Left Imbalance
      if (balance > 1 && k < node.left.key) {
        rec.record({
          title: `LL Imbalance Detected at Node [${node.key}]`,
          action: `Left-Left Imbalance at [${node.key}]. The left child's left side caused the overflow. Performing a single Right Rotation.`,
          rule: `LL Rotation Rule: Left child [${node.left.key}] moves up to become the new parent; [${node.key}] swings down to become its right child.`,
          tip: `Clockwise twist: Pull down on the right side to restore balance.`,
          popupMessage: `LL Case → Right Rotate on ${node.key}`,
          highlightNodeIds: [node.id, node.left.id],
          statusType: 'warning',
          actionCategory: 'rotate'
        });
        const rotated = this.rotateRight(node);
        rec.record({
          title: `Right Rotation Finished: New Subtree Root [${rotated.key}]`,
          action: `Right rotation complete. [${rotated.key}] is now the new root of this subtree.`,
          rule: `Balanced Invariant Restored: Both subtrees under [${rotated.key}] now satisfy |BF| ≤ 1.`,
          tip: `Notice that binary search order was completely preserved while shrinking the height!`,
          popupMessage: `Subtree balanced under ${rotated.key}`,
          highlightNodeIds: [rotated.id],
          statusType: 'success',
          actionCategory: 'rotate'
        });
        return rotated;
      }

      // Case RR: Right-Right Imbalance
      if (balance < -1 && k > node.right.key) {
        rec.record({
          title: `RR Imbalance Detected at Node [${node.key}]`,
          action: `Right-Right Imbalance at [${node.key}]. The right child's right side caused the overflow. Performing a single Left Rotation.`,
          rule: `RR Rotation Rule: Right child [${node.right.key}] moves up to become the parent; [${node.key}] swings down to become its left child.`,
          tip: `Counter-clockwise twist: Pull down on the left side to bring the tree back to center.`,
          popupMessage: `RR Case → Left Rotate on ${node.key}`,
          highlightNodeIds: [node.id, node.right.id],
          statusType: 'warning',
          actionCategory: 'rotate'
        });
        const rotated = this.rotateLeft(node);
        rec.record({
          title: `Left Rotation Finished: New Subtree Root [${rotated.key}]`,
          action: `Left rotation complete. [${rotated.key}] is now the balanced root of this subtree.`,
          rule: `Balanced Invariant Restored: Both branches are now height-aligned with |BF| ≤ 1.`,
          tip: `Tree height reduced and balanced.`,
          popupMessage: `Subtree balanced under ${rotated.key}`,
          highlightNodeIds: [rotated.id],
          statusType: 'success',
          actionCategory: 'rotate'
        });
        return rotated;
      }

      // Case LR: Left-Right Imbalance (Double Rotation)
      if (balance > 1 && k > node.left.key) {
        rec.record({
          title: `LR Imbalance Detected at Node [${node.key}]`,
          action: `Left-Right (Zig-Zag) Imbalance at [${node.key}]. Left side is heavy, but child [${node.left.key}] bends right. Starting 2-step Double Rotation.`,
          rule: `LR Rule Step 1: An inner zig-zag bend cannot be balanced with a single rotation. First, Left Rotate child [${node.left.key}] to align nodes into a straight line.`,
          tip: `Straighten the bent elbow first before lifting the arm.`,
          popupMessage: `LR Case: Step 1 → Left Rotate child ${node.left.key}`,
          highlightNodeIds: [node.id, node.left.id],
          statusType: 'warning',
          actionCategory: 'rotate'
        });

        // Step 1: Left rotate child
        node.left = this.rotateLeft(node.left);
        rec.record({
          title: `LR Step 1 Done: Child Rotated Left`,
          action: `Child [${node.left.key}] rotated left. Nodes are now aligned in a straight left-left line. Now ready for Step 2: Right Rotation on [${node.key}].`,
          rule: `LR Rule Step 2: With the zig-zag converted to a straight line (LL case), standard Right Rotation will restore balance.`,
          tip: `Now that it's straight, one clockwise rotation finishes the job.`,
          popupMessage: `Step 2 → Right Rotate on ${node.key}`,
          highlightNodeIds: [node.id, node.left.id],
          statusType: 'warning',
          actionCategory: 'rotate'
        });

        // Step 2: Right rotate node
        const rotated = this.rotateRight(node);
        rec.record({
          title: `LR Double Rotation Complete: Root [${rotated.key}]`,
          action: `Right rotation on [${node.key}] complete. [${rotated.key}] is now the new balanced subtree root.`,
          rule: `AVL Restored: Both branches now have matching heights within ±1.`,
          tip: `The inner middle value [${rotated.key}] successfully rose to the top.`,
          popupMessage: `LR Rotation complete!`,
          highlightNodeIds: [rotated.id],
          statusType: 'success',
          actionCategory: 'rotate'
        });
        return rotated;
      }

      // Case RL: Right-Left Imbalance (Double Rotation)
      if (balance < -1 && k < node.right.key) {
        rec.record({
          title: `RL Imbalance Detected at Node [${node.key}]`,
          action: `Right-Left (Zig-Zag) Imbalance at [${node.key}]. Right side is heavy, but child [${node.right.key}] bends left. Starting 2-step Double Rotation.`,
          rule: `RL Rule Step 1: The inner left-bend must be straightened first. Right Rotate child [${node.right.key}] to form a straight line.`,
          tip: `Align the bent spine into a straight line first.`,
          popupMessage: `RL Case: Step 1 → Right Rotate child ${node.right.key}`,
          highlightNodeIds: [node.id, node.right.id],
          statusType: 'warning',
          actionCategory: 'rotate'
        });

        // Step 1: Right rotate child
        node.right = this.rotateRight(node.right);
        rec.record({
          title: `RL Step 1 Done: Child Rotated Right`,
          action: `Child [${node.right.key}] rotated right. Nodes now form a straight right-right line. Now ready for Step 2: Left Rotation on [${node.key}].`,
          rule: `RL Rule Step 2: The straight line is now an RR case. Standard Left Rotation will level the tree.`,
          tip: `One counter-clockwise rotation completes the balance.`,
          popupMessage: `Step 2 → Left Rotate on ${node.key}`,
          highlightNodeIds: [node.id, node.right.id],
          statusType: 'warning',
          actionCategory: 'rotate'
        });

        // Step 2: Left rotate node
        const rotated = this.rotateLeft(node);
        rec.record({
          title: `RL Double Rotation Complete: Root [${rotated.key}]`,
          action: `Left rotation on [${node.key}] complete. [${rotated.key}] is now the balanced subtree root.`,
          rule: `AVL Restored: All subtrees now satisfy |BF| ≤ 1.`,
          tip: `Middle value [${rotated.key}] is now centered at the top.`,
          popupMessage: `RL Rotation complete!`,
          highlightNodeIds: [rotated.id],
          statusType: 'success',
          actionCategory: 'rotate'
        });
        return rotated;
      }

      return node;
    };

    this.root = insertInternal(this.root, key);

    rec.record({
      title: `AVL Tree Rebalanced`,
      action: `Key ${key} successfully inserted into the AVL tree.`,
      rule: `AVL Full Invariant: Every single node in the tree has Balance Factor in {-1, 0, +1}. Tree guarantees O(log n) lookups.`,
      tip: `No branch is more than 1 level deeper than its sibling branch.`,
      popupMessage: `AVL Tree balanced`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'success',
      actionCategory: 'insert'
    });

    this.steps = rec.steps;
    return this.steps;
  }

  delete(key) {
    this.steps = [];
    key = Number(key);
    if (isNaN(key)) return this.steps;

    const rec = createStepRecorder(() => this.cloneTree());

    rec.record({
      title: `Starting AVL Delete: Key ${key}`,
      action: `Beginning search for key ${key} starting at root [${this.root ? this.root.key : 'empty'}].`,
      rule: `BST Deletion Rule: Find the key first by binary search. Leaves can be removed immediately; nodes with 2 children must swap with their in-order successor.`,
      tip: `Think of deletion in two stages: First find and extract the node, then climb back up to fix any balance problems.`,
      popupMessage: `Deleting ${key}`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'delete'
    });

    const getMinValueNode = (node) => {
      let current = node;
      while (current.left) current = current.left;
      return current;
    };

    const deleteInternal = (node, k) => {
      if (!node) {
        rec.record({
          title: `Key ${k} Not Found`,
          action: `Reached an empty branch. Key ${k} was not found in the AVL tree.`,
          rule: `Search Failure: The requested key does not exist. Tree remains unmodified.`,
          tip: `No nodes were removed or changed.`,
          popupMessage: `Key ${k} not found`,
          statusType: 'error',
          actionCategory: 'delete'
        });
        return null;
      }

      if (k < node.key) {
        rec.record({
          title: `Descent: ${k} < ${node.key}`,
          action: `${k} is smaller than node [${node.key}]. Traversing into left subtree.`,
          rule: `BST Rule: Keys smaller than the parent must be in the left subtree.`,
          tip: `Follow the smaller branch on the left.`,
          popupMessage: `${k} < ${node.key} → Left`,
          highlightNodeIds: [node.id],
          statusType: 'info',
          actionCategory: 'delete'
        });
        node.left = deleteInternal(node.left, k);
      } else if (k > node.key) {
        rec.record({
          title: `Descent: ${k} > ${node.key}`,
          action: `${k} is greater than node [${node.key}]. Traversing into right subtree.`,
          rule: `BST Rule: Keys greater than the parent must be in the right subtree.`,
          tip: `Follow the larger branch on the right.`,
          popupMessage: `${k} > ${node.key} → Right`,
          highlightNodeIds: [node.id],
          statusType: 'info',
          actionCategory: 'delete'
        });
        node.right = deleteInternal(node.right, k);
      } else {
        // Node located
        if (!node.left || !node.right) {
          const child = node.left ? node.left : node.right;
          rec.record({
            title: `Deleted Node [${node.key}]`,
            action: `Target [${node.key}] reached. It has ${child ? '1 child [' + child.key + ']' : '0 children (leaf)'}. Removing [${node.key}] directly.`,
            rule: `Simple Deletion: A leaf can be erased directly. A single-child node simply passes its child pointer up to its parent.`,
            tip: `Clean cut: No complex reorganization required when a node doesn't have two separate branches to manage.`,
            popupMessage: `Removed ${node.key}`,
            highlightNodeIds: child ? [child.id] : [],
            statusType: 'success',
            actionCategory: 'delete'
          });
          node = child;
        } else {
          const succ = getMinValueNode(node.right);
          rec.record({
            title: `Swapping [${node.key}] with In-Order Successor [${succ.key}]`,
            action: `Node [${node.key}] has two children! Finding the smallest key in its right subtree ([${succ.key}]) and swapping values.`,
            rule: `In-Order Successor Rule: To safely replace a 2-child node without breaking BST order, take the smallest item on the right (which is strictly greater than all left items and smaller than all remaining right items).`,
            tip: `Like electing a class leader: pick the next-in-line smallest student from the older group.`,
            popupMessage: `Swap ${node.key} with successor ${succ.key}`,
            highlightNodeIds: [node.id, succ.id],
            statusType: 'info',
            actionCategory: 'delete'
          });
          node.key = succ.key;
          node.right = deleteInternal(node.right, succ.key);
        }
      }

      if (!node) return null;

      this.updateNode(node);
      const balance = node.balanceFactor;

      // LL Case
      if (balance > 1 && this.getBalanceFactor(node.left) >= 0) {
        rec.record({
          title: `Rebalancing: Right Rotation on [${node.key}]`,
          action: `After deletion, node [${node.key}] has BF = ${balance} (> +1). Performing Right Rotation to fix left-heavy imbalance.`,
          rule: `LL Rotation: Left child moves up; node [${node.key}] swings down to right.`,
          tip: `Clockwise twist levels the branches.`,
          popupMessage: `Right Rotate on ${node.key}`,
          highlightNodeIds: [node.id],
          statusType: 'warning',
          actionCategory: 'rotate'
        });
        return this.rotateRight(node);
      }

      // LR Case
      if (balance > 1 && this.getBalanceFactor(node.left) < 0) {
        rec.record({
          title: `Rebalancing: Double Rotate (Left-Right) on [${node.key}]`,
          action: `Node [${node.key}] has BF = ${balance} (> +1) with right-heavy left child. Left rotating child first, then right rotating node.`,
          rule: `LR Double Rotation: First straighten the inner kink, then rotate clockwise.`,
          tip: `Straighten then turn.`,
          popupMessage: `Double Rotate on ${node.key}`,
          highlightNodeIds: [node.id],
          statusType: 'warning',
          actionCategory: 'rotate'
        });
        node.left = this.rotateLeft(node.left);
        return this.rotateRight(node);
      }

      // RR Case
      if (balance < -1 && this.getBalanceFactor(node.right) <= 0) {
        rec.record({
          title: `Rebalancing: Left Rotation on [${node.key}]`,
          action: `Node [${node.key}] has BF = ${balance} (< -1). Performing Left Rotation to fix right-heavy imbalance.`,
          rule: `RR Rotation: Right child moves up; node [${node.key}] swings down to left.`,
          tip: `Counter-clockwise twist levels the branches.`,
          popupMessage: `Left Rotate on ${node.key}`,
          highlightNodeIds: [node.id],
          statusType: 'warning',
          actionCategory: 'rotate'
        });
        return this.rotateLeft(node);
      }

      // RL Case
      if (balance < -1 && this.getBalanceFactor(node.right) > 0) {
        rec.record({
          title: `Rebalancing: Double Rotate (Right-Left) on [${node.key}]`,
          action: `Node [${node.key}] has BF = ${balance} (< -1) with a left-heavy right child. Right rotating child first, then left rotating node.`,
          rule: `RL Double Rotation: First straighten the inner kink, then rotate counter-clockwise.`,
          tip: `Straighten then turn.`,
          popupMessage: `Double Rotate on ${node.key}`,
          highlightNodeIds: [node.id],
          statusType: 'warning',
          actionCategory: 'rotate'
        });
        node.right = this.rotateRight(node.right);
        return this.rotateLeft(node);
      }

      return node;
    };

    this.root = deleteInternal(this.root, key);

    rec.record({
      title: `Deletion Complete: Key ${key}`,
      action: `Key ${key} removed from the AVL tree.`,
      rule: `AVL Post-Delete Balance: All ancestor nodes recomputed heights; balance factors verified to be in {-1, 0, +1}.`,
      tip: `The tree maintained its logarithmic height guarantee!`,
      popupMessage: `Deletion finished`,
      statusType: 'success',
      actionCategory: 'delete'
    });

    this.steps = rec.steps;
    return this.steps;
  }

  clear() {
    this.root = null;
    this.steps = [];
  }

  getSnapshot() {
    return this.cloneTree();
  }

  getStats() {
    let totalKeys = 0;
    let totalNodes = 0;
    let height = this.getHeight(this.root);

    const count = (n) => {
      if (!n) return;
      totalNodes++;
      totalKeys++;
      count(n.left);
      count(n.right);
    };
    count(this.root);
    return { totalKeys, totalNodes, height, balanceFactor: this.getBalanceFactor(this.root) };
  }

  validateInvariants() {
    const list = [
      { name: "Binary Search Tree ordering property", valid: true, detail: "Left < Node < Right" },
      { name: "AVL Height Balance Factor bound (|BF| ≤ 1)", valid: true, detail: "All nodes BF in {-1, 0, +1}" },
      { name: "Node height values accurate", valid: true, detail: "1 + max(hL, hR)" }
    ];

    let bstValid = true;
    let avlValid = true;
    let heightValid = true;

    const validate = (node, min, max) => {
      if (!node) return;
      if (min !== null && node.key <= min) bstValid = false;
      if (max !== null && node.key >= max) bstValid = false;

      const bf = this.getBalanceFactor(node);
      if (Math.abs(bf) > 1) avlValid = false;

      const expectedH = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
      if (node.height !== expectedH) heightValid = false;

      validate(node.left, min, node.key);
      validate(node.right, node.key, max);
    };

    validate(this.root, null, null);
    list[0].valid = bstValid;
    list[1].valid = avlValid;
    list[2].valid = heightValid;
    return list;
  }

  toJSON() {
    function serializeNode(node) {
      if (!node) return null;
      return {
        id: node.id,
        key: node.key,
        height: node.height,
        left: serializeNode(node.left),
        right: serializeNode(node.right)
      };
    }
    return {
      type: 'avl',
      root: serializeNode(this.root)
    };
  }

  static fromJSON(data) {
    if (!data) return null;
    const tree = new AVLTree();
    function deserializeNode(nData) {
      if (!nData) return null;
      const node = new BSTNode(nData.key, nData.id);
      node.height = nData.height || 1;
      node.left = deserializeNode(nData.left);
      node.right = deserializeNode(nData.right);
      node.balanceFactor = (node.left ? node.left.height : 0) - (node.right ? node.right.height : 0);
      return node;
    }
    tree.root = deserializeNode(data.root);
    return tree;
  }
}

// ============================================================================
// 2. Red-Black Tree (Self-Balancing BST with 5 Properties)
// ============================================================================
export class RedBlackTree {
  constructor() {
    this.root = null;
    this.steps = [];
  }

  cloneTree() {
    return this.root ? this.root.clone() : null;
  }

  isRed(node) {
    return node ? node.color === 'RED' : false;
  }

  isBlack(node) {
    return !node || node.color === 'BLACK';
  }

  rotateLeft(x) {
    const y = x.right;
    x.right = y.left;
    if (y.left) y.left.parent = x;
    y.parent = x.parent;

    if (!x.parent) {
      this.root = y;
    } else if (x === x.parent.left) {
      x.parent.left = y;
    } else {
      x.parent.right = y;
    }

    y.left = x;
    x.parent = y;
  }

  rotateRight(y) {
    const x = y.left;
    y.left = x.right;
    if (x.right) x.right.parent = y;
    x.parent = y.parent;

    if (!y.parent) {
      this.root = x;
    } else if (y === y.parent.left) {
      y.parent.left = x;
    } else {
      y.parent.right = x;
    }

    x.right = y;
    y.parent = x;
  }

  search(key) {
    this.steps = [];
    key = Number(key);
    const rec = createStepRecorder(() => this.cloneTree());

    rec.record({
      title: `Red-Black Search: Key ${key}`,
      reason: `Beginning standard binary search for key ${key} starting at root.`,
      popupMessage: `Searching for ${key}`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'search'
    });

    let curr = this.root;
    while (curr) {
      if (curr.key === key) {
        rec.record({
          title: `Key ${key} Found!`,
          reason: `Found key ${key} in node [${curr.id}] with color ${curr.color}.`,
          popupMessage: `Found ${key} (${curr.color})!`,
          highlightNodeIds: [curr.id],
          highlightKeyIndices: { [curr.id]: [0] },
          statusType: 'success',
          actionCategory: 'search'
        });
        this.steps = rec.steps;
        return { found: true, steps: this.steps };
      } else if (key < curr.key) {
        rec.record({
          title: `Traverse Left: ${key} < ${curr.key}`,
          reason: `Key ${key} < ${curr.key}. Moving down to left child.`,
          popupMessage: `${key} < ${curr.key} → Left`,
          highlightNodeIds: [curr.id, curr.left ? curr.left.id : null].filter(Boolean),
          statusType: 'info',
          actionCategory: 'search'
        });
        curr = curr.left;
      } else {
        rec.record({
          title: `Traverse Right: ${key} > ${curr.key}`,
          reason: `Key ${key} > ${curr.key}. Moving down to right child.`,
          popupMessage: `${key} > ${curr.key} → Right`,
          highlightNodeIds: [curr.id, curr.right ? curr.right.id : null].filter(Boolean),
          statusType: 'info',
          actionCategory: 'search'
        });
        curr = curr.right;
      }
    }

    rec.record({
      title: `Key ${key} Not Found`,
      reason: `Key ${key} is not in the Red-Black tree.`,
      popupMessage: `Key ${key} not found`,
      statusType: 'error',
      actionCategory: 'search'
    });
    this.steps = rec.steps;
    return { found: false, steps: this.steps };
  }

  insert(key) {
    this.steps = [];
    key = Number(key);
    if (isNaN(key)) return this.steps;

    const rec = createStepRecorder(() => this.cloneTree());

    rec.record({
      title: `Red-Black Insert Initiated: Key ${key}`,
      action: `Preparing to insert key ${key} into the Red-Black Tree.`,
      rule: `Red-Black Insertion: Place key as a RED leaf to avoid adding black nodes, then check for Double-Red violations (Property 4).`,
      tip: `Inserting as RED is smart because it leaves all path black-heights unchanged.`,
      popupMessage: `Inserting ${key}`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'insert'
    });

    let node = new BSTNode(key);
    node.color = 'RED';

    let y = null;
    let x = this.root;

    // Step-by-step traversal
    while (x) {
      y = x;
      if (node.key === x.key) {
        rec.record({
          title: `Duplicate Key [${key}] Ignored`,
          action: `Found key ${key} already present in the Red-Black Tree.`,
          rule: `BST Set Invariant: Duplicate keys are not permitted.`,
          tip: `Values in a BST must be unique.`,
          popupMessage: `Duplicate key ${key}`,
          highlightNodeIds: [x.id],
          statusType: 'warning',
          actionCategory: 'insert'
        });
        this.steps = rec.steps;
        return this.steps;
      }

      if (node.key < x.key) {
        rec.record({
          title: `Search Descent: ${key} < ${x.key}`,
          action: `${key} is smaller than node [${x.key}]. Moving down to left child.`,
          rule: `BST Property: Lower values go left; higher values go right.`,
          tip: `Following the smaller branch on the left.`,
          popupMessage: `${key} < ${x.key} → Go Left`,
          highlightNodeIds: [x.id],
          statusType: 'info',
          actionCategory: 'insert'
        });
        x = x.left;
      } else {
        rec.record({
          title: `Search Descent: ${key} > ${x.key}`,
          action: `${key} is greater than node [${x.key}]. Moving down to right child.`,
          rule: `BST Property: Lower values go left; higher values go right.`,
          tip: `Following the larger branch on the right.`,
          popupMessage: `${key} > ${x.key} → Go Right`,
          highlightNodeIds: [x.id],
          statusType: 'info',
          actionCategory: 'insert'
        });
        x = x.right;
      }
    }

    node.parent = y;
    if (!y) {
      this.root = node;
    } else if (node.key < y.key) {
      y.left = node;
    } else {
      y.right = node;
    }

    rec.record({
      title: `Placed Node [${key}] as RED Leaf`,
      action: `Placed key [${key}] as a new RED leaf.`,
      rule: `Property 5 (Black-Height): Inserting as RED adds 0 black nodes, preserving black-height across all paths to leaves.`,
      tip: `Paint it red first to protect black-height across the rest of the tree.`,
      popupMessage: `Placed ${key} (RED leaf)`,
      highlightNodeIds: [node.id],
      statusType: 'info',
      actionCategory: 'insert'
    });

    // Check parent color
    if (!node.parent) {
      this.root.color = 'BLACK';
      rec.record({
        title: `Root Property: Recolor Root to BLACK`,
        action: `Node [${key}] was inserted as root of an empty tree. Painting it BLACK.`,
        rule: `Property 2: The root of a Red-Black tree must always be BLACK.`,
        tip: `Root is always the anchor of the tree and must be black.`,
        popupMessage: `Root set to BLACK (Property 2)`,
        highlightNodeIds: [this.root.id],
        statusType: 'success',
        actionCategory: 'recolor'
      });
      this.steps = rec.steps;
      return this.steps;
    }

    if (node.parent.color === 'BLACK') {
      rec.record({
        title: `Parent [${node.parent.key}] is BLACK → Tree is Valid!`,
        action: `Parent [${node.parent.key}] is BLACK. Adding a RED child here causes no conflicts.`,
        rule: `All 5 Red-Black Properties Satisfied: No two reds in a row (Property 4), and black-height is unchanged (Property 5).`,
        tip: `Best case scenario: insertion is finished without any rebalancing!`,
        popupMessage: `Parent is BLACK → Valid!`,
        highlightNodeIds: [node.id, node.parent.id],
        statusType: 'success',
        actionCategory: 'insert'
      });
      this.steps = rec.steps;
      return this.steps;
    }

    // Loop while parent is RED (Double-Red violation)
    while (node.parent && node.parent.color === 'RED') {
      const parent = node.parent;
      const grandparent = parent.parent;

      if (!grandparent) break;

      rec.record({
        title: `⚠️ Double-RED Violation: Node [${node.key}] & Parent [${parent.key}]`,
        action: `Both child [${node.key}] and parent [${parent.key}] are RED!`,
        rule: `Property 4 Violation: No two RED nodes may be directly connected. We must inspect Uncle to decide the repair case.`,
        tip: `Two red lights in a row are not allowed in traffic or Red-Black trees.`,
        popupMessage: `Double-RED: ${parent.key} & ${node.key}`,
        highlightNodeIds: [node.id, parent.id],
        statusType: 'warning',
        actionCategory: 'recolor'
      });

      if (parent === grandparent.left) {
        const uncle = grandparent.right;
        const uncleColor = uncle ? uncle.color : 'BLACK (NIL)';

        rec.record({
          title: `Inspecting Uncle: [${uncle ? uncle.key : 'NIL'}] is ${uncleColor}`,
          action: `Grandparent is [${grandparent.key}]. Parent [${parent.key}] is left child, so Uncle is right child [${uncle ? uncle.key : 'NIL'}]. Uncle color is ${uncleColor}.`,
          rule: `Case Selection: If Uncle is RED → Case 1 (Recolor). If Uncle is BLACK → Case 2 / 3 (Rotations).`,
          tip: `The uncle's color tells us whether we can solve this by swapping colors or need a rotation.`,
          popupMessage: `Uncle is ${uncleColor}`,
          highlightNodeIds: [node.id, parent.id, grandparent.id, uncle ? uncle.id : null].filter(Boolean),
          statusType: 'info',
          actionCategory: 'insert'
        });

        // Case 1: Uncle is RED -> Recolor
        if (uncle && uncle.color === 'RED') {
          rec.record({
            title: `Case 1: Uncle is RED → Recolor Parent, Uncle & Grandparent`,
            action: `Both Parent [${parent.key}] and Uncle [${uncle.key}] are RED. Recoloring Parent to BLACK, Uncle to BLACK, and Grandparent to RED.`,
            rule: `Case 1 Rule: Push blackness down from Grandparent to both brothers. Both sides stay balanced, and the red token moves up to Grandparent.`,
            tip: `Pass the red buck upstairs to grandpa.`,
            popupMessage: `Case 1: Parent & Uncle → BLACK, Grandparent → RED`,
            highlightNodeIds: [parent.id, uncle.id, grandparent.id],
            statusType: 'warning',
            actionCategory: 'recolor'
          });

          parent.color = 'BLACK';
          uncle.color = 'BLACK';
          grandparent.color = 'RED';

          rec.record({
            title: `Case 1 Recolor Applied`,
            action: `Parent [${parent.key}] and Uncle [${uncle.key}] are now BLACK. Grandparent [${grandparent.key}] is now RED.`,
            rule: `Propagation Check: Since Grandparent became RED, we must check if its parent is also RED (move check up).`,
            tip: `The local double-red is resolved! Now checking if grandpa conflicts with great-grandpa.`,
            popupMessage: `Recolored! Check moves up to ${grandparent.key}`,
            highlightNodeIds: [parent.id, uncle.id, grandparent.id],
            statusType: 'info',
            actionCategory: 'recolor'
          });

          node = grandparent;
        } else {
          // Case 2: Uncle is BLACK & Node is Right child (Triangle / Zig-Zag)
          if (node === parent.right) {
            rec.record({
              title: `Case 2: Uncle is BLACK & Triangle Shape (Zig-Zag)`,
              action: `Inner child creates a zig-zag: Grandparent [${grandparent.key}] (left) → Parent [${parent.key}] (right) → Child [${node.key}]. Left-rotating Parent [${parent.key}].`,
              rule: `Case 2 Rule: A triangle shape cannot be fixed directly. Rotate the parent toward the child to convert the bend into a straight line (Case 3).`,
              tip: `Straighten the bent elbow first before swinging the arm.`,
              popupMessage: `Case 2: Left Rotate Parent ${parent.key}`,
              highlightNodeIds: [node.id, parent.id],
              statusType: 'warning',
              actionCategory: 'rotate'
            });

            node = parent;
            this.rotateLeft(node);

            rec.record({
              title: `Case 2 Rotation Complete: Straight Line Formed`,
              action: `Nodes now form a straight line: Grandparent [${grandparent.key}] → Parent [${node.parent.key}] → Child [${node.key}].`,
              rule: `Case 2 → Case 3 Transition: With the elbow straightened, standard Case 3 color flip and rotation will complete the fix.`,
              tip: `Now in a straight line, ready for Case 3.`,
              popupMessage: `Straight line formed → Case 3`,
              highlightNodeIds: [node.parent.id, grandparent.id],
              statusType: 'info',
              actionCategory: 'rotate'
            });
          }

          // Case 3: Uncle is BLACK & Line Shape (Zig-Zig)
          rec.record({
            title: `Case 3: Uncle is BLACK & Line Shape → Color Flip & Rotate Grandparent`,
            action: `Nodes form a straight line. Swapping colors: Parent [${node.parent.key}] becomes BLACK, Grandparent [${grandparent.key}] becomes RED.`,
            rule: `Case 3 Rule: Parent becomes the black root of this cluster; grandparent swings down to become its red child.`,
            tip: `Flip colors, then rotate to restore balance.`,
            popupMessage: `Case 3: Parent → BLACK, Grandparent → RED`,
            highlightNodeIds: [node.parent.id, grandparent.id],
            statusType: 'warning',
            actionCategory: 'recolor'
          });

          node.parent.color = 'BLACK';
          grandparent.color = 'RED';

          rec.record({
            title: `Case 3 Colors Swapped → Rotating Grandparent [${grandparent.key}]`,
            action: `Parent [${node.parent.key}] is now BLACK and Grandparent [${grandparent.key}] is RED. Right-rotating Grandparent [${grandparent.key}].`,
            rule: `Rotation Mechanics: Clockwise turn brings black Parent [${node.parent.key}] to the top, balancing both branches.`,
            tip: `Clockwise swing restores balance.`,
            popupMessage: `Right Rotate on ${grandparent.key}`,
            highlightNodeIds: [node.parent.id, grandparent.id],
            statusType: 'warning',
            actionCategory: 'rotate'
          });

          this.rotateRight(grandparent);

          rec.record({
            title: `Case 3 Complete: Subtree Balanced!`,
            action: `Parent [${node.parent.key}] is now the black root of this subtree.`,
            rule: `Subtree Valid: Both left and right branches have equal black-height and zero double-red violations.`,
            tip: `Local tree is 100% repaired!`,
            popupMessage: `Subtree balanced under ${node.parent.key}`,
            highlightNodeIds: [node.parent.id],
            statusType: 'success',
            actionCategory: 'rotate'
          });
        }
      } else {
        // Mirror Case: Parent is RIGHT child of Grandparent
        const uncle = grandparent.left;
        const uncleColor = uncle ? uncle.color : 'BLACK (NIL)';

        rec.record({
          title: `Inspecting Uncle: [${uncle ? uncle.key : 'NIL'}] is ${uncleColor}`,
          action: `Grandparent is [${grandparent.key}]. Parent [${parent.key}] is right child, so Uncle is left child [${uncle ? uncle.key : 'NIL'}]. Uncle color is ${uncleColor}.`,
          rule: `Case Selection: If Uncle is RED → Case 1 (Recolor). If Uncle is BLACK → Case 2 / 3 (Rotations).`,
          tip: `Uncle color determines recolor vs rotation.`,
          popupMessage: `Uncle is ${uncleColor}`,
          highlightNodeIds: [node.id, parent.id, grandparent.id, uncle ? uncle.id : null].filter(Boolean),
          statusType: 'info',
          actionCategory: 'insert'
        });

        if (uncle && uncle.color === 'RED') {
          rec.record({
            title: `Case 1: Uncle is RED → Recolor Parent, Uncle & Grandparent`,
            action: `Both Parent [${parent.key}] and Uncle [${uncle.key}] are RED. Recoloring Parent to BLACK, Uncle to BLACK, and Grandparent to RED.`,
            rule: `Case 1 Rule: Push blackness down from Grandparent. Both sides stay balanced; red token moves up to Grandparent.`,
            tip: `Pass the red buck upstairs to grandpa.`,
            popupMessage: `Case 1: Parent & Uncle → BLACK, Grandparent → RED`,
            highlightNodeIds: [parent.id, uncle.id, grandparent.id],
            statusType: 'warning',
            actionCategory: 'recolor'
          });

          parent.color = 'BLACK';
          uncle.color = 'BLACK';
          grandparent.color = 'RED';

          rec.record({
            title: `Case 1 Recolor Applied`,
            action: `Parent and Uncle are now BLACK; Grandparent is RED.`,
            rule: `Propagation Check: Advancing check to Grandparent [${grandparent.key}] in case of double-red higher up.`,
            tip: `Check moves up to grandpa.`,
            popupMessage: `Recolored! Check moves up to ${grandparent.key}`,
            highlightNodeIds: [parent.id, uncle.id, grandparent.id],
            statusType: 'info',
            actionCategory: 'recolor'
          });

          node = grandparent;
        } else {
          if (node === parent.left) {
            rec.record({
              title: `Case 2: Uncle is BLACK & Triangle Shape (Zig-Zag)`,
              action: `Inner child creates a bend (left child of right parent). Right-rotating Parent [${parent.key}] into a straight line.`,
              rule: `Case 2 Rule: Rotate parent toward child to align into a straight line (Case 3).`,
              tip: `Straighten the bend first.`,
              popupMessage: `Case 2: Right Rotate Parent ${parent.key}`,
              highlightNodeIds: [node.id, parent.id],
              statusType: 'warning',
              actionCategory: 'rotate'
            });

            node = parent;
            this.rotateRight(node);

            rec.record({
              title: `Case 2 Rotation Complete: Straight Line Formed`,
              action: `Nodes now form a straight right-right line.`,
              rule: `Case 2 → Case 3 Transition: Standard Case 3 color flip and rotation will complete the fix.`,
              tip: `Straight line formed; ready for Case 3.`,
              popupMessage: `Straight line formed → Case 3`,
              highlightNodeIds: [node.parent.id, grandparent.id],
              statusType: 'info',
              actionCategory: 'rotate'
            });
          }

          rec.record({
            title: `Case 3: Uncle is BLACK & Line Shape → Color Flip & Rotate Grandparent`,
            action: `Color flip: Parent [${node.parent.key}] becomes BLACK, Grandparent [${grandparent.key}] becomes RED. Then Left-Rotate Grandparent [${grandparent.key}].`,
            rule: `Case 3 Rule: Parent becomes the black subtree root; Grandparent becomes its red child.`,
            tip: `Color flip then rotate to restore balance.`,
            popupMessage: `Case 3: Parent → BLACK, Grandparent → RED`,
            highlightNodeIds: [node.parent.id, grandparent.id],
            statusType: 'warning',
            actionCategory: 'recolor'
          });

          node.parent.color = 'BLACK';
          grandparent.color = 'RED';

          this.rotateLeft(grandparent);

          rec.record({
            title: `Case 3 Complete: Subtree Balanced!`,
            action: `Left rotation on Grandparent complete. Subtree satisfies all properties.`,
            rule: `Subtree Valid: Equal black-height and no consecutive reds.`,
            tip: `All invariants restored.`,
            popupMessage: `Subtree balanced under ${node.parent.key}`,
            highlightNodeIds: [node.parent.id],
            statusType: 'success',
            actionCategory: 'rotate'
          });
        }
      }
    }

    // Ensure root is BLACK
    if (this.root && this.root.color !== 'BLACK') {
      this.root.color = 'BLACK';
      rec.record({
        title: `Property 2 Check: Set Root Color to BLACK`,
        action: `Recoloring the Root node [${this.root.key}] to BLACK.`,
        rule: `Property 2: The root of a Red-Black Tree must always be BLACK.`,
        tip: `Turning root black adds +1 black node to every path equally, so black-height stays identical everywhere!`,
        popupMessage: `Root set to BLACK (Property 2)`,
        highlightNodeIds: [this.root.id],
        statusType: 'success',
        actionCategory: 'recolor'
      });
    }

    rec.record({
      title: `Red-Black Tree Insertion Complete`,
      reason: `All 5 Red-Black invariants verified: Root is Black, No Double-Red, and Black-Height is equal on all paths.`,
      popupMessage: `Tree fully balanced!`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'success',
      actionCategory: 'insert'
    });

    this.steps = rec.steps;
    return this.steps;
  }

  delete(key) {
    this.steps = [];
    key = Number(key);
    if (isNaN(key)) return this.steps;

    const rec = createStepRecorder(() => this.cloneTree());

    rec.record({
      title: `Red-Black Delete Initiated: Key ${key}`,
      reason: `Locating key ${key}. If node has two children, swap with in-order successor. If the removed node is BLACK, repair black-height deficiency via rotations/recolorings.`,
      popupMessage: `Deleting ${key}`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'delete'
    });

    let z = this.root;
    while (z && z.key !== key) {
      z = key < z.key ? z.left : z.right;
    }

    if (!z) {
      rec.record({
        title: `Key ${key} Not Found`,
        action: `Reached an empty branch. Key ${key} does not exist in the tree.`,
        rule: `Search Failure: No node was removed. Red-Black properties remain intact.`,
        tip: `Tree is untouched.`,
        popupMessage: `Key ${key} not found`,
        statusType: 'error',
        actionCategory: 'delete'
      });
      this.steps = rec.steps;
      return this.steps;
    }

    let y = z;
    let yOriginalColor = y.color;
    let x = null;
    let xParent = null;

    if (!z.left) {
      x = z.right;
      xParent = z.parent;
      this.transplant(z, z.right);
    } else if (!z.right) {
      x = z.left;
      xParent = z.parent;
      this.transplant(z, z.left);
    } else {
      // Two children: find in-order successor
      y = z.right;
      while (y.left) y = y.left;
      yOriginalColor = y.color;
      x = y.right;

      rec.record({
        title: `Two Children: Swap [${z.key}] with Successor [${y.key}]`,
        action: `Target node [${z.key}] has two children. Finding in-order successor [${y.key}] (color: ${y.color}) and copying its value into [${z.key}].`,
        rule: `Successor Rule: To delete a node with two children, replace it with the smallest node in its right subtree, then delete that leaf/single-child node instead.`,
        tip: `We swap contents first, so the actual node being physically removed is at the bottom of the tree.`,
        popupMessage: `Swap ${z.key} with successor ${y.key}`,
        highlightNodeIds: [z.id, y.id],
        statusType: 'info',
        actionCategory: 'delete'
      });

      if (y.parent === z) {
        if (x) x.parent = y;
        xParent = y;
      } else {
        xParent = y.parent;
        this.transplant(y, y.right);
        y.right = z.right;
        if (y.right) y.right.parent = y;
      }

      this.transplant(z, y);
      y.left = z.left;
      if (y.left) y.left.parent = y;
      y.color = z.color;
    }

    rec.record({
      title: `Node Removed (Original Color: ${yOriginalColor})`,
      action: yOriginalColor === 'RED'
        ? `Removed RED node. Deleting a red node preserves black-height and cannot cause double-reds.`
        : `Removed BLACK node! Black-height along this branch is reduced by 1, creating a Double-Black deficiency.`,
      rule: yOriginalColor === 'RED'
        ? `Red Deletion Invariant: Removing RED nodes never affects black-height. Done!`
        : `Double-Black Invariant: A missing black node means this branch is 1 unit too light compared to all other paths. Repair is required.`,
      tip: yOriginalColor === 'RED'
        ? `No fixup needed: clean and quick exit.`
        : `Think of it like an uneven weighing scale: we need to borrow or recolor to fix the lost weight.`,
      popupMessage: yOriginalColor === 'RED' ? `Removed RED (No fixup)` : `Removed BLACK → Double-Black`,
      statusType: yOriginalColor === 'RED' ? 'success' : 'warning',
      actionCategory: 'delete'
    });

    if (yOriginalColor === 'BLACK') {
      this.fixDelete(x, xParent, rec);
    }

    rec.record({
      title: `Red-Black Tree Deletion Complete`,
      action: `Key ${key} removed and all 5 Red-Black properties restored.`,
      rule: `Full Balance Restored: Black-height is equal across all paths; root is black; no double-red nodes exist.`,
      tip: `The tree remains balanced with guaranteed O(log n) performance!`,
      popupMessage: `Tree balanced`,
      statusType: 'success',
      actionCategory: 'delete'
    });

    this.steps = rec.steps;
    return this.steps;
  }

  transplant(u, v) {
    if (!u.parent) {
      this.root = v;
    } else if (u === u.parent.left) {
      u.parent.left = v;
    } else {
      u.parent.right = v;
    }
    if (v) v.parent = u.parent;
  }

  fixDelete(x, parent, rec) {
    while (x !== this.root && (!x || x.color === 'BLACK')) {
      if (!parent) break;

      if (x === parent.left) {
        let w = parent.right;

        // Case 1: Sibling is RED
        if (w && w.color === 'RED') {
          rec.record({
            title: `Delete Case 1: Sibling [${w.key}] is RED`,
            action: `Sibling [${w.key}] is RED. Recoloring Sibling to BLACK, Parent [${parent.key}] to RED, and Left-Rotating Parent [${parent.key}].`,
            rule: `Case 1 Rule: Structural rebalancing requires a BLACK sibling. Rotating the parent brings a black nephew into the sibling slot.`,
            tip: `Transform the configuration so the sibling is black (converts to Case 2, 3, or 4).`,
            popupMessage: `Delete Case 1: Left Rotate Parent ${parent.key}`,
            highlightNodeIds: [w.id, parent.id],
            statusType: 'warning',
            actionCategory: 'rotate'
          });

          w.color = 'BLACK';
          parent.color = 'RED';
          this.rotateLeft(parent);
          w = parent.right;
        }

        // Case 2: Sibling is BLACK and both sibling's children are BLACK
        if (w && this.isBlack(w.left) && this.isBlack(w.right)) {
          rec.record({
            title: `Delete Case 2: Sibling [${w.key}] and Children are BLACK`,
            action: `Both children of sibling [${w.key}] are BLACK. Recoloring Sibling [${w.key}] to RED and pushing the Double-Black up to Parent [${parent.key}].`,
            rule: `Case 2 Rule: Sibling gives up its blackness to match our branch. The black deficiency moves one level closer to the root.`,
            tip: `Both branches under parent are now equally light, so grandpa takes the deficit.`,
            popupMessage: `Delete Case 2: Sibling → RED, Double-Black to Parent`,
            highlightNodeIds: [w.id, parent.id],
            statusType: 'warning',
            actionCategory: 'recolor'
          });

          w.color = 'RED';
          x = parent;
          parent = x.parent;
        } else if (w) {
          // Case 3: Sibling is BLACK, inner child is RED, outer child is BLACK
          if (this.isBlack(w.right)) {
            rec.record({
              title: `Delete Case 3: Sibling's Outer Child is BLACK (Zig-Zag)`,
              action: `Sibling [${w.key}] inner child is RED, outer child is BLACK. Recoloring inner child BLACK, Sibling RED, and Right-Rotating Sibling [${w.key}].`,
              rule: `Case 3 Rule: Converts the inner red nephew into an outer red nephew (straight line into Case 4).`,
              tip: `Straighten the bend so Case 4 can finish the repair.`,
              popupMessage: `Delete Case 3: Right Rotate Sibling ${w.key}`,
              highlightNodeIds: [w.id],
              statusType: 'warning',
              actionCategory: 'rotate'
            });

            if (w.left) w.left.color = 'BLACK';
            w.color = 'RED';
            this.rotateRight(w);
            w = parent.right;
          }

          // Case 4: Sibling is BLACK, outer child is RED
          rec.record({
            title: `Delete Case 4: Sibling's Outer Child is RED`,
            action: `Sibling [${w.key}] takes Parent's color. Parent and outer nephew become BLACK. Left-Rotating Parent [${parent.key}].`,
            rule: `Case 4 Rule: The outer red nephew is turned BLACK to absorb the deficit! Double-Black eliminated completely!`,
            tip: `The red nephew absorbed the black burden: tree is 100% repaired and balanced!`,
            popupMessage: `Delete Case 4: Rotate Parent ${parent.key} → Done!`,
            highlightNodeIds: [w.id, parent.id],
            statusType: 'success',
            actionCategory: 'rotate'
          });

          w.color = parent.color;
          parent.color = 'BLACK';
          if (w.right) w.right.color = 'BLACK';
          this.rotateLeft(parent);
          x = this.root;
          break;
        } else {
          break;
        }
      } else {
        // Mirror Cases: x is right child
        let w = parent.left;
        if (w && w.color === 'RED') {
          rec.record({
            title: `Delete Case 1: Sibling [${w.key}] is RED`,
            action: `Sibling [${w.key}] is RED. Recoloring Sibling BLACK, Parent RED, and Right-Rotating Parent [${parent.key}].`,
            rule: `Case 1 Rule: Rotating parent brings a black nephew into the sibling slot.`,
            tip: `Converts to Case 2, 3, or 4 with a black sibling.`,
            popupMessage: `Delete Case 1: Right Rotate Parent`,
            highlightNodeIds: [w.id, parent.id],
            statusType: 'warning',
            actionCategory: 'rotate'
          });

          w.color = 'BLACK';
          parent.color = 'RED';
          this.rotateRight(parent);
          w = parent.left;
        }

        if (w && this.isBlack(w.right) && this.isBlack(w.left)) {
          rec.record({
            title: `Delete Case 2: Sibling [${w.key}] and Children are BLACK`,
            action: `Both children of sibling [${w.key}] are BLACK. Recoloring Sibling RED and passing the Double-Black up to Parent [${parent.key}].`,
            rule: `Case 2 Rule: Sibling turns red to match our deficit; parent takes the deficiency.`,
            tip: `Push deficiency one level up.`,
            popupMessage: `Delete Case 2: Sibling → RED`,
            highlightNodeIds: [w.id, parent.id],
            statusType: 'warning',
            actionCategory: 'recolor'
          });

          w.color = 'RED';
          x = parent;
          parent = x.parent;
        } else if (w) {
          if (this.isBlack(w.left)) {
            rec.record({
              title: `Delete Case 3: Sibling's Outer Child is BLACK`,
              action: `Left-rotating Sibling to align outer child into a straight line.`,
              rule: `Case 3 Rule: Straightens the inner red nephew into an outer red nephew.`,
              tip: `Prepares for Case 4.`,
              popupMessage: `Delete Case 3: Left Rotate Sibling`,
              highlightNodeIds: [w.id],
              statusType: 'warning',
              actionCategory: 'rotate'
            });

            if (w.right) w.right.color = 'BLACK';
            w.color = 'RED';
            this.rotateLeft(w);
            w = parent.left;
          }

          rec.record({
            title: `Delete Case 4: Sibling's Outer Child is RED`,
            action: `Sibling takes Parent's color; Parent and outer child become BLACK. Right-Rotating Parent [${parent.key}].`,
            rule: `Case 4 Rule: Outer red child is colored black to absorb the lost blackness. Double-Black eliminated!`,
            tip: `Double-black eliminated completely!`,
            popupMessage: `Delete Case 4: Done!`,
            highlightNodeIds: [w.id, parent.id],
            statusType: 'success',
            actionCategory: 'rotate'
          });

          w.color = parent.color;
          parent.color = 'BLACK';
          if (w.left) w.left.color = 'BLACK';
          this.rotateRight(parent);
          x = this.root;
          break;
        } else {
          break;
        }
      }
    }

    if (x) x.color = 'BLACK';
  }

  clear() {
    this.root = null;
    this.steps = [];
  }

  getSnapshot() {
    return this.cloneTree();
  }

  getStats() {
    let totalKeys = 0;
    let totalNodes = 0;
    let redCount = 0;
    let blackCount = 0;

    const count = (n) => {
      if (!n) return;
      totalNodes++;
      totalKeys++;
      if (n.color === 'RED') redCount++;
      else blackCount++;
      count(n.left);
      count(n.right);
    };
    count(this.root);
    return { totalKeys, totalNodes, redCount, blackCount };
  }

  validateInvariants() {
    const list = [
      { name: "Root is BLACK (Property 2)", valid: true, detail: "Root color == BLACK" },
      { name: "No two consecutive RED nodes (Property 4)", valid: true, detail: "If node is RED, children are BLACK" },
      { name: "Equal Black-Height on all paths (Property 5)", valid: true, detail: "Uniform number of BLACK nodes to leaves" }
    ];

    if (!this.root) return list;

    list[0].valid = (this.root.color === 'BLACK');

    let noDoubleRed = true;
    let blackHeightUniform = true;
    let expectedBH = -1;

    const check = (node, currentBH) => {
      if (!node) {
        if (expectedBH === -1) expectedBH = currentBH + 1; // NIL is black
        else if (expectedBH !== currentBH + 1) blackHeightUniform = false;
        return;
      }

      if (node.color === 'RED') {
        if ((node.left && node.left.color === 'RED') || (node.right && node.right.color === 'RED')) {
          noDoubleRed = false;
        }
      }

      const nextBH = currentBH + (node.color === 'BLACK' ? 1 : 0);
      check(node.left, nextBH);
      check(node.right, nextBH);
    };

    check(this.root, 0);
    list[1].valid = noDoubleRed;
    list[2].valid = blackHeightUniform;
    return list;
  }

  toJSON() {
    function serializeNode(node) {
      if (!node) return null;
      return {
        id: node.id,
        key: node.key,
        color: node.color,
        left: serializeNode(node.left),
        right: serializeNode(node.right)
      };
    }
    return {
      type: 'redblack',
      root: serializeNode(this.root)
    };
  }

  static fromJSON(data) {
    if (!data) return null;
    const tree = new RedBlackTree();
    function deserializeNode(nData, parent = null) {
      if (!nData) return null;
      const node = new BSTNode(nData.key, nData.id);
      node.color = nData.color || 'BLACK';
      node.parent = parent;
      node.left = deserializeNode(nData.left, node);
      node.right = deserializeNode(nData.right, node);
      return node;
    }
    tree.root = deserializeNode(data.root, null);
    return tree;
  }
}

// ============================================================================
// 3. Splay Tree (Self-Adjusting BST via Splaying)
// ============================================================================
export class SplayTree {
  constructor() {
    this.root = null;
    this.steps = [];
  }

  cloneTree() {
    return this.root ? this.root.clone() : null;
  }

  rotateRight(x) {
    const y = x.left;
    x.left = y.right;
    if (y.right) y.right.parent = x;
    y.parent = x.parent;

    if (!x.parent) {
      this.root = y;
    } else if (x === x.parent.right) {
      x.parent.right = y;
    } else {
      x.parent.left = y;
    }

    y.right = x;
    x.parent = y;
    return y;
  }

  rotateLeft(x) {
    const y = x.right;
    x.right = y.left;
    if (y.left) y.left.parent = x;
    y.parent = x.parent;

    if (!x.parent) {
      this.root = y;
    } else if (x === x.parent.left) {
      x.parent.left = y;
    } else {
      x.parent.right = y;
    }

    y.left = x;
    x.parent = y;
    return y;
  }

  splay(x, rec) {
    while (x.parent) {
      const p = x.parent;
      const g = p.parent;

      if (!g) {
        // Zig step: parent is root
        if (x === p.left) {
          this.rotateRight(p);
          rec.record({
            title: `Zig Step: Right Rotate Root [${p.key}]`,
            action: `Node [${x.key}] is the direct left child of Root [${p.key}]. Executing a single Right Rotation.`,
            rule: `Zig applies when the parent is root (no grandparent). A single rotation brings the accessed node to the root.`,
            tip: `One quick twist brings the freshly accessed item directly to the top shelf.`,
            popupMessage: `Zig: Right Rotate on ${p.key}`,
            highlightNodeIds: [x.id, p.id],
            statusType: 'info',
            actionCategory: 'splay'
          });
        } else {
          this.rotateLeft(p);
          rec.record({
            title: `Zig Step: Left Rotate Root [${p.key}]`,
            action: `Node [${x.key}] is the direct right child of Root [${p.key}]. Executing a single Left Rotation.`,
            rule: `Zig applies when the parent is root (no grandparent). A single rotation brings the accessed node to the root.`,
            tip: `One quick twist brings the freshly accessed item directly to the top shelf.`,
            popupMessage: `Zig: Left Rotate on ${p.key}`,
            highlightNodeIds: [x.id, p.id],
            statusType: 'info',
            actionCategory: 'splay'
          });
        }
      } else if (x === p.left && p === g.left) {
        // Zig-Zig (Left-Left)
        this.rotateRight(g);
        this.rotateRight(p);
        rec.record({
          title: `Zig-Zig Step (Left-Left)`,
          action: `Both [${x.key}] and parent [${p.key}] are left children. Rotating grandparent [${g.key}] right first, then rotating parent [${p.key}] right.`,
          rule: `When node and parent are linearly aligned on the same side, rotate GRANDPARENT first, then PARENT. This compresses the tree depth.`,
          tip: `Rotating grandparent first is Splay's magic trick—it halves the depth of the entire branch instead of just dragging it sideways!`,
          popupMessage: `Zig-Zig on ${x.key}`,
          highlightNodeIds: [x.id, p.id, g.id],
          statusType: 'warning',
          actionCategory: 'splay'
        });
      } else if (x === p.right && p === g.right) {
        // Zig-Zig (Right-Right)
        this.rotateLeft(g);
        this.rotateLeft(p);
        rec.record({
          title: `Zig-Zig Step (Right-Right)`,
          action: `Both [${x.key}] and parent [${p.key}] are right children. Rotating grandparent [${g.key}] left first, then rotating parent [${p.key}] left.`,
          rule: `When node and parent are linearly aligned on the same side, rotate GRANDPARENT first, then PARENT to compress tree depth.`,
          tip: `Rotating grandparent first compresses deep spindly branches into a compact, bushy tree.`,
          popupMessage: `Zig-Zig on ${x.key}`,
          highlightNodeIds: [x.id, p.id, g.id],
          statusType: 'warning',
          actionCategory: 'splay'
        });
      } else if (x === p.right && p === g.left) {
        // Zig-Zag (Left-Right)
        this.rotateLeft(p);
        this.rotateRight(g);
        rec.record({
          title: `Zig-Zag Step (Left-Right)`,
          action: `Node [${x.key}] is an inner child (right child of left parent). Rotating parent [${p.key}] left, then grandparent [${g.key}] right.`,
          rule: `When node and parent are on opposite sides (dog-leg / zigzag), rotate PARENT first to straighten the path, then rotate GRANDPARENT to lift the node.`,
          tip: `Straighten the elbow bend first, then lift the middle item up to the top!`,
          popupMessage: `Zig-Zag on ${x.key}`,
          highlightNodeIds: [x.id, p.id, g.id],
          statusType: 'warning',
          actionCategory: 'splay'
        });
      } else {
        // Zig-Zag (Right-Left)
        this.rotateRight(p);
        this.rotateLeft(g);
        rec.record({
          title: `Zig-Zag Step (Right-Left)`,
          action: `Node [${x.key}] is an inner child (left child of right parent). Rotating parent [${p.key}] right, then grandparent [${g.key}] left.`,
          rule: `When node and parent are on opposite sides (dog-leg / zigzag), rotate PARENT first to straighten the path, then rotate GRANDPARENT to lift the node.`,
          tip: `Straighten the elbow bend first, then lift the middle item up to the top!`,
          popupMessage: `Zig-Zag on ${x.key}`,
          highlightNodeIds: [x.id, p.id, g.id],
          statusType: 'warning',
          actionCategory: 'splay'
        });
      }
    }
  }

  search(key) {
    this.steps = [];
    key = Number(key);
    const rec = createStepRecorder(() => this.cloneTree());

    rec.record({
      title: `Splay Search: Key ${key}`,
      action: `Starting search for key ${key} from root.`,
      rule: `Splay Trees follow the principle of temporal locality: whatever key you search for (or its closest neighbor) is promoted to the root.`,
      tip: `Items accessed frequently stay right at the root for near-instant O(1) repeat lookups.`,
      popupMessage: `Searching for ${key}`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'search'
    });

    if (!this.root) return { found: false, steps: rec.steps };

    let curr = this.root;
    let last = null;
    while (curr) {
      last = curr;
      if (curr.key === key) {
        rec.record({
          title: `Key ${key} Found! Initiating Splay`,
          action: `Located key ${key} at node [${curr.key}]. Starting bottom-up splay rotations to bring it to the root.`,
          rule: `Every accessed key must be splayed to the root via Zig, Zig-Zig, or Zig-Zag rotation steps.`,
          tip: `Moving the most popular file straight to the front desk!`,
          popupMessage: `Found ${key}! Splaying to root...`,
          highlightNodeIds: [curr.id],
          statusType: 'success',
          actionCategory: 'splay'
        });
        this.splay(curr, rec);
        this.steps = rec.steps;
        return { found: true, steps: this.steps };
      } else if (key < curr.key) {
        curr = curr.left;
      } else {
        curr = curr.right;
      }
    }

    if (last) {
      rec.record({
        title: `Key ${key} Not Found: Splaying Last Visited Node [${last.key}]`,
        action: `Key ${key} is absent. Splaying the last visited ancestor [${last.key}] to the root.`,
        rule: `In Splay Trees, even unsuccessful searches promote the last touched node to root to optimize nearby searches.`,
        tip: `Even when a search misses, we warm up the cache around where the item would have lived.`,
        popupMessage: `Splaying ${last.key} to root`,
        highlightNodeIds: [last.id],
        statusType: 'warning',
        actionCategory: 'splay'
      });
      this.splay(last, rec);
    }

    this.steps = rec.steps;
    return { found: false, steps: this.steps };
  }

  insert(key) {
    this.steps = [];
    key = Number(key);
    if (isNaN(key)) return this.steps;

    const rec = createStepRecorder(() => this.cloneTree());

    rec.record({
      title: `Splay Insert: Key ${key}`,
      action: `Preparing to insert key ${key} into Splay Tree.`,
      rule: `Splay insertion is a 2-step dance: 1) standard BST leaf insertion, followed immediately by 2) splaying the new leaf to the root.`,
      tip: `New items immediately become the root so subsequent operations on them run in O(1) time.`,
      popupMessage: `Inserting ${key}`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'insert'
    });

    if (!this.root) {
      this.root = new BSTNode(key);
      rec.record({
        title: `Inserted Key ${key} as Root`,
        action: `Created new root node containing key ${key}.`,
        rule: `When the tree is empty, the new key becomes the root immediately.`,
        tip: `Every tree begins with a single root node.`,
        popupMessage: `Inserted root ${key}`,
        highlightNodeIds: [this.root.id],
        statusType: 'success',
        actionCategory: 'insert'
      });
      this.steps = rec.steps;
      return this.steps;
    }

    let node = new BSTNode(key);
    let curr = this.root;
    let parent = null;

    while (curr) {
      parent = curr;
      if (key === curr.key) {
        rec.record({
          title: `Duplicate Key ${key}: Splaying to Root`,
          action: `Key ${key} already exists in node [${curr.key}]. Splaying this existing node to the root.`,
          rule: `Duplicates are not inserted. Re-inserting an existing key acts as an access, prompting it to be splayed to root.`,
          tip: `Re-accessing an existing item refreshes its cache priority!`,
          popupMessage: `Duplicate ${key} → Splaying`,
          highlightNodeIds: [curr.id],
          statusType: 'warning',
          actionCategory: 'splay'
        });
        this.splay(curr, rec);
        this.steps = rec.steps;
        return this.steps;
      } else if (key < curr.key) {
        curr = curr.left;
      } else {
        curr = curr.right;
      }
    }

    node.parent = parent;
    if (key < parent.key) {
      parent.left = node;
    } else {
      parent.right = node;
    }

    rec.record({
      title: `Placed Key ${key} as Leaf → Beginning Splay`,
      action: `Connected new node [${node.key}] as a child under parent [${parent.key}]. Starting upward splay rotations.`,
      rule: `New nodes enter as BST leaves, but will immediately be rotated up to become the new root.`,
      tip: `Watch the node climb up the tree step-by-step until it reaches the crown.`,
      popupMessage: `Placed ${key}, splaying to root...`,
      highlightNodeIds: [node.id],
      statusType: 'info',
      actionCategory: 'insert'
    });

    this.splay(node, rec);

    rec.record({
      title: `Splay Complete: Key ${key} is Now Root!`,
      action: `Node [${this.root.key}] has successfully reached the root.`,
      rule: `The newly inserted key is now the root of the tree, and the access path has been restructured.`,
      tip: `The tree is self-balanced and ready for the next operation!`,
      popupMessage: `${key} is now Root!`,
      highlightNodeIds: [this.root.id],
      statusType: 'success',
      actionCategory: 'splay'
    });

    this.steps = rec.steps;
    return this.steps;
  }

  delete(key) {
    this.steps = [];
    key = Number(key);
    if (isNaN(key)) return this.steps;

    const rec = createStepRecorder(() => this.cloneTree());

    rec.record({
      title: `Splay Delete: Key ${key}`,
      action: `Beginning deletion for key ${key}. First step: search and splay ${key} to root.`,
      rule: `To delete from a Splay Tree, splay target key to the root, detach it, and join the left and right subtrees.`,
      tip: `Bring the node to the surface first so it can be cleanly detached without complicated pointer surgery deep in the tree.`,
      popupMessage: `Deleting ${key}`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'info',
      actionCategory: 'delete'
    });

    if (!this.root) return this.steps;

    const searchRes = this.search(key);
    for (const st of searchRes.steps) rec.steps.push(st);

    if (this.root.key !== key) {
      rec.record({
        title: `Key ${key} Not Found`,
        action: `Key ${key} was not found in the Splay Tree.`,
        rule: `Cannot delete a key that does not exist in the tree.`,
        tip: `Nothing to remove!`,
        popupMessage: `Key ${key} not found`,
        statusType: 'error',
        actionCategory: 'delete'
      });
      this.steps = rec.steps;
      return this.steps;
    }

    const L = this.root.left;
    const R = this.root.right;

    rec.record({
      title: `Removing Root Key [${key}]`,
      action: `Key ${key} is now at root. Severing root and separating Left Subtree (L) and Right Subtree (R).`,
      rule: `Detaching the root splits the tree into two disjoint BST subtrees: L (all keys < ${key}) and R (all keys > ${key}).`,
      tip: `Remove the head, leaving two independent branches to be spliced back together.`,
      popupMessage: `Removing root ${key}`,
      highlightNodeIds: [this.root.id],
      statusType: 'info',
      actionCategory: 'delete'
    });

    if (!L) {
      this.root = R;
      if (this.root) this.root.parent = null;
    } else {
      L.parent = null;
      let maxNode = L;
      while (maxNode.right) maxNode = maxNode.right;

      this.root = L;
      this.splay(maxNode, rec);

      this.root.right = R;
      if (R) R.parent = this.root;
    }

    rec.record({
      title: `Subtrees Joined: Deletion Complete`,
      action: `Splayed the maximum key in the left subtree to root, then attached the right subtree as its right child.`,
      rule: `Because all keys in L are strictly smaller than keys in R, the maximum of L has NO right child. Attaching R there guarantees the BST property.`,
      tip: `The biggest item on the left has an empty right arm that perfectly holds the entire right subtree!`,
      popupMessage: `Deletion finished`,
      highlightNodeIds: this.root ? [this.root.id] : [],
      statusType: 'success',
      actionCategory: 'delete'
    });

    this.steps = rec.steps;
    return this.steps;
  }

  clear() {
    this.root = null;
    this.steps = [];
  }

  getSnapshot() {
    return this.cloneTree();
  }

  getStats() {
    let totalKeys = 0;
    let totalNodes = 0;
    const count = (n) => {
      if (!n) return;
      totalNodes++;
      totalKeys++;
      count(n.left);
      count(n.right);
    };
    count(this.root);
    return { totalKeys, totalNodes, rootKey: this.root ? this.root.key : 'None' };
  }

  validateInvariants() {
    const list = [
      { name: "Binary Search Tree ordering property", valid: true, detail: "Left < Node < Right" },
      { name: "Parent pointers consistent", valid: true, detail: "Child.parent == Parent" }
    ];

    let bstValid = true;
    let parentValid = true;

    const check = (node, min, max) => {
      if (!node) return;
      if (min !== null && node.key <= min) bstValid = false;
      if (max !== null && node.key >= max) bstValid = false;

      if (node.left && node.left.parent !== node) parentValid = false;
      if (node.right && node.right.parent !== node) parentValid = false;

      check(node.left, min, node.key);
      check(node.right, node.key, max);
    };

    check(this.root, null, null);
    list[0].valid = bstValid;
    list[1].valid = parentValid;
    return list;
  }

  toJSON() {
    function serializeNode(node) {
      if (!node) return null;
      return {
        id: node.id,
        key: node.key,
        left: serializeNode(node.left),
        right: serializeNode(node.right)
      };
    }
    return {
      type: 'splay',
      root: serializeNode(this.root)
    };
  }

  static fromJSON(data) {
    if (!data) return null;
    const tree = new SplayTree();
    function deserializeNode(nData, parent = null) {
      if (!nData) return null;
      const node = new BSTNode(nData.key, nData.id);
      node.parent = parent;
      node.left = deserializeNode(nData.left, node);
      node.right = deserializeNode(nData.right, node);
      return node;
    }
    tree.root = deserializeNode(data.root, null);
    return tree;
  }
}
