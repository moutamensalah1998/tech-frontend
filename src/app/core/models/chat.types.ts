export interface ChatSession {
  session: string;
}

export interface ChatUser {
  userId: string;
  business_profile_id: string;
  connected_at: string;
}

export interface BusinessGroupMember {
  user_id: string;
  joined_at: string;
}

export interface ConversationMember {
  user_id: string;
  joined_at: string;
}

export interface MessageContext {
  type: 'reply' | 'forward' | string;
  replied_message_id?: string;
  original_content?: {
    question_text?: string;
    text?: string;
    text_body?: string;
    caption?: string;
    media_type?: string;
    accept_media_response?: boolean;
    answer_variant?: string;
    meta?: any;
    cdn_url?: string;
    media_id?: string;
    mime_type?: string;
    file_name?: string;
  };
}

export interface BaseMessage {
  _id: string;
  message_type: string;
  message_status?: string;
  content: any;
  recipient_number: string;
  context?: MessageContext;
  context_message_id?: string;
  created_at: string;
  is_from_contact: boolean;
}


export interface ChatMessage {
  id?: string;
  from: string;
  text: string;
  timestamp: number;
  conversation_id?: string;
  phone_number_id?: string;
  status?: MessageStatus;
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export interface MessageStatusUpdate {
  conversation_id: string;
  status: MessageStatus;
  message_id: string;
  timestamp: string;
}

export interface ConversationData {
  conversation_id: string;
}

export interface BusinessGroupData {
  phone_number_id: string;
}

export interface ChatError {
  message: string;
  code?: string;
}

// Socket Event Payloads
export interface JoinConversationPayload {
  conversation_id: string;
}

export interface LeaveConversationPayload {
  conversation_id: string;
}

export interface SendMessagePayload {
  text: string;
  conversation_id?: string;
}

export interface UserTypingPayload {
  userId: string;
  conversation_id?: string;
}

export interface JoinBusinessGroupPayload {
  session?: string;
}

export interface LeaveBusinessGroupPayload {
  session?: string;
}

export interface InteractiveHeader {
  type: 'text' | 'image' | 'video' | 'document';
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  documentName?: string;
}

export interface InteractiveButton {
  id: string;
  title: string;
}

export interface InteractiveListItem {
  id: string;
  title: string;
  description?: string;
}

export interface InteractiveView {
  type: 'button' | 'list' | 'flow';
  header?: InteractiveHeader;
  body?: string[];
  footer?: string;
  buttons: InteractiveButton[];
  listItems?: InteractiveListItem[];
}
export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTON' | 'BUTTONS';

  // Old structure properties
  sub_type?: 'quick_reply' | 'url' | 'phone_number';
  index?: number;
  text?: string;
  parameters?: Array<{ text: string }>;

  // New structure properties
  format?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'TEXT';
  example?: {
    header_handle?: string[];
  };
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
  }>;
}

export interface TemplateView {
  headerText?: string;
  bodyTexts: string[];
  footerText?: string;
  buttons: TemplateButton[];
  hasMedia?: boolean;
  mediaType?: 'image' | 'video' | 'document';
  mediaUrl?: string;
}

export interface TemplateButton {
  text: string;
  type: 'quick_reply' | 'url' | 'phone_number';
  url?: string;
  phoneNumber?: string;
}
