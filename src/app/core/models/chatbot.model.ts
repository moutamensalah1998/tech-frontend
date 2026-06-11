export type FlowNodeType = "message" | "question" | "interactive_buttons";

export interface Position {
  x: number;
  y: number;
}

export interface ContentItem {
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  order: number;
  content: {
    text_body?: string;
    file_name?: string;
    bytes?: string;
    mime_type?: string;
    preview_url?: string;
    file_size?: number;
    thumbnail_url?: string;
    caption?: string;
    document_title?: string;
    description?: string;
  };
}
export interface InteractiveReplyButton {
    id: string;
    title: string;
    next_node_id?: string;

}
export interface InteractiveButton {
  type: 'reply';
  reply: InteractiveReplyButton;
}

export interface InteractiveHeader {
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'media' | undefined;
  text?: string;
  media?: any;
}

export interface InteractiveFooter {
  text: string;
}

export interface InteractiveAction {
  buttons?: InteractiveButton[];
  button?: string;
  sections?: any[];
}

export interface DynamicFlowNodeBody {
  body_message?: {
    content_items: ContentItem[];
  };
  body_question?: {
    question_text: string;
    answer_variant: string;
    accept_media_response: boolean;
    save_to_variable: boolean;
    variable_name?: string;
  };
  body_button?: {
    type: 'button';
    header?: InteractiveHeader;
    body: {
      text: string;
    };
    footer?: InteractiveFooter;
    action: InteractiveAction;
  };
}

export interface Node {
  id: string;
  type: FlowNodeType;
  title: string;
  body: DynamicFlowNodeBody;
  position: Position;
  children: Node[];
  parents?: Node[];
  parent: Node | null;
  is_first: boolean;
  is_final: boolean;
  next_nodes?: string | null;
  buttonConnections?: { [buttonIndex: number]: string };
}
export interface ChatbotData {
  id: string;
  name: string;
  language: string;
  version: number;
  communicate_type: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  triggered?: number;
  stepsFinished?: number;
  finished?: number;
}

export interface ApiResponse {
  chatbots: ChatbotData[];
  total_count: number;
  total_pages: number;
  limit: number;
  page: number;
}
