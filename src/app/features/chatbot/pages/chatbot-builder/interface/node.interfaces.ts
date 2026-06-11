import { EventEmitter } from '@angular/core';
import { Node } from '../../../../../core/models/chatbot.model';

export interface NodeComponent {
  node: Node;
  isDragging: boolean;
  onConnectionStart: EventEmitter<MouseEvent | TouchEvent>;
  onAddNode: EventEmitter<void>;
  onDelete: EventEmitter<void>;
  onContentChange: EventEmitter<void>;
}

export interface DraggableComponent {
  onMouseDown(event: MouseEvent): void;
  onTouchStart(event: TouchEvent): void;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface ConnectionPoint extends NodePosition {}

export interface ZoomConfig {
  level: number;
  min: number;
  max: number;
  step: number;
}
