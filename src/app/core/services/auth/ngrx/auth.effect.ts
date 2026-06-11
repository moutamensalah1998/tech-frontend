import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import {
  AuthResponse,
} from '../../../../core/models/auth.types';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { UserService } from '../../../../core/services/auth/user.service';
import * as AuthActions from './auth.action';
import { logout } from './auth.action';

@Injectable({ providedIn: 'root' })
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private store: Store
  ) { }

  login$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AuthActions.login),
    switchMap((credentials) =>
      this.authService.login(credentials).pipe(
        map((response: AuthResponse) => {
          if (response.success && response.status_code === 200) {
            return AuthActions.loginSuccess({ token: response.data!.access_token });
          } else {
            return AuthActions.loginFailure({ error: 'Invalid credentials' });
          }
        }),
        catchError((error: any) => {
          console.error('Login error caught in effect:', error);
          const message = error?.error?.message || error?.message || 'Unknown error';
          return of(AuthActions.loginFailure({ error: message }));
        })
      )
    )
  )
);

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => {
          this.router.navigate(['/dashboard'], { replaceUrl: true });
          this.userService.loadAndSetUser();
        })
      ),
    { dispatch: false }
  );

  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      switchMap(() =>
        this.authService.refreshToken().pipe(
          map((response: AuthResponse) => {
            const token = response.data!.access_token;
            document.cookie = `session=${token}; path=/; Secure; SameSite=None`;
            return AuthActions.refreshTokenSuccess({ token });
          }),
          catchError((error: any) =>
            of(AuthActions.refreshTokenFailure({ error }))
          )
        )
      )
    )
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      switchMap(() => {
        return this.authService.logout().pipe(
          map(() => AuthActions.logoutSuccess())
        );

      }),
      catchError((error: any) =>
        of(AuthActions.logoutFailure({ error }))
      )
    ),
    { dispatch: false }
  );
}
