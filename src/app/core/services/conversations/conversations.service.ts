import { Injectable } from "@angular/core";
import { ApiService } from "../../api/api.service";
import { Observable, tap } from "rxjs";
import { HttpParams } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class ConversationsService {

  private teamBasePath = 'v1/team_inbox';

  constructor(private apiService: ApiService) { }

  getConversations(page: number, limit: number, search_terms: string | null = null ,status: string | null = null): Observable<any> {
    const url = `${this.teamBasePath}/get_conversations`;

    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (typeof search_terms === 'string' && search_terms.trim().length > 0) {
      params = params.set('search_terms', search_terms.trim());
    }
    if (typeof status === 'string' && status.trim().length > 0) {
      params = params.set('status_filter', status.trim());
    }
    return this.apiService.get(url, { params }).pipe(
      tap()
    );
  }

  getConversationById(id: string): Observable<any> {
    const url = `${this.teamBasePath}/get_conversation_by_id/${id}`;
    return this.apiService.get(url);
  }

  getConversationMessages(id: string, page: number, limit: number): Observable<any> {
    const url = `${this.teamBasePath}/get_conversation_messages/${id}`;
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    return this.apiService.get(url, { params });
  }

  changeConversationStatus(conversation_id: string, status: string): Observable<any> {
    const url = `${this.teamBasePath}/update_conversation_status`;
    const body = { conversation_id, status };
    return this.apiService.put(url, body);
  }

  assignConversation(conversation_id: string, user_id: string): Observable<any> {
    const url = `${this.teamBasePath}/conversation_user_assign`;
    const body = { conversation_id, user_id };
    return this.apiService.post(url, body);
  }

  assignTeamToConversation(conversation_id: string, team_id: string): Observable<any> {
    const url = `${this.teamBasePath}/conversation_team_assign`;
    const body = { conversation_id, team_id };
    return this.apiService.post(url, body);
  }

  createConversation(payload: {
    contact_country_code: string;
    contact_phone_number: string;
    template_id: string;
    parameters: string[];
    contact_name?: string;
  }): Observable<any> {
    const url = `${this.teamBasePath}/create_conversation`;
    return this.apiService.post(url, payload);
  }
}
