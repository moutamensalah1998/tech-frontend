import { FlowNodeType } from '../../../../../core/models/chatbot.model';

export interface ApiNode {
  id: string;
  type: FlowNodeType;
  body: any;
  is_final: boolean;
  is_first: boolean;
  position: { x: number; y: number };
  next_nodes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatbotFlowResponse {
  chatbot: {
    id: string;
    name: string;
    language: string;
    version: number;
    communicate_type: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
  };
  nodes: ApiNode[];
  statistics: {
    total_nodes: number;
    nodes_by_type: Record<string, number>;
    total_connections: number;
    orphaned_nodes: number;
    starting_nodes: number;
    final_nodes: number;
    has_media_content: boolean;
    complexity_level: string;
  };
  total_nodes: number;
}

