export interface Note {
  id: string;
  content: string;
  updated_at: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface CreateNoteRequest {
  content: string;
  contact_id?: string;
}

export interface UpdateNoteRequest {
  content: string;
}

export interface NotesResponse {
  success: boolean;
  message: string;
  status_code: number;
  data: {
    notes: Note[];
    total_count: number;
    total_pages: number;
    has_next: boolean;
    page: number;
    limit: number;
  };
} 