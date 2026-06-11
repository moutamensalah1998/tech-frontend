import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, throwError } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { ApiService } from '../../api/api.service';
import {
  AdminAuthResponse,
  AdminLoginCredentials,
} from '../../models/auth.types';
import { AdminAuthState } from './admin-ngrx/admin-auth.reducer';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
  private basePath = 'v1/auth/admin';
  private refreshAttempts = 0;
  private maxRefreshAttempts = 3;

  constructor(
    private apiService: ApiService,
    private store: Store<{ adminAuth: AdminAuthState }>
  ) { }

  get isAuthenticated$(): Observable<boolean> {
    return this.store.select('adminAuth').pipe(
      map(adminAuthState => !!adminAuthState.accessToken)
    );
  }

  get authToken$(): Observable<string | null> {
    return this.store.select('adminAuth').pipe(
      map(adminAuthState => adminAuthState.accessToken)
    );
  }

  get isLoading$(): Observable<boolean> {
    return this.store.select('adminAuth').pipe(
      map(adminAuthState => adminAuthState.loading)
    );
  }

  get error$(): Observable<string> {
    return this.store.select('adminAuth').pipe(
      map(adminAuthState => adminAuthState.error || '')
    );
  }

  get isAuthenticated(): boolean {
    let result = false;
    this.store.select('adminAuth').pipe(take(1)).subscribe(adminAuthState => {
      result = !!adminAuthState.accessToken;
    });
    return result;
  }

  get authToken(): string | null {
    let result = null;
    this.store.select('adminAuth').pipe(take(1)).subscribe(adminAuthState => {
      result = adminAuthState.accessToken;
    });
    return result;
  }

  getAuthTokenAsync(): Observable<string | null> {
    return this.store.select('adminAuth').pipe(
      map(adminAuthState => adminAuthState.accessToken),
      take(1)
    );
  }

  getRefreshToken(): string | null {
    let result = null;
    this.store.select('adminAuth').pipe(take(1)).subscribe(adminAuthState => {
      result = adminAuthState.refreshToken;
    });
    return result;
  }

  adminLogin(credentials: AdminLoginCredentials): Observable<AdminAuthResponse> {
    return this.apiService.post<AdminAuthResponse>(`${this.basePath}/login`, credentials);
  }

  adminRefreshToken(refreshToken?: string): Observable<AdminAuthResponse> {
    if (this.refreshAttempts >= this.maxRefreshAttempts) {
      return throwError(() => new Error('please login again'));
    }
    this.refreshAttempts++;

    const token = refreshToken || this.getRefreshToken();
    return this.apiService
      .post<AdminAuthResponse>(`${this.basePath}/refresh`, { refresh_token: token });
  }

  resetRefreshAttempts(): void {
    this.refreshAttempts = 0;
  }
}

