/**
 * Trie (Prefix Tree) Data Structure
 * 
 * Implements prefix tree for string keys:
 * - Root node representing empty string ("ROOT")
 * - Child branches for distinct character edges
 * - isEndOfWord flag designating complete stored words
 * - Step-by-step animations for insertion, deletion, and prefix searching
 */

let nextTrieNodeId = 1;
export function resetTrieNodeIdCounter() {
  nextTrieNodeId = 1;
}

export class TrieNode {
  constructor(char = '', id = null) {
    this.id = id || `trie_node_${nextTrieNodeId++}`;
    this.char = char; // '' for root
    this.isEndOfWord = false;
    this.childrenMap = new Map(); // char -> TrieNode
  }

  get isLeaf() {
    return this.childrenMap.size === 0;
  }

  get keys() {
    return [this.char === '' ? 'ROOT' : this.char];
  }

  get children() {
    // Return children sorted alphabetically
    return Array.from(this.childrenMap.values()).sort((a, b) => a.char.localeCompare(b.char));
  }

  clone() {
    const copy = new TrieNode(this.char, this.id);
    copy.isEndOfWord = this.isEndOfWord;
    for (const [ch, child] of this.childrenMap.entries()) {
      copy.childrenMap.set(ch, child.clone());
    }
    return copy;
  }
}

export class Trie {
  constructor() {
    this.root = new TrieNode('');
    this.steps = [];
  }

  cloneTree() {
    return this.root ? this.root.clone() : null;
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

  search(word) {
    this.steps = [];
    if (!word || typeof word !== 'string') return { found: false, steps: this.steps };
    word = word.trim().toLowerCase();

    this.recordStep({
      title: `Trie Search: Word "${word}"`,
      action: `Starting search for word "${word}" at root node. Traversal proceeds character by character.`,
      rule: `Trie lookup traverses one edge per character; time complexity is O(k) where k is string length.`,
      tip: `Smartphone keyboard autocomplete: each character you type follows the corresponding letter path.`,
      popupMessage: `Searching for "${word}"`,
      highlightNodeIds: [this.root.id],
      statusType: 'info',
      actionCategory: 'search'
    });

    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.childrenMap.has(ch)) {
        this.recordStep({
          title: `Search Failed: Character '${ch}' Missing`,
          action: `No edge exists for character '${ch}' from node [${curr.char || 'ROOT'}].`,
          rule: `If any character in the search word lacks a corresponding edge, the word is not present in the Trie.`,
          tip: `Dead end: no words starting with this prefix exist in the dictionary.`,
          popupMessage: `Edge '${ch}' not found`,
          highlightNodeIds: [curr.id],
          statusType: 'error',
          actionCategory: 'search'
        });
        return { found: false, steps: this.steps };
      }

      curr = curr.childrenMap.get(ch);
      this.recordStep({
        title: `Matched Character '${ch}' (${i + 1}/${word.length})`,
        action: `Traversed edge '${ch}' to node [${curr.id}]. Matched prefix "${word.substring(0, i + 1)}".`,
        rule: `Each step deepens prefix matching by exactly 1 character.`,
        tip: `Typing letter '${ch}' narrows down the search space.`,
        popupMessage: `Matched '${ch}'`,
        highlightNodeIds: [curr.id],
        highlightKeyIndices: { [curr.id]: [0] },
        statusType: 'info',
        actionCategory: 'search'
      });
    }

