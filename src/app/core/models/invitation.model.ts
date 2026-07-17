export interface InvitationItem {
  id: string;
  email: string | null;
  company_name: string | null;
  token: string;
  invitation_link?: string;
  status: 'pending' | 'used' | 'expired' | 'disabled';
  expires_at: string;
  used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvitationListResponse {
  success: boolean;
  message?: string;
  status_code: number;
  data: {
    items: InvitationItem[];
    total: number;
  };
}

export interface InvitationCreateResponse {
  success: boolean;
  message?: string;
  status_code: number;
  data: InvitationItem;
}

export interface InvitationValidateResponse {
  success: boolean;
  message?: string;
  status_code: number;
  data: InvitationItem;
}

export interface RegisterWithInvitationRequest {
  token: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  company_name: string;
}

export interface RegisterWithInvitationResponse {
  success: boolean;
  message?: string;
  status_code: number;
  data: {
    message: string;
    access_token: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    client: {
      id: string;
      company_name: string;
    };
  };
}

export interface RegisterEmbeddedSignupResponse {
  success: boolean;
  message?: string;
  status_code: number;
  data: {
    message: string;
    access_token: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    client: {
      id: string;
      company_name: string;
    };
    waba?: {
      waba_id: string;
      phone_number: string;
      phone_number_id: string;
    };
  };
}
