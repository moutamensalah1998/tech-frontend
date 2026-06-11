import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { ApiDocService } from '../api-doc.service';
import { 
  loadOpenApiSpec, 
  loadOpenApiSpecSuccess, 
  loadOpenApiSpecFailure,
  generateToken,
  generateTokenSuccess,
  generateTokenFailure
} from './api-doc.actions';

@Injectable()
export class ApiDocEffects {
  constructor(
    private actions$: Actions,
    private apiDocService: ApiDocService
  ) {}

  loadOpenApiSpec$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadOpenApiSpec),
      mergeMap(() =>
        this.apiDocService.getOpenApiSpec().pipe(
          map((spec) => loadOpenApiSpecSuccess({ spec })),
          catchError((error) => {
            console.error('[ApiDocEffects] loadOpenApiSpec error', error);
            return of(loadOpenApiSpecFailure({ error }));
          })
        )
      )
    )
  );

  generateToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(generateToken),
      mergeMap(() =>
        this.apiDocService.generateToken().pipe(
          map((response) => generateTokenSuccess({ accessToken: response.access_token })),
          catchError((error) => {
            console.error('[ApiDocEffects] generateToken error', error);
            return of(generateTokenFailure({ error }));
          })
        )
      )
    )
  );
}

