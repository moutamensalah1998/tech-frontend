import { Injectable } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ChatbotApiService {
  constructor(private apiService: ApiService) { }

  editChatbotFlowNode(payload: any): Observable<any> {

    return this.apiService.post('v1/chatbot/add_flow_node', payload);
  }

  createChatbotMetadata(payload: any): Observable<any> {
    return this.apiService.post('v1/chatbot/', payload);
  }

  getChatbotFlow(id: string): Observable<any> {
    return this.apiService.get(`v1/chatbot/${id}`);
  }

  getChatbotsMetadata(page: number, limit: number, search_query: string): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('search_query', search_query);
    return this.apiService.get(`v1/chatbot/`, { params });
  }

  deleteChatbot(id: string): Observable<any> {
    return this.apiService.delete(`v1/chatbot/${id}`);
  }

  triggerChatbot(payload: any): Observable<any> {
    return this.apiService.post('v1/chatbot/trigger', payload);
  }

  changeDefaultChatbot(chatbotId: string): Observable<any> {
    const params = new HttpParams().set('chatbot_id', chatbotId);
    return this.apiService.post('v1/chatbot/default', {}, { params });
  }
}
