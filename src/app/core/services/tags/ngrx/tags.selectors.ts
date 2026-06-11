import { createFeatureSelector, createSelector } from '@ngrx/store';
import {  TagState } from './tags.reducer';

export const selectTagState =
  createFeatureSelector<TagState>('TagSettings');

export const selectTagLoading = createSelector(
  selectTagState,
  (state) => state.loading
);

export const selectTagError = createSelector(
  selectTagState,
  (state) => state.error
);

export const selectTagData = createSelector(
  selectTagState,
  (state) => state.data
);
