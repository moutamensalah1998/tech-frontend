import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, throwError } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { ApiService } from '../../api/api.service';
import {
  AuthResponse,
  LoginCredentials,
} from '../../models/auth.types';
import { AuthState } from './ngrx/auth.reducer';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private basePath = 'v1/auth';
  private refreshAttempts = 0;
  private maxRefreshAttempts = 3;

  constructor(
    private apiService: ApiService,
    private store: Store<{ auth: AuthState }>,
    private cookieService: CookieService
  ) { }


  get isAuthenticated$(): Observable<boolean> {
    return this.store.select('auth').pipe(
      map(authState => !!authState.response && !!authState.user)
    );
  }

  get currentUser$(): Observable<any> {
    return this.store.select('auth').pipe(
      map(authState => authState.user)
    );
  }

  get authToken$(): Observable<string | null> {
    return this.store.select('auth').pipe(
      map(authState => authState.response)
    );
  }

  get isLoading$(): Observable<boolean> {
    return this.store.select('auth').pipe(
      map(authState => authState.loading)
    );
  }

  get error$(): Observable<string> {
    return this.store.select('auth').pipe(
      map(authState => authState.error || '')
    );
  }

  get isAuthenticated(): boolean {
    let result = false;
    this.store.select('auth').pipe(take(1)).subscribe(authState => {
      result = !!authState.response && !!authState.user;
    });
    return result;
  }

  get currentUser(): any {
    let result = null;
    this.store.select('auth').pipe(take(1)).subscribe(authState => {
      result = authState.user;
    });
    return result;
  }

  get authToken(): string | null {
    let result = null;
    this.store.select('auth').pipe(take(1)).subscribe(authState => {
      result = authState.response;
    });
    return result;
  }

  getAuthTokenAsync(): Observable<string | null> {
    return this.store.select('auth').pipe(
      map(authState => authState.response),
      take(1)
    );
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>(`${this.basePath}/login`, credentials);
  }

  refreshToken(): Observable<any> {
    if (this.refreshAttempts >= this.maxRefreshAttempts) {
      this.logout();
      return throwError(() => new Error('please login again'));
    }
    this.refreshAttempts++;

    return this.apiService
      .post<AuthResponse>(`${this.basePath}/refresh`, {});
  }

  logout(): Observable<any> {
    return this.apiService.post(`${this.basePath}/logout`, {});
  }

  changePassword(payload: { current_password: string, new_password: string }): Observable<any> {
    return this.apiService.put(`${this.basePath}/change-password`, payload);
  }
}
