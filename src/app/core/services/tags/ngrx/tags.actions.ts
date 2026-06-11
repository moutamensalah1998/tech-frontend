
import { createAction, props } from '@ngrx/store';

export const getTags = createAction(
  '[Profile Settings] Get Tags',
  props<{ page: number, limit: number, searchTerm?: string}>()
);

export const getTagsSuccess = createAction(
  '[Profile Settings] Get Tags Success',
  props<{ data: any }>()
);

export const getTagsError = createAction(
  '[Profile Settings] Get Tags Error',
  props<{ error: any }>()
);

export const addTag = createAction(
  '[Profile Settings] Add Tag',
  props<{ name: string }>()
);

export const addTagSuccess = createAction(
  '[Profile Settings] Add Tag Success',
  props<{ data: any }>()
);

export const addTagError = createAction(
  '[Profile Settings] Add Tag Error',
  props<{ error: any }>()
);
export const deleteTag = createAction(
  '[Profile Settings] delete Tag',
  props<{ name: string }>()
);

export const deleteTagSuccess = createAction(
  '[Profile Settings] delete Tag Success',
  props<{ data: any }>()
);

export const deleteTagError = createAction(
  '[Profile Settings] delete Tag Error',
  props<{ error: any }>()
);


export const updateTag = createAction(
  '[Profile Settings] update Tag',
  props<{ name: string, newName: string }>()
);

export const updateTagSuccess = createAction(
  '[Profile Settings] update Tag Success',
  props<{ data: any }>()
);

export const updateTagError = createAction(
  '[Profile Settings] update Tag Error',
  props<{ error: any }>()
);



