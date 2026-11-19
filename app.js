import { BTree, resetNodeIdCounter } from './btree.js';
import { BPlusTree, resetBPlusNodeIdCounter } from './bplus_tree.js';
import { MWayTree, resetMWayNodeIdCounter } from './mway_tree.js';
import { AVLTree, RedBlackTree, SplayTree, resetBSTNodeIdCounter } from './bst_trees.js';
import { Trie, resetTrieNodeIdCounter } from './trie.js';
import {
  MinHeap,
  MaxHeap,
  Deap,
  LeftistHeap,
  SkewHeap,
  BinomialHeap,
  LazyBinomialHeap,
  FibonacciHeap,
  resetHeapNodeIdCounter
} from './heaps.js';
import { BTreeRenderer } from './renderer.js';
import { AnimationController } from './controller.js';

// ==========================================================================
// Application State & Multi-Data Structure Registry
// ==========================================================================
let currentStructure = 'btree';

const trees = {
  btree: new BTree(4),
  bplus: new BPlusTree(4),
  avl: new AVLTree(),
  redblack: new RedBlackTree(),
  splay: new SplayTree(),
  mway: new MWayTree(4),
  trie: new Trie(),
  minheap: new MinHeap(),
  maxheap: new MaxHeap(),
  deap: new Deap(),
  leftist: new LeftistHeap(),
  skew: new SkewHeap(),
  binomial: new BinomialHeap(),
  lazybinomial: new LazyBinomialHeap(),
  fibonacci: new FibonacciHeap()
};

