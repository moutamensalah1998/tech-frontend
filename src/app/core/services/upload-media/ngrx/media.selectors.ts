import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UploadMediaState } from './meida.reducer';

export const selectUploadMediaState =
  createFeatureSelector<UploadMediaState>('uploadMedia');

export const selectUploadMediaLoading = createSelector(
  selectUploadMediaState,
  (state) => state.loading
);

export const selectUploadMediaError = createSelector(
  selectUploadMediaState,
  (state) => state.error
);

export const selectUploadMediaData = createSelector(
  selectUploadMediaState,
  (state) => state.data
);
