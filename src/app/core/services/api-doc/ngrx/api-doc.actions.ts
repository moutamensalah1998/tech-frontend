import { createAction, props } from '@ngrx/store';

export const loadOpenApiSpec = createAction('[API Doc] Load OpenAPI Spec');

export const loadOpenApiSpecSuccess = createAction(
  '[API Doc] Load OpenAPI Spec Success',
  props<{ spec: any }>()
);

export const loadOpenApiSpecFailure = createAction(
  '[API Doc] Load OpenAPI Spec Failure',
  props<{ error: any }>()
);

export const generateToken = createAction('[API Doc] Generate Token');

export const generateTokenSuccess = createAction(
  '[API Doc] Generate Token Success',
  props<{ accessToken: string }>()
);

export const generateTokenFailure = createAction(
  '[API Doc] Generate Token Failure',
  props<{ error: any }>()
);

