import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { selectAuthUser, selectAuthResponse } from '../services/auth/ngrx/auth.selector';

@Injectable({ providedIn: 'root' })
export class RedirectGuard implements CanActivate {
  constructor(private store: Store, private router: Router) {}

  canActivate(): Observable<boolean> {
    return combineLatest([
      this.store.select(selectAuthUser),
      this.store.select(selectAuthResponse)
    ]).pipe(
      take(1),
      map(([user, token]) => {
        if (user && token) {
          this.router.navigate(['/dashboard'], { replaceUrl: true });
          return false;
        }
        return true;
      })
    );
  }
}
