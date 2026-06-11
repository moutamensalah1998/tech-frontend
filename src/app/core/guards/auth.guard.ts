import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanMatch,
  Router,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of, combineLatest } from 'rxjs';
import {
  take,
  switchMap,
  map,
  tap,
  catchError,
} from 'rxjs/operators';

import { UserService } from '../services/auth/user.service';
import { selectAuthUser, selectAuthResponse } from '../services/auth/ngrx/auth.selector';
import { setAuthUser } from '../services/auth/ngrx/auth.action';
import * as SocketActions from '../services/chat/ngrx/socket.actions';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanMatch {
  constructor(private store: Store, private userService: UserService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.checkAuth();
  }

  canMatch(): Observable<boolean> {
    return this.checkAuth();
  }

  private checkAuth(): Observable<boolean> {
    return combineLatest([
      this.store.select(selectAuthUser),
      this.store.select(selectAuthResponse)
    ]).pipe(
      take(1),
      switchMap(([authUser, authToken]) => {
        if (authUser && authToken) {
          this.handleSocketConnection(authUser);
          return of(true);
        }

        return this.userService.fetchUserFromAPI().pipe(
          map(response => response.data),
          tap(user => {
            this.store.dispatch(setAuthUser({ user }));
            this.handleSocketConnection(user);
          }),
          map(user => !!user),
          catchError(() => {
            this.router.navigate(['auth/sign-in'], { replaceUrl: true });
            return of(false);
          })
        );
      })
    );
  }

  private handleSocketConnection(user: any) {
    if (user.roles?.some((role: any) => role.role_name === 'ADMINISTRATOR')) {
      this.store.dispatch(SocketActions.connectSocket());
    }
  }
}
