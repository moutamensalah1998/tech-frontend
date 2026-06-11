import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BusinessProfileState } from './profile-settings.reducer';

export const selectBusinessProfileState =
  createFeatureSelector<BusinessProfileState>('BusinessProfileSettings');

export const selectLoading = createSelector(
  selectBusinessProfileState,
  (state) => state.loading
);

export const selectError = createSelector(
  selectBusinessProfileState,
  (state) => state.error
);

export const selectProfileData = createSelector(
  selectBusinessProfileState,
  (state) => state.data
);
