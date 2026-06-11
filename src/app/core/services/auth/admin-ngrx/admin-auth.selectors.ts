import { createSelector, createFeatureSelector } from "@ngrx/store";
import { AdminAuthState } from "./admin-auth.reducer";

export const selectAdminAuthState = createFeatureSelector<AdminAuthState>('adminAuth');

export const selectAdminAuthLoading = createSelector(
  selectAdminAuthState,
  (state: AdminAuthState) => state.loading
);

export const selectAdminAuthError = createSelector(
  selectAdminAuthState,
  (state: AdminAuthState) => state.error
);

export const selectAdminAccessToken = createSelector(
  selectAdminAuthState,
  (state: AdminAuthState) => state.accessToken
);

export const selectAdminRefreshToken = createSelector(
  selectAdminAuthState,
  (state: AdminAuthState) => state.refreshToken
);

export const selectAdminIsAuthenticated = createSelector(
  selectAdminAccessToken,
  (accessToken) => !!accessToken
);

