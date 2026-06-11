export interface AuthResponse {
  success: boolean;
  error?:{
    message: string;
    status_code: number;
    details: string;
  }
  message?: string;
  status_code?: number;
  data?: {
    access_token: string;
    token_type: string;
    refresh_token?: string;
  }

}

export interface LoginCredentials {
  email: string;
  password: string;
  client_id: string;
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  success: boolean;
  error?:{
    message: string;
    status_code: number;
    details: string;
  }
  message?: string;
  status_code?: number;
  data?: {
    access_token: string;
    token_type: string;
    refresh_token: string;
  }
}

export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  REFRESH_FAILED = 'REFRESH_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED'
}

export enum Role {
    ADMINISTRATOR = "ADMINISTRATOR",
    AUTOMATION_MANAGER = "AUTOMATION_MANAGER",
    BILLING_MANAGER = "BILLING_MANAGER",
    BROADCAST_MANAGER = "BROADCAST_MANAGER",
    DEVELOPER = "DEVELOPER",
    DASHBOARD_VIEWER = "DASHBOARD_VIEWER",
    TEMPLATE_MANAGER = "TEMPLATE_MANAGER",
    OPERATOR = "OPERATOR",
    CONTACT_MANAGER = "CONTACT_MANAGER"
}

