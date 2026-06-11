
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as ConversationsActions from './conversations.actions';
import * as ConversationsSelectors from './conversations.selectors';

@Injectable({ providedIn: 'root' })
export class ConversationsFacade {
  conversations$ = this.store.select(ConversationsSelectors.selectAllConversations);
  meta$ = this.store.select(ConversationsSelectors.selectConversationsMeta);
  loading$ = this.store.select(ConversationsSelectors.selectConversationsLoading);
  error$ = this.store.select(ConversationsSelectors.selectConversationsError);

  constructor(private store: Store) {}

  loadConversations(page: number, size: number) {
    this.store.dispatch(ConversationsActions.loadConversations({ page, size }));
  }
}
