import { Node } from '../../../../../core/models/chatbot.model';
import { Connection } from '../services/connection.service';
import { ZoomConfig } from '../interface/node.interfaces';

export interface BuilderState {
  nodes: Node[];
  connections: Connection[];
  zoomConfig: ZoomConfig;
  isPanning: boolean;
  isDragging: boolean;
  draggedNodeId: string | null;
  selectedNode: Node | null;
  selectedConnection: Connection | null;
  showAddMenu: boolean;
  showShortcutsHelp: boolean;
}