const undoStacks = {
  btree: [], bplus: [], avl: [], redblack: [], splay: [], mway: [], trie: [],
  minheap: [], maxheap: [], deap: [], leftist: [], skew: [], binomial: [], lazybinomial: [], fibonacci: []
};
const redoStacks = {
  btree: [], bplus: [], avl: [], redblack: [], splay: [], mway: [], trie: [],
  minheap: [], maxheap: [], deap: [], leftist: [], skew: [], binomial: [], lazybinomial: [], fibonacci: []
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

// Topic Dropdowns
const btnTopicTrees = document.getElementById('btnTopicTrees');
const btnTopicHeaps = document.getElementById('btnTopicHeaps');
const dropdownTrees = document.getElementById('dropdownTrees');
const dropdownHeaps = document.getElementById('dropdownHeaps');
const activeTreeLabel = document.getElementById('activeTreeLabel');
const activeHeapLabel = document.getElementById('activeHeapLabel');
const dsMenuItems = document.querySelectorAll('.ds-menu-item');

// Dual View Array Strip
const heapArrayStrip = document.getElementById('heapArrayStrip');
const arrayStripFormula = document.getElementById('arrayStripFormula');
const arrayCellsContainer = document.getElementById('arrayCellsContainer');

const orderConfigGroup = document.getElementById('orderConfigGroup');
const orderSelect = document.getElementById('orderSelect');
const strategyConfigGroup = document.getElementById('strategyConfigGroup');
const strategySelect = document.getElementById('strategySelect');
const btnStratCLRS = document.getElementById('btnStratCLRS');
const btnStratReactive = document.getElementById('btnStratReactive');
const presetSelect = document.getElementById('presetSelect');
const keyTypeConfigGroup = document.getElementById('keyTypeConfigGroup');
const btnKeyTypeNum = document.getElementById('btnKeyTypeNum');
const btnKeyTypeAlpha = document.getElementById('btnKeyTypeAlpha');
let currentKeyType = 'numeric'; // 'numeric' | 'alphabetic'

// Stats Ribbon Elements
const statWork = document.getElementById('statWork');
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

// Code Trace Elements
const codeTraceTitle = document.getElementById('codeTraceTitle');
const codeTraceBadge = document.getElementById('codeTraceBadge');
const codeTraceContainer = document.getElementById('codeTraceContainer');

// Quiz Mode Elements
const btnQuizMode = document.getElementById('btnQuizMode');
const quizModal = document.getElementById('quizModal');
const btnQuizClose = document.getElementById('btnQuizClose');
const quizQuestionBadge = document.getElementById('quizQuestionBadge');
const quizQuestionPrompt = document.getElementById('quizQuestionPrompt');
const quizOptionsList = document.getElementById('quizOptionsList');
const quizFeedback = document.getElementById('quizFeedback');
const quizFeedbackTitle = document.getElementById('quizFeedbackTitle');
const quizFeedbackText = document.getElementById('quizFeedbackText');
const quizScoreBadge = document.getElementById('quizScoreBadge');
const btnQuizContinue = document.getElementById('btnQuizContinue');
let isQuizModeActive = false;
let quizScore = 0;
let quizTotal = 0;

// Compare Mode Elements
const btnCompare = document.getElementById('btnCompare');
const compareModal = document.getElementById('compareModal');
const btnCompareClose = document.getElementById('btnCompareClose');
const btnCompareDone = document.getElementById('btnCompareDone');
const compareSelectA = document.getElementById('compareSelectA');
const compareSelectB = document.getElementById('compareSelectB');
const compareInputKeys = document.getElementById('compareInputKeys');
const btnRunCompare = document.getElementById('btnRunCompare');
const compareHeaderA = document.getElementById('compareHeaderA');
const compareHeaderB = document.getElementById('compareHeaderB');
const compareMetricsA = document.getElementById('compareMetricsA');
const compareMetricsB = document.getElementById('compareMetricsB');
const compareThA = document.getElementById('compareThA');
const compareThB = document.getElementById('compareThB');
const compareTableBody = document.getElementById('compareTableBody');

// Exam Export Elements
const btnExportExam = document.getElementById('btnExportExam');
const exportModal = document.getElementById('exportModal');
const btnExportClose = document.getElementById('btnExportClose');
const btnExportModalDone = document.getElementById('btnExportModalDone');
const btnPrintSheet = document.getElementById('btnPrintSheet');
const printableExamSheet = document.getElementById('printableExamSheet');

// AI Tutor Elements
const btnNavAskAi = document.getElementById('btnNavAskAi');
const paneAi = document.getElementById('paneAi');
const aiModelSelect = document.getElementById('aiModelSelect');
const aiModelDesc = document.getElementById('aiModelDesc');
const aiCustomModelInput = document.getElementById('aiCustomModelInput');
const aiKeyStatusBadge = document.getElementById('aiKeyStatusBadge');
const aiStatusDot = document.getElementById('aiStatusDot');
const aiStatusText = document.getElementById('aiStatusText');
const aiKeyInputSection = document.getElementById('aiKeyInputSection');
const aiKeySavedSection = document.getElementById('aiKeySavedSection');
const aiApiKeyInput = document.getElementById('aiApiKeyInput');
const btnToggleKeyVisibility = document.getElementById('btnToggleKeyVisibility');
const btnSaveApiKey = document.getElementById('btnSaveApiKey');
const btnChangeApiKey = document.getElementById('btnChangeApiKey');
const btnClearApiKey = document.getElementById('btnClearApiKey');
const aiChatContainer = document.getElementById('aiChatContainer');
const aiQuickChips = document.getElementById('aiQuickChips');
const aiChatForm = document.getElementById('aiChatForm');
const aiChatInput = document.getElementById('aiChatInput');
const btnAiSend = document.getElementById('btnAiSend');
const btnAiClearChat = document.getElementById('btnAiClearChat');

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
      { id: 'mway_exam_alpha', label: 'Exam: E, L, Q, W, B, H, I, C, P, Z, X, S, F (Order 3)' },
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
  },
  minheap: {
    name: 'Min Heap',
    logo: 'MIN',
    title: 'Binary Min-Heap Visualizer',
    sub: 'Complete Binary Tree & Heapify-Up (Swim) / Heapify-Down (Sink)',
    showOrder: false,
    showStrategy: false,
    allowManualEdit: false,
    isTextual: false,
    singlePlaceholder: 'e.g. 42',
    batchPlaceholder: 'e.g. 30, 10, 20, 5, 12, 40, 8, 25',
    presets: [
      { id: 'min_clrs', label: 'CLRS Example: 16, 14, 10, 8, 7, 9, 3, 2, 4, 1' },
      { id: 'min_swims', label: 'Heapify-Up Showcase: 50, 40, 30, 20, 10, 5' },
      { id: 'min_random10', label: 'Random 10 Elements' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>Binary Min-Heap Invariant</h4>
        <ul>
          <li><strong>Min-Heap Order Property:</strong> For every node <code>i</code> other than root, <code>key(parent(i)) ≤ key(i)</code>. The root holds the global minimum.</li>
          <li><strong>Complete Binary Tree Shape:</strong> Every level except possibly the last is completely filled; the last level is filled sequentially from left to right.</li>
          <li><strong>1-Based Array Indexing Formulas:</strong>
            <ul>
              <li><code>Parent(i) = ⌊i / 2⌋</code></li>
              <li><code>LeftChild(i) = 2i</code></li>
              <li><code>RightChild(i) = 2i + 1</code></li>
            </ul>
          </li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>Core Operations</h4>
        <ul>
          <li><strong>Insert(x) - O(log n):</strong> Place <code>x</code> at index <code>N + 1</code> (next leaf). Heapify-Up (Swim): compare with parent; if <code>x &lt; parent</code>, swap with parent. Repeat up to root.</li>
          <li><strong>Extract-Min() - O(log n):</strong> Remove root element (minimum). Replace root with last element at index <code>N</code>. Heapify-Down (Sink): compare with children; swap with the smaller child until heap property is restored.</li>
        </ul>
      </div>
    `
  },
  maxheap: {
    name: 'Max Heap',
    logo: 'MAX',
    title: 'Binary Max-Heap Visualizer',
    sub: 'Complete Binary Tree & Heapify-Up (Swim) / Heapify-Down (Sink)',
    showOrder: false,
    showStrategy: false,
    allowManualEdit: false,
    isTextual: false,
    singlePlaceholder: 'e.g. 42',
    batchPlaceholder: 'e.g. 10, 50, 30, 20, 60, 15, 45, 70',
    presets: [
      { id: 'max_demo', label: 'CLRS Build-Max-Heap: 4, 1, 3, 2, 16, 9, 10, 14, 8, 7' },
      { id: 'max_ascending', label: 'Ascending Input (Max Swims): 10, 20, 30, 40, 50, 60' },
      { id: 'max_random10', label: 'Random 10 Elements' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>Binary Max-Heap Invariant</h4>
        <ul>
          <li><strong>Max-Heap Order Property:</strong> For every node <code>i</code> other than root, <code>key(parent(i)) ≥ key(i)</code>. The root holds the global maximum.</li>
          <li><strong>Complete Binary Tree Shape:</strong> All levels except possibly the last are full; leaves at last level are populated left-to-right.</li>
          <li><strong>Array Formulas:</strong> <code>Parent = ⌊i/2⌋</code>, <code>Left = 2i</code>, <code>Right = 2i + 1</code>.</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>Core Operations</h4>
        <ul>
          <li><strong>Insert(x) - O(log n):</strong> Place <code>x</code> at next available leaf (index <code>N + 1</code>). Heapify-Up (Swim): if <code>x &gt; parent</code>, swap with parent until invariant holds.</li>
          <li><strong>Extract-Max() - O(log n):</strong> Remove root (maximum). Move last leaf to root position. Heapify-Down (Sink): swap with the larger child until invariant holds.</li>
        </ul>
      </div>
    `
  },
  deap: {
    name: 'Deap (DEPQ)',
    logo: 'DP',
    title: 'Deap (Double-Ended Priority Queue) Visualizer',
    sub: 'Dual Min-Heap & Max-Heap Subtrees with Dual Correspondence',
    showOrder: false,
    showStrategy: false,
    allowManualEdit: false,
    isTextual: false,
    singlePlaceholder: 'e.g. 42',
    batchPlaceholder: 'e.g. 10, 5, 25, 4, 30, 8, 40, 2, 50, 15, 45',
    presets: [
      { id: 'deap_sahni', label: 'Horowitz & Sahni: 10, 5, 25, 4, 30, 8, 40, 2, 50, 15, 45' },
      { id: 'deap_minmax', label: 'Alternating Min/Max: 5, 95, 12, 88, 20, 80, 25, 75' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>Deap (Double-Ended Priority Queue) Definition</h4>
        <ul>
          <li><strong>Structure:</strong> A complete binary tree where the <strong>root (index 1) contains no element</strong>.</li>
          <li><strong>Left Subtree (Root = index 2):</strong> Is a <strong>Min-Heap</strong>.</li>
          <li><strong>Right Subtree (Root = index 3):</strong> Is a <strong>Max-Heap</strong>.</li>
          <li><strong>Dual Correspondence Property:</strong> For any node <code>i</code> in the min-heap subtree, let <code>j</code> be its corresponding partner in the max-heap:
            <code>j = i + 2^(⌊log2(i)⌋ - 1)</code>.
            If <code>j</code> does not exist (j &gt; n), then <code>j = ⌊j / 2⌋</code>.
            <strong>Invariant: <code>deap[i] ≤ deap[j]</code> must hold at all times!</strong>
          </li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>Deap Insertion Algorithm</h4>
        <ol>
          <li>Place key <code>x</code> temporarily at the new position <code>n + 1</code>.</li>
          <li>If position is in Min-Heap: compare <code>x</code> with its partner <code>j</code> in Max-Heap. If <code>x &gt; deap[j]</code>, swap <code>x</code> with <code>deap[j]</code> and bubble up in Max-Heap; otherwise bubble up in Min-Heap.</li>
          <li>If position is in Max-Heap: compare <code>x</code> with its partner <code>i</code> in Min-Heap. If <code>x &lt; deap[i]</code>, swap <code>x</code> with <code>deap[i]</code> and bubble up in Min-Heap; otherwise bubble up in Max-Heap.</li>
        </ol>
      </div>
      <div class="rule-block">
        <h4>Delete-Min & Delete-Max</h4>
        <ul>
          <li><strong>Delete-Min:</strong> Remove minimum from index 2. Move last element to position 2 and filter down in Min-Heap, checking cross-correspondence with Max-Heap at leaf.</li>
          <li><strong>Delete-Max:</strong> Remove maximum from index 3. Move last element to position 3 and filter down in Max-Heap, checking cross-correspondence with Min-Heap at leaf.</li>
        </ul>
      </div>
    `
  },
  leftist: {
    name: 'Leftist Heap',
    logo: 'LH',
    title: 'Leftist Heap Visualizer',
    sub: 'Null Path Length (s-value) Priority Queue & Right-Spine Merging',
    showOrder: false,
    showStrategy: false,
    allowManualEdit: false,
    isTextual: false,
    singlePlaceholder: 'e.g. 42',
    batchPlaceholder: 'e.g. 15, 10, 25, 5, 30, 8, 40, 12',
    presets: [
      { id: 'leftist_demo', label: 'Textbook Merge Sequence: 15, 10, 25, 5, 30, 8, 40, 12' },
      { id: 'leftist_swaps', label: 'Subtree Swaps Demo: 20, 15, 10, 8, 5, 2' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>Null Path Length (s-value / rank)</h4>
        <ul>
          <li><code>s(null) = 0</code></li>
          <li>For any node <code>x</code>: <code>s(x) = 1 + min(s(x.left), s(x.right))</code></li>
          <li><strong>Leftist Property:</strong> For every node <code>x</code>: <code>s(x.left) ≥ s(x.right)</code>.</li>
          <li><strong>Right Spine Bound:</strong> The shortest path to an external node is along the right spine, with length at most <code>⌊log2(n + 1)⌋</code>.</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>The Fundamental Merge(H1, H2) Operation</h4>
        <ol>
          <li>If either heap is null, return the other.</li>
          <li>Make <code>H1</code> the heap with smaller root key (<code>H1.key ≤ H2.key</code>).</li>
          <li>Recursively merge <code>H1.right</code> with <code>H2</code>: <code>H1.right = merge(H1.right, H2)</code>.</li>
          <li>Check Leftist Invariant: If <code>s(H1.left) &lt; s(H1.right)</code>, <strong>swap left and right children!</strong></li>
          <li>Update: <code>s(H1) = 1 + s(H1.right)</code>.</li>
        </ol>
      </div>
      <div class="rule-block">
        <h4>Insert & Extract-Min via Merge</h4>
        <ul>
          <li><strong>Insert(x):</strong> <code>merge(H, new Node(x))</code> - runs in <code>O(log n)</code>.</li>
          <li><strong>Extract-Min():</strong> Remove root, return <code>merge(root.left, root.right)</code> - runs in <code>O(log n)</code>.</li>
        </ul>
      </div>
    `
  },
  skew: {
    name: 'Skew Heap',
    logo: 'SK',
    title: 'Skew Heap Visualizer',
    sub: 'Self-Adjusting Priority Queue via Unconditional Swaps',
    showOrder: false,
    showStrategy: false,
    allowManualEdit: false,
    isTextual: false,
    singlePlaceholder: 'e.g. 42',
    batchPlaceholder: 'e.g. 20, 10, 40, 5, 15, 30, 8, 25',
    presets: [
      { id: 'skew_demo', label: 'Amortized Swaps: 20, 10, 40, 5, 15, 30, 8, 25' },
      { id: 'skew_seq', label: 'Sequential Insert: 10, 20, 30, 40, 50, 60' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>Skew Heap Self-Adjusting Principles</h4>
        <ul>
          <li>Self-adjusting version of Leftist Heaps (Sleator & Tarjan).</li>
          <li><strong>No s-values or ranks stored</strong> in nodes.</li>
          <li><strong>Amortized O(log n) time</strong> per operation.</li>
          <li>Guarantees efficiency over sequences of operations without balancing tags.</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>Unconditional Swap Merge(H1, H2)</h4>
        <ol>
          <li>Compare root keys; ensure <code>H1.key ≤ H2.key</code>.</li>
          <li>Recursively merge <code>H1.right</code> with <code>H2</code>.</li>
          <li><strong>Unconditional Swap:</strong> Without checking any ranks, swap left and right subtrees!
            <code>H1.left = merge(H1.right, H2)</code>, <code>H1.right = old_H1.left</code>.</li>
        </ol>
      </div>
    `
  },
  binomial: {
    name: 'Binomial Heap',
    logo: 'BH',
    title: 'Binomial Heap Visualizer',
    sub: 'Forest of Binomial Trees {B0, B1, ...} with Union Carries',
    showOrder: false,
    showStrategy: false,
    allowManualEdit: false,
    isTextual: false,
    singlePlaceholder: 'e.g. 42',
    batchPlaceholder: 'e.g. 12, 7, 25, 15, 28, 33, 41, 1',
    presets: [
      { id: 'binom_8keys', label: 'Full B3 Tree (8 keys): 12, 7, 25, 15, 28, 33, 41, 1' },
      { id: 'binom_carries', label: 'Union Carries Demo: 10, 20, 5, 40, 15, 30, 8' },
      { id: 'binom_clrs', label: 'CLRS Chapter 19 Dataset (13 keys)' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>Binomial Tree B_k Properties</h4>
        <ul>
          <li><code>B_0</code> is a single node.</li>
          <li>Tree <code>B_k</code> has <code>2^k</code> nodes and height <code>k</code>.</li>
          <li>Root of <code>B_k</code> has degree <code>k</code> with children <code>B_{k-1}, B_{k-2}, ..., B_0</code>.</li>
          <li>Contains exactly <code>(k choose i)</code> nodes at depth <code>i</code> (Binomial coefficients).</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>Binomial Heap Properties</h4>
        <ul>
          <li>Collection of min-heap ordered Binomial Trees.</li>
          <li><strong>Uniqueness:</strong> Contains at most one <code>B_k</code> of any degree <code>k</code>.</li>
          <li>Degrees present correspond directly to the <strong>binary representation of n</strong>!</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>Union & Extract-Min Workflow</h4>
        <ul>
          <li><strong>Union(H1, H2):</strong> Merge root lists by degree. Link adjacent trees of equal degree <code>k</code> (making smaller root parent of larger root, forming <code>B_{k+1}</code>). Handles carries just like binary arithmetic!</li>
          <li><strong>Extract-Min():</strong> Find minimum among tree roots. Remove it; reverse its children into a new Binomial Heap; Union with remaining trees.</li>
        </ul>
      </div>
    `
  },
  lazybinomial: {
    name: 'Lazy Binomial',
    logo: 'LBH',
    title: 'Lazy Binomial Heap Visualizer',
    sub: 'O(1) Lazy Insertion with Deferred Consolidation on Extract-Min',
    showOrder: false,
    showStrategy: false,
    allowManualEdit: false,
    isTextual: false,
    singlePlaceholder: 'e.g. 42',
    batchPlaceholder: 'e.g. 10, 20, 5, 40, 15, 30, 8',
    presets: [
      { id: 'lazy_insert_demo', label: 'Lazy Root List: 10, 20, 5, 40, 15, 30, 8' },
      { id: 'lazy_extract_demo', label: 'Extract-Min Consolidation Demo' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>Lazy Evaluation Paradigm</h4>
        <ul>
          <li>In standard Binomial Heaps, union and insert eagerly combine trees ($O(\log n)$ worst-case).</li>
          <li><strong>Lazy Binomial Heap:</strong> Inserts simply prepend a new $B_0$ tree to the root list in <strong>O(1) worst-case time</strong>!</li>
          <li>Multiple trees of the same degree are allowed in the unconsolidated root list.</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>Deferred Consolidation on Extract-Min</h4>
        <ol>
          <li>Find and remove the root with the global minimum key.</li>
          <li>Add all its children to the root list.</li>
          <li><strong>Consolidation Pass:</strong> Scan all roots and use an array table of degrees. Whenever two roots share degree <code>d</code>, link them into a tree of degree <code>d + 1</code>. Repeat until all degrees are distinct.</li>
        </ol>
      </div>
    `
  },
  fibonacci: {
    name: 'Fibonacci Heap',
    logo: 'FH',
    title: 'Fibonacci Heap Visualizer',
    sub: 'Amortized O(1) Priority Queue with Cascading Cuts & Marked Nodes',
    showOrder: false,
    showStrategy: false,
    allowManualEdit: false,
    isTextual: false,
    singlePlaceholder: 'e.g. 42',
    batchPlaceholder: 'e.g. 23, 7, 3, 17, 24, 18, 52, 38, 30, 26, 46',
    presets: [
      { id: 'fib_clrs', label: 'CLRS Showcase: 23, 7, 3, 17, 24, 18, 52, 38, 30, 26, 46' },
      { id: 'fib_decrease', label: 'Cascading Cut Demo (Decrease-Key)' }
    ],
    rulesHtml: `
      <div class="rule-block">
        <h4>Fibonacci Heap Complexity Bounds</h4>
        <ul>
          <li><strong>Insert:</strong> <code>O(1)</code> actual time</li>
          <li><strong>Union:</strong> <code>O(1)</code> actual time</li>
          <li><strong>Decrease-Key:</strong> <code>O(1)</code> amortized time (used in Dijkstra / Prim)</li>
          <li><strong>Extract-Min:</strong> <code>O(log n)</code> amortized time</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>The Marked Node Rule & Cascading Cuts</h4>
        <ul>
          <li>Roots are never marked.</li>
          <li>A non-root node becomes <strong>marked (●)</strong> when it loses its <em>first</em> child while under its current parent.</li>
          <li>If a marked node loses a <em>second</em> child: it is immediately <strong>cut</strong> from its parent and moved to the root list, unmarking it, and triggering a <strong>Cascading Cut</strong> recursively up its ancestor chain!</li>
          <li>This invariant guarantees that a tree of degree <code>k</code> has at least <code>F_{k+2}</code> nodes (Fibonacci numbers), bounding maximum degree to <code>O(log n)</code>.</li>
        </ul>
      </div>
      <div class="rule-block">
        <h4>Extract-Min & Consolidation</h4>
        <p>Removes minimum root, adds its children to root list, and links equal-degree roots using a degree table until all degrees are unique.</p>
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

  // Update Navigation Tabs & Topic Dropdowns
  dsNavButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.ds === dsKey);
  });

  const treeKeys = ['btree', 'bplus', 'avl', 'redblack', 'splay', 'mway', 'trie'];
  const heapKeys = ['minheap', 'maxheap', 'deap', 'leftist', 'skew', 'binomial', 'lazybinomial', 'fibonacci'];
  const isTree = treeKeys.includes(dsKey);
  const isHeap = heapKeys.includes(dsKey);

  if (btnTopicTrees) btnTopicTrees.classList.toggle('active', isTree);
  if (btnTopicHeaps) btnTopicHeaps.classList.toggle('active', isHeap);
  if (isTree && activeTreeLabel) activeTreeLabel.textContent = STRUCTURE_DEFS[dsKey].name;
  if (isHeap && activeHeapLabel) activeHeapLabel.textContent = STRUCTURE_DEFS[dsKey].name;

  if (dsMenuItems) {
    dsMenuItems.forEach(item => {
      item.classList.toggle('active', item.dataset.ds === dsKey);
    });
  }

  const def = STRUCTURE_DEFS[dsKey];

  // Update Branding
  appLogoBadge.textContent = def.logo;
  appBrandTitle.textContent = def.title;
  appBrandSub.textContent = def.sub;

  // Update Context Toolbar Visibility
  orderConfigGroup.style.display = def.showOrder ? 'flex' : 'none';
  strategyConfigGroup.style.display = def.showStrategy ? 'flex' : 'none';
  if (keyTypeConfigGroup) {
    keyTypeConfigGroup.style.display = (dsKey === 'trie') ? 'none' : 'flex';
  }
  if (btnToggleEditMode) {
    btnToggleEditMode.style.display = def.allowManualEdit ? 'inline-flex' : 'none';
    if (!def.allowManualEdit && isEditMode) {
      toggleEditMode(false);
    }
  }

  // Update Input Fields & Placeholders
  singleInput.type = 'text';
  updateInputPlaceholders();

  // Update Delete/Extract button label
  if (btnDeleteSingle) {
    if (dsKey === 'maxheap') {
      btnDeleteSingle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg> Extract Max`;
      btnDeleteSingle.title = "Extract maximum key (or enter a key to delete)";
    } else if (['minheap', 'deap', 'leftist', 'skew', 'binomial', 'lazybinomial', 'fibonacci'].includes(dsKey)) {
      btnDeleteSingle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg> Extract Min`;
      btnDeleteSingle.title = "Extract minimum key (or enter a key to delete)";
    } else {
      btnDeleteSingle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg> Delete`;
      btnDeleteSingle.title = "Delete key";
    }
  }

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

  // Reset work counter
  if (statWork) statWork.textContent = '0 ops';

  // Update Stats & Invariants
  updateTreeStats();
  updateInvariantsCheck();

  // Auto-populate starter demo if tree is empty
  const activeTree = getActiveTree();
  const stats = activeTree.getStats ? activeTree.getStats() : {};
  const count = stats.totalKeys !== undefined ? stats.totalKeys : (stats.totalWords || 0);
  if (count === 0 && def.presets && def.presets.length > 0) {
    loadPreset(def.presets[0].id, false);
  } else {
    // Render existing tree
    const snapshot = activeTree.getSnapshot();
    renderer.render(snapshot);
    renderer.resetView(snapshot);
  }

  // Update Heap Array Strip
  renderHeapArrayStrip(getActiveTree());

  // Update Code Trace
  updateCodeTrace(null, 0);

  stepTitle.textContent = `${def.title} Active`;
  stepReasonText.textContent = `Explore ${def.name} operations with real-time on-screen popups and step-by-step animations.`;
  stepBadge.className = 'step-badge step-badge-info';
  stepBadge.textContent = def.name.toUpperCase();

  if (notify) {
    showToast(`Switched to: ${def.name}`, 'info');
  }
}

// ==========================================================================
// Key Type Management (Numbers vs Alphabets)
// ==========================================================================
function applyKeyType(newType, announce = true) {
  if (newType !== 'numeric' && newType !== 'alphabetic') return;
  currentKeyType = newType;

  if (btnKeyTypeNum && btnKeyTypeAlpha) {
    btnKeyTypeNum.classList.toggle('active', newType === 'numeric');
    btnKeyTypeAlpha.classList.toggle('active', newType === 'alphabetic');
  }

  updateInputPlaceholders();

  if (announce) {
    const label = (newType === 'alphabetic') ? 'Alphabets (A-Z)' : 'Numbers (123)';
    showToast(`Key Type: ${label}`, 'info');
  }
}

function updateInputPlaceholders() {
  const def = STRUCTURE_DEFS[currentStructure];
  if (!def) return;
  if (currentStructure === 'trie') {
    singleInput.placeholder = def.singlePlaceholder;
    batchInput.placeholder = def.batchPlaceholder;
  } else if (currentKeyType === 'alphabetic') {
    singleInput.placeholder = 'e.g. E';
    batchInput.placeholder = 'e.g. E, L, Q, W, B, H, I, C, P, Z, X, S, F';
  } else {
    singleInput.placeholder = def.singlePlaceholder || 'e.g. 42';
    batchInput.placeholder = def.batchPlaceholder || 'e.g. 10, 20, 5, 6, 12, 30, 7, 17';
  }
}

// ponytail: Unified key parser handles both pure numbers and character tokens like 'E'.
function parseInputKey(raw) {
  if (!raw) return null;
  const isTextual = STRUCTURE_DEFS[currentStructure]?.isTextual;
  if (isTextual) return raw;

  const isNumericStr = !isNaN(Number(raw)) && !isNaN(parseFloat(raw));
  if (!isNumericStr) {
    // Non-numeric letter/string detected: auto-activate alphabetic key mode
    if (currentKeyType === 'numeric') {
      applyKeyType('alphabetic', false);
    }
    return raw;
  }

  return (currentKeyType === 'alphabetic') ? raw : Number(raw);
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
    if (dsKey === 'minheap') return MinHeap.fromJSON(data);
    if (dsKey === 'maxheap') return MaxHeap.fromJSON(data);
    if (dsKey === 'deap') return Deap.fromJSON(data);
    if (dsKey === 'leftist') return LeftistHeap.fromJSON(data);
    if (dsKey === 'skew') return SkewHeap.fromJSON(data);
    if (dsKey === 'binomial') return BinomialHeap.fromJSON(data);
    if (dsKey === 'lazybinomial') return LazyBinomialHeap.fromJSON(data);
    if (dsKey === 'fibonacci') return FibonacciHeap.fromJSON(data);
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
  } else if (currentStructure === 'minheap') {
    trees.minheap = MinHeap.fromJSON(data);
  } else if (currentStructure === 'maxheap') {
    trees.maxheap = MaxHeap.fromJSON(data);
  } else if (currentStructure === 'deap') {
    trees.deap = Deap.fromJSON(data);
  } else if (currentStructure === 'leftist') {
    trees.leftist = LeftistHeap.fromJSON(data);
  } else if (currentStructure === 'skew') {
    trees.skew = SkewHeap.fromJSON(data);
  } else if (currentStructure === 'binomial') {
    trees.binomial = BinomialHeap.fromJSON(data);
  } else if (currentStructure === 'lazybinomial') {
    trees.lazybinomial = LazyBinomialHeap.fromJSON(data);
  } else if (currentStructure === 'fibonacci') {
    trees.fibonacci = FibonacciHeap.fromJSON(data);
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
  } else if (currentStructure === 'minheap') {
    statLabelExtra1.textContent = 'Min Key:';
    statExtra1.textContent = stats.minKeys !== undefined ? stats.minKeys : 'None';
    statLabelExtra2.textContent = 'Property:';
    statExtra2.textContent = 'Parent ≤ Children';
  } else if (currentStructure === 'maxheap') {
    statLabelExtra1.textContent = 'Max Key:';
    statExtra1.textContent = stats.maxKeys !== undefined ? stats.maxKeys : 'None';
    statLabelExtra2.textContent = 'Property:';
    statExtra2.textContent = 'Parent ≥ Children';
  } else if (currentStructure === 'deap') {
    statLabelExtra1.textContent = 'Min Root:';
    statExtra1.textContent = stats.minKeys !== undefined ? stats.minKeys : 'None';
    statLabelExtra2.textContent = 'Max Root:';
    statExtra2.textContent = stats.maxKeys !== undefined ? stats.maxKeys : 'None';
  } else if (currentStructure === 'leftist') {
    statLabelExtra1.textContent = 'Min Root:';
    statExtra1.textContent = stats.minKeys !== undefined ? stats.minKeys : 'None';
    statLabelExtra2.textContent = 'Root s-val:';
    statExtra2.textContent = stats.height !== undefined ? stats.height : '0';
  } else if (currentStructure === 'skew') {
    statLabelExtra1.textContent = 'Min Root:';
    statExtra1.textContent = stats.minKeys !== undefined ? stats.minKeys : 'None';
    statLabelExtra2.textContent = 'Type:';
    statExtra2.textContent = 'Self-Adjusting';
  } else if (currentStructure === 'binomial') {
    statLabelExtra1.textContent = 'Min Root:';
    statExtra1.textContent = stats.minKeys !== undefined ? stats.minKeys : 'None';
    statLabelExtra2.textContent = 'Max Degree:';
    statExtra2.textContent = `B_${stats.maxKeys || 0}`;
  } else if (currentStructure === 'lazybinomial') {
    statLabelExtra1.textContent = 'Min Root:';
    statExtra1.textContent = stats.minKeys !== undefined ? stats.minKeys : 'None';
    statLabelExtra2.textContent = 'Root Trees:';
    statExtra2.textContent = `${stats.maxKeys || 0} roots`;
  } else if (currentStructure === 'fibonacci') {
    statLabelExtra1.textContent = 'Min Pointer:';
    statExtra1.textContent = stats.minKeys !== undefined ? stats.minKeys : 'None';
    statLabelExtra2.textContent = 'Root Trees:';
    statExtra2.textContent = `${stats.height || 0} roots`;
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

  // Live Work / Ops Metric Calculation
  let ops = 0;
  if (controller.steps && controller.steps.length > 0) {
    for (let i = 0; i <= index && i < controller.steps.length; i++) {
      const s = controller.steps[i];
      if (s.comparisons) ops += s.comparisons;
      else if (['swap', 'rotate', 'split', 'merge', 'cut'].includes(s.actionCategory)) ops += 2;
      else ops += 1;
    }
  }
  if (statWork) statWork.textContent = `${ops} ops`;

  // Render tree snapshot
  renderer.render(step.treeSnapshot, step);

  // Render Heap Array Strip if applicable
  renderHeapArrayStrip(getActiveTree(), step);

  // Synchronized Code Trace
  updateCodeTrace(step, index);

  // Check Quiz Mode trigger
  if (isQuizModeActive) {
    checkAndTriggerQuiz(step, index);
  }

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

  const val = parseInputKey(raw);
  if (val === null) {
    showToast('Please enter a valid value', 'error');
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
  const isHeap = ['minheap', 'maxheap', 'deap', 'leftist', 'skew', 'binomial', 'lazybinomial', 'fibonacci'].includes(currentStructure);

  if (!raw) {
    if (isHeap) {
      pushUndoState();
      const tree = getActiveTree();
      const res = tree.extractMin ? tree.extractMin() : (tree.extractMax ? tree.extractMax() : tree.delete());
      const steps = Array.isArray(res) ? res : (res && res.steps ? res.steps : []);
      updateTreeStats();
      buildHistoryList(steps);
      controller.loadSteps(steps, true);
      saveTreeState(false);
      const actionName = (currentStructure === 'maxheap') ? 'Extract-Max' : 'Extract-Min';
      showToast(`${actionName} executed`, 'info');
      return;
    }
    showToast('Please enter a value to delete', 'error');
    singleInput.focus();
    return;
  }

  const val = parseInputKey(raw);
  if (val === null) {
    showToast('Please enter a valid value', 'error');
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

  const val = parseInputKey(raw);
  if (val === null) {
    showToast('Please enter a valid value', 'error');
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

  const isText = STRUCTURE_DEFS[currentStructure]?.isTextual;
  const rawTokens = raw.split(/[\s,]+/).filter(Boolean);
  const hasAlphabetToken = rawTokens.some(t => isNaN(Number(t)));

  let items;
  if (isText || currentKeyType === 'alphabetic' || hasAlphabetToken) {
    if (currentKeyType === 'numeric' && hasAlphabetToken && !isText) {
      applyKeyType('alphabetic', false);
    }
    items = rawTokens;
  } else {
    items = rawTokens.map(s => parseInt(s, 10)).filter(n => !isNaN(n));
  }

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

  const isText = STRUCTURE_DEFS[currentStructure]?.isTextual;
  const rawTokens = raw.split(/[\s,]+/).filter(Boolean);
  const hasAlphabetToken = rawTokens.some(t => isNaN(Number(t)));

  let items;
  if (isText || currentKeyType === 'alphabetic' || hasAlphabetToken) {
    if (currentKeyType === 'numeric' && hasAlphabetToken && !isText) {
      applyKeyType('alphabetic', false);
    }
    items = rawTokens;
  } else {
    items = rawTokens.map(s => parseInt(s, 10)).filter(n => !isNaN(n));
  }

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
  } else if (currentKeyType === 'alphabetic') {
    batchInput.value = 'E, L, Q, W, B, H, I, C, P, Z, X, S, F';
  } else if (currentStructure === 'btree' || currentStructure === 'bplus' || currentStructure === 'mway') {
    batchInput.value = '10, 20, 5, 6, 12, 30, 7, 17, 3, 16, 22, 25';
  } else if (currentStructure === 'avl') {
    batchInput.value = '10, 20, 30, 40, 50, 25';
  } else if (currentStructure === 'redblack') {
    batchInput.value = '10, 20, 30, 15, 25, 5, 1';
  } else if (currentStructure === 'minheap') {
    batchInput.value = '30, 10, 20, 5, 12, 40, 8, 25';
  } else if (currentStructure === 'maxheap') {
    batchInput.value = '10, 50, 30, 20, 60, 15, 45, 70';
  } else if (currentStructure === 'deap') {
    batchInput.value = '10, 5, 25, 4, 30, 8, 40, 2, 50, 15, 45';
  } else if (currentStructure === 'leftist') {
    batchInput.value = '15, 10, 25, 5, 30, 8, 40, 12';
  } else if (currentStructure === 'skew') {
    batchInput.value = '20, 10, 40, 5, 15, 30, 8, 25';
  } else if (currentStructure === 'binomial') {
    batchInput.value = '12, 7, 25, 15, 28, 33, 41, 1';
  } else if (currentStructure === 'lazybinomial') {
    batchInput.value = '10, 20, 5, 40, 15, 30, 8';
  } else if (currentStructure === 'fibonacci') {
    batchInput.value = '23, 7, 3, 17, 24, 18, 52, 38, 30, 26, 46';
  } else {
    batchInput.value = '50, 30, 70, 20, 40';
  }
}

// ==========================================================================
// Presets Loading
// ==========================================================================
function loadPreset(preset, notify = true) {
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
    if (preset === 'mway_exam_alpha') {
      if (trees.mway.M !== 3) {
        trees.mway = new MWayTree(3);
        if (orderSelect) orderSelect.value = '3';
      }
      applyKeyType('alphabetic', false);
      keysToInsert = ['E', 'L', 'Q', 'W', 'B', 'H', 'I', 'C', 'P', 'Z', 'X', 'S', 'F'];
    } else if (preset === 'mway_branch') {
      applyKeyType('numeric', false);
      keysToInsert = [20, 40, 60, 10, 30, 50, 70];
    } else {
      applyKeyType('numeric', false);
      keysToInsert = [15, 25, 35, 5, 10, 20, 30, 40, 50];
    }
  } else if (currentStructure === 'trie') {
    if (preset === 'trie_words') keysToInsert = ['tea', 'ted', 'ten', 'to', 'in', 'inn'];
    else keysToInsert = ['apple', 'app', 'application', 'bat', 'ball'];
  } else if (currentStructure === 'minheap') {
    if (preset === 'min_clrs') keysToInsert = [16, 14, 10, 8, 7, 9, 3, 2, 4, 1];
    else if (preset === 'min_swims') keysToInsert = [50, 40, 30, 20, 10, 5];
    else keysToInsert = [45, 23, 12, 67, 8, 19, 34, 5, 89, 15];
  } else if (currentStructure === 'maxheap') {
    if (preset === 'max_demo') keysToInsert = [4, 1, 3, 2, 16, 9, 10, 14, 8, 7];
    else if (preset === 'max_ascending') keysToInsert = [10, 20, 30, 40, 50, 60];
    else keysToInsert = [12, 85, 34, 91, 5, 47, 63, 28, 74, 52];
  } else if (currentStructure === 'deap') {
    if (preset === 'deap_sahni') keysToInsert = [10, 5, 25, 4, 30, 8, 40, 2, 50, 15, 45];
    else keysToInsert = [5, 95, 12, 88, 20, 80, 25, 75];
  } else if (currentStructure === 'leftist') {
    if (preset === 'leftist_demo') keysToInsert = [15, 10, 25, 5, 30, 8, 40, 12];
    else keysToInsert = [20, 15, 10, 8, 5, 2];
  } else if (currentStructure === 'skew') {
    if (preset === 'skew_demo') keysToInsert = [20, 10, 40, 5, 15, 30, 8, 25];
    else keysToInsert = [10, 20, 30, 40, 50, 60];
  } else if (currentStructure === 'binomial') {
    if (preset === 'binom_8keys') keysToInsert = [12, 7, 25, 15, 28, 33, 41, 1];
    else if (preset === 'binom_carries') keysToInsert = [10, 20, 5, 40, 15, 30, 8];
    else keysToInsert = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130];
  } else if (currentStructure === 'lazybinomial') {
    if (preset === 'lazy_insert_demo') keysToInsert = [10, 20, 5, 40, 15, 30, 8];
    else keysToInsert = [15, 8, 22, 4, 19, 31, 12, 7];
  } else if (currentStructure === 'fibonacci') {
    if (preset === 'fib_clrs') keysToInsert = [23, 7, 3, 17, 24, 18, 52, 38, 30, 26, 46];
    else keysToInsert = [10, 20, 30, 40, 50, 5, 15];
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
  renderHeapArrayStrip(tree);
  saveTreeState(false);
  if (presetSelect) presetSelect.value = '';
  if (notify) {
    showToast(`Loaded preset example`, 'success');
  }
}

function handlePresetChange(e) {
  loadPreset(e.target.value, true);
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
  } else if (currentKeyType === 'alphabetic') {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randChar = letters[Math.floor(Math.random() * letters.length)];
    singleInput.value = randChar;
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
// Heap Array Representation Strip (Dual View)
// ==========================================================================
function renderHeapArrayStrip(tree, step) {
  if (!heapArrayStrip) return;
  if (!['minheap', 'maxheap', 'deap'].includes(currentStructure)) {
    heapArrayStrip.style.display = 'none';
    return;
  }
  heapArrayStrip.style.display = 'flex';

  const activeKeys = step ? (step.targetKeys || []) : [];

  if (currentStructure === 'deap') {
    if (arrayStripFormula) {
      arrayStripFormula.textContent = 'Left: Min-Heap [2..partner] • Right: Max-Heap • Partner: i ± 2^(⌊log2(i)⌋-1)';
    }
    const arr = tree.deap || tree.arr || [];
    if (arrayCellsContainer) {
      arrayCellsContainer.innerHTML = '';
      if (arr.length <= 2) {
        arrayCellsContainer.innerHTML = '<span style="font-size:0.75rem;color:var(--text-muted);padding:4px 8px;">Deap array is currently empty.</span>';
        return;
      }
      for (let i = 2; i < arr.length; i++) {
        const val = arr[i];
        const isMin = tree._isMinSubtree ? tree._isMinSubtree(i) : (tree.isMinSubtree ? tree.isMinSubtree(i) : (i < 4));
        const cell = document.createElement('div');
        cell.className = `array-cell ${isMin ? 'cell-min' : 'cell-max'}`;
        if (activeKeys.includes(val)) cell.classList.add('cell-active');
        cell.title = `Index ${i} (${isMin ? 'Min-Heap Subtree' : 'Max-Heap Subtree'})`;
        cell.innerHTML = `
          <span class="cell-index">[${i}]</span>
          <span class="cell-val">${val}</span>
        `;
        arrayCellsContainer.appendChild(cell);
      }
    }
  } else {
    if (arrayStripFormula) {
      arrayStripFormula.textContent = 'Parent: ⌊i/2⌋ • Left: 2i • Right: 2i+1';
    }
    const heap = tree.heap || [];
    if (arrayCellsContainer) {
      arrayCellsContainer.innerHTML = '';
      if (heap.length === 0) {
        arrayCellsContainer.innerHTML = '<span style="font-size:0.75rem;color:var(--text-muted);padding:4px 8px;">Heap array is currently empty.</span>';
        return;
      }
      for (let idx = 0; idx < heap.length; idx++) {
        const displayIdx = idx + 1;
        const val = heap[idx];
        const cell = document.createElement('div');
        cell.className = 'array-cell';
        if (activeKeys.includes(val)) cell.classList.add('cell-active');
        cell.title = `Index ${displayIdx} (Parent: ${Math.floor(displayIdx/2) || 'None'}, Left: ${2*displayIdx}, Right: ${2*displayIdx+1})`;
        cell.innerHTML = `
          <span class="cell-index">[${displayIdx}]</span>
          <span class="cell-val">${val}</span>
        `;
        arrayCellsContainer.appendChild(cell);
      }
    }
  }
}

// ==========================================================================
// Synchronized Pseudocode / Algorithm Trace
// ==========================================================================
const PSEUDOCODE_TRACES = {
  btree: [
    { line: 1, text: "function BTree-Insert(T, k):", match: ["start", "insert"] },
    { line: 2, text: "  r = T.root; if r.isFull():", match: ["overflow", "split", "full"] },
    { line: 3, text: "    s = AllocateNode(); T.root = s; s.children[0] = r", match: ["new root", "promote"] },
    { line: 4, text: "    SplitChild(s, 0, r); InsertNonFull(s, k)", match: ["split child", "median"] },
    { line: 5, text: "  else InsertNonFull(r, k)", match: ["search", "descend"] },
    { line: 6, text: "function BTree-Delete(T, k):", match: ["delete", "remove"] },
    { line: 7, text: "  if in leaf: direct remove; else swap predecessor", match: ["predecessor", "leaf remove"] },
    { line: 8, text: "  if underflow: borrow from sibling or merge", match: ["borrow", "merge", "underflow"] }
  ],
  bplus: [
    { line: 1, text: "function BPlus-Insert(T, k):", match: ["start", "insert"] },
    { line: 2, text: "  leaf = FindLeaf(T.root, k)", match: ["find", "search", "descend"] },
    { line: 3, text: "  InsertIntoLeaf(leaf, k)", match: ["leaf", "insert leaf"] },
    { line: 4, text: "  if leaf.overflow(): SplitLeafAndCopyUp(leaf)", match: ["split", "copy up", "overflow"] },
    { line: 5, text: "  PropagateIndexKeyToParent(parent, key)", match: ["promote", "parent", "propagate"] }
  ],
  avl: [
    { line: 1, text: "function AVL-Insert(node, k):", match: ["start", "insert"] },
    { line: 2, text: "  node = StandardBSTInsert(node, k)", match: ["bst", "leaf", "insert"] },
    { line: 3, text: "  bf = height(node.left) - height(node.right)", match: ["balance", "height", "bf"] },
    { line: 4, text: "  if bf > 1 and k < node.left.key: RotateRight(node) // LL", match: ["ll", "rotate right", "left-left"] },
    { line: 5, text: "  if bf < -1 and k > node.right.key: RotateLeft(node) // RR", match: ["rr", "rotate left", "right-right"] },
    { line: 6, text: "  if bf > 1 and k > node.left.key: RotateLeftRight(node) // LR", match: ["lr", "left-right", "double"] },
    { line: 7, text: "  if bf < -1 and k < node.right.key: RotateRightLeft(node) // RL", match: ["rl", "right-left"] }
  ],
  redblack: [
    { line: 1, text: "function RB-Insert(T, z):", match: ["start", "insert"] },
    { line: 2, text: "  BST-Insert(z); z.color = RED", match: ["red", "insert", "leaf"] },
    { line: 3, text: "  while z != root and z.parent.color == RED:", match: ["double red", "violation"] },
    { line: 4, text: "    if uncle(z).color == RED: Recolor(parent, uncle, grand)", match: ["recolor", "uncle red"] },
    { line: 5, text: "    else: TriangleToLine(z); RotateAndRecolor(grand)", match: ["rotate", "triangle", "line"] },
    { line: 6, text: "  T.root.color = BLACK", match: ["root black", "finish"] }
  ],
  splay: [
    { line: 1, text: "function Splay(T, x):", match: ["start", "splay"] },
    { line: 2, text: "  while x != T.root:", match: ["ascend", "step"] },
    { line: 3, text: "    if x.parent == T.root: Zig(x) // Single rotation", match: ["zig "] },
    { line: 4, text: "    else if same alignment: Zig-Zig(x) // Double same", match: ["zig-zig"] },
    { line: 5, text: "    else: Zig-Zag(x) // Double alternate", match: ["zig-zag"] }
  ],
  mway: [
    { line: 1, text: "function MWay-Search/Insert(node, k):", match: ["start", "insert"] },
    { line: 2, text: "  if k in node.keys: return found", match: ["found", "duplicate"] },
    { line: 3, text: "  if node.keys.length < M - 1: insertSorted(node, k)", match: ["insert", "has space"] },
    { line: 4, text: "  else: descend into child[i] where k[i-1] < k < k[i]", match: ["descend", "child", "branch"] }
  ],
  trie: [
    { line: 1, text: "function Trie-Insert(root, word):", match: ["start", "insert"] },
    { line: 2, text: "  curr = root; for char c in word:", match: ["traverse", "char"] },
    { line: 3, text: "    if not curr.children[c]: curr.children[c] = Node()", match: ["new node", "create", "branch"] },
    { line: 4, text: "    curr = curr.children[c]", match: ["advance", "step"] },
    { line: 5, text: "  curr.isEndOfWord = true", match: ["end of word", "finish", "complete"] }
  ],
  minheap: [
    { line: 1, text: "function MinHeap-Insert(H, k):", match: ["start", "insert"] },
    { line: 2, text: "  H.size++; H[H.size] = k; i = H.size", match: ["append", "tail"] },
    { line: 3, text: "  while i > 1 and H[⌊i/2⌋] > H[i]: // Swim up", match: ["swim", "bubble up", "compare"] },
    { line: 4, text: "    swap(H[⌊i/2⌋], H[i]); i = ⌊i/2⌋", match: ["swap", "swim swap"] },
    { line: 5, text: "function MinHeap-ExtractMin(H):", match: ["extract", "delete min"] },
    { line: 6, text: "  min = H[1]; H[1] = H[H.size--]; Sink(1); return min", match: ["sink", "trickle down", "min root"] }
  ],
  maxheap: [
    { line: 1, text: "function MaxHeap-Insert(H, k):", match: ["start", "insert"] },
    { line: 2, text: "  H.size++; H[H.size] = k; i = H.size", match: ["append", "tail"] },
    { line: 3, text: "  while i > 1 and H[⌊i/2⌋] < H[i]: // Swim up", match: ["swim", "bubble up", "compare"] },
    { line: 4, text: "    swap(H[⌊i/2⌋], H[i]); i = ⌊i/2⌋", match: ["swap", "swim swap"] },
    { line: 5, text: "function MaxHeap-ExtractMax(H):", match: ["extract", "delete max"] },
    { line: 6, text: "  max = H[1]; H[1] = H[H.size--]; Sink(1); return max", match: ["sink", "trickle down", "max root"] }
  ],
  deap: [
    { line: 1, text: "function Deap-Insert(D, k):", match: ["start", "insert"] },
    { line: 2, text: "  i = ++D.size; j = partnerIndex(i)", match: ["partner", "position"] },
    { line: 3, text: "  if i in Min-Subtree and k > D[j]: swap(D[i], D[j]); SwimMax(j)", match: ["min-subtree cross", "swap partner"] },
    { line: 4, text: "  else if i in Min-Subtree: SwimMin(i, k)", match: ["swim-min", "min-subtree"] },
    { line: 5, text: "  else if i in Max-Subtree and k < D[j]: swap(D[i], D[j]); SwimMin(j)", match: ["max-subtree cross"] },
    { line: 6, text: "  else: SwimMax(i, k)", match: ["swim-max", "max-subtree"] }
  ],
  leftist: [
    { line: 1, text: "function Leftist-Merge(h1, h2):", match: ["start", "merge"] },
    { line: 2, text: "  if h1 == null: return h2; if h2 == null: return h1", match: ["base case", "null"] },
    { line: 3, text: "  if h1.key > h2.key: swap(h1, h2)", match: ["root compare", "swap roots"] },
    { line: 4, text: "  h1.right = Leftist-Merge(h1.right, h2)", match: ["right spine", "recurse"] },
    { line: 5, text: "  if s(h1.left) < s(h1.right): swap(h1.left, h1.right)", match: ["s-value", "swap children", "leftist property"] },
    { line: 6, text: "  h1.s = s(h1.right) + 1; return h1", match: ["update s", "return"] }
  ],
  skew: [
    { line: 1, text: "function Skew-Merge(h1, h2):", match: ["start", "merge"] },
    { line: 2, text: "  if h1 == null: return h2; if h2 == null: return h1", match: ["null", "base case"] },
    { line: 3, text: "  if h1.key > h2.key: swap(h1, h2)", match: ["compare", "swap roots"] },
    { line: 4, text: "  swap(h1.left, h1.right) // Unconditional swap", match: ["unconditional swap", "swap left right"] },
    { line: 5, text: "  h1.left = Skew-Merge(h2, h1.left); return h1", match: ["recurse", "merge left"] }
  ],
  binomial: [
    { line: 1, text: "function Binomial-Union(H1, H2):", match: ["start", "union"] },
    { line: 2, text: "  H = MergeRootListsByDegree(H1, H2)", match: ["merge root list", "degree list"] },
    { line: 3, text: "  for curr in H: if degree(curr) == degree(next):", match: ["equal degree", "carry"] },
    { line: 4, text: "    Link smaller root as parent of larger root", match: ["link", "link trees", "binomial tree"] },
    { line: 5, text: "function ExtractMin(H): remove min, reverse children, Union", match: ["extract", "delete min"] }
  ],
  lazybinomial: [
    { line: 1, text: "function Lazy-Insert(H, k):", match: ["start", "lazy insert", "insert"] },
    { line: 2, text: "  Add single B0 tree to root list in O(1) time", match: ["o(1)", "root list", "b0"] },
    { line: 3, text: "function Lazy-ExtractMin(H):", match: ["extract", "delete min"] },
    { line: 4, text: "  Remove min root; splice children into root list", match: ["remove min", "children"] },
    { line: 5, text: "  Consolidate(): link equal degrees until all degrees unique", match: ["consolidat", "degree table", "link"] }
  ],
  fibonacci: [
    { line: 1, text: "function Fib-Insert(H, k): add to root list in O(1)", match: ["insert", "o(1)"] },
    { line: 2, text: "function Fib-ExtractMin(H): remove min, splice, Consolidate()", match: ["extract", "min"] },
    { line: 3, text: "function Fib-DecreaseKey(H, x, k): x.key = k; if x < parent: Cut()", match: ["decrease-key", "key"] },
    { line: 4, text: "function CascadingCut(H, y):", match: ["cascading cut", "mark"] },
    { line: 5, text: "  if not y.mark: y.mark = true // First child lost", match: ["mark true", "first child"] },
    { line: 6, text: "  else: Cut(y); CascadingCut(H, y.parent) // Second child lost", match: ["second child", "cut parent"] }
  ]
};

function updateCodeTrace(step, index) {
  if (!codeTraceContainer) return;
  const trace = PSEUDOCODE_TRACES[currentStructure] || [];
  if (trace.length === 0) {
    codeTraceContainer.innerHTML = '<div style="padding:12px;color:var(--text-muted);">Trace not available.</div>';
    return;
  }

  // Determine active line
  let activeLineIndex = 0;
  if (step) {
    const textToMatch = `${step.title || ''} ${step.actionCategory || ''} ${step.reason || ''} ${step.action || ''}`.toLowerCase();
    for (let i = 0; i < trace.length; i++) {
      const lineObj = trace[i];
      if (lineObj.match && lineObj.match.some(m => textToMatch.includes(m.toLowerCase()))) {
        activeLineIndex = i;
        break;
      }
    }
  }

  if (codeTraceTitle) {
    codeTraceTitle.textContent = `${STRUCTURE_DEFS[currentStructure]?.name || ''} Trace`;
  }
  if (codeTraceBadge) {
    codeTraceBadge.textContent = `Line ${trace[activeLineIndex]?.line || 1}`;
  }

  codeTraceContainer.innerHTML = '';
  trace.forEach((lineObj, i) => {
    const div = document.createElement('div');
    div.className = `code-line ${i === activeLineIndex ? 'active' : ''}`;
    div.innerHTML = `
      <span class="code-line-num">${lineObj.line}</span>
      <span class="code-line-text">${escapeHtml(lineObj.text)}</span>
    `;
    codeTraceContainer.appendChild(div);
  });
}

// ==========================================================================
// Topic Dropdown Menus Setup
// ==========================================================================
function setupTopicDropdowns() {
  function closeAllDropdowns() {
    dropdownTrees?.classList.remove('open');
    dropdownHeaps?.classList.remove('open');
    btnTopicTrees?.setAttribute('aria-expanded', 'false');
    btnTopicHeaps?.setAttribute('aria-expanded', 'false');
  }

  btnTopicTrees?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdownTrees?.classList.contains('open');
    closeAllDropdowns();
    if (!isOpen && dropdownTrees) {
      dropdownTrees.classList.add('open');
      btnTopicTrees?.setAttribute('aria-expanded', 'true');
    }
  });

  btnTopicHeaps?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdownHeaps?.classList.contains('open');
    closeAllDropdowns();
    if (!isOpen && dropdownHeaps) {
      dropdownHeaps.classList.add('open');
      btnTopicHeaps?.setAttribute('aria-expanded', 'true');
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.ds-dropdown')) {
      closeAllDropdowns();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllDropdowns();
  });

  dsMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      const ds = item.dataset.ds;
      if (ds) {
        switchDataStructure(ds);
        closeAllDropdowns();
      }
    });
  });
}

// ==========================================================================
// Quiz Mode: Predict the Next Step
// ==========================================================================
let lastQuizStepIndex = -1;

function setupQuizMode() {
  btnQuizMode?.addEventListener('click', () => {
    isQuizModeActive = !isQuizModeActive;
    btnQuizMode.classList.toggle('active', isQuizModeActive);
    showToast(isQuizModeActive ? '🎯 Quiz Mode ON: Practice predicting next operations!' : 'Quiz Mode OFF', 'info');
  });

  btnQuizClose?.addEventListener('click', () => {
    if (quizModal) quizModal.style.display = 'none';
  });

  btnQuizContinue?.addEventListener('click', () => {
    if (quizModal) quizModal.style.display = 'none';
    controller.nextStep();
  });
}

function checkAndTriggerQuiz(step, index) {
  if (!step || index === lastQuizStepIndex) return;
  // Trigger quiz on significant tree actions (rotations, swaps, splits, merges)
  const isActionStep = ['swap', 'rotate', 'split', 'merge', 'cut', 'recolor'].includes(step.actionCategory);
  if (!isActionStep) return;

  lastQuizStepIndex = index;
  controller.pause();

  // Generate question and options
  const question = `What operation is performed at this step in ${STRUCTURE_DEFS[currentStructure]?.name}?`;
  const correctAnswer = step.title || 'Algorithmic transformation';
  const distractorPool = [
    "No change, invariant satisfied",
    "Single Left-Left (LL) rotation",
    "Single Right-Right (RR) rotation",
    "Swap with left child",
    "Promote median key upwards",
    "Recolor parent and uncle to BLACK",
    "Unconditional swap of left and right subtrees",
    "Cascading cut to root list"
  ].filter(d => d.toLowerCase() !== correctAnswer.toLowerCase());

  // Pick 3 distractors + correct answer
  const options = [correctAnswer];
  while (options.length < 4 && distractorPool.length > 0) {
    const randIdx = Math.floor(Math.random() * distractorPool.length);
    options.push(distractorPool.splice(randIdx, 1)[0]);
  }
  options.sort(() => Math.random() - 0.5);

  quizTotal++;
  if (quizQuestionPrompt) quizQuestionPrompt.textContent = question;
  if (quizQuestionBadge) quizQuestionBadge.textContent = `Question #${quizTotal}`;
  if (quizOptionsList) quizOptionsList.innerHTML = '';
  if (quizFeedback) quizFeedback.style.display = 'none';
  if (btnQuizContinue) btnQuizContinue.style.display = 'none';
  if (quizScoreBadge) quizScoreBadge.textContent = `Score: ${quizScore} / ${quizTotal - 1}`;

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      // Disable all options
      if (quizOptionsList) {
        quizOptionsList.querySelectorAll('.quiz-opt-btn').forEach(b => b.disabled = true);
      }
      const isCorrect = (opt === correctAnswer);
      if (isCorrect) {
        btn.classList.add('correct');
        quizScore++;
        if (quizFeedback) quizFeedback.className = 'quiz-feedback-box correct';
        if (quizFeedbackTitle) quizFeedbackTitle.textContent = '🎉 Correct!';
        if (quizFeedbackText) quizFeedbackText.textContent = step.reason || step.rule || 'Great job anticipating the algorithmic transformation!';
      } else {
        btn.classList.add('wrong');
        if (quizFeedback) quizFeedback.className = 'quiz-feedback-box wrong';
        if (quizFeedbackTitle) quizFeedbackTitle.textContent = '❌ Incorrect';
        if (quizFeedbackText) quizFeedbackText.textContent = `The correct action was: "${correctAnswer}". Reason: ${step.reason || step.rule || ''}`;
        if (quizOptionsList) {
          quizOptionsList.querySelectorAll('.quiz-opt-btn').forEach(b => {
            if (b.textContent === correctAnswer) b.classList.add('correct');
          });
        }
      }
      if (quizScoreBadge) quizScoreBadge.textContent = `Score: ${quizScore} / ${quizTotal}`;
      if (quizFeedback) quizFeedback.style.display = 'block';
      if (btnQuizContinue) btnQuizContinue.style.display = 'inline-flex';
    });
    if (quizOptionsList) quizOptionsList.appendChild(btn);
  });

  if (quizModal) quizModal.style.display = 'flex';
}

// ==========================================================================
// Side-by-Side Algorithm Comparison Mode
// ==========================================================================
const BIG_O_COMPLEXITIES = {
  btree: { search: "O(log n)", insert: "O(log n)", delete: "O(log n)", union: "O(n)", amortized: "O(1) split", invariant: "All leaves at uniform depth; node keys [⌈M/2⌉-1 .. M-1]" },
  bplus: { search: "O(log n)", insert: "O(log n)", delete: "O(log n)", union: "O(n)", amortized: "O(1) leaf chain", invariant: "All records stored in linked leaves; internal nodes only route index" },
  avl: { search: "O(log n)", insert: "O(log n)", delete: "O(log n)", union: "O(n)", amortized: "O(1) rotation", invariant: "Strict balance factor |h_L - h_R| ≤ 1 at every node" },
  redblack: { search: "O(log n)", insert: "O(log n)", delete: "O(log n)", union: "O(n)", amortized: "O(1) recolor", invariant: "Root is black; no 2 consecutive reds; uniform black-height" },
  splay: { search: "O(log n)*", insert: "O(log n)*", delete: "O(log n)*", union: "O(m log(n/m))", amortized: "O(log n) amortized", invariant: "Self-adjusting: accessed elements splayed to root via Zig/Zig-Zig/Zig-Zag" },
  mway: { search: "O(M log_M n)", insert: "O(M log_M n)", delete: "O(M log_M n)", union: "O(n)", amortized: "N/A", invariant: "Multi-way search tree with up to M-1 keys and M subtrees" },
  trie: { search: "O(L)", insert: "O(L)", delete: "O(L)", union: "O(n)", amortized: "O(L) per word", invariant: "Prefix tree where edges represent characters of words of length L" },
  minheap: { search: "O(n)", insert: "O(log n)", delete: "O(log n)", union: "O(n)", amortized: "O(1) avg insert", invariant: "A[⌊i/2⌋] ≤ A[i]; complete binary tree array layout" },
  maxheap: { search: "O(n)", insert: "O(log n)", delete: "O(log n)", union: "O(n)", amortized: "O(1) avg insert", invariant: "A[⌊i/2⌋] ≥ A[i]; complete binary tree array layout" },
  deap: { search: "O(n)", insert: "O(log n)", delete: "O(log n)", union: "O(n)", amortized: "O(log n)", invariant: "Root empty; left is Min-Heap, right is Max-Heap, partners satisfy min ≤ max" },
  leftist: { search: "O(n)", insert: "O(log n)", delete: "O(log n)", union: "O(log n)", amortized: "O(log n)", invariant: "s(left) ≥ s(right); right spine length ≤ ⌊log2(n+1)⌋" },
  skew: { search: "O(n)", insert: "O(log n)*", delete: "O(log n)*", union: "O(log n)*", amortized: "O(log n) amortized", invariant: "Self-adjusting priority queue; unconditional left/right swap on right spine" },
  binomial: { search: "O(n)", insert: "O(1)* / O(log n)", delete: "O(log n)", union: "O(log n)", amortized: "O(1) amortized insert", invariant: "Forest of binomial trees B_k with at most one tree per degree" },
  lazybinomial: { search: "O(n)", insert: "O(1) worst", delete: "O(log n)*", union: "O(1)", amortized: "O(log n) extract-min", invariant: "Trees merged lazily into root list, consolidated during Extract-Min" },
  fibonacci: { search: "O(n)", insert: "O(1) worst", delete: "O(log n)*", union: "O(1)", amortized: "O(1) insert/decrease-key", invariant: "Marked nodes; cascading cuts maintain max degree O(log n) for F_{k+2} size" }
};

function createFreshTree(dsKey) {
  switch (dsKey) {
    case 'btree': return new BTree(4);
    case 'bplus': return new BPlusTree(4);
    case 'avl': return new AVLTree();
    case 'redblack': return new RedBlackTree();
    case 'splay': return new SplayTree();
    case 'mway': return new MWayTree(4);
    case 'trie': return new Trie();
    case 'minheap': return new MinHeap();
    case 'maxheap': return new MaxHeap();
    case 'deap': return new Deap();
    case 'leftist': return new LeftistHeap();
    case 'skew': return new SkewHeap();
    case 'binomial': return new BinomialHeap();
    case 'lazybinomial': return new LazyBinomialHeap();
    case 'fibonacci': return new FibonacciHeap();
    default: return new MinHeap();
  }
}

function setupCompareMode() {
  btnCompare?.addEventListener('click', () => {
    if (compareModal) {
      compareModal.style.display = 'flex';
      runComparison();
    }
  });

  btnCompareClose?.addEventListener('click', () => {
    if (compareModal) compareModal.style.display = 'none';
  });

  btnCompareDone?.addEventListener('click', () => {
    if (compareModal) compareModal.style.display = 'none';
  });

  btnRunCompare?.addEventListener('click', runComparison);
}

function runComparison() {
  const typeA = compareSelectA ? compareSelectA.value : 'avl';
  const typeB = compareSelectB ? compareSelectB.value : 'redblack';
  const rawInput = compareInputKeys ? compareInputKeys.value : '40, 20, 60, 10, 30, 50, 70';
  const keys = rawInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));

  const treeA = createFreshTree(typeA);
  const treeB = createFreshTree(typeB);

  let stepsA = 0;
  let stepsB = 0;

  for (const k of keys) {
    const resA = treeA.insert(k);
    stepsA += Array.isArray(resA) ? resA.length : (resA?.steps?.length || 1);
    const resB = treeB.insert(k);
    stepsB += Array.isArray(resB) ? resB.length : (resB?.steps?.length || 1);
  }

  const statsA = treeA.getStats ? treeA.getStats() : {};
  const statsB = treeB.getStats ? treeB.getStats() : {};
  const nameA = STRUCTURE_DEFS[typeA]?.name || typeA;
  const nameB = STRUCTURE_DEFS[typeB]?.name || typeB;

  if (compareHeaderA) compareHeaderA.textContent = `Structure A: ${nameA}`;
  if (compareHeaderB) compareHeaderB.textContent = `Structure B: ${nameB}`;
  if (compareThA) compareThA.textContent = nameA;
  if (compareThB) compareThB.textContent = nameB;

  if (compareMetricsA) {
    compareMetricsA.innerHTML = `
      <div class="compare-metric-row"><span>Keys Inserted:</span> <strong>${keys.length}</strong></div>
      <div class="compare-metric-row"><span>Total Operations / Steps:</span> <strong>${stepsA} ops</strong></div>
      <div class="compare-metric-row"><span>Resulting Height / Depth:</span> <strong>${statsA.height ?? statsA.levels ?? 'N/A'}</strong></div>
      <div class="compare-metric-row"><span>Total Nodes:</span> <strong>${statsA.totalNodes ?? statsA.totalKeys ?? keys.length}</strong></div>
    `;
  }

  if (compareMetricsB) {
    compareMetricsB.innerHTML = `
      <div class="compare-metric-row"><span>Keys Inserted:</span> <strong>${keys.length}</strong></div>
      <div class="compare-metric-row"><span>Total Operations / Steps:</span> <strong>${stepsB} ops</strong></div>
      <div class="compare-metric-row"><span>Resulting Height / Depth:</span> <strong>${statsB.height ?? statsB.levels ?? 'N/A'}</strong></div>
      <div class="compare-metric-row"><span>Total Nodes:</span> <strong>${statsB.totalNodes ?? statsB.totalKeys ?? keys.length}</strong></div>
    `;
  }

  const bigOA = BIG_O_COMPLEXITIES[typeA] || {};
  const bigOB = BIG_O_COMPLEXITIES[typeB] || {};

  if (compareTableBody) {
    compareTableBody.innerHTML = `
      <tr><td>Search / Find-Min</td><td><code>${bigOA.search || 'O(log n)'}</code></td><td><code>${bigOB.search || 'O(log n)'}</code></td></tr>
      <tr><td>Insert (Worst-Case)</td><td><code>${bigOA.insert || 'O(log n)'}</code></td><td><code>${bigOB.insert || 'O(log n)'}</code></td></tr>
      <tr><td>Delete / Extract-Min</td><td><code>${bigOA.delete || 'O(log n)'}</code></td><td><code>${bigOB.delete || 'O(log n)'}</code></td></tr>
      <tr><td>Union / Merge</td><td><code>${bigOA.union || 'O(n)'}</code></td><td><code>${bigOB.union || 'O(n)'}</code></td></tr>
      <tr><td>Amortized Characteristic</td><td>${bigOA.amortized || 'N/A'}</td><td>${bigOB.amortized || 'N/A'}</td></tr>
      <tr><td>Structural Invariant</td><td><small>${bigOA.invariant || ''}</small></td><td><small>${bigOB.invariant || ''}</small></td></tr>
    `;
  }
}

// ==========================================================================
// Printable Exam Study Sheet Generator
// ==========================================================================
function setupExamExport() {
  btnExportExam?.addEventListener('click', () => {
    generateExamStudySheet();
    if (exportModal) exportModal.style.display = 'flex';
  });

  btnExportClose?.addEventListener('click', () => {
    if (exportModal) exportModal.style.display = 'none';
  });

  btnExportModalDone?.addEventListener('click', () => {
    if (exportModal) exportModal.style.display = 'none';
  });

  btnPrintSheet?.addEventListener('click', () => {
    window.print();
  });
}

function generateExamStudySheet() {
  if (!printableExamSheet) return;
  const def = STRUCTURE_DEFS[currentStructure] || {};
  const bigO = BIG_O_COMPLEXITIES[currentStructure] || {};
  const activeTree = getActiveTree();
  const stats = activeTree.getStats ? activeTree.getStats() : {};

  printableExamSheet.innerHTML = `
    <div class="exam-section">
      <div class="exam-section-title">📘 ${def.title} — End-Semester Exam Cheatsheet</div>
      <p style="color:var(--text-secondary); margin-bottom: 8px;">${def.sub}</p>
      <div><strong>Core Invariant:</strong> ${bigO.invariant || 'Standard structural invariant.'}</div>
    </div>

    <div class="exam-section">
      <div class="exam-section-title">⏱️ Asymptotic Time Complexity Table</div>
      <table class="exam-table">
        <thead>
          <tr>
            <th>Operation</th>
            <th>Worst-Case Complexity</th>
            <th>Amortized / Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Find / Search</td><td><code>${bigO.search || 'O(log n)'}</code></td><td>${currentStructure.includes('heap') ? 'O(1) for root min/max' : 'Strict bound'}</td></tr>
          <tr><td>Insert</td><td><code>${bigO.insert || 'O(log n)'}</code></td><td>${bigO.amortized || 'N/A'}</td></tr>
          <tr><td>Delete / Extract</td><td><code>${bigO.delete || 'O(log n)'}</code></td><td>Restores heap/tree invariant</td></tr>
          <tr><td>Union / Merge</td><td><code>${bigO.union || 'O(n)'}</code></td><td>${currentStructure === 'fibonacci' || currentStructure === 'lazybinomial' ? 'O(1) pointer concatenation' : 'Spine or list union'}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="exam-section">
      <div class="exam-section-title">💡 Textbook Rules & Exam Pitfalls</div>
      <div>${def.rulesHtml}</div>
    </div>

    <div class="exam-section">
      <div class="exam-section-title">📊 Current Session Snapshot</div>
      <div style="display:flex; gap: 20px; font-family: var(--font-mono); font-size: 0.85rem;">
        <div>Total Keys: <strong>${stats.totalKeys ?? stats.totalWords ?? 0}</strong></div>
        <div>Height: <strong>${stats.height ?? stats.levels ?? 0}</strong></div>
        <div>Nodes: <strong>${stats.totalNodes ?? stats.totalKeys ?? 0}</strong></div>
      </div>
    </div>
  `;
}

// ==========================================================================
// AI Tutor Chatbot Integration (Google Gemini API with Real-Time Context)
// ==========================================================================
const MODEL_DESCRIPTIONS = {
  'gemini-3.5-flash-lite': '<strong>Best overall balance (Recommended):</strong> Fast, low-latency responses with a much higher daily free quota than standard Flash. Great as your default model.',
  'gemini-3.8-flash': '<strong>Best reasoning & accuracy:</strong> Ideal for complex edge cases like B+ tree underflow redistribution, AVL double rotations, or multi-step recurrence explanations.',
  'gemini-3.1-flash-lite': '<strong>Ultra-fast & cheap fallback:</strong> Good for basic walkthroughs (e.g., standard BST insertion, BFS/DFS steps).',
  'gemma-4-31b-it': '<strong>Open-weights alternative (31B):</strong> Completely free to use via AI Studio if you want an open-model option alongside Gemini.',
  'gemma-4-26b-a4b-it': '<strong>Open-weights alternative (26B):</strong> Compact, efficient open-model option alongside Gemini.',
  'custom': '<strong>Custom Model ID:</strong> Enter any valid model name from Google AI Studio / Gemini API.'
};

let aiConversationHistory = [];

function getStoredApiKey() {
  try {
    return localStorage.getItem('dsa_gemini_api_key') || '';
  } catch (_) {
    return '';
  }
}

function setStoredApiKey(key) {
  try {
    localStorage.setItem('dsa_gemini_api_key', key.trim());
  } catch (_) {}
}

function removeStoredApiKey() {
  try {
    localStorage.removeItem('dsa_gemini_api_key');
  } catch (_) {}
}

function getStoredModel() {
  try {
    return localStorage.getItem('dsa_gemini_model') || 'gemini-3.5-flash-lite';
  } catch (_) {
    return 'gemini-3.5-flash-lite';
  }
}

function setStoredModel(model) {
  try {
    localStorage.setItem('dsa_gemini_model', model);
  } catch (_) {}
}

function getSelectedModel() {
  const sel = aiModelSelect ? aiModelSelect.value : 'gemini-3.5-flash-lite';
  if (sel === 'custom') {
    return (aiCustomModelInput?.value || '').trim() || 'gemini-3.5-flash-lite';
  }
  return sel;
}

function updateModelDescription(modelKey) {
  if (aiModelDesc) {
    aiModelDesc.innerHTML = MODEL_DESCRIPTIONS[modelKey] || MODEL_DESCRIPTIONS['custom'];
  }
}

function updateApiKeyUi() {
  const key = getStoredApiKey();
  const hasKey = key && key.length > 5;
  if (aiStatusDot && aiStatusText) {
    aiStatusDot.className = hasKey ? 'status-dot status-dot-success' : 'status-dot status-dot-warning';
    aiStatusText.textContent = hasKey ? 'Ready' : 'No Key';
  }
  if (aiKeyInputSection && aiKeySavedSection) {
    aiKeyInputSection.style.display = hasKey ? 'none' : 'flex';
    aiKeySavedSection.style.display = hasKey ? 'flex' : 'none';
  }
  if (aiApiKeyInput && !hasKey) {
    aiApiKeyInput.value = '';
  }
}

function serializeNodeHierarchy(node) {
  if (!node) return null;
  const res = {
    id: node.id
  };
  if (Array.isArray(node.keys) && node.keys.length > 0) {
    res.keys = [...node.keys];
  } else if (node.key !== null && node.key !== undefined) {
    res.keys = [node.key];
  } else {
    res.keys = [];
  }
  if (node.isLeaf !== undefined) res.isLeaf = node.isLeaf;
  if (node.height !== undefined) res.height = node.height;
  if (node.color !== undefined) res.color = node.color;
  if (node.sValue !== undefined) res.sValue = node.sValue;
  if (node.degree !== undefined) res.degree = node.degree;
  if (node.marked !== undefined) res.marked = node.marked;
  if (node.heapSide) res.heapSide = node.heapSide;
  if (node.isDeapRoot) res.isDeapRoot = true;

  const children = node.children || [];
  if (children.length > 0) {
    res.children = children.map(serializeNodeHierarchy).filter(Boolean);
  }
  return res;
}

function compileLiveTreeContext() {
  const tree = getActiveTree();
  const def = STRUCTURE_DEFS[currentStructure] || {};
  const stats = tree.getStats ? tree.getStats() : {};
  const currentStep = (controller && controller.steps && controller.currentStepIndex >= 0) 
    ? controller.steps[controller.currentStepIndex] 
    : null;
  const stepIdx = controller ? controller.currentStepIndex : -1;
  const totalSteps = controller && controller.steps ? controller.steps.length : 0;

  // 1. Structure metadata & configuration
  const structureMeta = {
    name: def.name,
    title: def.title,
    category: ['minheap', 'maxheap', 'deap', 'leftist', 'skew', 'binomial', 'lazybinomial', 'fibonacci'].includes(currentStructure) ? 'Unit-2 Heaps' : 'Trees',
    keyType: currentKeyType,
    orderM: tree.M || null,
    deletionStrategy: tree.deletionStrategy || null,
    stats: {
      totalKeys: stats.totalKeys ?? stats.totalWords ?? 0,
      totalNodes: stats.totalNodes ?? stats.totalKeys ?? 0,
      heightOrDepth: stats.height ?? stats.levels ?? 0
    }
  };

  // 2. Exact current step details
  let stepDetails = null;
  if (currentStep) {
    stepDetails = {
      stepNumber: stepIdx + 1,
      totalSteps: totalSteps,
      title: currentStep.title || 'Step',
      actionCategory: currentStep.actionCategory || 'general',
      actionDescription: currentStep.action || currentStep.reason || '',
      algorithmicRule: currentStep.rule || '',
      explanationTip: currentStep.tip || '',
      targetKeys: currentStep.targetKeys || [],
      highlightNodeIds: currentStep.highlightNodeIds || []
    };
  }

  // 3. Complete hierarchical tree JSON
  let treeJson = null;
  if (currentStep && currentStep.treeSnapshot) {
    treeJson = serializeNodeHierarchy(currentStep.treeSnapshot);
  } else if (tree && typeof tree.toJSON === 'function') {
    treeJson = tree.toJSON();
  }

  // 4. Special array layouts for Heaps
  let arrayRepresentation = null;
  if (['minheap', 'maxheap'].includes(currentStructure)) {
    arrayRepresentation = {
      indexing: '1-based A[1..N]',
      array: (tree.heap || []).map((val, idx) => ({ index: idx + 1, key: val, parentIndex: Math.floor((idx + 1) / 2) || null }))
    };
  } else if (currentStructure === 'deap') {
    const deapArr = tree.deap || tree.arr || [];
    arrayRepresentation = {
      indexing: '1-based starting at index 2 (root at index 1 is empty)',
      array: deapArr.slice(2).map((val, idx) => ({ index: idx + 2, key: val, side: (tree._isMinSubtree ? tree._isMinSubtree(idx + 2) : idx + 2 < 4) ? 'min-subtree' : 'max-subtree' }))
    };
  }

  // 5. Invariants validation status
  const invariants = tree.validateInvariants ? tree.validateInvariants() : [];

  const fullPayload = {
    dataStructure: structureMeta,
    activeStep: stepDetails || "No animation currently active (Canvas is idle/ready)",
    treeJson: treeJson,
    ...(arrayRepresentation ? { heapArrayLayout: arrayRepresentation } : {}),
    invariants: invariants
  };

  return JSON.stringify(fullPayload, null, 2);
}

// ponytail: lightweight safe markdown parser without external libraries
function formatAiMarkdown(text) {
  if (!text) return '';
  let escaped = escapeHtml(text);

  // Code blocks: ```lang\ncode\n```
  escaped = escaped.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);

  // Inline code: `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold: **text**
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italics: *text*
  escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Bullet points: lines starting with - or *
  const lines = escaped.split('\n');
  let inList = false;
  let formatted = '';

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        formatted += '<ul>';
        inList = true;
      }
      formatted += `<li>${trimmed.substring(2)}</li>`;
    } else {
      if (inList) {
        formatted += '</ul>';
        inList = false;
      }
      if (trimmed.length > 0) {
        formatted += `<p>${trimmed}</p>`;
      }
    }
  }
  if (inList) formatted += '</ul>';

  return formatted;
}

