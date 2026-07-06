// --- AI Settings ---
export interface AISettings {
  enabled: boolean;
  auto_reply_enabled: boolean;
  auto_actions_enabled: boolean;
  confidence_threshold: number;
  fallback_message: string;
  model: string;
  fallback_assignment_user_id?: string;
  fallback_assignment_user_name?: string;
}

export interface FallbackAssignment {
  user_id: string | null;
  user_name: string | null;
}

export interface UserSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface AIStats {
  total_sources: number;
  ready_sources: number;
  total_chunks: number;
}

// --- Knowledge Sources ---
export type SourceType = 'url' | 'text' | 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'txt' | 'csv' | 'png' | 'jpg' | 'jpeg' | 'image' | 'excel' | 'word';

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  'url': 'Website URL',
  'text': 'Text Content',
  'pdf': 'PDF Document',
  'doc': 'Word Document',
  'docx': 'Word Document',
  'xls': 'Excel Spreadsheet',
  'xlsx': 'Excel Spreadsheet',
  'txt': 'Text File',
  'csv': 'CSV File',
  'png': 'PNG Image',
  'jpg': 'JPEG Image',
  'jpeg': 'JPEG Image',
  'image': 'Image',
  'excel': 'Excel Spreadsheet',
  'word': 'Word Document',
};

export const FILE_SOURCE_TYPES: string[] = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'image', 'excel', 'word'];
export const TEXT_SOURCE_TYPES: string[] = ['url', 'text'];

export interface KnowledgeSource {
  id: string;
  name: string;
  source_type: string;
  url?: string;
  content?: string;
  status: string;
  chunk_count: number;
  is_active: boolean;
  error_message?: string;
  last_scraped_at?: string;
  created_at?: string;
  filename?: string;
}

export interface KnowledgeSourceCreate {
  name: string;
  source_type: string;
  url?: string;
  content?: string;
}

// --- Test ---
export interface AITestRequest {
  client_id: string;
  message: string;
}

export interface AITestResponse {
  success: boolean;
  response: string;
  sources: string[];
  confidence: number;
  has_knowledge: boolean;
  response_time_ms: number;
  language?: string;
  model_used?: string;
  chunks_retrieved?: number;
  prompt_sent?: string;
}