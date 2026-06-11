
import { createAction, props } from '@ngrx/store';

export const UploadMedia = createAction(
  '[Upload Media] Upload Media',
  props<{ file: FormData; mediaType: string }>()
);

export const UploadMediaSuccess = createAction(
  '[Upload Media] Upload Media Success',
  props<{ response: any; mediaType: string }>()
);

export const UploadMediaFailure = createAction(
  '[Upload Media] Upload Media Failure',
  props<{ error: any }>()
);
