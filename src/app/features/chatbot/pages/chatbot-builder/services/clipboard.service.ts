import { Injectable } from '@angular/core';
import { Node } from '../../../../../core/models/chatbot.model';
import { uuidv7 } from 'uuidv7';

export interface ClipboardData {
  nodes: SerializedNode[];
  timestamp: number;
  type: 'copy' | 'cut';
}

interface SerializedNode {
  id: string;
  type: string;
  title: string;
  body: any;
  position: { x: number; y: number };
  is_first: boolean;
  is_final: boolean;
  next_nodes?: string | null;
  buttonConnections?: { [buttonIndex: number]: string };
  children?: string[]; // Store child IDs for connection mapping
}

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  private readonly STORAGE_KEY = 'chatbot_clipboard';
  private clipboardData: ClipboardData | null = null;
  private isCutOperation = false;

  copyNodes(nodes: Node[]): void {
    if (nodes.length === 0) return;

    const serializedNodes = nodes.map(node => this.serializeNode(node));
    
    this.clipboardData = {
      nodes: serializedNodes,
      timestamp: Date.now(),
      type: 'copy'
    };

    this.isCutOperation = false;
    this.saveToStorage();
  }

  cutNodes(nodes: Node[]): void {
    if (nodes.length === 0) return;

    const serializedNodes = nodes.map(node => this.serializeNode(node));
    
    this.clipboardData = {
      nodes: serializedNodes,
      timestamp: Date.now(),
      type: 'cut'
    };

    this.isCutOperation = true;
    this.saveToStorage();
  }

  pasteNodes(offset: { x: number; y: number } = { x: 50, y: 50 }): {
    nodes: Node[];
    idMapping: Map<string, string>;
  } | null {
    if (!this.clipboardData || this.clipboardData.nodes.length === 0) {
      return null;
    }

    // Check if clipboard data is too old (older than 1 hour)
    const age = Date.now() - this.clipboardData.timestamp;
    if (age > 3600000) { // 1 hour
      this.clear();
      return null;
    }

    const idMapping = new Map<string, string>();
    const pastedNodes: Node[] = [];

    // First pass: create new nodes with new IDs
    for (const serializedNode of this.clipboardData.nodes) {
      const newId = uuidv7();
      idMapping.set(serializedNode.id, newId);

      const newNode: Node = {
        id: newId,
        type: serializedNode.type as any,
        title: serializedNode.title,
        body: JSON.parse(JSON.stringify(serializedNode.body)), // Deep clone
        position: {
          x: serializedNode.position.x + offset.x,
          y: serializedNode.position.y + offset.y
        },
        children: [],
        parents: [],
        parent: null,
        is_first: false, // Pasted nodes are never first by default
        is_final: serializedNode.is_final,
        next_nodes: null,
        buttonConnections: {}
      };

      pastedNodes.push(newNode);
    }

    // Second pass: rebuild connections using new IDs
    for (let i = 0; i < this.clipboardData.nodes.length; i++) {
      const serializedNode = this.clipboardData.nodes[i];
      const newNode = pastedNodes[i];
      const oldId = serializedNode.id;
      const newId = newNode.id;

      // Map children connections
      if (serializedNode.children) {
        for (const oldChildId of serializedNode.children) {
          const newChildId = idMapping.get(oldChildId);
          if (newChildId) {
            const childNode = pastedNodes.find(n => n.id === newChildId);
            if (childNode) {
              newNode.children.push(childNode);
              if (!childNode.parents) {
                childNode.parents = [];
              }
              childNode.parents.push(newNode);
              childNode.parent = newNode;
            }
          }
        }
      }

      // Map button connections
      if (serializedNode.buttonConnections) {
        const newButtonConnections: { [buttonIndex: number]: string } = {};
        for (const [buttonIndexStr, oldTargetId] of Object.entries(serializedNode.buttonConnections)) {
          const buttonIndex = parseInt(buttonIndexStr);
          const newTargetId = idMapping.get(oldTargetId);
          if (newTargetId) {
            newButtonConnections[buttonIndex] = newTargetId;
            const targetNode = pastedNodes.find(n => n.id === newTargetId);
            if (targetNode) {
              if (!targetNode.parents) {
                targetNode.parents = [];
              }
              targetNode.parents.push(newNode);
            }
          }
        }
        newNode.buttonConnections = newButtonConnections;
      }

      // Map next_nodes
      if (serializedNode.next_nodes) {
        const newNextNodeId = idMapping.get(serializedNode.next_nodes);
        if (newNextNodeId) {
          newNode.next_nodes = newNextNodeId;
        }
      }
    }

    // If this was a cut operation, mark nodes for deletion
    // (The caller should handle deletion)
    if (this.clipboardData.type === 'cut') {
      // Reset to copy after paste (so nodes aren't deleted on subsequent pastes)
      this.clipboardData.type = 'copy';
      this.saveToStorage();
    }

    return {
      nodes: pastedNodes,
      idMapping
    };
  }

  hasClipboardData(): boolean {
    return this.clipboardData !== null && this.clipboardData.nodes.length > 0;
  }

  clear(): void {
    this.clipboardData = null;
    this.isCutOperation = false;
    this.clearStorage();
  }

  isCutMode(): boolean {
    return this.isCutOperation;
  }

  private serializeNode(node: Node): SerializedNode {
    // Store child IDs for connection mapping
    const childIds = (node.children && Array.isArray(node.children)) 
      ? node.children.map(child => child.id) 
      : [];

    // Safely clone body
    let clonedBody: any;
    try {
      if (typeof node.body === 'string') {
        clonedBody = JSON.parse(node.body);
      } else {
        clonedBody = JSON.parse(JSON.stringify(node.body));
      }
    } catch (error) {
      console.error('Failed to serialize node body:', error);
      clonedBody = node.body;
    }

    return {
      id: node.id,
      type: node.type,
      title: node.title,
      body: clonedBody,
      position: { ...node.position },
      is_first: node.is_first,
      is_final: node.is_final,
      next_nodes: node.next_nodes || null,
      buttonConnections: node.buttonConnections ? { ...node.buttonConnections } : undefined,
      children: childIds
    };
  }

  private saveToStorage(): void {
    try {
      if (this.clipboardData) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.clipboardData));
      }
    } catch (error) {
      console.error('Failed to save clipboard to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.clipboardData = JSON.parse(data);
        this.isCutOperation = this.clipboardData?.type === 'cut';
      }
    } catch (error) {
      console.error('Failed to load clipboard from storage:', error);
      this.clipboardData = null;
    }
  }

  private clearStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear clipboard storage:', error);
    }
  }

  // Initialize from storage on service creation
  constructor() {
    this.loadFromStorage();
  }
}

