import { createSelector } from '@ngrx/store';
import { TemplateState } from './your-template.reducer';

export const getTemplateState = (state: any) => state.whatsappTemplates;

export const selectTemplates = createSelector(
  getTemplateState,
  (state: TemplateState) => {
    if (state.templates?.data && Array.isArray(state.templates.data)) {
      return state.templates;
    }
    return { data: [], meta: { total_items: 0, total_pages: 0, current_page: 1, page_size: 10, has_next: false, has_prev: false, next_page: null, prev_page: null } };
  }
);

// export const selectTemplateLoading = createSelector(
//   getTemplateState,
//   (state) => state.loading
// );

export const selectTemplateError = createSelector(
  getTemplateState,
  (state) => state.error
);

export const selectCreateNewTemplate = createSelector(
  getTemplateState,
  (state) => state.createNewTemplate
);

export const selectNewTemplateError = createSelector(
  getTemplateState,
  (state) => state.newTemplateError
);

export const selectMediaIds = createSelector(
  getTemplateState,
  (state) => state.mediaIds
);

export const selectTemplateLoading = createSelector(
  getTemplateState,
  (state): boolean => !!state?.templatesLoading
);

export const selectUploadLoading = createSelector(
  getTemplateState,
  (state: TemplateState) => state.uploadLoading
);

export const selectSyncing = createSelector(
  getTemplateState,
  (state: TemplateState) => state.syncing
);