function appendUserMessage(text) {
  if (!aiChatContainer) return;
  const msgEl = document.createElement('div');
  msgEl.className = 'ai-message ai-message-user';
  msgEl.innerHTML = `
    <div class="ai-avatar">👤</div>
    <div class="ai-bubble">${formatAiMarkdown(text)}</div>
  `;
  aiChatContainer.appendChild(msgEl);
  aiChatContainer.scrollTop = aiChatContainer.scrollHeight;
}

function appendBotMessage(text) {
  if (!aiChatContainer) return;
  const msgEl = document.createElement('div');
  msgEl.className = 'ai-message ai-message-bot';
  msgEl.innerHTML = `
    <div class="ai-avatar">🤖</div>
    <div class="ai-bubble">${formatAiMarkdown(text)}</div>
  `;
  aiChatContainer.appendChild(msgEl);
  aiChatContainer.scrollTop = aiChatContainer.scrollHeight;
}

function appendTypingIndicator() {
  if (!aiChatContainer) return null;
  const msgEl = document.createElement('div');
  msgEl.className = 'ai-message ai-message-bot ai-typing-msg';
  msgEl.innerHTML = `
    <div class="ai-avatar">🤖</div>
    <div class="ai-bubble">
      <div class="ai-typing-dots">
        <span class="ai-typing-dot"></span>
        <span class="ai-typing-dot"></span>
        <span class="ai-typing-dot"></span>
      </div>
    </div>
  `;
  aiChatContainer.appendChild(msgEl);
  aiChatContainer.scrollTop = aiChatContainer.scrollHeight;
  return msgEl;
}

