import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Node } from '../../../../../core/models/chatbot.model';

export interface SelectionState {
  selectedNodeIds: Set<string>;
  isBoxSelecting: boolean;
  boxSelectionStart: { x: number; y: number } | null;
  boxSelectionEnd: { x: number; y: number } | null;
}

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  private selectionSubject = new BehaviorSubject<SelectionState>({
    selectedNodeIds: new Set(),
    isBoxSelecting: false,
    boxSelectionStart: null,
    boxSelectionEnd: null
  });

  selection$: Observable<SelectionState> = this.selectionSubject.asObservable();

  get selectedNodeIds(): Set<string> {
    return new Set(this.selectionSubject.value.selectedNodeIds);
  }

  selectNode(nodeId: string, addToSelection = false): void {
    const currentState = this.selectionSubject.value;
    const newSelection = addToSelection 
      ? new Set(currentState.selectedNodeIds)
      : new Set<string>();
    
    newSelection.add(nodeId);
    
    this.selectionSubject.next({
      ...currentState,
      selectedNodeIds: newSelection
    });
  }

  deselectNode(nodeId: string): void {
    const currentState = this.selectionSubject.value;
    const newSelection = new Set(currentState.selectedNodeIds);
    newSelection.delete(nodeId);
    
    this.selectionSubject.next({
      ...currentState,
      selectedNodeIds: newSelection
    });
  }

  selectNodes(nodeIds: string[]): void {
    const currentState = this.selectionSubject.value;
    this.selectionSubject.next({
      ...currentState,
      selectedNodeIds: new Set(nodeIds)
    });
  }

  selectAll(nodeIds: string[]): void {
    this.selectNodes(nodeIds);
  }

  clearSelection(): void {
    const currentState = this.selectionSubject.value;
    this.selectionSubject.next({
      ...currentState,
      selectedNodeIds: new Set()
    });
  }

  toggleSelection(nodeId: string): void {
    const currentState = this.selectionSubject.value;
    if (currentState.selectedNodeIds.has(nodeId)) {
      this.deselectNode(nodeId);
    } else {
      this.selectNode(nodeId, true);
    }
  }

  isSelected(nodeId: string): boolean {
    return this.selectionSubject.value.selectedNodeIds.has(nodeId);
  }

  getSelectionCount(): number {
    return this.selectionSubject.value.selectedNodeIds.size;
  }

  startBoxSelection(start: { x: number; y: number }): void {
    const currentState = this.selectionSubject.value;
    this.selectionSubject.next({
      ...currentState,
      isBoxSelecting: true,
      boxSelectionStart: start,
      boxSelectionEnd: start
    });
  }

  updateBoxSelection(end: { x: number; y: number }): void {
    const currentState = this.selectionSubject.value;
    if (currentState.isBoxSelecting) {
      this.selectionSubject.next({
        ...currentState,
        boxSelectionEnd: end
      });
    }
  }

  endBoxSelection(nodesInBox: string[]): void {
    const currentState = this.selectionSubject.value;
    this.selectionSubject.next({
      ...currentState,
      isBoxSelecting: false,
      boxSelectionStart: null,
      boxSelectionEnd: null,
      selectedNodeIds: new Set(nodesInBox)
    });
  }

  cancelBoxSelection(): void {
    const currentState = this.selectionSubject.value;
    this.selectionSubject.next({
      ...currentState,
      isBoxSelecting: false,
      boxSelectionStart: null,
      boxSelectionEnd: null
    });
  }

  getBoxSelectionBounds(): { x1: number; y1: number; x2: number; y2: number } | null {
    const state = this.selectionSubject.value;
    if (!state.boxSelectionStart || !state.boxSelectionEnd) {
      return null;
    }

    return {
      x1: Math.min(state.boxSelectionStart.x, state.boxSelectionEnd.x),
      y1: Math.min(state.boxSelectionStart.y, state.boxSelectionEnd.y),
      x2: Math.max(state.boxSelectionStart.x, state.boxSelectionEnd.x),
      y2: Math.max(state.boxSelectionStart.y, state.boxSelectionEnd.y)
    };
  }
}

