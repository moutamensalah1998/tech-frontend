import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  filter,
  finalize,
  Observable,
  switchMap,
  take,
  throwError,
  catchError,
} from 'rxjs';
import * as AuthActions from '../services/auth/ngrx/auth.action';
import * as AdminAuthActions from '../services/auth/admin-ngrx/admin-auth.actions';
import { AuthService } from '../services/auth/auth.service';
import { AdminAuthService } from '../services/auth/admin-auth.service';
import { selectAdminAccessToken } from '../services/auth/admin-ngrx/admin-auth.selectors';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private isAdminRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private adminRefreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private store: Store,
    private authService: AuthService,
    private adminAuthService: AdminAuthService,
    private router: Router
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    request = request.clone({
      withCredentials: true,
      headers: request.headers.set('ngrok-skip-browser-warning', 'true'),
    });

    if (this.shouldSkipAuth(request)) {
      return next.handle(request);
    }

    const isAdmin = this.isAdminRoute(request);

    if (isAdmin) {
      return this.adminAuthService.getAuthTokenAsync().pipe(
        take(1),
        switchMap((token) => {
          const clonedRequest = token ? this.addToken(request, token) : request;
          return next.handle(clonedRequest).pipe(
            catchError((error: HttpErrorResponse) => {
              if (error.status === 401 || error.status === 403) {
                return this.handleAdmin401Error(request, next, error);
              }
              return throwError(() => error);
            })
          );
        })
      );
    } else {
      return this.authService.getAuthTokenAsync().pipe(
        take(1),
        switchMap((token) => {
          const clonedRequest = token ? this.addToken(request, token) : request;
          return next.handle(clonedRequest).pipe(
            catchError((error: HttpErrorResponse) => {
              if (error.status === 401 || error.status === 403) {
                return this.handle401Error(request, next, error);
              }
              return throwError(() => error);
            })
          );
        })
      );
    }
  }

  private shouldSkipAuth(request: HttpRequest<any>): boolean {
    const publicUrls = [
      '/v1/auth/login',
      '/v1/auth/sign-in',
      '/v1/auth/refresh',
      '/v1/auth/register',
      '/v1/auth/admin/login',
      '/v1/auth/admin/refresh',
      'tech-gate-s3.s3.eu-north-1.amazonaws.com'
    ];
    return publicUrls.some((url) => request.url.includes(url));
  }

  private isAdminRoute(request: HttpRequest<any>): boolean {
    const isAdminApi = request.url.includes('/v1/auth/admin/');
    const isAdminPage = this.router.url.includes('/admin-');
    return isAdminApi || isAdminPage;
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler,
    originalError?: HttpErrorResponse
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((response: any) => {
          const newToken = response?.data?.access_token;
          if (!response || response.success === false || !newToken) {
            return this.handleUnauthorizedError(originalError);
          }

          this.store.dispatch(
            AuthActions.refreshTokenSuccess({
              token: newToken,
            })
          );
          this.refreshTokenSubject.next(newToken);

          return next.handle(this.addToken(request, newToken)).pipe(
            catchError((err: HttpErrorResponse) => {
              return this.handleUnauthorizedError(err);
            })
          );
        }),
        catchError((err: any) => {
          return this.handleUnauthorizedError(err);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => {
        return next.handle(this.addToken(request, token!));
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string | null): HttpRequest<any> {
    if (!token) {
      return request;
    }
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private handleAdmin401Error(
    request: HttpRequest<any>,
    next: HttpHandler,
    originalError?: HttpErrorResponse
  ): Observable<HttpEvent<any>> {
    if (!this.isAdminRefreshing) {
      this.isAdminRefreshing = true;
      this.adminRefreshTokenSubject.next(null);

      return this.adminAuthService.adminRefreshToken().pipe(
        switchMap((response: any) => {
          const newToken = response?.data?.access_token;
          const newRefreshToken = response?.data?.refresh_token;
          if (!response || response.success === false || !newToken) {
            return this.handleAdminUnauthorizedError(originalError);
          }

          this.store.dispatch(
            AdminAuthActions.adminRefreshTokenSuccess({
              accessToken: newToken,
              refreshToken: newRefreshToken
            })
          );
          this.adminRefreshTokenSubject.next(newToken);
          this.adminAuthService.resetRefreshAttempts();

          return next.handle(this.addToken(request, newToken)).pipe(
            catchError((err: HttpErrorResponse) => {
              return this.handleAdminUnauthorizedError(err);
            })
          );
        }),
        catchError((err: any) => {
          return this.handleAdminUnauthorizedError(err);
        }),
        finalize(() => {
          this.isAdminRefreshing = false;
        })
      );
    }

    return this.adminRefreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => {
        return next.handle(this.addToken(request, token!));
      })
    );
  }

  private handleUnauthorizedError(originalError?: any): Observable<never> {
    this.store.dispatch(AuthActions.logout());
    this.router.navigate(['auth/sign-in'], { replaceUrl: true });
    return throwError(() => originalError ?? new Error('Unauthorized'));
  }

  private handleAdminUnauthorizedError(originalError?: any): Observable<never> {
    this.store.dispatch(AdminAuthActions.adminLogout());
    this.router.navigate(['/admin-login'], { replaceUrl: true });
    return throwError(() => originalError ?? new Error('Unauthorized'));
  }
}
