
export class ButtonPositionHelper {

  static getActualButtonPosition(nodeId: string, buttonIndex: number): { x: number; y: number } | null {
    try {
      const nodeContainer = document.querySelector(`[data-node-id="${nodeId}"]`);
      if (!nodeContainer) {
        return null;
      }

      const buttonContainer = nodeContainer.querySelector(`[data-button-index="${buttonIndex}"]`);
      if (!buttonContainer) {
        return null;
      }

      const connectionButton = buttonContainer.querySelector('.connection-button');
      if (!connectionButton) {
        return null;
      }

      const buttonRect = connectionButton.getBoundingClientRect();
      const gridContainer = document.querySelector('.transition-transform');

      if (!gridContainer) {
        return null;
      }

      const gridRect = gridContainer.getBoundingClientRect();
      const zoomLevel = parseFloat(getComputedStyle(gridContainer).transform.match(/matrix\(([^)]+)\)/)?.[1]?.split(',')[0] || '1');
      const relativeX = (buttonRect.left + buttonRect.width / 2 - gridRect.left) / zoomLevel;
      const relativeY = (buttonRect.top + buttonRect.height / 2 - gridRect.top) / zoomLevel;

      return {
        x: relativeX,
        y: relativeY
      };

    } catch (error) {
      return null;
    }
  }

  static getAllButtonPositions(nodeId: string): { [buttonIndex: number]: { x: number; y: number } } {
    const positions: { [buttonIndex: number]: { x: number; y: number } } = {};

    const nodeContainer = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (!nodeContainer) return positions;

    const buttonContainers = nodeContainer.querySelectorAll('[data-button-index]');

    buttonContainers.forEach((container) => {
      const buttonIndex = parseInt(container.getAttribute('data-button-index') || '0');
      const position = this.getActualButtonPosition(nodeId, buttonIndex);

      if (position) {
        positions[buttonIndex] = position;
      }
    });

    return positions;
  }

  static enhanceConnectionService(connectionService: any): void {
    const originalGetConnectionPoint = connectionService.getConnectionPoint.bind(connectionService);

    connectionService.getConnectionPoint = (node: any, buttonIndex?: number) => {
      if (node.type === 'interactive_buttons' && buttonIndex !== undefined) {
        const actualPosition = this.getActualButtonPosition(node.id, buttonIndex);
        if (actualPosition) {
          return actualPosition;
        }
      }
      return originalGetConnectionPoint(node, buttonIndex);
    };
  }
}
