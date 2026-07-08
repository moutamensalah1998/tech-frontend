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
        // delay: (error, retryAttempt) => ObservableInput
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

  get<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    return this.addRetryStrategy(this.http.get<T>(this.buildUrl(endpoint), options));
  }

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Observable<T> {
    return this.addRetryStrategy(this.http.post<T>(this.buildUrl(endpoint), body, options));
  }

  put<T>(endpoint: string, body: any, options?: RequestOptions): Observable<T> {
    return this.addRetryStrategy(this.http.put<T>(this.buildUrl(endpoint), body, options));
  }

  delete<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    return this.addRetryStrategy(this.http.delete<T>(this.buildUrl(endpoint), options));
  }

  getBlob(endpoint: string, options?: RequestOptions): Observable<Blob> {
    return this.http.get(this.buildUrl(endpoint), {
      ...(options || {}),
      responseType: 'blob',
    }).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
