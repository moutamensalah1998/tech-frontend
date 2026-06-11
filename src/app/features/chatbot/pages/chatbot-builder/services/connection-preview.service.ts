import { Injectable, ElementRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Node } from '../../../../../core/models/chatbot.model';
import { ConnectionService } from './connection.service';
import { ConnectionPreviewLine } from '../models/connection-preview.model';
import { ZoomConfig } from '../interface/node.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ConnectionPreviewService {
  private previewLineSubject = new BehaviorSubject<ConnectionPreviewLine | null>(null);
  previewLine$: Observable<ConnectionPreviewLine | null> = this.previewLineSubject.asObservable();

  private isConnectingSubject = new BehaviorSubject<boolean>(false);
  isConnecting$: Observable<boolean> = this.isConnectingSubject.asObservable();

  private connectionSourceNode: Node | null = null;
  private connectionSourceButtonIndex?: number;
  private connectionSourceButtonId?: string;
  private previewUpdateFrame: number | null = null;
  private gridContainer?: ElementRef<HTMLElement>;
  private zoomConfig?: ZoomConfig;

  private mouseMoveListener?: (event: MouseEvent) => void;
  private touchMoveListener?: (event: TouchEvent) => void;
  private mouseUpListener?: (event: MouseEvent) => void;
  private touchEndListener?: (event: TouchEvent) => void;
  private onConnectionEndCallback?: (targetElement: HTMLElement) => void;

  constructor(private connectionService: ConnectionService) {}

  /**
   * Initialize the service with required dependencies
   */
  initialize(
    gridContainer: ElementRef<HTMLElement>,
    zoomConfig: ZoomConfig,
    onConnectionEnd?: (targetElement: HTMLElement) => void
  ): void {
    this.gridContainer = gridContainer;
    this.zoomConfig = zoomConfig;
    this.onConnectionEndCallback = onConnectionEnd;
  }

  /**
   * Start connection drag
   */
  startConnection(
    sourceNode: Node,
    buttonIndex?: number,
    buttonId?: string
  ): void {
    this.connectionSourceNode = sourceNode;
    this.connectionSourceButtonIndex = buttonIndex;
    this.connectionSourceButtonId = buttonId;
    this.isConnectingSubject.next(true);

    let sourcePos: { x: number; y: number } | null = null;

    if (sourceNode.type === 'interactive_buttons' && buttonIndex !== undefined) {
      sourcePos = this.getActualButtonPosition(sourceNode.id, buttonIndex);
    }

    if (!sourcePos) {
      sourcePos = this.connectionService.getConnectionPoint(
        sourceNode,
        buttonIndex
      );
    }

    if (sourcePos) {
      this.previewLineSubject.next({
        x1: sourcePos.x,
        y1: sourcePos.y,
        x2: sourcePos.x,
        y2: sourcePos.y
      });
    }

    this.addConnectionEventListeners();
  }

  /**
   * Update preview line position
   */
  updatePreview(clientX: number, clientY: number): void {
    if (!this.isConnectingSubject.value || !this.connectionSourceNode || !this.gridContainer || !this.zoomConfig) {
      return;
    }

    if (this.previewUpdateFrame) {
      cancelAnimationFrame(this.previewUpdateFrame);
    }

    this.previewUpdateFrame = requestAnimationFrame(() => {
      let sourcePos: { x: number; y: number } | null = null;

      if (this.connectionSourceNode!.type === 'interactive_buttons' && this.connectionSourceButtonIndex !== undefined) {
        sourcePos = this.getActualButtonPosition(this.connectionSourceNode!.id, this.connectionSourceButtonIndex);
      }

      if (!sourcePos) {
        sourcePos = this.connectionService.getConnectionPoint(
          this.connectionSourceNode!,
          this.connectionSourceButtonIndex
        );
      }

      if (!sourcePos) return;

      const container = this.gridContainer!.nativeElement;
      const containerRect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;

      const targetX = (scrollLeft + clientX - containerRect.left) / this.zoomConfig!.level;
      const targetY = (scrollTop + clientY - containerRect.top) / this.zoomConfig!.level;

      this.previewLineSubject.next({
        x1: sourcePos.x,
        y1: sourcePos.y,
        x2: targetX,
        y2: targetY
      });
    });
  }

  /**
   * End connection drag
   */
  endConnection(): void {
    this.isConnectingSubject.next(false);
    this.connectionSourceNode = null;
    this.connectionSourceButtonIndex = undefined;
    this.connectionSourceButtonId = undefined;
    this.previewLineSubject.next(null);
    this.removeConnectionEventListeners();

    if (this.previewUpdateFrame) {
      cancelAnimationFrame(this.previewUpdateFrame);
      this.previewUpdateFrame = null;
    }
  }

  /**
   * Get preview line
   */
  getPreviewLine(): ConnectionPreviewLine | null {
    return this.previewLineSubject.value;
  }

  /**
   * Get connection source info
   */
  getConnectionSource(): {
    node: Node | null;
    buttonIndex?: number;
    buttonId?: string;
  } {
    return {
      node: this.connectionSourceNode,
      buttonIndex: this.connectionSourceButtonIndex,
      buttonId: this.connectionSourceButtonId
    };
  }

  private getActualButtonPosition(nodeId: string, buttonIndex: number): { x: number; y: number } | null {
    if (!this.gridContainer || !this.zoomConfig) return null;

    try {
      const nodeContainer = document.querySelector(`[data-node-id="${nodeId}"]`);
      if (!nodeContainer) return null;

      const buttonContainer = nodeContainer.querySelector(`[data-button-index="${buttonIndex}"]`);
      if (!buttonContainer) return null;

      const connectionButton = buttonContainer.querySelector('.connection-button');
      if (!connectionButton) return null;

      const buttonRect = connectionButton.getBoundingClientRect();
      const container = this.gridContainer.nativeElement;
      const containerRect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;

      const relativeX = (scrollLeft + buttonRect.left + buttonRect.width / 2 - containerRect.left) / this.zoomConfig.level;
      const relativeY = (scrollTop + buttonRect.top + buttonRect.height / 2 - containerRect.top) / this.zoomConfig.level;

      return { x: relativeX, y: relativeY };
    } catch (error) {
      return null;
    }
  }

  private addConnectionEventListeners(): void {
    this.mouseMoveListener = (event: MouseEvent) => {
      if (this.isConnectingSubject.value) {
        this.updatePreview(event.clientX, event.clientY);
      }
    };

    this.touchMoveListener = (event: TouchEvent) => {
      if (this.isConnectingSubject.value) {
        event.preventDefault();
        const touch = event.touches[0];
        this.updatePreview(touch.clientX, touch.clientY);
      }
    };

    this.mouseUpListener = (event: MouseEvent) => {
      if (this.isConnectingSubject.value) {
        this.onConnectionEndCallback?.(event.target as HTMLElement);
        this.endConnection();
      }
    };

    this.touchEndListener = (event: TouchEvent) => {
      if (this.isConnectingSubject.value) {
        const touch = event.changedTouches[0];
        const targetElement = document.elementFromPoint(
          touch.clientX,
          touch.clientY
        ) as HTMLElement;
        this.onConnectionEndCallback?.(targetElement);
        this.endConnection();
      }
    };

    document.addEventListener('mousemove', this.mouseMoveListener);
    document.addEventListener('touchmove', this.touchMoveListener, { passive: false });
    document.addEventListener('mouseup', this.mouseUpListener);
    document.addEventListener('touchend', this.touchEndListener);
  }

  private removeConnectionEventListeners(): void {
    if (this.mouseMoveListener) {
      document.removeEventListener('mousemove', this.mouseMoveListener);
    }
    if (this.touchMoveListener) {
      document.removeEventListener('touchmove', this.touchMoveListener);
    }
    if (this.mouseUpListener) {
      document.removeEventListener('mouseup', this.mouseUpListener);
    }
    if (this.touchEndListener) {
      document.removeEventListener('touchend', this.touchEndListener);
    }
  }
}

