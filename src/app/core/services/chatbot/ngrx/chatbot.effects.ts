import { Injectable } from '@angular/core';
import { ChatbotApiService } from '../chatbot.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { mergeMap, map, catchError } from 'rxjs/operators';
import { ToastService } from '../../toast-message.service';
import {
  changeDefaultChatbot,
  changeDefaultChatbotError,
  changeDefaultChatbotSuccess,
  createChatbotMetaData,
  createChatbotMetaDataError,
  createChatbotMetaDataSuccess,
  deleteChatbot,
  deleteChatbotError,
  deleteChatbotSuccess,
  getChatbotFlow,
  getChatbotFlowError,
  getChatbotFlowSuccess,
  getChatbotsMetaData,
  getChatbotsMetaDataError,
  getChatbotsMetaDataSuccess,
  triggerChatbot,
  triggerChatbotError,
  triggerChatbotSuccess,
  updateChatbotFlowNodes,
  updateChatbotFlowNodesError,
  updateChatbotFlowNodesSuccess,
} from './chatbot.actions';

@Injectable()
export class ChatbotEffects {
  constructor(
    private actions$: Actions,
    private chatbot: ChatbotApiService,
    private toastService: ToastService
  ) { }

  createChatbotMetaData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createChatbotMetaData),
      mergeMap(({ chatbot }) =>
        this.chatbot.createChatbotMetadata(chatbot).pipe(
          map((data) => {
            this.toastService.showToast('Chatbot created successfully!', 'success');
            return createChatbotMetaDataSuccess({ data: data.data });
          }),
          catchError((error) => {
            const errorMessage = error?.error?.message || 'Failed to create chatbot';
            this.toastService.showToast(errorMessage, 'error');
            return of(createChatbotMetaDataError({ error }));
          })
        )
      )
    )
  );

  getChatbotsMetaData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getChatbotsMetaData),
      mergeMap(({ page, limit, search }) =>
        this.chatbot.getChatbotsMetadata(page, limit, search).pipe(
          map((data) => getChatbotsMetaDataSuccess({ data: data.data })),
          catchError((error) => {
            const errorMessage = error?.error?.message || 'Failed to load chatbots';
            this.toastService.showToast(errorMessage, 'error');
            return of(getChatbotsMetaDataError({ error }));
          })
        )
      )
    )
  );

  updateChatbotFlowNodes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateChatbotFlowNodes),
      mergeMap(({ flowNodes }) =>
        this.chatbot.editChatbotFlowNode({
          ...flowNodes,
          chatbot_id: flowNodes.chatbot_id
        }).pipe(
          map((data) => {
            this.toastService.showToast('Flow saved successfully!', 'success');
            return updateChatbotFlowNodesSuccess({ data: data.data });
          }),
          catchError((error) => {
            const errorMessage = error?.error?.message || 'Failed to save flow';
            this.toastService.showToast(errorMessage, 'error');
            console.error('❌ Flow save error:', error);
            return of(updateChatbotFlowNodesError({ error }));
          })
        )
      )
    )
  );

  deleteChatbot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteChatbot),
      mergeMap(({ chatbotId: id }) =>
        this.chatbot.deleteChatbot(id).pipe(
          map(() => {
            this.toastService.showToast('Chatbot deleted successfully', 'success');
            return deleteChatbotSuccess();
          }),
          catchError((error) => {
            const errorMessage = error?.error?.message || 'Failed to delete chatbot';
            this.toastService.showToast(errorMessage, 'error');
            return of(deleteChatbotError({ error }));
          })
        )
      )
    )
  );

  getChatbotFlow$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getChatbotFlow),
      mergeMap(({ chatbotId }) => {

        return this.chatbot.getChatbotFlow(chatbotId).pipe(
          map((response) => {
            const nodeCount = response.data?.nodes?.length || 0;
            if (nodeCount > 0) {
              this.toastService.showToast(
                `Flow loaded successfully (${nodeCount} nodes)`,
                'success'
              );
            } else {
              this.toastService.showToast(
                'Empty flow loaded - ready to build!',
                'info'
              );
            }

            return getChatbotFlowSuccess({ data: response.data });
          }),
          catchError((error) => {
            let errorMessage = 'Failed to load chatbot flow';
            if (error.status === 404) {
              errorMessage = 'Chatbot not found';
            } else if (error.status === 403) {
              errorMessage = 'You do not have permission to access this chatbot';
            } else if (error.status === 500) {
              errorMessage = 'Server error - please try again later';
            } else if (error?.error?.message) {
              errorMessage = error.error.message;
            }

            this.toastService.showToast(errorMessage, 'error');

            return of(getChatbotFlowError({ error }));
          })
        );
      })
    )
  );

  triggerChatbot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(triggerChatbot),
      mergeMap(({ chat_bot_id, conversation_id, recipient_number }) =>
        this.chatbot.triggerChatbot({
          chat_bot_id,
          conversation_id,
          recipient_number
        }).pipe(
          map((data) => {
            this.toastService.showToast('Chatbot triggered successfully!', 'success');
            return triggerChatbotSuccess({ data: data.data });
          }),
          catchError((error) => {
            const errorMessage = error?.error?.message || 'Failed to trigger chatbot';
            return of(triggerChatbotError({ error }));
          })
        )
      )
    )
  );

  changeDefaultChatbot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(changeDefaultChatbot),
      mergeMap(({ chatbotId }) =>
        this.chatbot.changeDefaultChatbot(chatbotId).pipe(
          map(() => changeDefaultChatbotSuccess(
            {
              data: {
                message: 'Chatbot default changed successfully'
              }
            }
          )),
          catchError((error) => {
            return of(changeDefaultChatbotError({ error }));
          })
        )
      )
    )
  );
}
