
import { createAction, props } from '@ngrx/store';

export const getAttributes = createAction(
  '[Profile Settings] Get Attributes',
  props<{ page: number, limit: number, searchTerm?: string }>()
);

export const getAttributesSuccess = createAction(
  '[Profile Settings] Get Attributes Success',
  props<{ data: any }>()
);

export const getAttributesError = createAction(
  '[Profile Settings] Get Attributes Error',
  props<{ error: any }>()
);

export const addAttribute = createAction(
  '[Profile Settings] Add Attribute',
  props<{ name: string }>()
);

export const addAttributeSuccess = createAction(
  '[Profile Settings] Add Attribute Success',
  props<{ data: any }>()
);

export const addAttributeError = createAction(
  '[Profile Settings] Add Attribute Error',
  props<{ error: any }>()
);

export const deleteAttribute = createAction(
  '[Profile Settings] delete Attribute',
  props<{ name: string }>()
);

export const deleteAttributeSuccess = createAction(
  '[Profile Settings] delete Attribute Success',
  props<{ data: any }>()
);

export const deleteAttributeError = createAction(
  '[Profile Settings] delete Attribute Error',
  props<{ error: any }>()
);

export const updateAttribute = createAction(
  '[Profile Settings] update Attribute',
  props<{ name: string, newName: string }>()
);

export const updateAttributeSuccess = createAction(
  '[Profile Settings] update Attribute Success',
  props<{ data: any }>()
);

export const updateAttributeError = createAction(
  '[Profile Settings] update Attribute Error',
  props<{ error: any }>()
);
