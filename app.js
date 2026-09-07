import { BTree, resetNodeIdCounter } from './btree.js';
import { BPlusTree, resetBPlusNodeIdCounter } from './bplus_tree.js';
import { MWayTree, resetMWayNodeIdCounter } from './mway_tree.js';
import { AVLTree, RedBlackTree, SplayTree, resetBSTNodeIdCounter } from './bst_trees.js';
import { Trie, resetTrieNodeIdCounter } from './trie.js';
import { BTreeRenderer } from './renderer.js';
import { AnimationController } from './controller.js';

// ==========================================================================
// Application State & Multi-Data Structure Registry
// ==========================================================================
let currentStructure = 'btree'; // 'btree' | 'bplus' | 'avl' | 'redblack' | 'splay' | 'mway' | 'trie'

const trees = {
  btree: new BTree(4),
  bplus: new BPlusTree(4),
  avl: new AVLTree(),
  redblack: new RedBlackTree(),
  splay: new SplayTree(),
  mway: new MWayTree(4),
  trie: new Trie()
};

const undoStacks = {
  btree: [], bplus: [], avl: [], redblack: [], splay: [], mway: [], trie: []
};
const redoStacks = {
  btree: [], bplus: [], avl: [], redblack: [], splay: [], mway: [], trie: []
};

let renderer = null;
let controller = null;

// DOM Elements: Navigation & Header
const dsNavButtons = document.querySelectorAll('.ds-tab-btn');
const btnToggleSidebar = document.getElementById('btnToggleSidebar');
const sidebar = document.querySelector('.sidebar');
const appLogoBadge = document.getElementById('appLogoBadge');
const appBrandTitle = document.getElementById('appBrandTitle');
const appBrandSub = document.getElementById('appBrandSub');

const orderConfigGroup = document.getElementById('orderConfigGroup');
const orderSelect = document.getElementById('orderSelect');
const strategyConfigGroup = document.getElementById('strategyConfigGroup');
const strategySelect = document.getElementById('strategySelect');
const btnStratCLRS = document.getElementById('btnStratCLRS');
const btnStratReactive = document.getElementById('btnStratReactive');
const presetSelect = document.getElementById('presetSelect');

// Stats Ribbon Elements
const statKeys = document.getElementById('statKeys');
const statNodes = document.getElementById('statNodes');
const statHeight = document.getElementById('statHeight');
const statExtra1 = document.getElementById('statExtra1');
const statExtra2 = document.getElementById('statExtra2');
const statLabelKeys = document.getElementById('statLabelKeys');
const statLabelHeight = document.getElementById('statLabelHeight');
const statLabelExtra1 = document.getElementById('statLabelExtra1');
const statLabelExtra2 = document.getElementById('statLabelExtra2');

// Canvas Viewport & Layers
const canvasViewport = document.getElementById('canvasViewport');
const canvasSvg = document.getElementById('canvasSvg');
const nodesLayer = document.getElementById('nodesLayer');

// Manual Edit Mode Elements
const btnToggleEditMode = document.getElementById('btnToggleEditMode');
const editModeBtnText = document.getElementById('editModeBtnText');
const editModeBanner = document.getElementById('editModeBanner');
const trashDropZone = document.getElementById('trashDropZone');
const btnAddKeyPrompt = document.getElementById('btnAddKeyPrompt');
const btnDoneEditing = document.getElementById('btnDoneEditing');
let isEditMode = false;

// Mode Tabs (Single / Batch)
const tabSingleBtn = document.getElementById('tabSingleBtn');
const tabBatchBtn = document.getElementById('tabBatchBtn');
const singlePanel = document.getElementById('singlePanel');
const batchPanel = document.getElementById('batchPanel');

// Operations Inputs & Buttons
const singleInput = document.getElementById('singleInput');
const btnInsertSingle = document.getElementById('btnInsertSingle');
const btnDeleteSingle = document.getElementById('btnDeleteSingle');
const btnSearchSingle = document.getElementById('btnSearchSingle');

const batchInput = document.getElementById('batchInput');
const btnInsertBatch = document.getElementById('btnInsertBatch');
const btnDeleteBatch = document.getElementById('btnDeleteBatch');
const btnSampleArray = document.getElementById('btnSampleArray');
const btnClearBatchInput = document.getElementById('btnClearBatchInput');

// History & Persistence Actions
const btnUndo = document.getElementById('btnUndo');
const btnRedo = document.getElementById('btnRedo');
const btnSaveTree = document.getElementById('btnSaveTree');
const btnRandomKey = document.getElementById('btnRandomKey');
const btnClearTree = document.getElementById('btnClearTree');

// Zoom & Pan Buttons
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnFitScreen = document.getElementById('btnFitScreen');
const btnResetZoom = document.getElementById('btnResetZoom');

// Playback Controls
const btnJumpStart = document.getElementById('btnJumpStart');
const btnPrevStep = document.getElementById('btnPrevStep');
const btnPlayPause = document.getElementById('btnPlayPause');
const btnNextStep = document.getElementById('btnNextStep');
const btnJumpEnd = document.getElementById('btnJumpEnd');
const playIcon = document.getElementById('playIcon');
const playText = document.getElementById('playText');
const timelineScrubber = document.getElementById('timelineScrubber');
const stepCounter = document.getElementById('stepCounter');
const speedButtons = document.querySelectorAll('.speed-btn');

// Sidebar Elements
const sidebarTabButtons = document.querySelectorAll('.sidebar-tab-btn');
const sidebarPanes = document.querySelectorAll('.sidebar-pane');
const stepBadge = document.getElementById('stepBadge');
const stepIndexBadge = document.getElementById('stepIndexBadge');
const stepTitle = document.getElementById('stepTitle');
const stepReasonBox = document.getElementById('stepReasonBox');
const stepReasonText = document.getElementById('stepReasonText');
const historyList = document.getElementById('historyList');
const invariantList = document.getElementById('invariantList');
const paneRules = document.getElementById('paneRules');
const toastContainer = document.getElementById('toastContainer');

