import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CanvasPanningService {
  private isPanningSubject = new BehaviorSubject<boolean>(false);
  isPanning$: Observable<boolean> = this.isPanningSubject.asObservable();

  private panStart = { x: 0, y: 0 };
  private scrollStart = { x: 0, y: 0 };
  private touchStart = { x: 0, y: 0 };
  private touchScrollStart = { x: 0, y: 0 };
  private isTouchPanning = false;

  /**
   * Initialize canvas panning for a container element
   * @param container The container element to enable panning on
   * @param isClickingOnEmptySpace Function to check if click is on empty space
   * @param isUIElement Function to check if element is a UI element
   * @param onPanningChange Optional callback when panning state changes
   * @returns Cleanup function to remove event listeners
   */
  initializePanning(
    container: HTMLElement,
    isClickingOnEmptySpace: (e: MouseEvent | TouchEvent) => boolean,
    isUIElement: (el: HTMLElement) => boolean,
    onPanningChange?: (isPanning: boolean) => void
  ): () => void {
    const onMouseDown = (e: MouseEvent) => {
      if (isClickingOnEmptySpace(e) && !isUIElement(e.target as HTMLElement)) {
        this.isPanningSubject.next(true);
        this.panStart = { x: e.clientX, y: e.clientY };
        this.scrollStart = {
          x: container.scrollLeft,
          y: container.scrollTop
        };

        container.style.cursor = 'grabbing';
        container.style.userSelect = 'none';
        e.preventDefault();
        onPanningChange?.(true);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isPanningSubject.value) return;

      const deltaX = e.clientX - this.panStart.x;
      const deltaY = e.clientY - this.panStart.y;

      container.scrollLeft = this.scrollStart.x - deltaX;
      container.scrollTop = this.scrollStart.y - deltaY;
      e.preventDefault();
    };

    const onMouseUp = (e: MouseEvent) => {
      if (this.isPanningSubject.value) {
        this.isPanningSubject.next(false);
        container.style.cursor = '';
        container.style.userSelect = '';
        onPanningChange?.(false);
      }
    };

    const onMouseLeave = () => {
      if (this.isPanningSubject.value) {
        this.isPanningSubject.next(false);
        container.style.cursor = '';
        container.style.userSelect = '';
        onPanningChange?.(false);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && isClickingOnEmptySpace(e) &&
        !isUIElement(e.target as HTMLElement)) {
        const touch = e.touches[0];
        this.isTouchPanning = true;
        this.touchStart = { x: touch.clientX, y: touch.clientY };
        this.touchScrollStart = {
          x: container.scrollLeft,
          y: container.scrollTop
        };
        e.preventDefault();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!this.isTouchPanning || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - this.touchStart.x;
      const deltaY = touch.clientY - this.touchStart.y;

      container.scrollLeft = this.touchScrollStart.x - deltaX;
      container.scrollTop = this.touchScrollStart.y - deltaY;
      e.preventDefault();
    };

    const onTouchEnd = () => {
      if (this.isTouchPanning) {
        this.isTouchPanning = false;
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }

  get isPanning(): boolean {
    return this.isPanningSubject.value;
  }
}

