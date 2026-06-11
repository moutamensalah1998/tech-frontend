import { createReducer, on } from '@ngrx/store';
import * as TagSettingsActions from './tags.actions';

export interface TagState {
  loading: boolean;
  error: any | null;
  data: any;
  success: boolean | null
}

export const tagInitialState: TagState = {
  loading: false,
  error: null,
  data: null,
  success: null
};


export const tagReducer = createReducer(
  tagInitialState,
  on(
    TagSettingsActions.getTags,
    TagSettingsActions.addTag,
    (state) => ({ ...state, loading: true, error: null })
  ),
  on(
    TagSettingsActions.getTagsSuccess,
    (state, { data }) => ({ ...state, loading: false, data, success: true })
  ),
  on(
    TagSettingsActions.addTagSuccess,
    (state, { data }) => ({ ...state, loading: false, success: true })
  ),
  on(
    TagSettingsActions.getTagsError,
    TagSettingsActions.addTagError,
    (state, { error }) => ({ ...state, loading: false, error })
  )
);

