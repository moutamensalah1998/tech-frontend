import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root'
})
export class ViewportService {
  private viewportBoundsSubject = new BehaviorSubject<ViewportBounds | null>(null);
  viewportBounds$: Observable<ViewportBounds | null> = this.viewportBoundsSubject.asObservable();

  private scrollListener?: () => void;
  private resizeListener?: () => void;

  /**
   * Initialize viewport tracking for a container
   * @param container The container element to track
   * @param onViewportChange Optional callback when viewport changes
   */
  initialize(
    container: HTMLElement,
    onViewportChange?: (bounds: ViewportBounds) => void
  ): void {
    const updateViewport = () => {
      const bounds: ViewportBounds = {
        x: container.scrollLeft,
        y: container.scrollTop,
        width: container.clientWidth,
        height: container.clientHeight
      };
      this.viewportBoundsSubject.next(bounds);
      onViewportChange?.(bounds);
    };

    this.scrollListener = () => updateViewport();
    this.resizeListener = () => updateViewport();

    container.addEventListener('scroll', this.scrollListener);
    window.addEventListener('resize', this.resizeListener);
    updateViewport();
  }

  /**
   * Update viewport bounds manually
   */
  updateViewport(bounds: ViewportBounds): void {
    this.viewportBoundsSubject.next(bounds);
  }

  /**
   * Get current viewport bounds
   */
  getViewportBounds(): ViewportBounds | null {
    return this.viewportBoundsSubject.value;
  }

  /**
   * Cleanup event listeners
   */
  cleanup(container?: HTMLElement): void {
    if (container && this.scrollListener) {
      container.removeEventListener('scroll', this.scrollListener);
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    this.scrollListener = undefined;
    this.resizeListener = undefined;
  }
}

