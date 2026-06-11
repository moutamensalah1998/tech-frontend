import { createReducer, on } from '@ngrx/store';
import * as ProfileSettingsActions from './profile-settings.actions';

export interface BusinessProfileState {
  loading: boolean;
  error: any | null;
  data: any;
}

export const businessProfileInitialState: BusinessProfileState = {
  loading: false,
  error: null,
  data: null,
};


export const profileSettingsBusinessProfileReducer = createReducer(
  businessProfileInitialState,
  on(
    ProfileSettingsActions.getBusinessProfile,
    (state) => ({ ...state, loading: true, error: null })
  ),
  on(
    ProfileSettingsActions.businessProfileSuccess,
    (state, { data }) => ({ ...state, loading: false, data })
  ),
  on(
    ProfileSettingsActions.businessProfileError,
    (state, { error }) => ({ ...state, loading: false, error })
  ),
  on(
    ProfileSettingsActions.updateBusinessProfile,
    (state) => ({ ...state, loading: true, error: null })
  ),
  on(
    ProfileSettingsActions.updateBusinessProfileSuccess,
    (state, { data }) => ({ ...state, loading: false, data })
  ),
  on(
    ProfileSettingsActions.updateBusinessProfileError,
    (state, { error }) => ({ ...state, loading: false, error })
  )
)