async function sendAiMessage(userText) {
  const trimmed = userText.trim();
  if (!trimmed) return;

  const apiKey = getStoredApiKey();
  if (!apiKey) {
    appendUserMessage(trimmed);
    appendBotMessage("⚠️ **Google Gemini API Key Required**\nPlease paste your Gemini API key in the configuration box above and click **Save Key**. Your key is stored solely in your local browser and is never sent to any external server other than Google's official API.");
    return;
  }

  const model = getSelectedModel();
  appendUserMessage(trimmed);
  if (aiChatInput) aiChatInput.value = '';

  const typingEl = appendTypingIndicator();

  try {
    const liveContextJson = compileLiveTreeContext();
    const systemPrompt = `You are Antigravity's Data Structures & Algorithms Professor and Exam Tutor.
You are helping an undergraduate computer science student understand advanced trees and heaps (CLRS / Cormen, Sahni, Weiss) for university examinations.

Below is the COMPLETE LIVE CONTEXT in JSON format, containing the full tree hierarchy (every root, key, child node, pointer, color/degree/s-value), invariant validations, and the exact step currently happening:

\`\`\`json
${liveContextJson}
\`\`\`

Instructions for your response:
1. Treat the JSON data above as the exact ground truth for all keys, node IDs, parent-child relationships, and animation states.
2. Directly answer the student's question clearly and concisely.
3. Reference the exact keys, node IDs, and children from the JSON tree when explaining transformations (e.g. why a node split, why an AVL rotation occurred, how children were linked in a binomial tree, or why leftist heap swapped children).
4. Provide exam-ready theoretical justification (time complexity, balance factor, invariant check) whenever relevant.`;

    // Compile message contents including last 4 turns of conversation
    const contents = [];
    const recent = aiConversationHistory.slice(-4);
    for (const m of recent) {
      contents.push(m);
    }
    contents.push({
      role: 'user',
      parts: [{ text: trimmed }]
    });

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1200
      }
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (typingEl) typingEl.remove();

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `HTTP ${response.status} ${response.statusText}`;
      if (response.status === 400 && errMsg.includes('API_KEY')) {
        appendBotMessage("❌ **Invalid API Key**: Google rejected this API key. Please re-enter a valid key from [Google AI Studio](https://aistudio.google.com/app/apikey).");
      } else if (response.status === 429) {
        appendBotMessage("⏳ **Quota / Rate Limit**: Google Gemini API quota exceeded. Please wait a few seconds or choose another model from the dropdown above.");
      } else {
        appendBotMessage(`⚠️ **Gemini API Error (${response.status})**: ${errMsg}`);
      }
      return;
    }

    const data = await response.json();
    const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to analyze this step.";

    aiConversationHistory.push({ role: 'user', parts: [{ text: trimmed }] });
    aiConversationHistory.push({ role: 'model', parts: [{ text: botText }] });

    appendBotMessage(botText);
  } catch (err) {
    if (typingEl) typingEl.remove();
    appendBotMessage(`❌ **Network Error**: Unable to reach Google Gemini API (${err.message || 'Check your internet connection'}).`);
  }
}

