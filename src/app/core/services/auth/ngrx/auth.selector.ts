import { createSelector, createFeatureSelector } from "@ngrx/store";
import { AuthState } from "./auth.reducer";

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectAuthLoading = createSelector(
  selectAuthState,
  (state: AuthState) => state.loading
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state: AuthState) => state.error
);

export const selectAuthResponse = createSelector(
  selectAuthState,
  (state: AuthState) => state.response
);

export const selectAuthUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.user
);

