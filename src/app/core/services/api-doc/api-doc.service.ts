import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class ApiDocService {
  constructor(private apiService: ApiService) {}

  getOpenApiSpec(): Observable<any> {
    return this.apiService.get<any>('custom-docs/openapi-by-tags.json').pipe(
      catchError((error) => {
        console.error('Failed to load OpenAPI spec:', error);
        throw error;
      })
    );
  }

  generateToken(): Observable<{ access_token: string }> {
    return this.apiService.post<{ access_token: string }>('v1/auth/generate-token').pipe(
      catchError((error) => {
        console.error('Failed to generate token:', error);
        throw error;
      })
    );
  }
}

