import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Connection } from './../../services/connection.service';
import { Node } from './../../../../../../core/models/chatbot.model';
import { NODE_CONSTANTS } from './../../constants/node.constants';

@Component({
  selector: 'app-connection-layer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './connection-layer.component.html',
  styleUrls: ['./connection-layer.component.css'],
})
export class ConnectionLayerComponent implements OnInit, OnChanges {
  @Input() connections: Connection[] = [];
  @Input() previewLine: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null = null;
  @Input() deleteButton: { x: number; y: number } | null = null;
  @Input() zoomLevel: number = 1;

  @Output() connectionClick = new EventEmitter<{
    connection: Connection;
    event: MouseEvent;
  }>();
  @Output() deleteConnection = new EventEmitter<void>();

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['connections']) {
    }
  }

  trackByConnection(index: number, connection: Connection): string {
    const buttonSuffix =
      connection.buttonIndex !== undefined
        ? `-btn-${connection.buttonIndex}`
        : '';
    return `${connection.from.id}-${connection.to.id}${buttonSuffix}`;
  }

  getButtonLabel(connection: Connection): string {
    if (
      connection.from.type === 'interactive_buttons' &&
      connection.buttonIndex !== undefined
    ) {
      const button =
        connection.from.body.body_button?.action?.buttons?.[
          connection.buttonIndex
        ];
      return button?.reply?.title || `Btn ${connection.buttonIndex + 1}`;
    }
    return '';
  }

  getConnectionStartPoint(connection: Connection): { x: number; y: number } {
    // Get actual node width from constants
    const nodeWidth = connection.from.type === 'interactive_buttons'
      ? NODE_CONSTANTS.DIMENSIONS.BUTTON_WIDTH
      : NODE_CONSTANTS.DIMENSIONS.MESSAGE_WIDTH;

    let startY: number;
    if (
      connection.from.type === 'interactive_buttons' &&
      connection.buttonIndex !== undefined
    ) {
      const buttonY = this.getButtonYPosition(connection.from, connection.buttonIndex);
      startY = buttonY;
    } else {
      // Get actual node height from DOM or use default
      const actualHeight = this.getActualNodeHeight(connection.from.id) || NODE_CONSTANTS.DIMENSIONS.CARD_HEIGHT;
      startY = connection.from.position.y + (actualHeight / 2);
    }

    // Start point is at the right edge of the source node
    // Nodes are positioned absolutely relative to infinite-canvas, SVG uses same coordinate system
    const startPoint = {
      x: connection.from.position.x + nodeWidth,
      y: startY,
    };

    return startPoint;
  }

  getConnectionEndPoint(connection: Connection): { x: number; y: number } {
    // Get actual node height from DOM or use default
    const actualHeight = this.getActualNodeHeight(connection.to.id) || NODE_CONSTANTS.DIMENSIONS.CARD_HEIGHT;

    // End point is at the left edge of the target node
    // Nodes are positioned absolutely relative to infinite-canvas, SVG uses same coordinate system
    const endPoint = {
      x: connection.to.position.x,
      y: connection.to.position.y + (actualHeight / 2),
    };
    return endPoint;
  }

  private getActualNodeHeight(nodeId: string): number | null {
    try {
      const nodeContainer = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
      if (!nodeContainer) return null;

      const nodeCard = nodeContainer.querySelector('.node-card') as HTMLElement;
      if (!nodeCard) return null;

      const rect = nodeCard.getBoundingClientRect();
      const gridContainer = document.querySelector('.smooth-grid') as HTMLElement;
      if (!gridContainer) return null;

      const zoomLevel = this.getZoomLevel();
      // Convert to canvas coordinates (same coordinate system as nodes)
      const height = rect.height / zoomLevel;
      return height;
    } catch (error) {
      return null;
    }
  }

  private getButtonYPosition(node: Node, buttonIndex: number): number {
    const actualPosition = this.getActualButtonYPosition(node.id, buttonIndex);
    if (actualPosition !== null) {
      return actualPosition;
    }
    return this.getCalculatedButtonYPosition(node, buttonIndex);
  }

  private getActualButtonYPosition(nodeId: string, buttonIndex: number): number | null {
    try {
      const nodeContainer = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
      if (!nodeContainer) return null;

      const buttonContainer = nodeContainer.querySelector(`[data-button-index="${buttonIndex}"]`) as HTMLElement;
      if (!buttonContainer) return null;

      // Get the node's canvas position from its style (which matches node.position)
      const nodeTop = parseFloat(nodeContainer.style.top) || 0;

      // Get button's position relative to the node container in screen coordinates
      const buttonRect = buttonContainer.getBoundingClientRect();
      const nodeRect = nodeContainer.getBoundingClientRect();

      // Calculate button's Y position relative to the node's top in screen pixels
      const buttonRelativeYScreen = buttonRect.top - nodeRect.top + (buttonRect.height / 2);

      // Convert to canvas coordinates by dividing by zoom level
      const zoomLevel = this.getZoomLevel();
      const buttonRelativeY = buttonRelativeYScreen / zoomLevel;

      // Add to node's Y position to get absolute canvas coordinate
      const buttonY = nodeTop + buttonRelativeY;

      return buttonY;
    } catch (error) {
      return null;
    }
  }

  private getCalculatedButtonYPosition(node: Node, buttonIndex: number): number {
    const nodeY = node.position.y;
    const measurements = {
      nodeHeader: 80,
      debugInfo: 32,
      interactiveType: 72,
      headerSection: 100,
      bodySection: 120,
      footerSection: 72,
      buttonsSectionHeader: 48,
    };
    const buttonsSectionStartY = Object.values(measurements).reduce((sum, height) => sum + height, 0);
    const buttonContainerHeight = 104;
    const buttonSpacing = 16;
    const buttonCenterY = buttonsSectionStartY + (buttonIndex * (buttonContainerHeight + buttonSpacing)) + (buttonContainerHeight / 2);
    const calculatedY = nodeY + buttonCenterY;
    return calculatedY;
  }

  private getZoomLevel(): number {
    // Use input zoomLevel if available, otherwise try to detect from DOM
    if (this.zoomLevel && this.zoomLevel !== 1) {
      return this.zoomLevel;
    }

    const gridContainer = document.querySelector('.smooth-grid');
    if (!gridContainer) return 1;
    const transformStyle = getComputedStyle(gridContainer).transform;
    if (transformStyle && transformStyle !== 'none') {
      const matrix = transformStyle.match(/matrix.*\((.+)\)/);
      if (matrix) {
        const values = matrix[1].split(', ');
        return parseFloat(values[0]) || 1;
      }
    }
    return 1;
  }

  getConnectionColor(connection: Connection): string {
    if (connection.buttonIndex !== undefined) {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
      return colors[connection.buttonIndex] || '#6b7280';
    }
    return '#6b7280';
  }

  getConnectionPath(connection: Connection): string {
    const startPoint = this.getConnectionStartPoint(connection);
    const endPoint = this.getConnectionEndPoint(connection);

    if (!startPoint || !endPoint) {
      return '';
    }


    const startX = startPoint.x;
    const startY = startPoint.y;
    const endX = endPoint.x;
    const endY = endPoint.y;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    let controlDistance = Math.min(Math.max(Math.abs(deltaX) * 0.4, 60), 150);
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      controlDistance = Math.min(controlDistance, 100);
    }
    const controlPoint1X = startX + controlDistance;
    const controlPoint1Y = startY;
    const controlPoint2X = endX - controlDistance;
    const controlPoint2Y = endY;
    const path = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y} ${controlPoint2X} ${controlPoint2Y} ${endX} ${endY}`;
    return path;
  }

  getPreviewPath(): string {
    if (!this.previewLine) return '';
    const { x1, y1, x2, y2 } = this.previewLine;
    const deltaX = x2 - x1;
    const controlDistance = Math.min(Math.max(Math.abs(deltaX) * 0.4, 60), 150);
    const controlPoint1X = x1 + controlDistance;
    const controlPoint1Y = y1;
    const controlPoint2X = x2 - controlDistance;
    const controlPoint2Y = y2;

    return `M ${x1} ${y1} C ${controlPoint1X} ${controlPoint1Y} ${controlPoint2X} ${controlPoint2Y} ${x2} ${y2}`;
  }

  getLabelPosition(connection: Connection): { x: number; y: number } | null {
    const startPoint = this.getConnectionStartPoint(connection);
    const endPoint = this.getConnectionEndPoint(connection);
    if (!startPoint || !endPoint) return null;
    return {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2 - 8,
    };
  }

  isButtonConnection(connection: Connection): boolean {
    return (
      connection.from.type === 'interactive_buttons' &&
      connection.buttonIndex !== undefined
    );
  }

  getStrokeDashArray(connection: Connection): string {
    return this.isButtonConnection(connection) ? '8,4' : 'none';
  }

  getStrokeWidth(connection: Connection): number {
    if (this.isCircularConnection(connection)) return 3;
    return this.isButtonConnection(connection) ? 2.5 : 2;
  }

  getConnectionOpacity(connection: Connection): number {
    return this.isCircularConnection(connection) ? 0.8 : 1;
  }

  getMarkerEnd(connection: Connection): string {
    if (this.isButtonConnection(connection)) {
      return `url(#button-arrowhead-${connection.buttonIndex})`;
    }
    return 'url(#arrowhead)';
  }

  onConnectionClick(connection: Connection, event: MouseEvent): void {
    event.stopPropagation();
    this.connectionClick.emit({ connection, event });
  }

  getConnectionStrength(connection: Connection): number {
    if (!this.isButtonConnection(connection)) return 1;

    return this.connections.filter(
      (conn) =>
        conn.from.id === connection.from.id &&
        conn.to.id === connection.to.id
    ).length;
  }

  isCircularConnection(connection: Connection): boolean {
    return this.connections.some(
      (conn) =>
        conn.from.id === connection.to.id &&
        conn.to.id === connection.from.id &&
        conn !== connection
    );
  }
}