function setupAiTutor() {
  // 1. Initialize Saved API Key & Model
  const savedModel = getStoredModel();
  if (aiModelSelect) {
    const optExists = Array.from(aiModelSelect.options).some(o => o.value === savedModel);
    if (optExists) {
      aiModelSelect.value = savedModel;
    } else {
      aiModelSelect.value = 'custom';
      if (aiCustomModelInput) {
        aiCustomModelInput.style.display = 'block';
        aiCustomModelInput.value = savedModel;
      }
    }

    updateModelDescription(aiModelSelect.value);

    aiModelSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      updateModelDescription(val);
      if (val === 'custom') {
        if (aiCustomModelInput) aiCustomModelInput.style.display = 'block';
      } else {
        if (aiCustomModelInput) aiCustomModelInput.style.display = 'none';
        setStoredModel(val);
      }
    });
  }

  if (aiCustomModelInput) {
    aiCustomModelInput.addEventListener('input', (e) => {
      setStoredModel(e.target.value.trim());
    });
  }

  updateApiKeyUi();

  // 2. Save Key Button
  btnSaveApiKey?.addEventListener('click', () => {
    const val = (aiApiKeyInput?.value || '').trim();
    if (!val) {
      showToast('Please paste a valid Gemini API key', 'warning');
      return;
    }
    setStoredApiKey(val);
    updateApiKeyUi();
    showToast('Gemini API key saved in browser storage', 'success');
  });

  // 3. Toggle Visibility
  btnToggleKeyVisibility?.addEventListener('click', () => {
    if (aiApiKeyInput) {
      aiApiKeyInput.type = aiApiKeyInput.type === 'password' ? 'text' : 'password';
      btnToggleKeyVisibility.textContent = aiApiKeyInput.type === 'password' ? '👁️' : '🔒';
    }
  });

  // 4. Change Key
  btnChangeApiKey?.addEventListener('click', () => {
    if (aiKeyInputSection && aiKeySavedSection) {
      aiKeyInputSection.style.display = 'flex';
      aiKeySavedSection.style.display = 'none';
      if (aiApiKeyInput) {
        aiApiKeyInput.value = getStoredApiKey();
        aiApiKeyInput.focus();
      }
    }
  });

  // 5. Remove Key
  btnClearApiKey?.addEventListener('click', () => {
    removeStoredApiKey();
    updateApiKeyUi();
    showToast('API key removed', 'info');
  });

  // 6. Chat Submit
  aiChatForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = aiChatInput ? aiChatInput.value : '';
    sendAiMessage(q);
  });

  // 7. Clear Chat
  btnAiClearChat?.addEventListener('click', () => {
    aiConversationHistory = [];
    if (aiChatContainer) {
      aiChatContainer.innerHTML = `
        <div class="ai-message ai-message-bot">
          <div class="ai-avatar">🤖</div>
          <div class="ai-bubble">
            <p><strong>Chat cleared!</strong></p>
            <p>I still have live access to your canvas and step state. Ask me anything about this tree!</p>
          </div>
        </div>
      `;
    }
  });

  // 8. Quick Chips
  if (aiQuickChips) {
    aiQuickChips.querySelectorAll('.ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        if (prompt) {
          sendAiMessage(prompt);
        }
      });
    });
  }

  // 9. Top Nav "Ask AI" Shortcut
  btnNavAskAi?.addEventListener('click', () => {
    // Switch to AI tab
    const aiTabBtn = document.querySelector('.sidebar-tab-btn[data-pane="ai"]');
    if (aiTabBtn) {
      sidebarTabButtons.forEach(b => b.classList.remove('active'));
      sidebarPanes.forEach(p => p.classList.remove('active'));
      aiTabBtn.classList.add('active');
      if (paneAi) paneAi.classList.add('active');
    }
    if (sidebar && !sidebar.classList.contains('open')) {
      sidebar.classList.add('open');
    }
    if (aiChatInput) {
      aiChatInput.focus();
    }
  });
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

  // 1b. Topic Dropdowns
  setupTopicDropdowns();

  // 1c. Tool Modals (Quiz, Compare, Exam Export)
  setupQuizMode();
  setupCompareMode();
  setupExamExport();

  // 1d. AI Tutor Setup
  setupAiTutor();

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

  // 3b. Key Type Buttons (Numbers / Alphabets)
  if (btnKeyTypeNum) {
    btnKeyTypeNum.addEventListener('click', () => applyKeyType('numeric'));
  }
  if (btnKeyTypeAlpha) {
    btnKeyTypeAlpha.addEventListener('click', () => applyKeyType('alphabetic'));
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
