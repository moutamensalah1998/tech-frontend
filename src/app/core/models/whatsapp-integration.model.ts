export interface ExchangeCodeRequest {
  tenant_id: string;
  code: string;
  redirect_uri: string;
}

export interface ExchangeCodeResponse {
  connection_id: string;
  status: 'pending' | 'connected' | 'failed';
}

export interface ConnectionStatusResponse {
  connection_id: string;
  status: 'pending' | 'connected' | 'failed';
  waba_id?: string;
  phone_number_id?: string;
}

// Embedded Signup interfaces
export interface ExchangeTokenRequest {
  code: string;
  client_id: string;
}

export interface ExchangeTokenResponse {
  waba_id: string;
  phone_number_id: string;
  phone_number: string;
  verified_name: string;
  quality_rating: string;
  message: string;
}

export interface MetaSDKResponse {
  code?: string;
  error?: string;
  error_description?: string;
}

// Extend Window interface for Meta SDK
declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: any;
  }
}

