import { createReducer, on } from '@ngrx/store';
import { UploadMedia, UploadMediaSuccess, UploadMediaFailure } from './meida.actions';

export interface UploadMediaState {
  loading: boolean;
  error: any | null;
  data: any;
  success: boolean | null
}

export const uploadMediagInitialState: UploadMediaState = {
  loading: false,
  error: null,
  data: null,
  success: null
};

export const uploadMediaReducer = createReducer(
  uploadMediagInitialState,
  on(
    UploadMedia,
    (state) => ({ ...state, loading: true, error: null, data: null })
  ),
  on(
    UploadMediaSuccess,
    (state, { response }) => ({
      ...state,
      loading: false,
      data: response,
      success: true,
      error: null
    })
  ),
  on(
    UploadMediaFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error,
      success: false,
      data: null
    })
  )
)
