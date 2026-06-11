export interface BroadcastRequest {
  broadcast_name: string;
  list_of_numbers: string[];
  template_id: string;
  parameters: string[];
  scheduled_time: string;
  is_now: boolean;
  header_media_url?: string | null;
}

export interface BroadcastResponse {
  success: boolean;
  message: string;
  status_code: number;
  data: {
    broadcasts: BroadcastData[];
    total_count: number;
    total_pages: number;
    limit: number;
    page: number;
  };
}


export interface ApiErrorResponse {
  status: string;
  error: {
    status_code: number;
    error_code: string;
    message: string;
    timestamp: string;
    path: string;
  };
}

export interface BroadcastData {
  id: string;
  name: string;
  template_id: string;
  template_name?: string; 
  status: 'pending' | 'sent' | 'failed' | 'scheduled';
  scheduled_time: string;
  created_at?: string;
  updated_at?: string;
  total_contacts: number;
  user_id?: string;
  business_id?: string;
}
