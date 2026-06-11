import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, map, mergeMap, of, switchMap } from 'rxjs';
import { ProfileSettingsService } from '../profile-settings.service';
import * as ProfileSettingsActions from './profile-settings.actions';

@Injectable()
export class ProfileSettingsEffects {
  constructor(
    private actions$: Actions,
    private profileSettingsService: ProfileSettingsService
  ) {}

  getProfileSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileSettingsActions.getBusinessProfile),
      mergeMap(() =>
        this.profileSettingsService.getBusinessProfile().pipe(
          map((data) => ProfileSettingsActions.businessProfileSuccess({ data })),
          catchError((error) =>
            of(ProfileSettingsActions.businessProfileError({ error }))
          )
        )
      )
    )
  );

  updateBusinessProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileSettingsActions.updateBusinessProfile),
      mergeMap(({ formData }) =>
        this.profileSettingsService.updateBusinessProfile(formData).pipe(
          map((data) => ProfileSettingsActions.updateBusinessProfileSuccess({ data })),
          catchError((error) =>
            of(ProfileSettingsActions.updateBusinessProfileError({ error }))
          )
        )
      )
    )
  );
}
