export interface ContactAttribute {
  id: string;
  name: string;
  value: string;
  contact_id: string;
  created_at: string;
  updated_at: string;
}

export interface ContactAttributesResponse {
  success: boolean;
  message: string;
  status_code: number;
  data: {
    attributes: ContactAttribute[];
    total_count: number;
    total_pages: number;
    limit: number;
    page: number;
  };
} 