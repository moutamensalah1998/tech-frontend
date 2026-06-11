import { Injectable } from "@angular/core";
import { ApiService } from "../../api/api.service";
import { Observable } from "rxjs";
import { HttpParams } from '@angular/common/http';



@Injectable({
  providedIn: 'root'
})
export class MessagesService {

  constructor(private apiService: ApiService) { }

  textMessage(messageBody: string, recipientNumber: string, contextMessageId: string | null, client_message_id: string | null): Observable<any> {
    let url = `v1/message/text`;
    let body = { message_body: messageBody, recipient_number: recipientNumber, context_message_id: contextMessageId, client_message_id: client_message_id };

    return this.apiService.post(url, body);
  }

  mediaMessage(recipientNumber: string, file: File | null, contextMessageId: string | null, mediaLink: string | null, caption: string | null, client_message_id: string | null): Observable<any> {
    let url = `v1/message/media`;
    let formData = new FormData();

    formData.append('recipient_number', recipientNumber);
    if (file) {
      formData.append('file', file);
    }

    if (contextMessageId) {
      formData.append('context_message_id', contextMessageId);
    }
    if (mediaLink) {
      formData.append('media_link', mediaLink);
    }
    if (caption) {
      formData.append('caption', caption);
    }
    if (client_message_id) {
      formData.append('client_message_id', client_message_id);
    }

    return this.apiService.post(url, formData);
  }

  replyWithReactionMessage(emoji: string, recipientNumber: string, contextMessageId: string | null): Observable<any> {
    let url = `v1/message/reaction`;
    let body = { emoji: emoji, recipient_number: recipientNumber, context_message_id: contextMessageId };

    return this.apiService.post(url, body);
  }

  locationMessage(recipientNumber: string, latitude: number, longitude: number, name: string | null, address: string | null, contextMessageId: string | null, client_message_id: string | null): Observable<any> {
    let url = `v1/message/location`;
    let body = { recipient_number: recipientNumber, latitude: latitude, longitude: longitude, name: name, address: address, context_message_id: contextMessageId, client_message_id: client_message_id };

    return this.apiService.post(url, body);
  }

  interactiveReplyButtonMessage(recipientNumber: string, button_text: string, buttons: Array<{ id: string, title: string }>, contextMessageId: string | null): Observable<any> {
    let url = `v1/message/interactive_reply_button`;
    let body = { recipient_number: recipientNumber, button_text: button_text, buttons: buttons, context_message_id: contextMessageId };

    return this.apiService.post(url, body);
  }

  templateMessage(recipientNumber: string, templateId: string, parameters: string[], clientMessageId: string | null, media_url: string | null): Observable<any> {
    let url = `v1/message/template`;
    let body: any = {
      recipient_number: recipientNumber,
      template_id: templateId,
      parameters: parameters,
      client_message_id: clientMessageId
    };

    if (media_url) {
      body.media_url = media_url;
    }

    return this.apiService.post(url, body);
  }
  getMessagesByConversation(conversationId: string, before_created_at: string | null, before_id: string | null, limit: number = 10): Observable<any> {
    const url = `v1/message/get_by_conversation`;
    const params = new HttpParams()
      .set('conversation_id', conversationId)
      .set('limit', limit.toString())
      .set('before_created_at', before_created_at ? before_created_at : '')
      .set('before_id', before_id ? before_id : '');
    return this.apiService.get(url, { params });
  }

}
