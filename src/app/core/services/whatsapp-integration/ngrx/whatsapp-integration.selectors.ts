import { createSelector } from '@ngrx/store';
import { WhatsappIntegrationState } from './whatsapp-integration.reducer';

export const getWhatsappIntegrationState = (state: any) => state.whatsappIntegration;

export const selectConnectionId = createSelector(
  getWhatsappIntegrationState,
  (state: WhatsappIntegrationState) => state.connectionId
);

export const selectConnectionStatus = createSelector(
  getWhatsappIntegrationState,
  (state: WhatsappIntegrationState) => state.status
);

export const selectWabaId = createSelector(
  getWhatsappIntegrationState,
  (state: WhatsappIntegrationState) => state.wabaId
);

export const selectPhoneNumberId = createSelector(
  getWhatsappIntegrationState,
  (state: WhatsappIntegrationState) => state.phoneNumberId
);

export const selectIsSigningUp = createSelector(
  getWhatsappIntegrationState,
  (state: WhatsappIntegrationState) => state.signingUp
);

export const selectIsLoading = createSelector(
  getWhatsappIntegrationState,
  (state: WhatsappIntegrationState) => state.loading
);

export const selectIsPolling = createSelector(
  getWhatsappIntegrationState,
  (state: WhatsappIntegrationState) => state.polling
);

export const selectWhatsappIntegrationError = createSelector(
  getWhatsappIntegrationState,
  (state: WhatsappIntegrationState) => state.error
);

export const selectIsConnected = createSelector(
  getWhatsappIntegrationState,
  (state: WhatsappIntegrationState) => state.status === 'connected'
);

export const selectPhoneNumber = createSelector(
  getWhatsappIntegrationState,
  (state: WhatsappIntegrationState) => state.phoneNumber
);

export const selectVerifiedName = createSelector(
  getWhatsappIntegrationState,
  (state: WhatsappIntegrationState) => state.verifiedName
);

export const selectQualityRating = createSelector(
  getWhatsappIntegrationState,
  (state: WhatsappIntegrationState) => state.qualityRating
);

export const selectSuccessMessage = createSelector(
  getWhatsappIntegrationState,
  (state: WhatsappIntegrationState) => state.successMessage
);

