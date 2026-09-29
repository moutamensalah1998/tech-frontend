import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../api/api.service';

export interface ApiTokenListItem {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

export interface CreatedApiToken {
  id: string;
  name: string;
  token: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiTokenService {
  constructor(private apiService: ApiService) {}

  list(): Observable<any> {
    return this.apiService.get('v1/api-tokens');
  }

  create(name: string): Observable<any> {
    return this.apiService.post(`v1/api-tokens?name=${encodeURIComponent(name)}`);
  }

  revoke(id: string): Observable<any> {
    return this.apiService.delete(`v1/api-tokens/${id}`);
  }
}
