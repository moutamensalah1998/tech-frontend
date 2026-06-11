import { createReducer, on } from '@ngrx/store';
import * as WhatsappIntegrationActions from './whatsapp-integration.actions';

export interface WhatsappIntegrationState {
  connectionId: string | null;
  status: 'pending' | 'connected' | 'failed' | null;
  wabaId: string | null;
  phoneNumberId: string | null;
  phoneNumber: string | null;
  verifiedName: string | null;
  qualityRating: string | null;
  loading: boolean;
  signingUp: boolean;
  polling: boolean;
  error: any;
  successMessage: string | null;
}

export const initialState: WhatsappIntegrationState = {
  connectionId: null,
  status: null,
  wabaId: null,
  phoneNumberId: null,
  phoneNumber: null,
  verifiedName: null,
  qualityRating: null,
  loading: false,
  signingUp: false,
  polling: false,
  error: null,
  successMessage: null,
};

export const whatsappIntegrationReducer = createReducer(
  initialState,
  on(WhatsappIntegrationActions.startWhatsAppSignup, (state) => ({
    ...state,
    signingUp: true,
    error: null,
  })),
  on(WhatsappIntegrationActions.startWhatsAppSignupSuccess, (state, { response }) => ({
    ...state,
    signingUp: false,
    connectionId: response.connection_id,
    status: response.status,
    error: null,
  })),
  on(WhatsappIntegrationActions.startWhatsAppSignupFailure, (state, { error }) => ({
    ...state,
    signingUp: false,
    error,
  })),
  on(WhatsappIntegrationActions.checkConnectionStatus, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(WhatsappIntegrationActions.checkConnectionStatusSuccess, (state, { response }) => ({
    ...state,
    loading: false,
    status: response.status,
    wabaId: response.waba_id || state.wabaId,
    phoneNumberId: response.phone_number_id || state.phoneNumberId,
    error: null,
  })),
  on(WhatsappIntegrationActions.checkConnectionStatusFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(WhatsappIntegrationActions.startPollingConnection, (state) => ({
    ...state,
    polling: true,
  })),
  on(WhatsappIntegrationActions.stopPollingConnection, (state) => ({
    ...state,
    polling: false,
  })),
  // Embedded Signup actions
  on(WhatsappIntegrationActions.startEmbeddedSignup, (state) => ({
    ...state,
    signingUp: true,
    error: null,
    successMessage: null,
  })),
  on(WhatsappIntegrationActions.startEmbeddedSignupSuccess, (state, { response }) => ({
    ...state,
    signingUp: false,
    status: 'connected' as const,
    wabaId: response.waba_id,
    phoneNumberId: response.phone_number_id,
    phoneNumber: response.phone_number,
    verifiedName: response.verified_name,
    qualityRating: response.quality_rating,
    successMessage: response.message,
    error: null,
  })),
  on(WhatsappIntegrationActions.startEmbeddedSignupFailure, (state, { error }) => ({
    ...state,
    signingUp: false,
    error,
    successMessage: null,
  }))
);

