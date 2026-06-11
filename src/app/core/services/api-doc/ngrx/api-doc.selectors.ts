import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ApiDocState } from './api-doc.reducer';

export const selectApiDocState = createFeatureSelector<ApiDocState>('apiDoc');

export const selectOpenApiSpec = createSelector(
  selectApiDocState,
  (state) => state.spec
);

export const selectLoading = createSelector(
  selectApiDocState,
  (state) => state.loading
);

export const selectError = createSelector(
  selectApiDocState,
  (state) => state.error
);

export const selectAccessToken = createSelector(
  selectApiDocState,
  (state) => state.accessToken
);

export const selectGeneratingToken = createSelector(
  selectApiDocState,
  (state) => state.generatingToken
);

export const selectTokenError = createSelector(
  selectApiDocState,
  (state) => state.tokenError
);

