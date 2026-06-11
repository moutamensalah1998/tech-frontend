import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Node } from '../../../../../core/models/chatbot.model';
import { Connection } from './connection.service';

export interface MinimapState {
  isVisible: boolean;
  viewportBounds: { x: number; y: number; width: number; height: number } | null;
  scale: number;
}

@Injectable({
  providedIn: 'root'
})
export class MinimapService {
  private stateSubject = new BehaviorSubject<MinimapState>({
    isVisible: true,
    viewportBounds: null,
    scale: 0.1 // 1:10 scale
  });

  state$: Observable<MinimapState> = this.stateSubject.asObservable();

  get state(): MinimapState {
    return this.stateSubject.value;
  }

  toggle(): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      isVisible: !this.stateSubject.value.isVisible
    });
  }

  setViewportBounds(bounds: { x: number; y: number; width: number; height: number }): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      viewportBounds: bounds
    });
  }

  calculateNodePositions(nodes: Node[], canvasWidth: number, canvasHeight: number): Array<{ id: string; x: number; y: number; width: number; height: number }> {
    const scale = this.stateSubject.value.scale;
    return nodes.map(node => ({
      id: node.id,
      x: node.position.x * scale,
      y: node.position.y * scale,
      width: 320 * scale, // Approximate node width
      height: 120 * scale // Approximate node height
    }));
  }

  screenToMinimapCoordinates(screenX: number, screenY: number, containerBounds: DOMRect, canvasBounds: { width: number; height: number }): { x: number; y: number } {
    const scale = this.stateSubject.value.scale;
    return {
      x: screenX * scale,
      y: screenY * scale
    };
  }

  minimapToScreenCoordinates(minimapX: number, minimapY: number): { x: number; y: number } {
    const scale = this.stateSubject.value.scale;
    return {
      x: minimapX / scale,
      y: minimapY / scale
    };
  }
}

