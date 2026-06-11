import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NodeManagementService, NodeOperation } from './node-management.service';
import { Node } from '../../../../../core/models/chatbot.model';

export interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class UndoRedoService {
  private undoStack: Node[][] = []; // Stack of node states for undo
  private redoStack: Node[][] = []; // Stack of node states for redo
  private maxStackSize = 50;
  private isExecuting = false; // Prevent recursive operations

  private stateSubject = new BehaviorSubject<UndoRedoState>({
    canUndo: false,
    canRedo: false,
    undoCount: 0,
    redoCount: 0
  });

  state$: Observable<UndoRedoState> = this.stateSubject.asObservable();

  constructor(private nodeService: NodeManagementService) {
    // Don't save state in constructor - wait for nodes to be loaded
  }

  saveState(): void {
    if (this.isExecuting) {
      return; // Don't save state during undo/redo operations
    }

    const currentNodes = this.nodeService.nodes;
    if (currentNodes.length === 0 && this.undoStack.length === 0) {
      return; // Don't save empty state if stack is empty
    }

    const currentState = this.deepCloneNodes(currentNodes);

    // Add to undo stack
    this.undoStack.push(currentState);

    // Clear redo stack when new action is performed
    if (this.redoStack.length > 0) {
      this.redoStack = [];
    }

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }

    this.updateState();
  }

  undo(): boolean {
    if (this.undoStack.length <= 1) {
      // Can't undo if there's only one state (current state)
      return false;
    }

    if (this.isExecuting) {
      // Prevent recursive undo calls
      return false;
    }

    this.isExecuting = true;

    try {
      // Remove current state (it's the last one)
      const currentState = this.undoStack.pop()!;

      // Get previous state
      const previousState = this.undoStack[this.undoStack.length - 1];

      // Save current state to redo stack
      this.redoStack.push(currentState);

      // Restore previous state
      this.restoreState(previousState);

      this.updateState();
      return true;
    } catch (error) {
      console.error('Undo failed:', error);
      return false;
    } finally {
      // Use setTimeout to ensure state is restored and any triggered saves are prevented
      setTimeout(() => {
        this.isExecuting = false;
      }, 500); // Increased delay to prevent saveState from interfering
    }
  }

  redo(): boolean {
    if (this.redoStack.length === 0) {
      return false;
    }

    if (this.isExecuting) {
      // Prevent recursive redo calls
      return false;
    }

    this.isExecuting = true;

    try {
      // Get state from redo stack
      const stateToRestore = this.redoStack.pop()!;

      if (!stateToRestore || stateToRestore.length === 0) {
        this.isExecuting = false;
        return false;
      }

      // Save current state to undo stack BEFORE restoring
      const currentNodes = this.nodeService.nodes;
      const currentState = this.deepCloneNodes(currentNodes);
      this.undoStack.push(currentState);

      // Restore state (this will trigger nodes$ observable, but isExecuting will prevent saveState)
      this.restoreState(stateToRestore);

      // Update state to reflect new undo/redo availability
      // Do this immediately and also after a delay to ensure UI updates
      this.updateState();

      return true;
    } catch (error) {
      console.error('Redo failed:', error);
      this.isExecuting = false;
      this.updateState(); // Update state even on error
      return false;
    } finally {
      // Use setTimeout to ensure state is restored and any triggered saves are prevented
      // The delay ensures that any saveState calls triggered by node changes are blocked
      setTimeout(() => {
        this.isExecuting = false;
        // Final state update to ensure UI reflects correct state
        this.updateState();
      }, 500);
    }
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.saveState(); // Save current state as initial state
    this.updateState();
  }

  canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private restoreState(nodes: Node[]): void {
    // Deep clone to avoid reference issues
    const restoredNodes = this.deepCloneNodes(nodes);

    // Rebuild connections
    this.rebuildConnections(restoredNodes);

    // Load nodes into service (this will trigger node updates)
    // The isExecuting flag will prevent saveState from being called during this
    this.nodeService.loadNodes(restoredNodes);

    // Update state immediately
    this.updateState();
  }

  private rebuildConnections(nodes: Node[]): void {
    const nodeMap = new Map<string, Node>();
    nodes.forEach(node => nodeMap.set(node.id, node));

    nodes.forEach(node => {
      // Clear existing connections
      node.children = [];
      node.parents = [];
      node.parent = null;

      // Rebuild children from next_nodes
      if (node.next_nodes) {
        const childNode = nodeMap.get(node.next_nodes);
        if (childNode) {
          node.children.push(childNode);
          if (!childNode.parents) {
            childNode.parents = [];
          }
          childNode.parents.push(node);
          childNode.parent = node;
        }
      }

      // Rebuild button connections
      if (node.buttonConnections) {
        Object.entries(node.buttonConnections).forEach(([buttonIndexStr, targetNodeId]) => {
          const targetNode = nodeMap.get(targetNodeId);
          if (targetNode) {
            if (!targetNode.parents) {
              targetNode.parents = [];
            }
            if (!targetNode.parents.some(p => p.id === node.id)) {
              targetNode.parents.push(node);
            }
            if (!targetNode.parent) {
              targetNode.parent = node;
            }
          }
        });
      }
    });
  }

  private deepCloneNodes(nodes: Node[]): Node[] {
    return nodes.map(node => ({
      ...node,
      body: JSON.parse(JSON.stringify(node.body)),
      position: { ...node.position },
      children: [],
      parents: [],
      parent: null,
      buttonConnections: node.buttonConnections ? { ...node.buttonConnections } : undefined
    }));
  }

  private updateState(): void {
    this.stateSubject.next({
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoCount: Math.max(0, this.undoStack.length - 1),
      redoCount: this.redoStack.length
    });
  }

  getCurrentState(): UndoRedoState {
    return this.stateSubject.value;
  }
}

