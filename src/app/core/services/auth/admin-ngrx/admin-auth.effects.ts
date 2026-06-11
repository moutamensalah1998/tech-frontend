import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import {
  AdminAuthResponse,
} from '../../../../core/models/auth.types';
import { AdminAuthService } from '../admin-auth.service';
import * as AdminAuthActions from './admin-auth.actions';
import { adminLogout } from './admin-auth.actions';

@Injectable({ providedIn: 'root' })
export class AdminAuthEffects {
  constructor(
    private actions$: Actions,
    private adminAuthService: AdminAuthService,
    private router: Router,
    private store: Store
  ) { }

  adminLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminAuthActions.adminLogin),
      switchMap((credentials) =>
        this.adminAuthService.adminLogin(credentials).pipe(
          map((response: AdminAuthResponse) => {
            if (response.success && response.status_code === 200 && response.data) {
              return AdminAuthActions.adminLoginSuccess({
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token
              });
            } else {
              return AdminAuthActions.adminLoginFailure({ error: 'Invalid credentials' });
            }
          }),
          catchError((error: any) => {
            console.error('Admin login error caught in effect:', error);
            const message = error?.error?.message || error?.message || 'Unknown error';
            return of(AdminAuthActions.adminLoginFailure({ error: message }));
          })
        )
      )
    )
  );

  adminLoginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdminAuthActions.adminLoginSuccess),
        tap(() => {
          this.router.navigate(['/admin-dashboard'], { replaceUrl: true });
        })
      ),
    { dispatch: false }
  );

  adminRefreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminAuthActions.adminRefreshToken),
      switchMap(() =>
        this.adminAuthService.adminRefreshToken().pipe(
          map((response: AdminAuthResponse) => {
            if (response.success && response.status_code === 200 && response.data) {
              return AdminAuthActions.adminRefreshTokenSuccess({
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token
              });
            } else {
              return AdminAuthActions.adminRefreshTokenFailure({ error: 'Failed to refresh token' });
            }
          }),
          catchError((error: any) =>
            of(AdminAuthActions.adminRefreshTokenFailure({ error }))
          )
        )
      )
    )
  );

  adminRefreshTokenFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdminAuthActions.adminRefreshTokenFailure),
        tap(() => {
          this.store.dispatch(adminLogout());
          this.router.navigate(['/admin-login'], { replaceUrl: true });
        })
      ),
    { dispatch: false }
  );

  adminLogout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(adminLogout),
        tap(() => {
          this.router.navigate(['/admin-login'], { replaceUrl: true });
        })
      ),
    { dispatch: false }
  );
}

