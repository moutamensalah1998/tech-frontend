import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AttributesState } from './attributes.reducer';
import { PaginationData } from '../../../models/pagination.model';
import { AttributeModel } from '../../../models/attribute.model';

export const selectAttributesState =
  createFeatureSelector<AttributesState>('AttributesSettings');

export const selectAttributesLoading = createSelector(
  selectAttributesState,
  (state) => state.loading
);

export const selectAttributesError = createSelector(
  selectAttributesState,
  (state) => state.error
);

export const selectAttributesData = createSelector(
  selectAttributesState,
  (state) => state.data
);

export const selectAttributesList = createSelector(
  selectAttributesData,
  (data: AttributeModel | null) => data?.attributes || []
);

export const selectAttributesPagination = createSelector(
  selectAttributesData,
  (data: AttributeModel | null): PaginationData => ({
    total_count: data?.total_count || 0,
    total_pages: data?.total_pages || 0,
    limit: data?.limit || 10,
    page: data?.page || 1
  })
);