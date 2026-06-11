import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UIHelpersService {
  /**
   * Check if click is on empty space (not on UI elements)
   */
  isClickingOnEmptySpace(e: MouseEvent | TouchEvent): boolean {
    const target = e.target as HTMLElement;
    const isGridContainer = target.classList.contains('smooth-grid');
    const isContentArea = target.classList.contains('infinite-canvas');
    const isConnectionLayer = target.tagName.toLowerCase() === 'app-connection-layer' ||
      target.tagName.toLowerCase() === 'svg' ||
      (target.tagName.toLowerCase() === 'path' && target.closest('app-connection-layer'));

    const nodeContainer = target.closest('.node-container');
    const isAddMenu = target.closest('app-add-node-menu');
    const isZoomControls = target.closest('app-zoom-controls');
    const isSidebar = target.closest('app-sidebar');
    const isAddNodeButton = target.closest('[title="Add new node"]') ||
      (target.closest('button') && target.textContent?.includes('Add Node'));

    return ((isGridContainer || isContentArea || isConnectionLayer) &&
      !nodeContainer && !isAddMenu && !isZoomControls && !isSidebar && !isAddNodeButton)!;
  }

  /**
   * Check if element is a UI element (should not trigger panning)
   */
  isUIElement(element: HTMLElement): boolean {
    return !!(
      element.closest('button') ||
      element.closest('app-add-node-menu') ||
      element.closest('app-zoom-controls') ||
      element.closest('app-sidebar') ||
      element.closest('.node-container') ||
      element.classList.contains('toolbar') ||
      element.hasAttribute('title')
    );
  }

  /**
   * Scroll to and highlight a node
   */
  scrollToNode(nodeId: string): void {
    const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
    if (nodeElement) {
      nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nodeElement.classList.add('ring-4', 'ring-blue-400');
      setTimeout(() => {
        nodeElement.classList.remove('ring-4', 'ring-blue-400');
      }, 2000);
    }
  }
}

