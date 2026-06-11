import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Node } from '../../../../../core/models/chatbot.model';

export interface DragData {
  node: Node;
  isDragging: boolean;
  offset: { x: number; y: number };
  currentPosition: { x: number; y: number };
  startPosition: { x: number; y: number };
}

@Injectable({
  providedIn: 'root'
})
export class DragDropService {
  private dragSubject = new BehaviorSubject<DragData | null>(null);
  private currentDrag: DragData | null = null;
  private rafId: number | null = null;
  private isInitialized = false;

  drag$ = this.dragSubject.asObservable();

  startDrag(node: Node, event: MouseEvent | TouchEvent, zoomLevel: number = 1): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    event.preventDefault();
    event.stopPropagation();

    const { clientX, clientY } = this.getEventCoordinates(event);

    const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
    if (!nodeElement) {
      this.isInitialized = false;
      return;
    }

    const gridContainer = document.querySelector('.smooth-grid') as HTMLElement;
    if (!gridContainer) {
      this.isInitialized = false;
      return;
    }

    const gridRect = gridContainer.getBoundingClientRect();

    const clickGridX = (clientX - gridRect.left) / zoomLevel;
    const clickGridY = (clientY - gridRect.top) / zoomLevel;

    const offset = {
      x: clickGridX - node.position.x,
      y: clickGridY - node.position.y
    };

    const startPosition = { x: node.position.x, y: node.position.y };

    this.currentDrag = {
      node,
      isDragging: true,
      offset,
      currentPosition: { ...startPosition },
      startPosition
    };

    nodeElement.classList.add('dragging');
    nodeElement.style.zIndex = '1000';

    this.dragSubject.next(this.currentDrag);

