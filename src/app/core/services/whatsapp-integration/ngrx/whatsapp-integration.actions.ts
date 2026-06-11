import { createAction, props } from '@ngrx/store';
import {
  ExchangeCodeResponse,
  ConnectionStatusResponse,
  ExchangeTokenResponse,
} from '../../../models/whatsapp-integration.model';

// Start signup flow
export const startWhatsAppSignup = createAction(
  '[WhatsApp Integration/API] Start WhatsApp Signup',
  props<{ tenantId: string }>()
);

export const startWhatsAppSignupSuccess = createAction(
  '[WhatsApp Integration/API] Start WhatsApp Signup Success',
  props<{ response: ExchangeCodeResponse }>()
);

export const startWhatsAppSignupFailure = createAction(
  '[WhatsApp Integration/API] Start WhatsApp Signup Failure',
  props<{ error: any }>()
);

// Check connection status
export const checkConnectionStatus = createAction(
  '[WhatsApp Integration/API] Check Connection Status',
  props<{ connectionId: string }>()
);

export const checkConnectionStatusSuccess = createAction(
  '[WhatsApp Integration/API] Check Connection Status Success',
  props<{ response: ConnectionStatusResponse }>()
);

export const checkConnectionStatusFailure = createAction(
  '[WhatsApp Integration/API] Check Connection Status Failure',
  props<{ error: any }>()
);

// Poll connection status
export const startPollingConnection = createAction(
  '[WhatsApp Integration] Start Polling Connection',
  props<{ connectionId: string }>()
);

export const stopPollingConnection = createAction(
  '[WhatsApp Integration] Stop Polling Connection'
);

// Embedded Signup actions
export const startEmbeddedSignup = createAction(
  '[WhatsApp Integration/API] Start Embedded Signup',
  props<{ clientId: string }>()
);

export const startEmbeddedSignupSuccess = createAction(
  '[WhatsApp Integration/API] Start Embedded Signup Success',
  props<{ response: ExchangeTokenResponse }>()
);

export const startEmbeddedSignupFailure = createAction(
  '[WhatsApp Integration/API] Start Embedded Signup Failure',
  props<{ error: any }>()
);

