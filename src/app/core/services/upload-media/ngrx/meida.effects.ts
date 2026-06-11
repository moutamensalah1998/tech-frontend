import { UploadMediaService } from './../upload-media.service';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { UploadMedia, UploadMediaSuccess, UploadMediaFailure } from './meida.actions';


@Injectable()
export class UploadMediaEffects {
  constructor(
    private actions$: Actions,
    private uploadMediaService: UploadMediaService) {}


    uploadMedia$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UploadMedia),
        switchMap((action) => {
          return this.uploadMediaService.uploadMedia(action.file).pipe(
            map((response) => {
              return UploadMediaSuccess({ response, mediaType: action.mediaType });
            }),
            catchError((error) => {
              return of(UploadMediaFailure({ error }));
            })
          );
        })
      )
    );

}
