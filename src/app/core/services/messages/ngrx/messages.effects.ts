import { sortConversations } from './../../conversations/ngrx/conversations.actions';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { MessagesService } from '../messages.service';
import { catchError, map, mergeMap, of } from 'rxjs';
import {
  sendInteractiveReplyButtonMessage,
  sendInteractiveReplyButtonMessageError,
  sendInteractiveReplyButtonMessageSuccess,
  sendLocationMessage,
  sendLocationMessageError,
  sendLocationMessageSuccess,
  sendMediaMessage,
  sendMediaMessageError,
  sendMediaMessageSuccess,
  sendReplyWithReactionMessage,
  sendReplyWithReactionMessageError,
  sendReplyWithReactionMessageSuccess,
  sendTemplateMessage,
  sendTemplateMessageError,
  sendTemplateMessageSuccess,
  sendTextMessage,
  sendTextMessageError,
  sendTextMessageSuccess,
  loadMessagesByConversation,
  loadMessagesByConversationSuccess,
  loadMessagesByConversationFailure,
  addLocalMessage,
} from './messages.actions';
function transformSimplifiedContext(message: any): any {
  if (message.context?.type === 'reply') {
    return message;
  }
  if (message.context && typeof message.context === 'object' && !message.context.type) {
    const contextText = message.context.text_body || message.context.text || message.context.question_text;
    if (contextText) {
      return {
        ...message,
        context: {
          type: 'reply',
          replied_message_id: 'unknown',
          original_content: {
            text: contextText,
            text_body: contextText,
          }
        }
      };
    }
  }

  return message;
}
@Injectable({
  providedIn: 'root',
})
export class MessagesEffects {
  constructor(
    private actions$: Actions,
    private messagesService: MessagesService
  ) {}

  textMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(sendTextMessage),
      mergeMap(
        ({
          messageBody,
          recipientNumber,
          contextMessageId,
          client_message_id,
        }) =>
          this.messagesService
            .textMessage(
              messageBody,
              recipientNumber,
              contextMessageId,
              client_message_id
            )
            .pipe(
              map((response) =>
                sendTextMessageSuccess({
                  data: response.data.data,
                  client_message_id: response.data.client_message_id,
                })
              ),
              catchError((error) => of(sendTextMessageError({ error })))
            )
      )
    )
  );

  mediaMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(sendMediaMessage),
      mergeMap(
        ({
          recipientNumber,
          file,
          contextMessageId,
          mediaLink,
          caption,
          client_message_id,
        }) =>
          this.messagesService
            .mediaMessage(
              recipientNumber,
              file,
              contextMessageId,
              mediaLink,
              caption,
              client_message_id
            )
            .pipe(
              map((response) =>
                sendMediaMessageSuccess({
                  data: response.data.data,
                  client_message_id: response.data.client_message_id,
                })
              ),
              catchError((error) => of(sendMediaMessageError({ error })))
            )
      )
    )
  );

  replyWithReactionMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(sendReplyWithReactionMessage),
      mergeMap(({ emoji, recipientNumber, contextMessageId }) =>
        this.messagesService
          .replyWithReactionMessage(emoji, recipientNumber, contextMessageId)
          .pipe(
            map((data) =>
              sendReplyWithReactionMessageSuccess({ data: data.data })
            ),
            catchError((error) =>
              of(sendReplyWithReactionMessageError({ error }))
            )
          )
      )
    )
  );

  locationMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(sendLocationMessage),
      mergeMap(
        ({
          recipientNumber,
          latitude,
          longitude,
          name,
          address,
          contextMessageId,
          client_message_id,
        }) =>
          this.messagesService
            .locationMessage(
              recipientNumber,
              latitude,
              longitude,
              name,
              address,
              contextMessageId,
              client_message_id
            )
            .pipe(
              map((response) =>
                sendLocationMessageSuccess({
                  data: response.data.data,
                  client_message_id: response.data.client_message_id,
                })
              ),
              catchError((error) => of(sendLocationMessageError({ error })))
            )
      )
    )
  );

  sendInteractiveReplyButtonMessageSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(sendInteractiveReplyButtonMessage),
      mergeMap(({ recipientNumber, button_text, buttons, contextMessageId }) =>
        this.messagesService
          .interactiveReplyButtonMessage(
            recipientNumber,
            button_text,
            buttons,
            contextMessageId
          )
          .pipe(
            map((data) =>
              sendInteractiveReplyButtonMessageSuccess({ data: data.data })
            ),
            catchError((error) =>
              of(sendInteractiveReplyButtonMessageError({ error }))
            )
          )
      )
    )
  );

  sendTemplateMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(sendTemplateMessage),
      mergeMap(
        ({ recipientNumber, templateId, parameters, client_message_id, media_url }) =>
          this.messagesService
            .templateMessage(
              recipientNumber,
              templateId,
              parameters,
              client_message_id,
              media_url
            )
            .pipe(
              map((response) =>
                sendTemplateMessageSuccess({
                  data: response.data.data,
                  client_message_id: response.data.client_message_id,
                })
              ),
              catchError((error) => of(sendTemplateMessageError({ error })))
            )
      )
    )
  );

loadMessagesByConversation$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadMessagesByConversation),
    mergeMap(({ conversationId, before_id = null, before_created_at = null, limit = 100 }) =>
      this.messagesService
        .getMessagesByConversation(conversationId, before_created_at, before_id, limit)
        .pipe(
          map((response) => {
            const transformedData = response.data.map((message: any) =>
              transformSimplifiedContext(message)
            );

            return loadMessagesByConversationSuccess({
              data: transformedData,
              meta: {
                cursor: response.cursor,
                limit: response.limit,
                has_more: response.has_more,
              },
            });
          }),
          catchError((error) => of(loadMessagesByConversationFailure({ error })))
        )
    )
  )
);

  sortConversations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(addLocalMessage),
      map(({ message }) => sortConversations({ conversationId: message.conversationId }))
    )
  );
}
