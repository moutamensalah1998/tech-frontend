export type TemplateStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'PENDING_DELETION'
  | 'REJECTED'
  | 'DRAFT'
  | 'PAUSED'
  | 'DISABLED';

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: string | null;
  text?: string | null;
  example?: {
    header_handle?: string[];
    body_text_named_params?: Array<{
      param_name: string;
      example: string;
    }>;
  } | null;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE' | 'COPY_CODE'; 
    text?: string;
    example?: string;
  }> | null;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  status: TemplateStatus;
  category: string;
  previous_category?: string;
  template_wat_id?: string;
  components: TemplateComponent[];
  reason?: string;
  client_id?: string;
  created_at?: string;
  updated_at?: string;
  cdnUrl?: string;
}

// --- Response Wrappers ---
export interface TemplateItem {
  template: WhatsAppTemplate;
  variables: string[];
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

export interface TemplateApiResponse {
  data: TemplateItem[];
  meta: Meta;
}
