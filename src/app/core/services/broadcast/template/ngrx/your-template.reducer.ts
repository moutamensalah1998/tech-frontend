import { createReducer, on } from '@ngrx/store';
import * as TemplateActions from './your-template.actions';
import { TemplateApiResponse } from '../../../../models/whatsapp-template.model';

export interface TemplateState {
  templates: TemplateApiResponse | null;
  templatesLoading: boolean;
  uploadLoading: boolean;
  error: any;
  createNewTemplate: boolean;
  newTemplateError: any;
  mediaIds: { [key: string]: string };
  syncing: boolean;
}

export const initialState: TemplateState = {
  templates: null,
  templatesLoading: false,
  uploadLoading: false,
  error: null,
  createNewTemplate: false,
  newTemplateError: null,
  mediaIds: {},
  syncing: false
};


export const templateReducer = createReducer(
  initialState,
  on(TemplateActions.loadTemplates, (state) => ({
    ...state,
    templatesLoading: true,
    error: null,
  })),
  on(TemplateActions.loadTemplatesSuccess, (state, { templates }) => ({
    ...state,
    templates,
    templatesLoading: false,
  })),
  on(TemplateActions.loadTemplatesFailure, (state, { error }) => ({
    ...state,
    error,
    templatesLoading: false,
  })),

  on(TemplateActions.uploadMedia, (state) => ({
    ...state,
    uploadLoading: true,
    error: null,
  })),
  on(TemplateActions.uploadMediaSuccess, (state, { response, mediaType }) => {
    let mediaId = '';
    if (response?.data?.h) {
      mediaId = response.data.h;
    }

    return {
      ...state,
      uploadLoading: false,
      mediaIds: {
        ...state.mediaIds,
        [mediaType]: mediaId,
      },
    };
  }),
  on(TemplateActions.uploadMediaFailure, (state, { error }) => ({
    ...state,
    error,
    uploadLoading: false,
  })),

  on(TemplateActions.createTemplate, (state) => ({
    ...state,
    createNewTemplate: true,
    newTemplateError: null,
  })),
  on(TemplateActions.createTemplateSuccess, (state) => ({
    ...state,
    createNewTemplate: false,
    newTemplateError: null,
  })),
  on(TemplateActions.createTemplateFailure, (state, { error }) => ({
    ...state,
    createNewTemplate: false,
    newTemplateError: error,
  })),
  on(TemplateActions.syncTemplates, (state) => ({
    ...state,
    syncing: true,
  })),
  on(TemplateActions.syncTemplatesSuccess, (state) => ({
    ...state,
    syncing: false,
  })),
  on(TemplateActions.syncTemplatesFailure, (state) => ({
    ...state,
    syncing: false,
  }))
);
