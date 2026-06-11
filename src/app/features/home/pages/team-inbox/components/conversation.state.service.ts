import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Conversation } from '../../../../../core/models/conversation.model';

@Injectable({ providedIn: 'root' })
export class ConversationStateService {
  private activeConversationSubject = new BehaviorSubject<Conversation | null>(null);
  activeConversation$ = this.activeConversationSubject.asObservable();

  setActiveConversation(conversation: Conversation | null) {
    this.activeConversationSubject.next(conversation);
  }

  getActiveConversation(): Conversation | null {
    return this.activeConversationSubject.getValue();
  }
}
