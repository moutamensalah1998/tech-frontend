import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ChatbotState } from './chatbot.reducer';

export const selectChatbotState =
  createFeatureSelector<ChatbotState>('chatbot');

export const selectChatbotLoading = createSelector(
  selectChatbotState,
  (state) => state.loading
);

export const selectChatbotError = createSelector(
  selectChatbotState,
  (state) => state.error
);

export const selectChatbotData = createSelector(
  selectChatbotState,
  (state) => state.data
);

