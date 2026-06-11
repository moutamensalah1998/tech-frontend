export class DOMUtils {
  static isInteractiveElement(element: HTMLElement): boolean {
    const interactiveSelectors = [
      'input', 'textarea', 'select', 'button',
      '[contenteditable]', '.interactive-element'
    ];

    return interactiveSelectors.some(selector =>
      element.matches(selector) || element.closest(selector)
    );
  }

  static findNodeContainer(element: HTMLElement): HTMLElement | null {
    return element.closest('.node-container') as HTMLElement;
  }

  static getNodeIdFromElement(element: HTMLElement): string | null {
    const container = this.findNodeContainer(element);
    return container?.getAttribute('data-node-id') || null;
  }
}
