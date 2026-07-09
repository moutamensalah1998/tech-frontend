import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Conversation } from '../../../../../core/models/conversation.model';

@Injectable({ providedIn: 'root' })
export class ConversationStateService {
  private activeConversationSubject = new BehaviorSubject<Conversation | null>(null);
  activeConversation$ = this.activeConversationSubject.asObservable();

  private pendingConversationIdSubject = new BehaviorSubject<string | null>(null);
  pendingConversationId$ = this.pendingConversationIdSubject.asObservable();

  setActiveConversation(conversation: Conversation | null) {
    this.activeConversationSubject.next(conversation);
  }

  getActiveConversation(): Conversation | null {
    return this.activeConversationSubject.getValue();
  }

  /**
   * Set a pending conversation ID for deep-link navigation from notifications.
   * The chat-list component listens to this and auto-selects the conversation.
   */
  setPendingConversationId(conversationId: string | null) {
    this.pendingConversationIdSubject.next(conversationId);
  }

  getPendingConversationId(): string | null {
    return this.pendingConversationIdSubject.getValue();
  }
}