import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../core/env/environment';
import { 
  AISettings, 
  AIStats,
  KnowledgeSource, 
  KnowledgeSourceCreate,
  AITestRequest, 
  AITestResponse,
  FallbackAssignment,
  UserSearchResult
} from '../models/ai-config.model';

@Injectable({
  providedIn: 'root'
})
export class AIConfigService {
  private baseUrl = `${environment.apiUrl}/v1/admin/ai`;
  private decisionUrl = `${environment.apiUrl}/v1/ai/decision`;

  constructor(private http: HttpClient) {}

  // --- Settings ---
  getAISettings(clientId: string): Observable<{ success: boolean; settings: AISettings; stats: AIStats }> {
    return this.http.get<{ success: boolean; settings: AISettings; stats: AIStats }>(
      `${this.baseUrl}/status?client_id=${clientId}`
    );
  }

  toggleAI(clientId: string, enabled: boolean): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/toggle?client_id=${clientId}`, { enabled });
  }

  updateSettings(clientId: string, settings: Partial<AISettings>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/settings?client_id=${clientId}`, settings);
  }

  // --- Fallback Assignment ---
  getFallbackAssignment(clientId: string): Observable<FallbackAssignment> {
    return this.http.get<FallbackAssignment>(`${this.baseUrl}/fallback-assignment?client_id=${clientId}`);
  }

  updateFallbackAssignment(clientId: string, userId: string | null): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/fallback-assignment?client_id=${clientId}`, { user_id: userId });
  }

  // --- Knowledge Sources ---
  getSources(clientId: string): Observable<{ success: boolean; sources: KnowledgeSource[] }> {
    return this.http.get<{ success: boolean; sources: KnowledgeSource[] }>(
      `${this.baseUrl}/sources?client_id=${clientId}`
    );
  }

  createSource(clientId: string, source: KnowledgeSourceCreate): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/sources?client_id=${clientId}`, source);
  }

  uploadSource(clientId: string, name: string, sourceType: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('source_type', sourceType);
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/sources/upload?client_id=${clientId}`, formData);
  }

  deleteSource(clientId: string, sourceId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/sources/${sourceId}?client_id=${clientId}`);
  }

  rescrapeSource(clientId: string, sourceId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/sources/${sourceId}/rescrape?client_id=${clientId}`, {});
  }

  // --- Test ---
  testAI(clientId: string, message: string): Observable<AITestResponse> {
    const request: AITestRequest = { client_id: clientId, message };
    return this.http.post<AITestResponse>(`${this.baseUrl}/test`, request);
  }

  // --- Health ---
  getAIHealth(): Observable<any> {
    return this.http.get<any>(`${this.decisionUrl}/health`);
  }
}
