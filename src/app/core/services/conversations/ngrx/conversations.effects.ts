// src/app/store/conversations/conversations.effects.ts

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ConversationsService } from '../conversations.service';
import * as ConversationsActions from './conversations.actions';
import { catchError, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { selectAllConversations } from './conversations.selectors';

@Injectable()
export class ConversationsEffects {
  constructor(
    private actions$: Actions,
    private store: Store,
    private conversationsService: ConversationsService
  ) {}

  loadConversations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ConversationsActions.loadConversations),
      switchMap(({ page, size, search_terms, status }) =>
        this.conversationsService.getConversations(page, size, search_terms ?? null, status ?? null).pipe(
          map((response) =>
            ConversationsActions.loadConversationsSuccess({
              conversations: response.data,
              meta: response.meta,
            })
          ),
          catchError((error) =>
            of(ConversationsActions.loadConversationsFailure({ error }))
          )
        )
      )
    )
  );

  updateConversationStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ConversationsActions.updateConversationStatus),
      switchMap(({ conversationId, status }) =>
        this.conversationsService.changeConversationStatus(conversationId, status).pipe(
          map(() => ConversationsActions.updateConversationStatusSuccess()),
          catchError((error) =>
            of(ConversationsActions.updateConversationStatusFailure({ error }))
          )
        )
      )
    )
  );

  assignConversation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ConversationsActions.assignConversation),
      switchMap(({ conversationId, userId }) =>
        this.conversationsService.assignConversation(conversationId, userId).pipe(
          map(() => ConversationsActions.assignConversationSuccess()),
          catchError((error) =>
            of(ConversationsActions.assignConversationFailure({ error }))
          )
        )
      )
    )
  );
}
