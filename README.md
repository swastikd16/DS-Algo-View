# DS-Algo-View 🌳⚡

An interactive, animated visualizer and learning platform for complex tree data structures.

[![JavaScript](https://img.shields.io/badge/Vanilla-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Overview

**DS-Algo-View** is built to make understanding advanced tree algorithms effortless. Rather than staring at static diagrams or dry textbook pseudocode, this tool lets you watch operations unfold step-by-step with real-time animations, on-screen callouts, and intuitive explanations.

---

## ✨ Key Features

- **7 Tree Visualizers**:
  - **B-Tree** (with toggle for Cormen/CLRS Top-Down vs Standard Bottom-Up deletion)
  - **B+ Tree** (index & data leaves with sequential pointers)
  - **AVL Tree** (self-balancing with rotation tracking)
  - **Red-Black Tree** (color balancing, rotations, and invariant checks)
  - **Splay Tree** (self-adjusting access rotations)
  - **M-Way Search Tree** (multi-key node branching)
  - **Trie** (prefix tree word autocomplete)

- **Beginner-Friendly Narration**: Every step provides clear, plain-English explanations breaking down *What We're Doing*, *The Rule*, and an *Analogy*.
- **Interactive Scrubber & Speed Controls**: Play, pause, step forward/backward, or jump to any step in the operation history.
- **On-Canvas Floating Callouts**: Interactive step cards point directly to active nodes as they split, rotate, or rebalance.
- **Manual Edit Mode**: Drag & drop keys directly on the canvas to build and experiment with custom tree shapes.
- **Undo / Redo & Auto-Save**: Seamless state history with browser persistence across reloads.
- **No Build Tools Required**: Pure Vanilla JavaScript, HTML5, and CSS with zero external dependencies.

---

## 🚀 Quick Start

Run locally with any static web server:

```bash
# Clone the repository
git clone https://github.com/swastikd16/DS-Algo-View.git

# Enter project directory
cd DS-Algo-View

# Start local server
node server.js
```

Open `http://localhost:3000` in your browser.

*(You can also use VS Code Live Server or simply open `index.html` directly.)*

---

## 📜 License

MIT License. Free to use for education, teaching, and study.
