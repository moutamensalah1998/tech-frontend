export type NodeEventType = 'add' | 'delete' | 'update' | 'connect';

export interface NodeEvent<T = any> {
  type: NodeEventType;
  nodeId: string;
  data?: T;
}

export interface ConnectionEvent {
  source: Node;
  target: Node;
  action: 'create' | 'delete';
}

// enums/node.enums.ts
export enum NodeType {
  MESSAGE = 'message',
  QUESTION = 'question',
  INTERACTIVE_BUTTONS = 'interactive_buttons'
}

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document'
}

export enum DragState {
  IDLE = 'idle',
  DRAGGING = 'dragging',
  CONNECTING = 'connecting'
}
