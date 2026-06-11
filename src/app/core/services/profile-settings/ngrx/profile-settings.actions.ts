import { createAction, props } from '@ngrx/store';

export const getBusinessProfile = createAction(
  '[Profile Settings] Get Profile Settings'
);

export const businessProfileSuccess = createAction(
  '[Profile Settings] Get Profile Settings Success',
  props<{ data: any }>()
);

export const businessProfileError = createAction(
  '[Profile Settings] Get Profile Settings Error',
  props<{ error: any }>()
);

export const updateBusinessProfile = createAction(
  '[Profile Settings] Update Business Profile',
  props<{ formData: FormData }>()
);

export const updateBusinessProfileSuccess = createAction(
  '[Profile Settings] Update Business Profile Success',
  props<{ data: any }>()
);

export const updateBusinessProfileError = createAction(
  '[Profile Settings] Update Business Profile Error',
  props<{ error: any }>()
);