// ==========================================================================
// Data Structure Metadata & Definitions
// ==========================================================================
const STRUCTURE_DEFS = {
  btree: {
    name: 'B-Tree',
    logo: 'B',
    title: 'B-Tree Visualizer',
    sub: 'Order (M) Algorithm & On-Screen Step Explorer',
    showOrder: true,
    showStrategy: true,
    allowManualEdit: true,
    isTextual: false,
    singlePlaceholder: 'e.g. 42',
    batchPlaceholder: 'e.g. 10, 20, 5, 6, 12, 30, 7, 17',
    presets: [
      { id: 'cormen_demo', label: 'Cormen Deletion Demo (Delete 60)' },
      { id: 'clrs', label: 'Textbook Sequence (18 keys)' },
      { id: 'sequential', label: 'Ascending Sequence (1 to 15)' },
      { id: 'reverse', label: 'Descending Sequence (15 to 1)' },
      { id: 'random12', label: 'Random 12 Numbers' },
      { id: 'splits', label: 'Splits & Merges Demo' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>Order (M) Capacity Formulas</h4>
        <p>For a B-Tree of order <strong>M</strong>:</p>
        <ul>
          <li><strong>Max children:</strong> <code>M</code></li>
          <li><strong>Min children:</strong> <code>⌈M / 2⌉</code> (non-root internal)</li>
          <li><strong>Max keys:</strong> <code>M - 1</code></li>
          <li><strong>Min keys:</strong> <code>⌈M / 2⌉ - 1</code> (non-root)</li>
          <li><strong>Root keys:</strong> <code>[1 .. M - 1]</code> (if non-empty)</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>Insertion Rules (Splitting at Overflow)</h4>
        <ol>
          <li>Search down to leaf node and insert key in sorted order.</li>
          <li>If node contains <code>M</code> keys (overflow), split around median index <code>⌊M / 2⌋</code>.</li>
          <li>The median key moves <strong>↑ upwards</strong> to parent node.</li>
          <li>If parent overflows, recursively split upward. If root splits, tree height increases by 1.</li>
        </ol>
      </div>
      <div class="rule-block">
        <h4>Cormen (CLRS) Top-Down vs Reactive Deletion</h4>
        <ul>
          <li><strong>Cormen Top-Down (CLRS Ch. 18):</strong> Single-pass descent. Proactively repairs child nodes having <code>≤ minKeys</code> via borrow or merge <em>before</em> descending. Guarantees leaf deletion never needs backtracking.</li>
          <li><strong>Standard Reactive (Knuth):</strong> Deletes from leaf directly, only borrowing or merging if underflow (<code>&lt; minKeys</code>) occurs.</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>CLRS Deletion Cases</h4>
        <ul>
          <li><strong>Case 1:</strong> Key in leaf → remove directly.</li>
          <li><strong>Case 2a/2b:</strong> Key in internal node → swap with predecessor (if left child has &gt; minKeys) or successor (if right child has &gt; minKeys).</li>
          <li><strong>Case 2c:</strong> Both children have minKeys → merge children with key.</li>
          <li><strong>Case 3:</strong> Child has minKeys → borrow from sibling (3a) or merge siblings (3b) before descending.</li>
        </ul>
      </div>
    `
  },
  bplus: {
    name: 'B+ Tree',
    logo: 'B+',
    title: 'B+ Tree Visualizer',
    sub: 'Sequential Leaf Chaining & Internal Index Routing',
    showOrder: true,
    showStrategy: false,
    allowManualEdit: false,
    isTextual: false,
    singlePlaceholder: 'e.g. 42',
    batchPlaceholder: 'e.g. 10, 20, 30, 40, 50, 60, 70, 25',
    presets: [
      { id: 'bp_demo', label: 'Sequential Leaves Demo (8 keys)' },
      { id: 'bp_range', label: 'Range Dataset (10 keys)' },
      { id: 'bp_splits', label: 'Splits & Leaf Links (12 keys)' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>B+ Tree Structural Principles</h4>
        <ul>
          <li><strong>Internal Nodes:</strong> Hold only index/routing keys. They direct searches to appropriate subtrees.</li>
          <li><strong>Leaf Nodes:</strong> Contain 100% of all data records.</li>
          <li><strong>Sequential Leaf Chain:</strong> Every leaf node maintains a <code>.next</code> pointer to its right sibling for <code>O(K)</code> sequential range scanning.</li>
          <li><strong>Uniform Height:</strong> All leaf nodes reside at the exact same depth.</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>B+ Tree Insertion Rules</h4>
        <ol>
          <li>Always insert key into the target leaf node in sorted order.</li>
          <li>If leaf contains <code>M</code> keys (overflow), split into left and right leaves.</li>
          <li><strong>Copy Up:</strong> The first key of the right leaf is <em>copied</em> (not removed) to the parent as the routing index.</li>
          <li>Update leaf linked list: <code>left.next = right</code>.</li>
          <li>If internal node overflows, split around median (moves up, not copied).</li>
        </ol>
      </div>
      <div class="rule-block">
        <h4>B+ Tree Deletion Rules</h4>
        <ol>
          <li>Find and remove key directly from the leaf node.</li>
          <li>If key was the first key in the leaf, update the corresponding router in ancestor nodes.</li>
          <li>If leaf underflows (&lt; minKeys): borrow from left sibling, or borrow from right sibling, or merge leaves.</li>
          <li>When merging leaves, remove routing index from parent and reconnect <code>.next</code> pointer.</li>
        </ol>
      </div>
    `
  },
  avl: {
    name: 'AVL Tree',
    logo: 'AVL',
    title: 'AVL Tree Visualizer',
    sub: 'Self-Balancing BST with LL, RR, LR, RL Rotations',
    showOrder: false,
    showStrategy: false,
    allowManualEdit: false,
    isTextual: false,
    singlePlaceholder: 'e.g. 42',
    batchPlaceholder: 'e.g. 10, 20, 30, 40, 50, 25',
    presets: [
      { id: 'avl_rotations', label: 'Rotation Showcase (LL, RR, LR, RL)' },
      { id: 'avl_ascending', label: 'Ascending 1 to 10 (Left Rotations)' },
      { id: 'avl_descending', label: 'Descending 10 to 1 (Right Rotations)' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>AVL Balance Factor Invariant</h4>
        <p>For every node in an AVL Tree:</p>
        <p><code>Balance Factor (BF) = Height(Left) - Height(Right)</code></p>
        <p>Strict invariant: <strong>BF ∈ {-1, 0, +1}</strong>. If <code>|BF| &gt; 1</code>, the tree is imbalanced and must be rotated.</p>
      </div>
      <div class="rule-block">
        <h4>The 4 AVL Rotation Cases</h4>
        <ul>
          <li><strong>LL Case (BF &gt; 1, child BF ≥ 0):</strong> Single Right Rotation on imbalanced node.</li>
          <li><strong>RR Case (BF &lt; -1, child BF ≤ 0):</strong> Single Left Rotation on imbalanced node.</li>
          <li><strong>LR Case (BF &gt; 1, child BF &lt; 0):</strong> Double Rotation. Left Rotate left child, then Right Rotate node.</li>
          <li><strong>RL Case (BF &lt; -1, child BF &gt; 0):</strong> Double Rotation. Right Rotate right child, then Left Rotate node.</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>AVL Insertion & Deletion Workflow</h4>
        <ol>
          <li>Perform standard BST insert or delete.</li>
          <li>Unwind the recursion stack upward to the root.</li>
          <li>At each ancestor: recompute <code>Height = 1 + max(hL, hR)</code> and <code>BF = hL - hR</code>.</li>
          <li>If <code>|BF| &gt; 1</code>, apply the matching rotation case immediately.</li>
        </ol>
      </div>
    `
  },
  redblack: {
    name: 'Red-Black Tree',
    logo: 'RB',
    title: 'Red-Black Tree Visualizer',
    sub: 'Self-Balancing BST with 5 Red-Black Color Invariants',
    showOrder: false,
    showStrategy: false,
    allowManualEdit: false,
    isTextual: false,
    singlePlaceholder: 'e.g. 42',
    batchPlaceholder: 'e.g. 10, 20, 30, 15, 25, 5, 1',
    presets: [
      { id: 'rb_recolor', label: 'Uncle Recolor Demo (7 keys)' },
      { id: 'rb_zigzag', label: 'Triangle Case Demo (Zig-Zag)' },
      { id: 'rb_seq', label: 'Ascending Sequence (1 to 10)' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>The 5 Fundamental Red-Black Properties</h4>
        <ol>
          <li><strong>Node Color:</strong> Every node is colored either <strong>RED</strong> or <strong>BLACK</strong>.</li>
          <li><strong>Root Property:</strong> The root is always <strong>BLACK</strong>.</li>
          <li><strong>Leaf Property:</strong> Every leaf (NIL) is <strong>BLACK</strong>.</li>
          <li><strong>Red Property:</strong> If a node is <strong>RED</strong>, both its children must be <strong>BLACK</strong> (no two consecutive RED nodes).</li>
          <li><strong>Black-Height Property:</strong> For each node, all simple paths to descendant leaves contain the exact same number of <strong>BLACK</strong> nodes.</li>
        </ol>
      </div>
      <div class="rule-block">
        <h4>Red-Black Insertion Rules</h4>
        <ol>
          <li><strong>Insert as RED:</strong> Always insert new node as a RED leaf to preserve Black-Height (Property 5).</li>
          <li><strong>Parent is BLACK:</strong> No violation. Done!</li>
          <li><strong>Parent is RED (Double-Red Violation):</strong> Inspect Uncle (parent's sibling):
            <ul>
              <li><strong>Case 1 (Uncle is RED):</strong> Recolor Parent to BLACK, Uncle to BLACK, and Grandparent to RED. Move check up to Grandparent.</li>
              <li><strong>Case 2 (Uncle is BLACK, Triangle / Zig-Zag):</strong> Rotate Parent toward child to align nodes into a straight line (converts to Case 3).</li>
              <li><strong>Case 3 (Uncle is BLACK, Line / Zig-Zig):</strong> Recolor Parent to BLACK, Grandparent to RED, then rotate Grandparent toward Uncle.</li>
            </ul>
          </li>
          <li><strong>Final Step:</strong> Set Root color to BLACK (Property 2).</li>
        </ol>
      </div>
      <div class="rule-block">
        <h4>Red-Black Deletion Rules</h4>
        <ol>
          <li>Perform standard BST delete (0, 1, or 2 children with successor swap).</li>
          <li>If removed node was <strong>RED</strong>: Done! No properties violated.</li>
          <li>If removed node was <strong>BLACK</strong>: A Double-Black deficiency is introduced. Inspect Sibling (W):
            <ul>
              <li><strong>Case 1 (Sibling is RED):</strong> Recolor Sibling BLACK, Parent RED, rotate Parent toward Double-Black.</li>
              <li><strong>Case 2 (Sibling and both its children are BLACK):</strong> Recolor Sibling RED, push Double-Black up to Parent.</li>
              <li><strong>Case 3 (Sibling is BLACK, inner child RED, outer child BLACK):</strong> Recolor inner child BLACK, Sibling RED, rotate Sibling away from Double-Black.</li>
              <li><strong>Case 4 (Sibling is BLACK, outer child RED):</strong> Sibling takes Parent's color, Parent becomes BLACK, outer child becomes BLACK, rotate Parent toward Double-Black. Double-Black eliminated!</li>
            </ul>
          </li>
        </ol>
      </div>
    `
  },
  splay: {
    name: 'Splay Tree',
    logo: 'SP',
    title: 'Splay Tree Visualizer',
    sub: 'Self-Adjusting BST via Zig, Zig-Zig, and Zig-Zag Rotations',
    showOrder: false,
    showStrategy: false,
    allowManualEdit: false,
    isTextual: false,
    singlePlaceholder: 'e.g. 42',
    batchPlaceholder: 'e.g. 50, 30, 70, 20, 40',
    presets: [
      { id: 'splay_access', label: 'Deep Access & Promotion Demo' },
      { id: 'splay_seq', label: 'Sequential Insert & Splay' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>Splay Tree Self-Adjusting Principles</h4>
        <ul>
          <li>Does not store height or color tags.</li>
          <li>Every accessed, inserted, or searched key is moved to the root via splay rotations.</li>
          <li>Provides amortized <code>O(log n)</code> time per operation.</li>
          <li>Frequently accessed items remain near the root for <code>O(1)</code> rapid subsequent access.</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>The 3 Splay Rotation Steps</h4>
        <ul>
          <li><strong>Zig (Single Rotation):</strong> When parent is the root. Single Left or Right Rotation brings node to root.</li>
          <li><strong>Zig-Zig (Both Same Side):</strong> Node and parent are both left (or both right) children. Rotate Grandparent first, then rotate Parent.</li>
          <li><strong>Zig-Zag (Opposite Sides):</strong> Node is an inner child (e.g. right child of left parent). Rotate Parent first, then rotate Grandparent.</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>Deletion in Splay Trees</h4>
        <ol>
          <li>Search for key and splay it to the root.</li>
          <li>If key matches root, remove it, splitting the tree into Left Subtree (L) and Right Subtree (R).</li>
          <li>Splay the maximum key in L to its root (this root will have no right child).</li>
          <li>Attach R as the right child of L.</li>
        </ol>
      </div>
    `
  },
  mway: {
    name: 'M-Way Tree',
    logo: 'MW',
    title: 'Multi-Way (M-Way) Search Tree',
    sub: 'Order (M) Multi-Branching Search Tree',
    showOrder: true,
    showStrategy: false,
    allowManualEdit: false,
    isTextual: false,
    singlePlaceholder: 'e.g. 42',
    batchPlaceholder: 'e.g. 20, 40, 60, 10, 30, 50, 70',
    presets: [
      { id: 'mway_branch', label: 'M-Way Branching Demo (7 keys)' },
      { id: 'mway_multi', label: 'Multi-Key Node Demo (9 keys)' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>Multi-Way (M-Way) Search Tree Definition</h4>
        <ul>
          <li>Each node holds at most <code>M - 1</code> keys and at most <code>M</code> children.</li>
          <li>Keys in each node are strictly ordered: <code>k0 &lt; k1 &lt; ... &lt; kp-1</code>.</li>
          <li>Subtree <code>Ti</code> contains keys strictly bounded by <code>ki-1 &lt; key &lt; ki</code>.</li>
          <li>Unlike B-Trees, non-root nodes do not enforce a minimum <code>⌈M/2⌉</code> fill threshold.</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>Insertion & Deletion Rules</h4>
        <ul>
          <li><strong>Insertion:</strong> Search down to node. If node has space (&lt; M - 1 keys), insert key in sorted order. If full, navigate to appropriate child branch; if child does not exist, sprout a new child node.</li>
          <li><strong>Deletion:</strong> If key in leaf, delete directly. If in internal node, swap with in-order predecessor or successor, then recursively delete from leaf.</li>
        </ul>
      </div>
    `
  },
  trie: {
    name: 'Trie',
    logo: 'TR',
    title: 'Trie (Prefix Tree) Visualizer',
    sub: 'Character Path Traversal & Word End Markers',
    showOrder: false,
    showStrategy: false,
    allowManualEdit: false,
    isTextual: true,
    singlePlaceholder: 'e.g. apple',
    batchPlaceholder: 'e.g. tea, ted, ten, to, in, inn',
    presets: [
      { id: 'trie_words', label: 'Common Prefixes: tea, ted, ten, to, in, inn' },
      { id: 'trie_fruits', label: 'Word Family: apple, app, application, bat, ball' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>Trie (Prefix Tree) Fundamentals</h4>
        <ul>
          <li><strong>Root Node:</strong> Represents the empty string <code>""</code>.</li>
          <li><strong>Edges:</strong> Each outgoing branch represents a single character.</li>
          <li><strong>Shared Prefixes:</strong> Words sharing identical prefixes share the exact same sequence of ancestor nodes.</li>
          <li><strong>isEndOfWord:</strong> A boolean flag designating that a complete word terminates at this node.</li>
          <li><strong>Complexity:</strong> Search, Insert, and Delete take <code>O(L)</code> time, where <code>L</code> is word length, independent of total dictionary size.</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>Insertion & Deletion Rules</h4>
        <ul>
          <li><strong>Insert:</strong> Traverse character by character. If edge exists, follow it; if missing, create new character node. Mark last node with <code>isEndOfWord = true</code>.</li>
          <li><strong>Delete:</strong> Unmark <code>isEndOfWord</code>. If node has no other children, prune it bottom-up until reaching an ancestor that has other children or represents another word.</li>
        </ul>
      </div>
    `
  }
};

function getActiveTree() {
  return trees[currentStructure];
}

// ==========================================================================
// Data Structure Switching
// ==========================================================================
function switchDataStructure(dsKey, notify = true) {
  if (!STRUCTURE_DEFS[dsKey]) return;
  currentStructure = dsKey;

  // Save selected structure preference
  try {
    localStorage.setItem('dsa_active_structure', dsKey);
  } catch (_) {}

  // Update Navigation Tabs
  dsNavButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.ds === dsKey);
  });

  const def = STRUCTURE_DEFS[dsKey];

  // Update Branding
  appLogoBadge.textContent = def.logo;
  appBrandTitle.textContent = def.title;
  appBrandSub.textContent = def.sub;

  // Update Context Toolbar Visibility
  orderConfigGroup.style.display = def.showOrder ? 'flex' : 'none';
  strategyConfigGroup.style.display = def.showStrategy ? 'flex' : 'none';
  if (btnToggleEditMode) {
    btnToggleEditMode.style.display = def.allowManualEdit ? 'inline-flex' : 'none';
    if (!def.allowManualEdit && isEditMode) {
      toggleEditMode(false);
    }
  }

  // Update Input Fields & Placeholders
  singleInput.type = def.isTextual ? 'text' : 'number';
  singleInput.placeholder = def.singlePlaceholder;
  batchInput.placeholder = def.batchPlaceholder;

  // Update Preset Dropdown
  presetSelect.innerHTML = '<option value="" disabled selected>Load Example...</option>';
  def.presets.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.label;
    presetSelect.appendChild(opt);
  });

  // Update Rules Pane
  paneRules.innerHTML = `<div class="rules-container">${def.rulesHtml}</div>`;

  // Pause any running animation
  controller.pause();
  controller.loadSteps([], false);

  // Update Undo / Redo buttons
  updateUndoRedoButtons();

  // Update Stats & Invariants
  updateTreeStats();
  updateInvariantsCheck();

  // Render tree
  const activeTree = getActiveTree();
  const snapshot = activeTree.getSnapshot();
  renderer.render(snapshot);
  renderer.resetView(snapshot);

  stepTitle.textContent = `${def.title} Active`;
  stepReasonText.textContent = `Explore ${def.name} operations with real-time on-screen popups and step-by-step animations.`;
  stepBadge.className = 'step-badge step-badge-info';
  stepBadge.textContent = def.name.toUpperCase();

  if (notify) {
    showToast(`Switched to: ${def.name}`, 'info');
  }
}

// ==========================================================================
// Deletion Strategy Management (for B-Tree)
// ==========================================================================
function applyDeletionStrategy(newStrat, announce = true) {
  if (newStrat !== 'clrs' && newStrat !== 'reactive') return;
  trees.btree.setDeletionStrategy(newStrat);

  if (strategySelect) strategySelect.value = newStrat;

  if (btnStratCLRS && btnStratReactive) {
    if (newStrat === 'clrs') {
      btnStratCLRS.classList.add('active');
      btnStratReactive.classList.remove('active');
    } else {
      btnStratReactive.classList.add('active');
      btnStratCLRS.classList.remove('active');
    }
  }

  if (announce && currentStructure === 'btree') {
    const isCLRS = (newStrat === 'clrs');
    stepTitle.textContent = isCLRS 
      ? '📘 Cormen (CLRS) Top-Down Deletion Active' 
      : '⚡ Standard Reactive Bottom-Up Deletion Active';
    stepReasonText.textContent = isCLRS
      ? 'CLRS / Cormen Method (Chapter 18): Single-pass top-down descent. If a child node has ≤ minKeys, it is proactively fixed via sibling borrow or merge BEFORE descending.'
      : 'Standard Reactive Method: Keys are deleted directly from leaf first, repairing underflow upward only when necessary.';
    showToast(`B-Tree Deletion: ${isCLRS ? 'Cormen (CLRS)' : 'Reactive'}`, 'info');
  }
}

// ==========================================================================
// Tree Persistence (localStorage)
// ==========================================================================
function getStorageKey(dsKey = currentStructure) {
  return `dsa_saved_tree_${dsKey}`;
}

function saveTreeState(notifyUser = false) {
  try {
    const tree = getActiveTree();
    if (!tree) return;
    const serialized = tree.toJSON();
    localStorage.setItem(getStorageKey(), JSON.stringify(serialized));
    if (notifyUser) {
      showToast(`${STRUCTURE_DEFS[currentStructure].name} saved to browser storage!`, 'success');
    }
  } catch (err) {
    console.error("Failed to save tree:", err);
    if (notifyUser) showToast('Failed to save tree', 'error');
  }
}

function loadSavedTreeState(dsKey) {
  try {
    const raw = localStorage.getItem(getStorageKey(dsKey));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data) return null;

    if (dsKey === 'btree') return BTree.fromJSON(data);
    if (dsKey === 'bplus') return BPlusTree.fromJSON(data);
    if (dsKey === 'avl') return AVLTree.fromJSON(data);
    if (dsKey === 'redblack') return RedBlackTree.fromJSON(data);
    if (dsKey === 'splay') return SplayTree.fromJSON(data);
    if (dsKey === 'mway') return MWayTree.fromJSON(data);
    if (dsKey === 'trie') return Trie.fromJSON(data);
    return null;
  } catch (err) {
    console.error("Error loading saved state for " + dsKey, err);
    return null;
  }
}

// ==========================================================================
// Undo / Redo Management
// ==========================================================================
function pushUndoState() {
  const tree = getActiveTree();
  if (!tree) return;
  const stack = undoStacks[currentStructure];
  stack.push(tree.toJSON());
  if (stack.length > 50) stack.shift();
  redoStacks[currentStructure] = [];
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  if (btnUndo) btnUndo.disabled = (undoStacks[currentStructure].length === 0);
  if (btnRedo) btnRedo.disabled = (redoStacks[currentStructure].length === 0);
}

function undoAction() {
  const stack = undoStacks[currentStructure];
  if (stack.length === 0) return;
  controller.pause();

  const tree = getActiveTree();
  redoStacks[currentStructure].push(tree.toJSON());

  const prevState = stack.pop();
  restoreTreeFromJSON(prevState);

  controller.loadSteps([], false);
  updateTreeStats();
  updateInvariantsCheck();
  renderer.render(getActiveTree().getSnapshot());
  renderer.resetView(getActiveTree().getSnapshot());
  saveTreeState(false);
  updateUndoRedoButtons();
  stepTitle.textContent = 'Undid Last Action';
  stepReasonText.textContent = 'Data structure restored to prior state.';
  showToast('Undid last action', 'info');
}

function redoAction() {
  const stack = redoStacks[currentStructure];
  if (stack.length === 0) return;
  controller.pause();

  const tree = getActiveTree();
  undoStacks[currentStructure].push(tree.toJSON());

  const nextState = stack.pop();
  restoreTreeFromJSON(nextState);

  controller.loadSteps([], false);
  updateTreeStats();
  updateInvariantsCheck();
  renderer.render(getActiveTree().getSnapshot());
  renderer.resetView(getActiveTree().getSnapshot());
  saveTreeState(false);
  updateUndoRedoButtons();
  stepTitle.textContent = 'Redid Action';
  stepReasonText.textContent = 'Action redone successfully.';
  showToast('Redid action', 'info');
}

function restoreTreeFromJSON(data) {
  if (!data) return;
  if (currentStructure === 'btree') {
    trees.btree = BTree.fromJSON(data);
    if (orderSelect) orderSelect.value = String(trees.btree.M);
  } else if (currentStructure === 'bplus') {
    trees.bplus = BPlusTree.fromJSON(data);
    if (orderSelect) orderSelect.value = String(trees.bplus.M);
  } else if (currentStructure === 'avl') {
    trees.avl = AVLTree.fromJSON(data);
  } else if (currentStructure === 'redblack') {
    trees.redblack = RedBlackTree.fromJSON(data);
  } else if (currentStructure === 'splay') {
    trees.splay = SplayTree.fromJSON(data);
  } else if (currentStructure === 'mway') {
    trees.mway = MWayTree.fromJSON(data);
    if (orderSelect) orderSelect.value = String(trees.mway.M);
  } else if (currentStructure === 'trie') {
    trees.trie = Trie.fromJSON(data);
  }
}

// ==========================================================================
// Stats & Invariants Display
// ==========================================================================
function updateTreeStats() {
  const tree = getActiveTree();
  const stats = tree.getStats();

  // Reset Labels
  statLabelKeys.textContent = (currentStructure === 'trie') ? 'Words:' : 'Keys:';
  statLabelHeight.textContent = (currentStructure === 'trie') ? 'Depth:' : 'Height:';

  statKeys.textContent = (currentStructure === 'trie') ? (stats.totalWords || 0) : (stats.totalKeys || 0);
  statNodes.textContent = stats.totalNodes || 0;
  statHeight.textContent = stats.height !== undefined ? stats.height : (stats.maxDepth !== undefined ? stats.maxDepth : (stats.totalNodes > 0 ? 1 : 0));

  // Custom chips 4 & 5 based on structure
  if (currentStructure === 'btree') {
    statLabelExtra1.textContent = 'Keys/Node:';
    statExtra1.textContent = `[${stats.minKeys} .. ${stats.maxKeys}]`;
    statLabelExtra2.textContent = 'Children:';
    statExtra2.textContent = `[${stats.minChildren} .. ${stats.maxChildren}]`;
  } else if (currentStructure === 'bplus') {
    statLabelExtra1.textContent = 'Keys/Node:';
    statExtra1.textContent = `[${stats.minKeys} .. ${stats.maxKeys}]`;
    statLabelExtra2.textContent = 'Leaves:';
    statExtra2.textContent = 'Linked (.next)';
  } else if (currentStructure === 'avl') {
    statLabelExtra1.textContent = 'Root BF:';
    const bf = stats.balanceFactor || 0;
    statExtra1.textContent = `${bf > 0 ? '+' : ''}${bf}`;
    statLabelExtra2.textContent = 'Invariants:';
    statExtra2.textContent = '|BF| ≤ 1';
  } else if (currentStructure === 'redblack') {
    statLabelExtra1.textContent = 'Red:';
    statExtra1.textContent = stats.redCount || 0;
    statLabelExtra2.textContent = 'Black:';
    statExtra2.textContent = stats.blackCount || 0;
  } else if (currentStructure === 'splay') {
    statLabelExtra1.textContent = 'Root Key:';
    statExtra1.textContent = stats.rootKey !== undefined ? stats.rootKey : 'None';
    statLabelExtra2.textContent = 'Access:';
    statExtra2.textContent = 'Splay to Root';
  } else if (currentStructure === 'mway') {
    statLabelExtra1.textContent = 'Max Keys:';
    statExtra1.textContent = stats.maxKeys || 0;
    statLabelExtra2.textContent = 'Max Children:';
    statExtra2.textContent = stats.maxChildren || 0;
  } else if (currentStructure === 'trie') {
    statLabelExtra1.textContent = 'Alphabet:';
    statExtra1.textContent = 'Prefix Map';
    statLabelExtra2.textContent = 'Lookup:';
    statExtra2.textContent = 'O(Word Length)';
  }
}

function updateInvariantsCheck() {
  const tree = getActiveTree();
  invariantList.innerHTML = '';

  if (currentStructure === 'btree') {
    const inv = tree.validateInvariants();
    const M = tree.M;
    const minK = tree.minKeys;
    const maxK = tree.maxKeys;
    const minC = tree.minChildren;
    const maxC = tree.maxChildren;

    const items = [
      { label: `Non-root node keys in bound [${minK} .. ${maxK}] (⌈M/2⌉-1 to M-1)`, valid: true },
      { label: `Non-root internal children in bound [${minC} .. ${maxC}] (⌈M/2⌉ to M)`, valid: true },
      { label: `Uniform leaf depth verified (Depth = ${inv.leafDepth || 0})`, valid: true },
      { label: 'Keys in all nodes strictly sorted in ascending order', valid: true },
      { label: 'Internal nodes with k keys have exactly k+1 children', valid: true }
    ];

    if (!inv.valid) {
      inv.errors.forEach(err => {
        const li = document.createElement('li');
        li.style.color = 'var(--danger)';
        li.textContent = `⚠️ ${err}`;
        invariantList.appendChild(li);
      });
    } else {
      items.forEach(it => {
        const li = document.createElement('li');
        li.className = 'invariant-item-valid';
        li.textContent = `✓ ${it.label}`;
        invariantList.appendChild(li);
      });
    }
  } else {
    const invList = tree.validateInvariants ? tree.validateInvariants() : [];
    invList.forEach(item => {
      const li = document.createElement('li');
      li.className = item.valid ? 'invariant-item-valid' : '';
      if (!item.valid) li.style.color = 'var(--danger)';
      li.textContent = `${item.valid ? '✓' : '⚠️'} ${item.name} (${item.detail})`;
      invariantList.appendChild(li);
    });
  }
}

// ==========================================================================
// Animation Step & Playback Handlers
// ==========================================================================
function handleStepChange(step, index, totalSteps) {
  if (!step) {
    stepIndexBadge.textContent = 'Step 0 / 0';
    stepCounter.textContent = 'Step 0 / 0';
    timelineScrubber.max = 0;
    timelineScrubber.value = 0;
    return;
  }

  // Scrubber & Counter
  timelineScrubber.max = Math.max(0, totalSteps - 1);
  timelineScrubber.value = index;
  stepCounter.textContent = `Step ${index + 1} / ${totalSteps}`;
  stepIndexBadge.textContent = `Step ${index + 1} / ${totalSteps}`;

  // Step Details
  stepTitle.textContent = step.title || 'Step';

  const status = step.statusType || 'info';
  stepBadge.className = `step-badge step-badge-${status}`;
  stepBadge.textContent = (step.actionCategory || status).toUpperCase();

  stepReasonBox.className = `step-reason-box ${status}`;

  if (step.action && step.rule) {
    stepReasonBox.innerHTML = `
      <div class="step-tier-container">
        <div class="step-tier-block tier-action">
          <div class="step-tier-label">🎯 What We're Doing</div>
          <div class="step-tier-text">${escapeHtml(step.action)}</div>
        </div>
        <div class="step-tier-block tier-rule">
          <div class="step-tier-label">💡 The Rule in Simple Words</div>
          <div class="step-tier-text">${escapeHtml(step.rule)}</div>
        </div>
        ${step.tip ? `
        <div class="step-tier-block tier-tip">
          <div class="step-tier-label">👶 Beginner Tip / Analogy</div>
          <div class="step-tier-text">${escapeHtml(step.tip)}</div>
        </div>` : ''}
      </div>
    `;
  } else {
    stepReasonBox.innerHTML = `
      <div class="step-reason-label">Why this step occurred</div>
      <p id="stepReasonText">${escapeHtml(step.reason || 'Operation step')}</p>
    `;
  }

  // Render tree snapshot
  renderer.render(step.treeSnapshot, step);

  highlightHistoryItem(index);
  updateInvariantsCheck();
}

function handlePlayStateChange(isPlaying) {
  if (isPlaying) {
    playText.textContent = 'Pause';
    playIcon.innerHTML = `
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
    `;
  } else {
    playText.textContent = 'Play';
    playIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
  }
}

function buildHistoryList(steps) {
  historyList.innerHTML = '';
  if (!steps || steps.length === 0) {
    historyList.innerHTML = '<div style="font-size:0.8rem;color:var(--text-muted);text-align:center;padding:20px;">No steps recorded.</div>';
    return;
  }

  steps.forEach((step, idx) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.dataset.index = idx;
    item.innerHTML = `
      <div class="history-item-top">
        <span class="history-item-title">${escapeHtml(step.title)}</span>
        <span class="history-item-index">#${idx + 1}</span>
      </div>
      <div class="history-item-desc">${escapeHtml(step.reason)}</div>
    `;
    item.addEventListener('click', () => controller.jumpToStep(idx));
    historyList.appendChild(item);
  });
}

function highlightHistoryItem(index) {
  const items = historyList.querySelectorAll('.history-item');
  items.forEach((item, idx) => {
    if (idx === index) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      item.classList.remove('active');
    }
  });
}

// ==========================================================================
// Operations Execution (Single & Batch)
// ==========================================================================
function executeSingleInsert() {
  const raw = singleInput.value.trim();
  if (!raw) {
    showToast('Please enter a value to insert', 'error');
    singleInput.focus();
    return;
  }

  const isText = STRUCTURE_DEFS[currentStructure]?.isTextual;
  const val = isText ? raw : Number(raw);
  if (!isText && isNaN(val)) {
    showToast('Please enter a valid numeric value', 'error');
    singleInput.focus();
    return;
  }

  pushUndoState();
  const tree = getActiveTree();
  const res = tree.insert(val);
  const steps = Array.isArray(res) ? res : (res && res.steps ? res.steps : []);

  updateTreeStats();
  buildHistoryList(steps);
  controller.loadSteps(steps, true);
  singleInput.value = '';
  saveTreeState(false);
}

function executeSingleDelete() {
  const raw = singleInput.value.trim();
  if (!raw) {
    showToast('Please enter a value to delete', 'error');
    singleInput.focus();
    return;
  }

  const isText = STRUCTURE_DEFS[currentStructure]?.isTextual;
  const val = isText ? raw : Number(raw);
  if (!isText && isNaN(val)) {
    showToast('Please enter a valid numeric value', 'error');
    singleInput.focus();
    return;
  }

  pushUndoState();
  const tree = getActiveTree();
  const res = tree.delete(val);
  const steps = Array.isArray(res) ? res : (res && res.steps ? res.steps : []);

  updateTreeStats();
  buildHistoryList(steps);
  controller.loadSteps(steps, true);
  singleInput.value = '';
  saveTreeState(false);
}

function executeSingleSearch() {
  const raw = singleInput.value.trim();
  if (!raw) {
    showToast('Please enter a value to search', 'error');
    singleInput.focus();
    return;
  }

  const isText = STRUCTURE_DEFS[currentStructure]?.isTextual;
  const val = isText ? raw : Number(raw);
  if (!isText && isNaN(val)) {
    showToast('Please enter a valid numeric value', 'error');
    singleInput.focus();
    return;
  }

  const tree = getActiveTree();
  const res = tree.search(val);
  const steps = Array.isArray(res) ? res : (res && res.steps ? res.steps : []);

  buildHistoryList(steps);
  controller.loadSteps(steps, true);
}

function executeBatchInsert() {
  const raw = batchInput.value.trim();
  if (!raw) {
    showToast('Please enter a list of items to insert', 'error');
    batchInput.focus();
    return;
  }

  const isText = STRUCTURE_DEFS[currentStructure].isTextual;
  let items = isText 
    ? raw.split(/[\s,]+/).filter(Boolean)
    : raw.split(/[\s,]+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n));

  if (items.length === 0) {
    showToast('No valid items found to insert', 'error');
    return;
  }

  pushUndoState();
  const tree = getActiveTree();
  const allSteps = [];

  for (const item of items) {
    const res = tree.insert(item);
    const steps = Array.isArray(res) ? res : (res && res.steps ? res.steps : []);
    allSteps.push(...steps);
  }

  updateTreeStats();
  buildHistoryList(allSteps);
  controller.loadSteps(allSteps, true);
  saveTreeState(false);
  showToast(`Batch inserted ${items.length} items`, 'success');
}

function executeBatchDelete() {
  const raw = batchInput.value.trim();
  if (!raw) {
    showToast('Please enter a list of items to delete', 'error');
    batchInput.focus();
    return;
  }

  const isText = STRUCTURE_DEFS[currentStructure].isTextual;
  let items = isText 
    ? raw.split(/[\s,]+/).filter(Boolean)
    : raw.split(/[\s,]+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n));

  if (items.length === 0) {
    showToast('No valid items found to delete', 'error');
    return;
  }

  pushUndoState();
  const tree = getActiveTree();
  const allSteps = [];

  for (const item of items) {
    const res = tree.delete(item);
    const steps = Array.isArray(res) ? res : (res && res.steps ? res.steps : []);
    allSteps.push(...steps);
  }

  updateTreeStats();
  buildHistoryList(allSteps);
  controller.loadSteps(allSteps, true);
  saveTreeState(false);
  showToast(`Batch deleted ${items.length} items`, 'info');
}

function handleSampleArray() {
  if (currentStructure === 'trie') {
    batchInput.value = 'tea, ted, ten, to, in, inn';
  } else if (currentStructure === 'btree' || currentStructure === 'bplus' || currentStructure === 'mway') {
    batchInput.value = '10, 20, 5, 6, 12, 30, 7, 17, 3, 16, 22, 25';
  } else if (currentStructure === 'avl') {
    batchInput.value = '10, 20, 30, 40, 50, 25';
  } else if (currentStructure === 'redblack') {
    batchInput.value = '10, 20, 30, 15, 25, 5, 1';
  } else {
    batchInput.value = '50, 30, 70, 20, 40';
  }
}

// ==========================================================================
// Presets Loading
// ==========================================================================
function handlePresetChange(e) {
  const preset = e.target.value;
  if (!preset) return;

  pushUndoState();
  const tree = getActiveTree();
  tree.clear();

  let keysToInsert = [];

  if (currentStructure === 'btree') {
    if (preset === 'cormen_demo') {
      keysToInsert = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160];
    } else if (preset === 'clrs') {
      keysToInsert = [18, 12, 40, 55, 60, 68, 72, 85, 25, 30, 35, 1, 5, 8, 9, 21, 23, 24];
    } else if (preset === 'sequential') {
      keysToInsert = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    } else if (preset === 'reverse') {
      keysToInsert = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    } else if (preset === 'random12') {
      const set = new Set();
      while (set.size < 12) set.add(Math.floor(Math.random() * 95) + 5);
      keysToInsert = Array.from(set);
    } else if (preset === 'splits') {
      keysToInsert = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    }
  } else if (currentStructure === 'bplus') {
    if (preset === 'bp_demo') keysToInsert = [10, 20, 30, 40, 50, 60, 70, 25];
    else if (preset === 'bp_range') keysToInsert = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    else keysToInsert = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  } else if (currentStructure === 'avl') {
    if (preset === 'avl_rotations') keysToInsert = [10, 20, 30, 40, 50, 25];
    else if (preset === 'avl_ascending') keysToInsert = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    else keysToInsert = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  } else if (currentStructure === 'redblack') {
    if (preset === 'rb_recolor') keysToInsert = [10, 20, 30, 15, 25, 5, 1];
    else if (preset === 'rb_zigzag') keysToInsert = [10, 5, 7];
    else keysToInsert = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  } else if (currentStructure === 'splay') {
    if (preset === 'splay_access') keysToInsert = [50, 30, 70, 20, 40];
    else keysToInsert = [10, 20, 30, 40, 50];
  } else if (currentStructure === 'mway') {
    if (preset === 'mway_branch') keysToInsert = [20, 40, 60, 10, 30, 50, 70];
    else keysToInsert = [15, 25, 35, 5, 10, 20, 30, 40, 50];
  } else if (currentStructure === 'trie') {
    if (preset === 'trie_words') keysToInsert = ['tea', 'ted', 'ten', 'to', 'in', 'inn'];
    else keysToInsert = ['apple', 'app', 'application', 'bat', 'ball'];
  }

  const allSteps = [];
  for (const k of keysToInsert) {
    const res = tree.insert(k);
    const steps = Array.isArray(res) ? res : (res && res.steps ? res.steps : []);
    allSteps.push(...steps);
  }

  updateTreeStats();
  buildHistoryList(allSteps);
  controller.loadSteps(allSteps, false);
  renderer.render(tree.getSnapshot());
  renderer.resetView(tree.getSnapshot());
  saveTreeState(false);
  presetSelect.value = '';
  showToast(`Loaded preset example`, 'success');
}

// ==========================================================================
// Random, Clear, and Manual Edit Mode
// ==========================================================================
function handleRandomKey() {
  if (currentStructure === 'trie') {
    const pool = ['code', 'data', 'tree', 'node', 'link', 'hash', 'leaf', 'root', 'fast', 'byte'];
    const randWord = pool[Math.floor(Math.random() * pool.length)] + Math.floor(Math.random() * 10);
    singleInput.value = randWord;
    executeSingleInsert();
  } else {
    const randVal = Math.floor(Math.random() * 95) + 5;
    singleInput.value = randVal;
    executeSingleInsert();
  }
}

function handleClearTree() {
  pushUndoState();
  const tree = getActiveTree();
  tree.clear();
  controller.pause();
  controller.loadSteps([], false);
  updateTreeStats();
  updateInvariantsCheck();
  renderer.render(tree.getSnapshot());
  renderer.resetView(tree.getSnapshot());
  saveTreeState(false);
  stepTitle.textContent = `${STRUCTURE_DEFS[currentStructure].name} Cleared`;
  stepReasonText.textContent = 'All nodes removed. Tree is empty.';
  showToast('Tree cleared', 'info');
}

function toggleEditMode(enable) {
  if (!STRUCTURE_DEFS[currentStructure].allowManualEdit) return;
  isEditMode = enable;
  renderer.setEditMode(isEditMode, {
    onMoveKey: (srcNodeId, keyIdx, targetNodeId) => {
      pushUndoState();
      trees.btree.moveKeyBetweenNodes(srcNodeId, keyIdx, targetNodeId);
      updateTreeStats();
      updateInvariantsCheck();
      renderer.render(trees.btree.root);
      saveTreeState(false);
    },
    onRemoveKey: (nodeId, keyIdx) => {
      pushUndoState();
      trees.btree.removeKeyDirectly(nodeId, keyIdx);
      updateTreeStats();
      updateInvariantsCheck();
      renderer.render(trees.btree.root);
      saveTreeState(false);
    },
    onAddKey: (nodeId) => {
      const raw = prompt("Enter an integer key to add to this node:");
      if (!raw) return;
      const val = parseInt(raw, 10);
      if (isNaN(val)) return;
      pushUndoState();
      trees.btree.addKeyDirectly(nodeId, val);
      updateTreeStats();
      updateInvariantsCheck();
      renderer.render(trees.btree.root);
      saveTreeState(false);
    },
    onAddChild: (nodeId) => {
      pushUndoState();
      trees.btree.createChildNode(nodeId);
      updateTreeStats();
      updateInvariantsCheck();
      renderer.render(trees.btree.root);
      saveTreeState(false);
    },
    onRemoveNode: (nodeId) => {
      pushUndoState();
      trees.btree.removeNodeDirectly(nodeId);
      updateTreeStats();
      updateInvariantsCheck();
      renderer.render(trees.btree.root);
      saveTreeState(false);
    },
    onCreateRoot: () => {
      pushUndoState();
      trees.btree.createInitialRootNode();
      updateTreeStats();
      updateInvariantsCheck();
      renderer.render(trees.btree.root);
      saveTreeState(false);
    }
  });

  if (editModeBanner) editModeBanner.style.display = isEditMode ? 'flex' : 'none';
  if (editModeBtnText) editModeBtnText.textContent = isEditMode ? 'Exit Edit' : 'Manual Edit';
  btnToggleEditMode.classList.toggle('btn-primary', isEditMode);
  btnToggleEditMode.classList.toggle('btn-outline-primary', !isEditMode);

  renderer.render(trees.btree.root);
}

// ==========================================================================
// Setup Event Listeners
// ==========================================================================
function setupEventListeners() {
  // 1. Data Structure Navigation
  dsNavButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const ds = btn.dataset.ds;
      switchDataStructure(ds);
    });
  });

  // Mobile sidebar toggle
  if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener('click', () => {
      if (sidebar) sidebar.classList.toggle('open');
    });
  }

  // 2. Order M Select
  if (orderSelect) {
    orderSelect.addEventListener('change', (e) => {
      const newM = parseInt(e.target.value, 10);
      pushUndoState();
      if (currentStructure === 'btree') {
        trees.btree = new BTree(newM);
        trees.btree.setDeletionStrategy(strategySelect ? strategySelect.value : 'clrs');
      } else if (currentStructure === 'bplus') {
        trees.bplus = new BPlusTree(newM);
      } else if (currentStructure === 'mway') {
        trees.mway = new MWayTree(newM);
      }
      updateTreeStats();
      updateInvariantsCheck();
      renderer.render(getActiveTree().getSnapshot());
      renderer.resetView(getActiveTree().getSnapshot());
      saveTreeState(false);
      showToast(`Order changed to M = ${newM}`, 'info');
    });
  }

  // 3. Deletion Strategy Buttons
  if (btnStratCLRS) {
    btnStratCLRS.addEventListener('click', () => applyDeletionStrategy('clrs'));
  }
  if (btnStratReactive) {
    btnStratReactive.addEventListener('click', () => applyDeletionStrategy('reactive'));
  }

  // 4. Presets
  if (presetSelect) {
    presetSelect.addEventListener('change', handlePresetChange);
  }

  // 5. Operation Mode Tabs
  if (tabSingleBtn && tabBatchBtn) {
    tabSingleBtn.addEventListener('click', () => {
      tabSingleBtn.classList.add('active');
      tabBatchBtn.classList.remove('active');
      singlePanel.classList.add('active');
      batchPanel.classList.remove('active');
    });
    tabBatchBtn.addEventListener('click', () => {
      tabBatchBtn.classList.add('active');
      tabSingleBtn.classList.remove('active');
      batchPanel.classList.add('active');
      singlePanel.classList.remove('active');
    });
  }

  // 6. Action Buttons
  btnInsertSingle.addEventListener('click', executeSingleInsert);
  btnDeleteSingle.addEventListener('click', executeSingleDelete);
  btnSearchSingle.addEventListener('click', executeSingleSearch);

  singleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') executeSingleInsert();
  });

  btnInsertBatch.addEventListener('click', executeBatchInsert);
  btnDeleteBatch.addEventListener('click', executeBatchDelete);
  btnSampleArray.addEventListener('click', handleSampleArray);
  btnClearBatchInput.addEventListener('click', () => {
    batchInput.value = '';
    batchInput.focus();
  });

  // 7. Undo / Redo / Save / Random / Clear
  btnUndo.addEventListener('click', undoAction);
  btnRedo.addEventListener('click', redoAction);
  btnSaveTree.addEventListener('click', () => saveTreeState(true));
  btnRandomKey.addEventListener('click', handleRandomKey);
  btnClearTree.addEventListener('click', handleClearTree);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Space)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undoAction();
    } else if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z')) {
      e.preventDefault();
      redoAction();
    } else if (e.code === 'Space') {
      e.preventDefault();
      controller.togglePlay();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      controller.stepForward();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      controller.stepBackward();
    }
  });

  // 8. Manual Edit Mode Controls
  if (btnToggleEditMode) {
    btnToggleEditMode.addEventListener('click', () => toggleEditMode(!isEditMode));
  }
  if (btnDoneEditing) {
    btnDoneEditing.addEventListener('click', () => toggleEditMode(false));
  }
  if (btnAddKeyPrompt) {
    btnAddKeyPrompt.addEventListener('click', () => {
      const raw = prompt("Enter an integer key to insert:");
      if (!raw) return;
      const val = parseInt(raw, 10);
      if (!isNaN(val)) {
        pushUndoState();
        trees.btree.insert(val);
        updateTreeStats();
        updateInvariantsCheck();
        renderer.render(trees.btree.root);
        saveTreeState(false);
      }
    });
  }

  // 9. Zoom & Pan
  btnZoomIn.addEventListener('click', () => {
    renderer.scale = Math.min(renderer.scale * 1.2, 3.0);
    renderer.applyTransform();
  });
  btnZoomOut.addEventListener('click', () => {
    renderer.scale = Math.max(renderer.scale / 1.2, 0.25);
    renderer.applyTransform();
  });
  btnFitScreen.addEventListener('click', () => {
    renderer.fitToScreen(getActiveTree().getSnapshot());
  });
  btnResetZoom.addEventListener('click', () => {
    renderer.resetView(getActiveTree().getSnapshot());
  });

  // 10. Playback Controls
  btnPlayPause.addEventListener('click', () => controller.togglePlay());
  btnNextStep.addEventListener('click', () => controller.stepForward());
  btnPrevStep.addEventListener('click', () => controller.stepBackward());
  btnJumpStart.addEventListener('click', () => controller.jumpToStart());
  btnJumpEnd.addEventListener('click', () => controller.jumpToEnd());

  timelineScrubber.addEventListener('input', (e) => {
    controller.jumpToStep(parseInt(e.target.value, 10));
  });

  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      speedButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      controller.setSpeed(parseFloat(btn.dataset.speed));
    });
  });

  // 11. Sidebar Tabs
  sidebarTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sidebarTabButtons.forEach(b => b.classList.remove('active'));
      sidebarPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = document.getElementById(`pane${capitalize(btn.dataset.pane)}`);
      if (pane) pane.classList.add('active');
    });
  });
}

// ==========================================================================
// Initialization
// ==========================================================================
function init() {
  renderer = new BTreeRenderer(canvasViewport, canvasSvg, nodesLayer);

  controller = new AnimationController({
    onStepChange: handleStepChange,
    onPlayStateChange: handlePlayStateChange
  });

  // Load saved states for all structures if present
  Object.keys(trees).forEach(ds => {
    const saved = loadSavedTreeState(ds);
    if (saved) trees[ds] = saved;
  });

  // Determine initial active data structure
  let initialDS = 'btree';
  try {
    const savedDS = localStorage.getItem('dsa_active_structure');
    if (savedDS && STRUCTURE_DEFS[savedDS]) initialDS = savedDS;
  } catch (_) {}

  setupEventListeners();
  switchDataStructure(initialDS, false);
}

// ==========================================================================
// Utilities
// ==========================================================================
function showToast(message, type = 'info') {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Boot application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
