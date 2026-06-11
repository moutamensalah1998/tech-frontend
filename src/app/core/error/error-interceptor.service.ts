import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ErrorTranslatorService } from './error-translator.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private errorTranslator = inject(ErrorTranslatorService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage: string;

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = error.error.message || this.errorTranslator.translateError('INTERNAL_ERROR');
        } else {
          // Server-side error - use translator service
          errorMessage = this.errorTranslator.translateHttpError(error);

          // Handle 401 - redirect to login
          if (error.status === 401) {
            this.router.navigate(['/auth/sign-in'], { replaceUrl: true });
          }
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