    this.addEventListeners(zoomLevel);
  }

  private updateDragPosition(clientX: number, clientY: number, zoomLevel: number): void {
    if (!this.currentDrag || !this.currentDrag.isDragging) return;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      this.performDragUpdate(clientX, clientY, zoomLevel);
    });
  }

  private performDragUpdate(clientX: number, clientY: number, zoomLevel: number): void {
    if (!this.currentDrag || !this.isInitialized) return;

    const gridContainer = document.querySelector('.smooth-grid') as HTMLElement;
    if (!gridContainer) return;

    const containerRect = gridContainer.getBoundingClientRect();

    const gridX = (clientX - containerRect.left) / zoomLevel;
    const gridY = (clientY - containerRect.top) / zoomLevel;

    const newX = gridX - this.currentDrag.offset.x;
    const newY = gridY - this.currentDrag.offset.y;

    const minX = 0;
    const minY = 0;
    const maxX = 10000;
    const maxY = 10000;

    const constrainedX = Math.max(minX, Math.min(maxX, newX));
    const constrainedY = Math.max(minY, Math.min(maxY, newY));

    const deltaX = Math.abs(constrainedX - this.currentDrag.currentPosition.x);
    const deltaY = Math.abs(constrainedY - this.currentDrag.currentPosition.y);

    if (deltaX < 1 && deltaY < 1) {
      return;
    }

    const newPosition = { x: constrainedX, y: constrainedY };
    this.currentDrag.node.position = newPosition;
    this.currentDrag.currentPosition = { x: constrainedX, y: constrainedY };

    const nodeElement = document.querySelector(`[data-node-id="${this.currentDrag.node.id}"]`) as HTMLElement;
    if (nodeElement) {
      nodeElement.style.left = `${constrainedX}px`;
      nodeElement.style.top = `${constrainedY}px`;
      nodeElement.style.transform = '';
    }

    this.dragSubject.next(this.currentDrag);
  }

  private endDrag(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (!this.currentDrag) {
      this.isInitialized = false;
      return;
    }

    const nodeElement = document.querySelector(`[data-node-id="${this.currentDrag.node.id}"]`) as HTMLElement;

    const snapSize = 20;
    const snappedX = Math.round(this.currentDrag.node.position.x / snapSize) * snapSize;
    const snappedY = Math.round(this.currentDrag.node.position.y / snapSize) * snapSize;
    const snappedPosition = { x: snappedX, y: snappedY };
    this.currentDrag.node.position = snappedPosition;

    if (nodeElement) {
      nodeElement.classList.remove('dragging');
      nodeElement.style.zIndex = '';

      nodeElement.style.transition = 'none';
      nodeElement.style.left = `${snappedX}px`;
      nodeElement.style.top = `${snappedY}px`;
      nodeElement.style.transform = '';

      requestAnimationFrame(() => {
        if (nodeElement) {
          nodeElement.style.transition = '';
        }
      });
    }

    this.currentDrag.isDragging = false;
    this.dragSubject.next(this.currentDrag);

    this.currentDrag = null;
    this.isInitialized = false;
    this.removeEventListeners();
  }

  private getEventCoordinates(event: MouseEvent | TouchEvent): { clientX: number; clientY: number } {
    if (event instanceof MouseEvent) {
      return { clientX: event.clientX, clientY: event.clientY };
    } else {
      const touch = event.touches[0] || event.changedTouches[0];
      return { clientX: touch.clientX, clientY: touch.clientY };
    }
  }

  private addEventListeners(zoomLevel: number): void {
    this._mouseMoveHandler = (event: MouseEvent) => {
      event.preventDefault();
      if (this.currentDrag?.isDragging && this.isInitialized) {
        this.updateDragPosition(event.clientX, event.clientY, zoomLevel);
      }
    };

    this._touchMoveHandler = (event: TouchEvent) => {
      event.preventDefault();
      if (this.currentDrag?.isDragging && this.isInitialized) {
        const touch = event.touches[0];
        if (touch) {
          this.updateDragPosition(touch.clientX, touch.clientY, zoomLevel);
        }
      }
    };

    this._mouseUpHandler = () => {
      if (this.isInitialized) {
        this.endDrag();
      }
    };

    this._touchEndHandler = () => {
      if (this.isInitialized) {
        this.endDrag();
      }
    };

    this._contextMenuHandler = (event: Event) => {
      if (this.currentDrag?.isDragging) {
        event.preventDefault();
      }
    };

    document.addEventListener('mousemove', this._mouseMoveHandler, { passive: false, capture: true });
    document.addEventListener('touchmove', this._touchMoveHandler, { passive: false, capture: true });
    document.addEventListener('mouseup', this._mouseUpHandler, { passive: true, capture: true });
    document.addEventListener('touchend', this._touchEndHandler, { passive: true, capture: true });
    document.addEventListener('contextmenu', this._contextMenuHandler, { passive: false });

    document.addEventListener('mouseleave', this._mouseUpHandler, { passive: true });
  }

  private removeEventListeners(): void {
    if (this._mouseMoveHandler) {
      document.removeEventListener('mousemove', this._mouseMoveHandler, { capture: true } as any);
    }
    if (this._touchMoveHandler) {
      document.removeEventListener('touchmove', this._touchMoveHandler, { capture: true } as any);
    }
    if (this._mouseUpHandler) {
      document.removeEventListener('mouseup', this._mouseUpHandler, { capture: true } as any);
      document.removeEventListener('mouseleave', this._mouseUpHandler);
    }
    if (this._touchEndHandler) {
      document.removeEventListener('touchend', this._touchEndHandler, { capture: true } as any);
    }
    if (this._contextMenuHandler) {
      document.removeEventListener('contextmenu', this._contextMenuHandler);
    }

    this._mouseMoveHandler = undefined;
    this._touchMoveHandler = undefined;
    this._mouseUpHandler = undefined;
    this._touchEndHandler = undefined;
    this._contextMenuHandler = undefined;
  }

  private _mouseMoveHandler?: (event: MouseEvent) => void;
  private _touchMoveHandler?: (event: TouchEvent) => void;
  private _mouseUpHandler?: () => void;
  private _touchEndHandler?: () => void;
  private _contextMenuHandler?: (event: Event) => void;
}