    if (curr.isEndOfWord) {
      this.recordStep({
        title: `Search Succeeded: Word "${word}" Found!`,
        action: `Reached end of word at node [${curr.id}]. 'isEndOfWord' flag is TRUE.`,
        rule: `A search succeeds only when all characters match AND the terminal node has isEndOfWord marked true.`,
        tip: `Valid dictionary word confirmed!`,
        popupMessage: `Word "${word}" found!`,
        highlightNodeIds: [curr.id],
        highlightKeyIndices: { [curr.id]: [0] },
        statusType: 'success',
        actionCategory: 'search'
      });
      return { found: true, node: curr, steps: this.steps };
    } else {
      this.recordStep({
        title: `Prefix Found, But Not A Stored Word`,
        action: `Traversed all characters of "${word}", but node [${curr.id}] does NOT have 'isEndOfWord' set.`,
        rule: `The prefix exists in the Trie, but only as part of longer words (e.g. 'car' in 'card').`,
        tip: `It's a valid prefix, but not an independent stored word on its own.`,
        popupMessage: `Prefix matched, not complete word`,
        highlightNodeIds: [curr.id],
        statusType: 'warning',
        actionCategory: 'search'
      });
      return { found: false, isPrefix: true, steps: this.steps };
    }
  }

  insert(word) {
    this.steps = [];
    if (!word) return this.steps;
    word = String(word).trim().toLowerCase();
    if (!word) return this.steps;

    this.recordStep({
      title: `Trie Insert: Word "${word}"`,
      action: `Preparing to insert word "${word}" into Trie.`,
      rule: `Inserting into a Trie reuses existing shared prefixes and creates new character nodes only when branches diverge.`,
      tip: `Words with matching beginnings (like "app" and "apple") share the exact same starting path!`,
      popupMessage: `Inserting "${word}"`,
      highlightNodeIds: [this.root.id],
      statusType: 'info',
      actionCategory: 'insert'
    });

    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.childrenMap.has(ch)) {
        const newNode = new TrieNode(ch);
        curr.childrenMap.set(ch, newNode);

        this.recordStep({
          title: `Created Character Node '${ch}'`,
          action: `No edge for '${ch}' existed from [${curr.char || 'ROOT'}]. Created new child node for '${ch}'.`,
          rule: `When a prefix diverges from existing paths, a new TrieNode is attached.`,
          tip: `Sprouting a new branch for the new letter.`,
          popupMessage: `Created node '${ch}'`,
          highlightNodeIds: [curr.id, newNode.id],
          highlightKeyIndices: { [newNode.id]: [0] },
          statusType: 'info',
          actionCategory: 'insert'
        });
        curr = newNode;
      } else {
        curr = curr.childrenMap.get(ch);
        this.recordStep({
          title: `Reusing Existing Edge '${ch}'`,
          action: `Found existing edge for '${ch}'. Moving down along shared prefix "${word.substring(0, i + 1)}".`,
          rule: `Prefix sharing: Tries save memory by storing common word beginnings only once.`,
          tip: `Walking down an already paved hallway!`,
          popupMessage: `Reusing '${ch}'`,
          highlightNodeIds: [curr.id],
          highlightKeyIndices: { [curr.id]: [0] },
          statusType: 'info',
          actionCategory: 'insert'
        });
      }
    }

    if (!curr.isEndOfWord) {
      curr.isEndOfWord = true;
      this.recordStep({
        title: `Marked End of Word: "${word}"`,
        action: `Set isEndOfWord = true on node [${curr.id}] for character '${curr.char}'.`,
        rule: `Setting isEndOfWord tags this node as a complete, valid dictionary entry.`,
        tip: `Stamping the word with a completion badge!`,
        popupMessage: `✓ End of Word "${word}"`,
        highlightNodeIds: [curr.id],
        highlightKeyIndices: { [curr.id]: [0] },
        statusType: 'success',
        actionCategory: 'insert'
      });
    } else {
      this.recordStep({
        title: `Word "${word}" Already Existed`,
        action: `Word "${word}" was already present in the Trie with isEndOfWord set.`,
        rule: `Duplicate word insertions do not duplicate nodes or alter the Trie structure.`,
        tip: `This word was already in the dictionary.`,
        popupMessage: `Word "${word}" already stored`,
        highlightNodeIds: [curr.id],
        statusType: 'warning',
        actionCategory: 'insert'
      });
    }

    return this.steps;
  }

  delete(word) {
    this.steps = [];
    if (!word) return this.steps;
    word = String(word).trim().toLowerCase();
    if (!word) return this.steps;

    this.recordStep({
      title: `Trie Delete: Word "${word}"`,
      action: `Preparing to delete word "${word}". Searching down to the terminal node.`,
      rule: `Deleting from a Trie unmarks isEndOfWord and prunes suffix nodes that aren't shared by any other word.`,
      tip: `Unmark the finish line, then tidy up any leftover letters that nobody else uses.`,
      popupMessage: `Deleting "${word}"`,
      highlightNodeIds: [this.root.id],
      statusType: 'info',
      actionCategory: 'delete'
    });

    const removeHelper = (node, w, index) => {
      if (index === w.length) {
        if (!node.isEndOfWord) return false;
        node.isEndOfWord = false;

        this.recordStep({
          title: `Unmarked End of Word: "${word}"`,
          action: `Unchecked 'isEndOfWord' on node [${node.char}]. It is no longer a complete word.`,
          rule: `Unmarking isEndOfWord removes the word from dictionary lookups while preserving shared prefixes for other words.`,
          tip: `Removed the word completion tag.`,
          popupMessage: `Unmarked "${word}"`,
          highlightNodeIds: [node.id],
          statusType: 'success',
          actionCategory: 'delete'
        });

        // If node has no other children, it can be pruned
        return node.childrenMap.size === 0;
      }

      const ch = w[index];
      if (!node.childrenMap.has(ch)) return false;

      const childNode = node.childrenMap.get(ch);
      const shouldPruneChild = removeHelper(childNode, w, index + 1);

      if (shouldPruneChild) {
        node.childrenMap.delete(ch);
        this.recordStep({
          title: `Pruned Unused Node '${ch}'`,
          action: `Node '${ch}' had no other children and is no longer a word terminator. Pruned from tree.`,
          rule: `Suffix pruning: Nodes with no children and no isEndOfWord flag are reclaimed to save memory.`,
          tip: `Cleaned up the dead-end branch!`,
          popupMessage: `Pruned '${ch}'`,
          highlightNodeIds: [node.id],
          statusType: 'info',
          actionCategory: 'delete'
        });
        return !node.isEndOfWord && node.childrenMap.size === 0;
      }

      return false;
    };

    const success = removeHelper(this.root, word, 0);
    this.recordStep({
      title: `Deletion Finished`,
      action: success 
        ? `Deletion process for "${word}" completed successfully.`
        : `Word "${word}" was not found or has remaining shared prefixes.`,
      rule: `All remaining words in the Trie are intact.`,
      tip: `Trie pruned and clean.`,
      popupMessage: `Deletion finished`,
      highlightNodeIds: [this.root.id],
      statusType: 'success',
      actionCategory: 'delete'
    });

    return this.steps;
  }

  clear() {
    this.root = new TrieNode('');
    this.steps = [];
  }

  getSnapshot() {
    return this.cloneTree();
  }

  getStats() {
    let totalNodes = 0;
    let totalWords = 0;
    let maxDepth = 0;

    const count = (n, depth) => {
      if (!n) return;
      totalNodes++;
      if (n.isEndOfWord) totalWords++;
      if (depth > maxDepth) maxDepth = depth;
      for (const child of n.childrenMap.values()) {
        count(child, depth + 1);
      }
    };
    count(this.root, 0);
    return { totalNodes, totalWords, maxDepth, totalKeys: totalWords };
  }

  validateInvariants() {
    const list = [
      { name: "Root node represents empty prefix", valid: true, detail: "Root char is ''" },
      { name: "All child edges represent unique single characters", valid: true, detail: "No duplicate child branches" },
      { name: "Leaf nodes have isEndOfWord or valid branches", valid: true, detail: "No dangling empty leaves" }
    ];

    let noDanglingLeaves = true;
    const check = (n) => {
      if (!n) return;
      if (n !== this.root && n.childrenMap.size === 0 && !n.isEndOfWord) {
        noDanglingLeaves = false;
      }
      for (const child of n.childrenMap.values()) check(child);
    };
    check(this.root);
    list[2].valid = noDanglingLeaves;
    return list;
  }

  toJSON() {
    function serializeNode(node) {
      if (!node) return null;
      const children = {};
      for (const [ch, child] of node.childrenMap.entries()) {
        children[ch] = serializeNode(child);
      }
      return {
        id: node.id,
        char: node.char,
        isEndOfWord: node.isEndOfWord,
        children
      };
    }
    return {
      type: 'trie',
      root: serializeNode(this.root)
    };
  }

  static fromJSON(data) {
    if (!data) return null;
    const trie = new Trie();
    function deserializeNode(nData) {
      if (!nData) return null;
      const node = new TrieNode(nData.char, nData.id);
      node.isEndOfWord = !!nData.isEndOfWord;
      if (nData.children) {
        for (const [ch, childData] of Object.entries(nData.children)) {
          node.childrenMap.set(ch, deserializeNode(childData));
        }
      }
      return node;
    }
    trie.root = deserializeNode(data.root) || new TrieNode('');
    return trie;
  }
}
