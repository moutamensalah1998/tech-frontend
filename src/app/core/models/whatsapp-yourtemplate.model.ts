export interface WhatsAppTemplate {
  id?: string;
  name: string;
  status?: string;
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  language: string;
  components: TemplateComponent[];
}

export interface WhatsAppTemplateResponse {
  templates: WhatsAppTemplate[];
  paging?: {
    before: string;
    after: string;
  };
}

export type TemplateComponent =
  | HeaderComponent
  | BodyComponent
  | FooterComponent
  | ButtonsComponent;

export interface HeaderComponent {
  type: 'HEADER';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: Record<string, any[]>;
  buttons?: TemplateButton[];
  image?: string;
  video?: string;
  document?: string;
}

export interface BodyComponent {
  type: 'BODY';
  text?: string;
  add_security_recommendation?: boolean;
  example?: Record<string, any[]>;
}

export interface FooterComponent {
  type: 'FOOTER';
  text?: string;
  code_expiration_minutes?: number;
}

export interface ButtonsComponent {
  type: 'BUTTONS';
  buttons: TemplateButton[];
}

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  index?: number;
  text?: string;
  phone_number?: string;
  url?: string;
  otp_type?: string;
  example?: string;
  package_name?: string;
  signature_hash?: string;
}

export interface CreateTemplateRequest {
  name: string;
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  language: string;
  body?: string;
  components: TemplateComponent[];
}

export interface WorkingTemplateRequest {
  name: string;
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  language: string;
  header?: {
    format: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    text?: string;
    media_handle?: string;
    variables: any[];
  };
  body?: {
    text: string;
    variables: any[];
  };
  footer?: {
    text: string;
  };
  buttons?: any[];
}

export function toJsonCreate(template: CreateTemplateRequest): string {
  return JSON.stringify(template, null, 2);
}
