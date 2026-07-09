import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError, timer } from "rxjs";
import { environment } from "../env/environment";
import { catchError, retry } from "rxjs/operators";
import { AuthErrorType } from "../models/auth.types";

export interface RequestOptions {
  headers?: HttpHeaders;
  params?: HttpParams;
  isJson?: boolean;
  isMultipart?: boolean;
  retries?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  private retryStrategy = {
    maxRetries: 3, 
    backoff: 1000    
  };

  // Cache-busting headers to prevent service worker from serving stale API responses
  private readonly noCacheHeaders = new HttpHeaders({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      return throwError(() => new Error(AuthErrorType.NETWORK_ERROR));
    }
    return throwError(() => error);
  }

  private addRetryStrategy<T>(observable: Observable<T>): Observable<T> {
    return observable.pipe(
      retry({
        count: this.retryStrategy.maxRetries,
        delay: (error: any, retryAttempt: number) => {
          const status = error?.status;
          if (typeof status === 'number' && status >= 400 && status < 500 && status !== 401) {
            return throwError(() => error);
          }
          const attempt = Math.max(1, retryAttempt);
          const delayMs = this.retryStrategy.backoff * Math.pow(2, attempt - 1);
          return timer(delayMs);
        }
      }),
      catchError(err => this.handleError(err))
    );
  }

  private buildUrl(endpoint: string): string {
    const base = this.baseUrl.replace(/\/+$/, '');
    const path = endpoint.replace(/^\/+/, '');
    return `${base}/${path}`;
  }

  /**
   * Get no-cache headers to bypass service worker cache for API requests.
   */
  private getNoCacheHeaders(existingHeaders?: HttpHeaders): HttpHeaders {
    let headers = existingHeaders || new HttpHeaders();
    headers = headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers = headers.set('Pragma', 'no-cache');
    headers = headers.set('Expires', '0');
    return headers;
  }

  get<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    const opts = { ...(options || {}), headers: this.getNoCacheHeaders(options?.headers) };
    return this.addRetryStrategy(this.http.get<T>(this.buildUrl(endpoint), opts));
  }

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Observable<T> {
    const opts = { ...(options || {}), headers: this.getNoCacheHeaders(options?.headers) };
    return this.addRetryStrategy(this.http.post<T>(this.buildUrl(endpoint), body, opts));
  }

  put<T>(endpoint: string, body: any, options?: RequestOptions): Observable<T> {
    const opts = { ...(options || {}), headers: this.getNoCacheHeaders(options?.headers) };
    return this.addRetryStrategy(this.http.put<T>(this.buildUrl(endpoint), body, opts));
  }

  delete<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    const opts = { ...(options || {}), headers: this.getNoCacheHeaders(options?.headers) };
    return this.addRetryStrategy(this.http.delete<T>(this.buildUrl(endpoint), opts));
  }

  getBlob(endpoint: string, options?: RequestOptions): Observable<Blob> {
    const opts = { ...(options || {}), headers: this.getNoCacheHeaders(options?.headers), responseType: 'blob' as const };
    return this.http.get(this.buildUrl(endpoint), opts).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
