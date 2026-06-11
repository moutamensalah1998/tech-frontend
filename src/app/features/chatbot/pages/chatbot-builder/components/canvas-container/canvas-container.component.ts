import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  TrackByFunction,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../../../../../core/models/chatbot.model';
import { MessageNodeComponent } from '../app-message-node/app-message-node.component';
import { QuestionNodeComponent } from '../app-question-node/app-question-node.component';
import { InteractiveButtonsNodeComponent } from '../app-interactive-buttons-node/app-interactive-buttons-node.component';
import { ConnectionLayerComponent } from '../connection-layer/connection-layer.component';
import { Connection } from '../../services/connection.service';
import { ConnectionPreviewLine, ConnectionDeleteButton } from '../../models/connection-preview.model';
import { ZoomConfig } from '../../interface/node.interfaces';

export interface GridConfig {
  enabled: boolean;
  size: number;
  showGrid: boolean;
}

@Component({
  selector: 'app-canvas-container',
  standalone: true,
  imports: [
    CommonModule,
    MessageNodeComponent,
    QuestionNodeComponent,
    InteractiveButtonsNodeComponent,
    ConnectionLayerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './canvas-container.component.html',
  styleUrls: ['./canvas-container.component.scss']
})
export class CanvasContainerComponent {
  @ViewChild('gridContainer', { static: true })
  gridContainer!: ElementRef<HTMLElement>;

  @Input() nodes: Node[] = [];
  @Input() connections: Connection[] = [];
  @Input() zoomConfig!: ZoomConfig;
  @Input() gridConfig!: GridConfig;
  @Input() isPanning = false;
  @Input() isDragging = false;
  @Input() draggedNodeId: string | null = null;
  @Input() previewLine: ConnectionPreviewLine | null = null;
  @Input() deleteButton: ConnectionDeleteButton | null = null;
  @Input() isNodeFirst: (id: string) => boolean = () => false;

  @Output() nodeConnectionStart = new EventEmitter<{ node: Node; event: MouseEvent | TouchEvent | any }>();
  @Output() nodeAdd = new EventEmitter<Node>();
  @Output() nodeDelete = new EventEmitter<Node>();
  @Output() nodeContentChange = new EventEmitter<void>();
  @Output() connectionClick = new EventEmitter<{ connection: Connection; event: MouseEvent }>();
  @Output() connectionDelete = new EventEmitter<void>();
  @Output() canvasClick = new EventEmitter<Event>();
  @Output() viewportChange = new EventEmitter<{ x: number; y: number; width: number; height: number }>();

  trackByNodeId: TrackByFunction<Node> = (index: number, node: Node) => node.id;

  getTransformStyle(): string {
    return `scale(${this.zoomConfig.level})`;
  }

  getGridStyle(): { [key: string]: string } {
    if (!this.gridConfig.showGrid) {
      return {};
    }
    const size = this.gridConfig.size;
    return {
      'background-image': 'linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px)',
      'background-size': `${size}px ${size}px`
    };
  }

  getNodeZIndex(node: Node, isDragging: boolean, draggedNodeId: string | null, isNodeFirst: (id: string) => boolean): number {
    const baseZIndex = 20;

    if (isDragging && draggedNodeId === node.id) {
      return 1000;
    }

    if (isNodeFirst(node.id)) {
      return baseZIndex + 5;
    }

    return baseZIndex;
  }

  onNodeConnectionStart(node: Node, event: MouseEvent | TouchEvent | any): void {
    this.nodeConnectionStart.emit({ node, event });
  }

  onNodeAdd(node: Node): void {
    this.nodeAdd.emit(node);
  }

  onNodeDelete(node: Node): void {
    this.nodeDelete.emit(node);
  }

  onNodeContentChange(): void {
    this.nodeContentChange.emit();
  }

  onConnectionClick(connection: Connection, event: MouseEvent): void {
    this.connectionClick.emit({ connection, event });
  }

  onConnectionDelete(): void {
    this.connectionDelete.emit();
  }

  onCanvasClick(event: Event): void {
    this.canvasClick.emit(event);
  }
}

