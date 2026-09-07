# DS-Algo-View 🌳⚡

> An interactive, textbook-accurate, animated visualizer and learning platform for complex tree data structures.

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![JavaScript](https://img.shields.io/badge/Vanilla-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ Features

### 1. Supported Data Structures
- **B-Tree (Order M)**:
  - Cormen / CLRS (Chapter 18) Top-Down Preemptive splits & borrows/merges on descent.
  - Standard Reactive (Knuth / University DSA) Bottom-Up rebalancing on upward backtracking.
  - Interactive strategy toggle button with real-time explanation.
- **B+ Tree (Order M)**:
  - Record data stored exclusively in leaves with sequential `.next` chaining.
  - Copy-Up for leaf splits and Push-Up for routing index splits.
- **AVL Tree**:
  - Self-balancing BST tracking Balance Factors ($BF \in \{-1, 0, 1\}$).
  - All 4 rotation cases: Single LL, Single RR, Double LR, Double RL.
- **Red-Black Tree**:
  - Red-Black invariants (Root Black, No Double-Red, Equal Black-Height).
  - Case 1 (Uncle Red recolor), Case 2 (Uncle Black triangle rotation), Case 3 (Uncle Black line rotation & color swap).
- **Splay Tree**:
  - Self-adjusting BST bringing recently accessed elements to the root.
  - Zig, Zig-Zig, and Zig-Zag rotations for search, insert, and delete.
- **M-Way Search Tree**:
  - Multi-key nodes with up to $M-1$ keys and $M$ children without split constraints.
- **Trie (Prefix Tree)**:
  - Edge-labeled prefix tree with character node sharing and word end markers.

---

### 2. Algorithmic Narration Engine (3-Tier)
Every operation step is narrated using an intuitive 3-tier structure:
1. 🎯 **What We're Doing**: Concrete action referencing the exact keys and nodes currently on screen.
2. 💡 **The Rule**: The foundational DSA rule or textbook invariant without academic jargon.
3. 👶 **Beginner Tip / Analogy**: Intuitive mental hook (balance scales, accordion compression, library catalog cards, overstuffed buses).

---

### 3. Interactive UI & Controls
- **On-Screen Floating Callouts**: Contextual popups attached directly to active nodes with hover ghosting, node elevation, and quick dismiss.
- **Playback Scrubber**: Play/Pause, Step Forward/Backward, Jump to Start/End, and Speed control (0.5x to 3x).
- **Manual Edit Mode**: Drag & drop keys between nodes, add keys, or remove nodes interactively.
- **History & Persistence**: Full **Undo (Ctrl+Z)** / **Redo (Ctrl+Y)** and **localStorage** persistence across page reloads.
- **Rules Tab**: In-depth rules, invariants, and step-by-step operation cheat-sheets for each data structure.
- **Viewport Controls**: Smooth pan and zoom with mouse drag and wheel, reset zoom, and fit-to-screen.

---

## 🚀 Quick Start

### Running Locally
No build tools or bundlers required—just native ES modules:

```bash
# Clone the repository
git clone https://github.com/swastikd16/DS-Algo-View.git

# Enter project directory
cd DS-Algo-View

# Start local server (using Node.js)
node server.js
```

Open your browser and navigate to:
```
http://localhost:3000/
```

Alternatively, open `index.html` via VS Code Live Server or any static web server (`python -m http.server 3000`, `npx serve`, etc.).

---

## ☁️ Deployment on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import the **`swastikd16/DS-Algo-View`** repository from GitHub.
4. Leave all build settings at default (Static Project).
5. Click **Deploy** — your app will be live globally in seconds!

---

## 📜 License
MIT License. Free to use for education, teaching, and study.
