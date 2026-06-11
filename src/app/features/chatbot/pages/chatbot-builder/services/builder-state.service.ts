import { Injectable } from '@angular/core';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Node } from '../../../../../core/models/chatbot.model';
import { Connection, ConnectionService } from './connection.service';
import { NodeManagementService } from './node-management.service';
import { DragDropService } from './drag-drop.service';
import { CanvasPanningService } from './canvas-panning.service';
import { SelectionService } from './selection.service';
import { ZoomConfig } from '../interface/node.interfaces';
import { NODE_CONSTANTS } from '../constants/node.constants';

@Injectable({
  providedIn: 'root'
})
export class BuilderStateService {
  // Expose observables from various services
  nodes$: Observable<Node[]>;
  connections$: Observable<Connection[]>;
  isPanning$: Observable<boolean>;
  isDragging$: Observable<boolean>;
  draggedNodeId$: Observable<string | null>;
  selectedNodeIds$: Observable<Set<string>>;
  zoomConfig$: Observable<ZoomConfig>;

  // Combined state
  private zoomConfigSubject = new BehaviorSubject<ZoomConfig>({
    level: 1,
    min: NODE_CONSTANTS.ZOOM.MIN,
    max: NODE_CONSTANTS.ZOOM.MAX,
    step: NODE_CONSTANTS.ZOOM.STEP
  });

  constructor(
    private nodeService: NodeManagementService,
    private connectionService: ConnectionService,
    private dragDropService: DragDropService,
    private panningService: CanvasPanningService,
    private selectionService: SelectionService
  ) {
    this.nodes$ = this.nodeService.nodes$;
    this.connections$ = this.connectionService.connections$;
    this.isPanning$ = this.panningService.isPanning$;
    this.isDragging$ = this.dragDropService.drag$.pipe(
      map(dragData => dragData?.isDragging ?? false)
    );
    this.draggedNodeId$ = this.dragDropService.drag$.pipe(
      map(dragData => dragData?.isDragging ? dragData.node.id : null)
    );
    this.selectedNodeIds$ = this.selectionService.selection$.pipe(
      map(selection => selection.selectedNodeIds)
    );
    this.zoomConfig$ = this.zoomConfigSubject.asObservable();
  }

  /**
   * Update zoom configuration
   */
  updateZoom(level: number): void {
    const current = this.zoomConfigSubject.value;
    const newLevel = Math.max(
      current.min,
      Math.min(current.max, level)
    );
    this.zoomConfigSubject.next({
      ...current,
      level: newLevel
    });
  }

  /**
   * Get current zoom config
   */
  getZoomConfig(): ZoomConfig {
    return this.zoomConfigSubject.value;
  }

  /**
   * Get current nodes
   */
  getNodes(): Node[] {
    return this.nodeService.nodes;
  }

  /**
   * Get current connections
   */
  getConnections(): Connection[] {
    return this.connectionService.getAllConnections(this.getNodes());
  }

  /**
   * Check if node is first
   */
  isNodeFirst(nodeId: string): boolean {
    return this.nodeService.isFirstNode(nodeId);
  }

  /**
   * Get first node
   */
  getFirstNode(): Node | null {
    return this.nodeService.getFirstNode();
  }

  /**
   * Get first node title
   */
  getFirstNodeTitle(): string | null {
    const firstNode = this.getFirstNode();
    return firstNode ? firstNode.title : null;
  }
}

