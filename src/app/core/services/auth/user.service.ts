import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, throwError } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { selectAuthUser } from './ngrx/auth.selector';
import * as AuthActions from './ngrx/auth.action';
import { ApiService } from '../../api/api.service';
import { ToastService } from '../toast-message.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private basePath = 'v1/user/';
  private isLoadingUser = false;

  constructor(
    private store: Store,
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  getUser(): Observable<any> {
    return this.store.select(selectAuthUser);
  }

  loadAndSetUser(): void {
    if (this.isLoadingUser) {
      return;
    }

    this.isLoadingUser = true;
    this.fetchUserFromAPI().pipe(take(1)).subscribe({
      next: (response) => {
        this.isLoadingUser = false;
        if (response && response.success && response.data) {
          const userPayload = response.data ?? response;
          this.store.dispatch(AuthActions.setAuthUser({ user: userPayload }));
        } else {
          this.toastService.showToast('Failed to load user data.', 'error');
        }
      },
      error: (error) => {
        this.isLoadingUser = false;
        console.error('Failed to load user data:', error);
        this.toastService.showToast('Failed to load user data.', 'error');
      }
    });
  }

  setUser(user: any): void {
    this.store.dispatch(AuthActions.setAuthUser({ user }));
  }

  isUserLoading(): boolean {
    return this.isLoadingUser;
  }

  fetchUserFromAPI(): Observable<any> {
    const endpoint = `${this.basePath}`;
    return this.apiService.get(endpoint).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  private handleError(error: any) {
    console.error('UserService.handleError:', error);
    return throwError(() => error);
  }
}
