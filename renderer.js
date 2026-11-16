/**
 * B-Tree Visual Renderer
 * Computes non-overlapping subtree coordinates, draws authentic B-Tree pointer connectors,
 * renders interactive animated key nodes, and renders contextual floating on-canvas callout popups.
 */

export class BTreeRenderer {
  constructor(canvasContainer, svgElement, nodesLayer) {
    this.container = canvasContainer;
    this.svg = svgElement;
    this.nodesLayer = nodesLayer;

    // Layout configuration
    this.keyWidth = 46;
    this.keyHeight = 40;
    this.nodePadding = 6;
    this.levelGap = 120;
    this.siblingGap = 32;

    // Viewport transform (Pan & Zoom)
    this.scale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;

    this.isEditMode = false;
    this.editCallbacks = null;

    this.setupPanAndZoom();
  }

  setEditMode(enabled, callbacks = {}) {
    this.isEditMode = enabled;
    this.editCallbacks = callbacks;
  }

  setupPanAndZoom() {
    this.container.addEventListener('mousedown', (e) => {
      if (e.target.closest('.btree-node') || e.target.closest('.no-pan')) return;
      this.isPanning = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      this.container.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPanning) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this.applyTransform();
    });

    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.container.style.cursor = 'grab';
      }
    });

    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      const rect = this.container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let newScale = e.deltaY < 0 ? this.scale * zoomFactor : this.scale / zoomFactor;
      newScale = Math.min(Math.max(0.2, newScale), 3.0);

      this.panX = mouseX - (mouseX - this.panX) * (newScale / this.scale);
      this.panY = mouseY - (mouseY - this.panY) * (newScale / this.scale);
      this.scale = newScale;

      this.applyTransform();
    }, { passive: false });
  }

  applyTransform() {
    const transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    this.svg.style.transform = transform;
    this.nodesLayer.style.transform = transform;
    this.svg.style.transformOrigin = '0 0';
    this.nodesLayer.style.transformOrigin = '0 0';
  }

  resetView(rootNode = null) {
    if (!rootNode || rootNode.keys.length === 0) {
      this.scale = 1.0;
      this.panX = (this.container.clientWidth / 2) - 80;
      this.panY = 80;
    } else {
      this.fitToScreen(rootNode);
    }
    this.applyTransform();
  }

  fitToScreen(rootNode) {
    if (!rootNode) return;
    this.computeLayout(rootNode);
    const bounds = this.getTreeBounds(rootNode);
    const containerW = this.container.clientWidth;
    const containerH = this.container.clientHeight;

    const treeW = bounds.maxX - bounds.minX + 140;
    const treeH = bounds.maxY - bounds.minY + 140;

    const scaleX = containerW / treeW;
    const scaleY = containerH / treeH;
    this.scale = Math.min(Math.max(Math.min(scaleX, scaleY) * 0.88, 0.35), 1.25);

    this.panX = (containerW - treeW * this.scale) / 2 - bounds.minX * this.scale + 70 * this.scale;
    this.panY = 70;
    this.applyTransform();
  }

  getTreeBounds(node) {
    if (node.isForest) {
      const validChildren = (node.children || []).filter(Boolean);
      if (validChildren.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const traverse = (n) => {
        if (!n) return;
        if (n._x < minX) minX = n._x;
        if (n._x + n._nodeWidth > maxX) maxX = n._x + n._nodeWidth;
        if (n._y < minY) minY = n._y;
        if (n._y + this.keyHeight > maxY) maxY = n._y + this.keyHeight;
        const valid = (n.children || []).filter(Boolean);
        for (const child of valid) traverse(child);
      };
      validChildren.forEach(traverse);
      return { minX, maxX, minY, maxY };
    }

    let minX = node._x;
    let maxX = node._x + node._nodeWidth;
    let minY = node._y;
    let maxY = node._y + this.keyHeight;

    const traverse = (n) => {
      if (!n) return;
      if (n._x < minX) minX = n._x;
      if (n._x + n._nodeWidth > maxX) maxX = n._x + n._nodeWidth;
      if (n._y + this.keyHeight > maxY) maxY = n._y + this.keyHeight;
      const validChildren = (n.children || []).filter(Boolean);
      for (const child of validChildren) {
        traverse(child);
      }
    };
    traverse(node);
    return { minX, maxX, minY, maxY };
  }

  /**
   * Layout calculation:
   * Pass 1: Compute widths bottom-up
   * Pass 2: Assign (x, y) coordinates top-down
   */
  computeLayout(root) {
    if (!root) return;

    const extraEditW = this.isEditMode ? 38 : 0;
    const currentLevelGap = this.isEditMode ? 120 : this.levelGap;

    const computeWidths = (node) => {
      if (node.isForest) {
        const validChildren = (node.children || []).filter(Boolean);
        let totalChildWidth = 0;
        for (let i = 0; i < validChildren.length; i++) {
          computeWidths(validChildren[i]);
          totalChildWidth += validChildren[i]._subtreeWidth;
        }
        totalChildWidth += Math.max(0, validChildren.length - 1) * (this.siblingGap + 24);
        node._subtreeWidth = Math.max(60, totalChildWidth);
        node._nodeWidth = 0;
        return;
      }

      const keysCount = Math.max((node.keys || []).length, 1);
      node._nodeWidth = Math.max(keysCount * this.keyWidth + this.nodePadding * 2 + extraEditW, this.isEditMode ? 90 : 60);

      const validChildren = (node.children || []).filter(Boolean);
      if (node.isLeaf || validChildren.length === 0) {
        node._subtreeWidth = node._nodeWidth;
      } else {
        let totalChildWidth = 0;
        for (let i = 0; i < validChildren.length; i++) {
          computeWidths(validChildren[i]);
          totalChildWidth += validChildren[i]._subtreeWidth;
        }
        totalChildWidth += (validChildren.length - 1) * this.siblingGap;
        node._subtreeWidth = Math.max(node._nodeWidth, totalChildWidth);
      }
    };

    const assignCoordinates = (node, leftX, depth) => {
      if (node.isForest) {
        node._x = leftX;
        node._y = 40;
        const validChildren = (node.children || []).filter(Boolean);
        let currentChildLeft = leftX;
        for (let i = 0; i < validChildren.length; i++) {
          const child = validChildren[i];
          assignCoordinates(child, currentChildLeft, 0);
          currentChildLeft += child._subtreeWidth + this.siblingGap + 24;
        }
        return;
      }

      node._y = depth * currentLevelGap + 40;
      const validChildren = (node.children || []).filter(Boolean);

      if (node.isLeaf || validChildren.length === 0) {
        node._x = leftX + (node._subtreeWidth - node._nodeWidth) / 2;
      } else {
        node._x = leftX + (node._subtreeWidth - node._nodeWidth) / 2;

        let currentChildLeft = leftX;
        let totalChildrenSpan = 0;
        for (const child of validChildren) {
          totalChildrenSpan += child._subtreeWidth;
        }
        totalChildrenSpan += (validChildren.length - 1) * this.siblingGap;

        if (node._subtreeWidth > totalChildrenSpan) {
          currentChildLeft += (node._subtreeWidth - totalChildrenSpan) / 2;
        }

        for (let i = 0; i < validChildren.length; i++) {
          const child = validChildren[i];
          assignCoordinates(child, currentChildLeft, depth + 1);
          currentChildLeft += child._subtreeWidth + this.siblingGap;
        }
      }
    };

    computeWidths(root);
    assignCoordinates(root, 0, 0);
  }

  /**
   * Render Tree from snapshot with active step highlights and on-screen callouts
   */
  render(rootSnapshot, stepInfo = {}) {
    this.svg.innerHTML = '';
    this.nodesLayer.innerHTML = '';

    const rootKeys = (rootSnapshot && rootSnapshot.keys) ? rootSnapshot.keys : [];
    const rootChildren = (rootSnapshot && rootSnapshot.children) ? (rootSnapshot.children || []).filter(Boolean) : [];
    if (!rootSnapshot || (rootKeys.length === 0 && rootChildren.length === 0)) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-tree-placeholder no-pan';
      if (this.isEditMode) {
        emptyMsg.innerHTML = `
          <div class="empty-icon">🛠️</div>
          <h3>Tree is Empty</h3>
          <p>You are in Manual Edit Mode. Create a root node to begin building your custom B-Tree.</p>
          <button id="btnCreateRootNode" class="btn btn-primary" style="margin-top: 12px; pointer-events: auto;">
            + Create Root Node
          </button>
        `;
        const createBtn = emptyMsg.querySelector('#btnCreateRootNode');
        if (createBtn) {
          createBtn.addEventListener('click', () => {
            if (this.editCallbacks && this.editCallbacks.onCreateRoot) {
              this.editCallbacks.onCreateRoot();
            }
          });
        }
      } else {
        emptyMsg.innerHTML = `
          <div class="empty-icon">🌳</div>
          <h3>Tree is Empty</h3>
          <p>Insert a single key or batch array above, or click "Manual Edit" to build your own tree.</p>
        `;
      }
      this.nodesLayer.appendChild(emptyMsg);
      return;
    }

    this.computeLayout(rootSnapshot);

    const highlightNodeIds = new Set(stepInfo.highlightNodeIds || []);
    const highlightKeyIndices = stepInfo.highlightKeyIndices || {};
    const statusType = stepInfo.statusType || 'info';
    const actionCategory = stepInfo.actionCategory || 'general';
    const popupMessage = stepInfo.popupMessage || '';
    const meta = stepInfo.meta || {};

    // 1. Setup SVG markers and draw connectors
    this.setupSvgDefs();
    this.drawConnectors(rootSnapshot, highlightNodeIds);
    this.drawBPlusLeafChain(rootSnapshot);

    // 2. Draw Nodes with key chips
    this.drawNodes(rootSnapshot, highlightNodeIds, highlightKeyIndices, statusType, actionCategory, meta);

    // 3. Render On-Screen Contextual Callout Popup anchored at active node
    if (popupMessage && highlightNodeIds.size > 0) {
      this.renderOnScreenPopup(rootSnapshot, highlightNodeIds, stepInfo);
    }
  }

  setupSvgDefs() {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="bplus-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 8 5 L 0 9 z" fill="#0284c7" />
      </marker>
    `;
    this.svg.appendChild(defs);
  }

  drawBPlusLeafChain(rootSnapshot) {
    if (!rootSnapshot) return;
    const leaves = [];
    const collect = (n) => {
      if (!n) return;
      if (n.isLeaf) leaves.push(n);
      else {
        const validChildren = (n.children || []).filter(Boolean);
        for (const c of validChildren) collect(c);
      }
    };
    collect(rootSnapshot);

    const isBPlus = leaves.some(l => l.next || l.nextId || (l.id && l.id.startsWith('bp_')));
    if (isBPlus && leaves.length > 1) {
      for (let i = 0; i < leaves.length - 1; i++) {
        const l1 = leaves[i];
        const l2 = leaves[i + 1];
        const sx = l1._x + l1._nodeWidth + 2;
        const sy = l1._y + (this.keyHeight / 2);
        const ex = l2._x - 6;
        const ey = l2._y + (this.keyHeight / 2);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const cx1 = sx + 16;
        const cy1 = sy - 14;
        const cx2 = ex - 16;
        const cy2 = ey - 14;
        path.setAttribute('d', `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${ex} ${ey}`);
        path.setAttribute('class', 'bplus-leaf-link');
        path.setAttribute('marker-end', 'url(#bplus-arrow)');
        this.svg.appendChild(path);
      }
    }
  }

  drawConnectors(node, highlightNodeIds) {
    if (!node) return;
    if (node.isForest) {
      const validRoots = (node.children || []).filter(Boolean);
      for (let i = 0; i < validRoots.length - 1; i++) {
        const r1 = validRoots[i];
        const r2 = validRoots[i + 1];
        const sx = r1._x + r1._nodeWidth + 2;
        const sy = r1._y + (this.keyHeight / 2);
        const ex = r2._x - 6;
        const ey = r2._y + (this.keyHeight / 2);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${sx} ${sy} L ${ex} ${ey}`);
        path.setAttribute('class', 'forest-root-link');
        this.svg.appendChild(path);
      }
      for (const child of validRoots) {
        this.drawConnectors(child, highlightNodeIds);
      }
      return;
    }
    if (node.isLeaf) return;
    const validChildren = (node.children || []).filter(Boolean);
    if (validChildren.length === 0) return;

    const numChildren = validChildren.length;
    const numKeys = (node.keys || []).length;

    for (let i = 0; i < numChildren; i++) {
      const child = validChildren[i];
      if (!child) continue;

      let startX;
      if (numChildren === 2 && numKeys === 1) {
        // Binary tree: left child exits from left side, right child exits from right side
        startX = (i === 0) 
          ? node._x + this.nodePadding + (this.keyWidth * 0.25)
          : node._x + node._nodeWidth - this.nodePadding - (this.keyWidth * 0.25);
      } else if (i === 0) {
        startX = node._x + this.nodePadding + (this.keyWidth * 0.25);
      } else if (i === numKeys) {
        startX = node._x + this.nodePadding + (numKeys * this.keyWidth) - (this.keyWidth * 0.25);
      } else {
        startX = node._x + this.nodePadding + (i * this.keyWidth);
      }

      const startY = node._y + this.keyHeight + this.nodePadding;
      const endX = child._x + (child._nodeWidth / 2);
      const endY = child._y;

      const controlY1 = startY + (endY - startY) * 0.45;
      const controlY2 = endY - (endY - startY) * 0.45;

      const pathData = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('class', 'tree-connector');

      const isHighlighted = highlightNodeIds.has(node.id) && highlightNodeIds.has(child.id);
      if (isHighlighted) {
        path.classList.add('connector-highlight');
      }

      this.svg.appendChild(path);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', startX);
      circle.setAttribute('cy', startY);
      circle.setAttribute('r', '3');
      circle.setAttribute('class', isHighlighted ? 'connector-dot-highlight' : 'connector-dot');
      this.svg.appendChild(circle);

      // Render Trie character edge badge if edge has character
      if (child.char && child.char !== 'ROOT') {
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        labelGroup.setAttribute('class', 'trie-edge-label-group');

        const circleBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circleBg.setAttribute('cx', midX);
        circleBg.setAttribute('cy', midY);
        circleBg.setAttribute('r', '10');
        circleBg.setAttribute('class', 'trie-edge-circle');
        labelGroup.appendChild(circleBg);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', midX);
        text.setAttribute('y', midY + 4);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'trie-edge-text');
        text.textContent = child.char;
        labelGroup.appendChild(text);

        this.svg.appendChild(labelGroup);
      }

      this.drawConnectors(child, highlightNodeIds);
    }
  }

  drawNodes(node, highlightNodeIds, highlightKeyIndices, statusType, actionCategory, meta) {
    if (!node) return;
    if (node.isForest) {
      const validChildren = (node.children || []).filter(Boolean);
      for (const child of validChildren) {
        this.drawNodes(child, highlightNodeIds, highlightKeyIndices, statusType, actionCategory, meta);
      }
      return;
    }

    const nodeEl = document.createElement('div');
    nodeEl.className = 'btree-node';
    nodeEl.id = `rendered-${node.id}`;
    nodeEl.style.left = `${node._x}px`;
    nodeEl.style.top = `${node._y}px`;
    nodeEl.style.minWidth = `${node._nodeWidth}px`;

    if (this.isEditMode) {
      nodeEl.classList.add('editable-node');

      // Drop target event listeners
      nodeEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        nodeEl.classList.add('drop-target-active');
      });

      nodeEl.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        nodeEl.classList.remove('drop-target-active');
      });

      nodeEl.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        nodeEl.classList.remove('drop-target-active');
        try {
          const raw = e.dataTransfer.getData('text/plain');
          if (!raw) return;
          const data = JSON.parse(raw);
          if (data && this.editCallbacks && this.editCallbacks.onMoveKey) {
            this.editCallbacks.onMoveKey(data.sourceNodeId, data.keyIndex, node.id);
          }
        } catch (err) {
          console.error("Drop parsing error:", err);
        }
      });
    }

    const isNodeHighlighted = highlightNodeIds.has(node.id);
    if (isNodeHighlighted) {
      nodeEl.classList.add('node-highlighted');
      nodeEl.classList.add(`status-${statusType}`);
      nodeEl.classList.add(`action-${actionCategory}`);
    }

    if (node.isLeaf) {
      nodeEl.classList.add('node-leaf');
    } else {
      nodeEl.classList.add('node-internal');
    }

    if (node.color === 'RED') {
      nodeEl.classList.add('node-rb-red');
    } else if (node.color === 'BLACK') {
      nodeEl.classList.add('node-rb-black');
    }

    if (node.isMinRoot) {
      nodeEl.classList.add('node-min-root');
      const minTag = document.createElement('div');
      minTag.className = 'node-action-tag tag-min-root';
      minTag.innerHTML = `<span>★ Min Root</span>`;
      nodeEl.appendChild(minTag);
    }

    if (node.isDeapRoot) {
      nodeEl.classList.add('node-deap-root');
    } else if (node.heapSide === 'min') {
      nodeEl.classList.add('node-deap-min');
    } else if (node.heapSide === 'max') {
      nodeEl.classList.add('node-deap-max');
    }

    if (node.marked) {
      nodeEl.classList.add('node-fib-marked');
    }

    // Action banner for specific operations
    if (isNodeHighlighted) {
      if (actionCategory === 'split' && meta.medianKey !== undefined && meta.overflowNodeId === node.id) {
        const splitTag = document.createElement('div');
        splitTag.className = 'node-action-tag tag-split';
        splitTag.innerHTML = `<span>⚡ Median ${meta.medianKey} ↑</span>`;
        nodeEl.appendChild(splitTag);
      } else if (actionCategory === 'borrow') {
        const borrowTag = document.createElement('div');
        borrowTag.className = 'node-action-tag tag-borrow';
        borrowTag.innerHTML = `<span>🔄 Borrow Rotation</span>`;
        nodeEl.appendChild(borrowTag);
      } else if (actionCategory === 'merge') {
        const mergeTag = document.createElement('div');
        mergeTag.className = 'node-action-tag tag-merge';
        mergeTag.innerHTML = `<span>⇥ ⇤ Merging</span>`;
        nodeEl.appendChild(mergeTag);
      } else if (actionCategory === 'rotate') {
        const rotateTag = document.createElement('div');
        rotateTag.className = 'node-action-tag tag-rotate';
        rotateTag.innerHTML = `<span>🔄 Balanced Rotation</span>`;
        nodeEl.appendChild(rotateTag);
      } else if (actionCategory === 'recolor') {
        const recolorTag = document.createElement('div');
        recolorTag.className = 'node-action-tag tag-recolor';
        recolorTag.innerHTML = `<span>🎨 Color Recolor</span>`;
        nodeEl.appendChild(recolorTag);
      } else if (actionCategory === 'splay') {
        const splayTag = document.createElement('div');
        splayTag.className = 'node-action-tag tag-splay';
        splayTag.innerHTML = `<span>🚀 Splay Rotation</span>`;
        nodeEl.appendChild(splayTag);
      }
    }

    // Keys container
    const keysContainer = document.createElement('div');
    keysContainer.className = 'keys-container';

    const highlightedKeys = highlightKeyIndices[node.id] || [];

    node.keys.forEach((key, idx) => {
      const keyChip = document.createElement('div');
      keyChip.className = 'key-cell';
      keyChip.dataset.key = key;
      keyChip.dataset.index = idx;

      if (key === 'ROOT') {
        keyChip.classList.add('key-trie-root');
      }

      const keyValSpan = document.createElement('span');
      keyValSpan.className = 'key-value-text';
      keyValSpan.textContent = key;
      keyChip.appendChild(keyValSpan);

      if (isNodeHighlighted && highlightedKeys.includes(idx)) {
        keyChip.classList.add('key-highlighted');
        keyChip.classList.add(`key-${statusType}`);

        if (actionCategory === 'split') {
          keyChip.classList.add('key-split-median');
        }
      }

      // Drag & Drop and manual edit in edit mode
      if (this.isEditMode) {
        keyChip.setAttribute('draggable', 'true');
        keyChip.classList.add('draggable-key');
        keyChip.title = "Drag to move key | Click to edit value";

        keyChip.addEventListener('dragstart', (e) => {
          e.stopPropagation();
          e.dataTransfer.setData('text/plain', JSON.stringify({
            sourceNodeId: node.id,
            keyIndex: idx,
            key: key
          }));
          keyChip.classList.add('key-dragging');
        });

        keyChip.addEventListener('dragend', () => {
          keyChip.classList.remove('key-dragging');
          document.querySelectorAll('.drop-target-active').forEach(el => el.classList.remove('drop-target-active'));
        });

        // Quick delete cross
        const delCross = document.createElement('span');
        delCross.className = 'key-del-cross no-pan';
        delCross.textContent = '×';
        delCross.title = 'Remove key';
        delCross.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.editCallbacks && this.editCallbacks.onRemoveKey) {
            this.editCallbacks.onRemoveKey(node.id, idx);
          }
        });
        keyChip.appendChild(delCross);

        // Click to edit
        keyChip.addEventListener('click', (e) => {
          if (e.target.classList.contains('key-del-cross')) return;
          if (this.editCallbacks && this.editCallbacks.onEditKey) {
            this.editCallbacks.onEditKey(node.id, idx, key);
          }
        });
      }

      keysContainer.appendChild(keyChip);
    });

    // In edit mode: Add "+ Key" button inside the keys container
    if (this.isEditMode) {
      const addKeyBtn = document.createElement('button');
      addKeyBtn.className = 'node-add-key-inline no-pan';
      addKeyBtn.textContent = '+';
      addKeyBtn.title = 'Add a key to this node';
      addKeyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.editCallbacks && this.editCallbacks.onAddKey) {
          this.editCallbacks.onAddKey(node.id);
        }
      });
      keysContainer.appendChild(addKeyBtn);
    }

    const nodeMeta = document.createElement('div');
    nodeMeta.className = 'node-badge';

    if (node.color) {
      nodeMeta.innerHTML = `<span class="rb-color-chip ${node.color.toLowerCase()}">${node.color}</span>`;
    } else if (node.balanceFactor !== undefined) {
      const bfSign = node.balanceFactor > 0 ? '+' : '';
      const isHeavy = Math.abs(node.balanceFactor) > 1;
      nodeMeta.innerHTML = `<span class="avl-bf-chip ${isHeavy ? 'bf-heavy' : ''}">BF: ${bfSign}${node.balanceFactor}</span> &bull; H: ${node.height}`;
    } else if (node.isEndOfWord !== undefined) {
      nodeMeta.innerHTML = node.isEndOfWord 
        ? `<span class="trie-word-chip">✓ Word</span>` 
        : `<span class="trie-prefix-chip">prefix</span>`;
    } else if (node.isDeapRoot) {
      nodeMeta.innerHTML = `<span class="deap-root-chip">Empty Root</span>`;
    } else if (node.heapSide) {
      const isMin = node.heapSide === 'min';
      nodeMeta.innerHTML = `<span class="heap-badge-chip ${isMin ? 'chip-min' : 'chip-max'}">${isMin ? 'Min-Heap' : 'Max-Heap'}</span> &bull; [${node.heapIndex}]`;
    } else if (node.sValue !== undefined && node.degree === undefined && !node.heapIndex) {
      nodeMeta.innerHTML = `<span class="heap-badge-chip chip-leftist">s = ${node.sValue}</span>`;
    } else if (node.degree !== undefined) {
      const markTag = node.marked ? ` &bull; <span class="fib-marked-chip">● Marked</span>` : '';
      nodeMeta.innerHTML = `<span class="heap-badge-chip">deg: ${node.degree}</span>${markTag}`;
    } else if (node.heapIndex !== undefined) {
      nodeMeta.innerHTML = `<span class="heap-badge-chip">idx: [${node.heapIndex}]</span>`;
    } else {
      nodeMeta.textContent = node.isLeaf ? 'Leaf' : `Node (${node.keys.length})`;
    }

    nodeEl.appendChild(keysContainer);
    nodeEl.appendChild(nodeMeta);

    // In edit mode: Add Node Action Controls (+ Child, − Node)
    if (this.isEditMode) {
      const editBar = document.createElement('div');
      editBar.className = 'node-edit-bar no-pan';

      const addChildBtn = document.createElement('button');
      addChildBtn.className = 'node-sub-btn';
      addChildBtn.textContent = '+ Child';
      addChildBtn.title = 'Add a new child branch to this node';
      addChildBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.editCallbacks && this.editCallbacks.onAddChild) {
          this.editCallbacks.onAddChild(node.id);
        }
      });
      editBar.appendChild(addChildBtn);

      const delNodeBtn = document.createElement('button');
      delNodeBtn.className = 'node-sub-btn btn-danger-sub';
      delNodeBtn.textContent = '− Del';
      delNodeBtn.title = 'Delete this node';
      delNodeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.editCallbacks && this.editCallbacks.onRemoveNode) {
          this.editCallbacks.onRemoveNode(node.id);
        }
      });
      editBar.appendChild(delNodeBtn);

      nodeEl.appendChild(editBar);
    }

    this.nodesLayer.appendChild(nodeEl);

    // Recurse children
    const validChildren = (node.children || []).filter(Boolean);
    for (const child of validChildren) {
      this.drawNodes(child, highlightNodeIds, highlightKeyIndices, statusType, actionCategory, meta);
    }
  }

  /**
   * Render On-Screen Floating Callout directly attached to the active node
   */
  renderOnScreenPopup(root, highlightNodeIds, stepInfo) {
    // 1. Identify the high-precision target node ID
    let primaryTargetId = stepInfo.targetNodeId || null;

    if (!primaryTargetId && stepInfo.highlightKeyIndices) {
      for (const [nId, indices] of Object.entries(stepInfo.highlightKeyIndices)) {
        if (Array.isArray(indices) && indices.length > 0) {
          primaryTargetId = nId;
          break;
        }
      }
    }

    if (!primaryTargetId && stepInfo.meta) {
      primaryTargetId = stepInfo.meta.childId || stepInfo.meta.overflowNodeId || stepInfo.meta.targetNodeId || null;
    }

    // 2. Find the target node in the tree snapshot
    let targetNode = null;
    let targetParent = null;
    let isRoot = false;
    let isLeaf = false;

    // Search by primaryTargetId first
    if (primaryTargetId) {
      const findPrimary = (n, parent = null) => {
        if (!n || targetNode) return;
        if (n.id === primaryTargetId) {
          targetNode = n;
          targetParent = parent;
          isRoot = (parent === null);
          const validChildren = (n.children || []).filter(Boolean);
          isLeaf = Boolean(n.isLeaf || validChildren.length === 0);
          return;
        }
        const validChildren = (n.children || []).filter(Boolean);
        for (const child of validChildren) {
          findPrimary(child, n);
        }
      };
      findPrimary(root);
    }

    // Fallback: search for any highlighted node if primary ID was not matched
    if (!targetNode) {
      const findFallback = (n, parent = null) => {
        if (!n || targetNode) return;
        if (highlightNodeIds && highlightNodeIds.has(n.id)) {
          targetNode = n;
          targetParent = parent;
          isRoot = (parent === null);
          const validChildren = (n.children || []).filter(Boolean);
          isLeaf = Boolean(n.isLeaf || validChildren.length === 0);
          return;
        }
        const validChildren = (n.children || []).filter(Boolean);
        for (const child of validChildren) {
          findFallback(child, n);
        }
      };
      findFallback(root);
    }

    if (!targetNode) return;

    const popup = document.createElement('div');

    // Smart placement:
    // Leaf nodes: place below so parent nodes, upper levels, and connectors stay 100% visible
    // Root / internal nodes: place above where there is open clearance
    const placeBelow = isLeaf && !isRoot;
    popup.className = `node-callout-popup popup-${stepInfo.statusType || 'info'} ${placeBelow ? 'popup-below' : 'popup-above'}`;
    
    // Position callout with perfect vertical offset
    const popupX = targetNode._x + (targetNode._nodeWidth / 2);
    const popupY = placeBelow
      ? (targetNode._y + this.keyHeight + 28)
      : (targetNode._y - 12);

    popup.style.left = `${popupX}px`;
    popup.style.top = `${popupY}px`;
    popup.title = "Hover to see underlying nodes; click × to dismiss";

    const iconMap = {
      'split': '⚡',
      'borrow': '🔄',
      'merge': '🧩',
      'insert': '📥',
      'delete': '🗑️',
      'search': '🔍',
      'rotate': '🔄',
      'recolor': '🎨',
      'splay': '🚀',
      'general': '💡'
    };
    const icon = iconMap[stepInfo.actionCategory] || '💡';

    popup.innerHTML = `
      <div class="popup-arrow"></div>
      <div class="popup-header">
        <span class="popup-icon">${icon}</span>
        <span class="popup-title">${this.escapeHtml(stepInfo.title || 'Step Action')}</span>
        <button class="popup-close-btn no-pan" title="Dismiss callout" aria-label="Close">×</button>
      </div>
      <div class="popup-body">${this.escapeHtml(stepInfo.popupMessage || stepInfo.reason || '')}</div>
    `;

    // Dismiss callout on close button click
    const closeBtn = popup.querySelector('.popup-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        popup.style.display = 'none';
      });
    }

    // Hover effect: elevates covered node and parent to front & softens popup opacity
    popup.addEventListener('mouseenter', () => {
      popup.classList.add('popup-hovered');
      const targetEl = document.getElementById(`rendered-${targetNode.id}`);
      if (targetEl) targetEl.classList.add('node-front');
      if (targetParent) {
        const parentEl = document.getElementById(`rendered-${targetParent.id}`);
        if (parentEl) parentEl.classList.add('node-front');
      }
    });

    popup.addEventListener('mouseleave', () => {
      popup.classList.remove('popup-hovered');
      const targetEl = document.getElementById(`rendered-${targetNode.id}`);
      if (targetEl) targetEl.classList.remove('node-front');
      if (targetParent) {
        const parentEl = document.getElementById(`rendered-${targetParent.id}`);
        if (parentEl) parentEl.classList.remove('node-front');
      }
    });

    this.nodesLayer.appendChild(popup);
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
