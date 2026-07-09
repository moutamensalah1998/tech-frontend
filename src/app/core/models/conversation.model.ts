
export type ConversationOwner = 'NONE' | 'AI' | 'CHATBOT' | 'HUMAN';

export interface Conversation {
  id: string;
  contact_name: string;
  contact_phone_number: string;
  country_code_phone_number: string;
  updated_at: string;
  contact_id: string;
  client_id: string;
  created_at: string;
  status: 'OPEN' | 'SOLVED' | 'PENDING' | string;
  user_assignments_id: string;
  last_message: string;
  last_message_time: number;
  conversation_expiration_time: string;
  conversation_is_expired: boolean;
  unread_count: number;
  chatbot_triggered: boolean;
  owner: ConversationOwner;
}

export interface Meta {
  total_items: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
  next_page: number | null;
  prev_page: number | null;
}

export interface ConversationsResponse {
  data: Conversation[];
  meta: Meta;
}
