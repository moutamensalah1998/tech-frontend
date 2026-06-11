import { createReducer, on } from '@ngrx/store';
import * as ChatbotActions from './chatbot.actions';

export interface ChatbotState {
  loading: boolean;
  error: any;
  data: any;
}

const initialState: ChatbotState = {
  loading: false,
  error: null,
  data: null,
};

export const chatbotReducer = createReducer(
  initialState,

  // -------- CREATE CHATBOT --------
  on(ChatbotActions.createChatbotMetaData, state => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ChatbotActions.createChatbotMetaDataSuccess, (state, { data }) => ({
    ...state,
    loading: false,
    data,
  })),
  on(ChatbotActions.createChatbotMetaDataError, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // -------- GET CHATBOT --------
  on(ChatbotActions.getChatbotsMetaData, state => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ChatbotActions.getChatbotsMetaDataSuccess, (state, { data }) => ({
    ...state,
    loading: false,
    data,
  })),
  on(ChatbotActions.getChatbotsMetaDataError, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // -------- UPDATE CHATBOT --------
  on(ChatbotActions.updateChatbotMetaData, state => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ChatbotActions.updateChatbotMetaDataSuccess, (state, { data }) => ({
    ...state,
    loading: false,
    data,
  })),
  on(ChatbotActions.updateChatbotMetaDataError, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // -------- DELETE CHATBOT --------
  on(ChatbotActions.deleteChatbot, state => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ChatbotActions.deleteChatbotSuccess, (state) => ({
    ...state,
    loading: false,
  })),
  on(ChatbotActions.deleteChatbotError, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // -------- UPDATE FLOW NODES --------
  on(ChatbotActions.updateChatbotFlowNodes, state => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ChatbotActions.updateChatbotFlowNodesSuccess, (state, { data }) => ({
    ...state,
    loading: false,
    data,
  })),
  on(ChatbotActions.updateChatbotFlowNodesError, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // -------- TRIGGER CHATBOT --------
  on(ChatbotActions.triggerChatbot, state => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ChatbotActions.triggerChatbotSuccess, (state, { data }) => ({
    ...state,
    loading: false,
  })),
  on(ChatbotActions.triggerChatbotError, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // -------- GET CHATBOT FLOW --------
  on(ChatbotActions.getChatbotFlow, state => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ChatbotActions.getChatbotFlowSuccess, (state, { data }) => ({
    ...state,
    loading: false,
    data,
  })),
  on(ChatbotActions.getChatbotFlowError, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // -------- Set Default Chatbot --------
  on(ChatbotActions.changeDefaultChatbot, state => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(ChatbotActions.changeDefaultChatbotSuccess, (state, { data }) => ({
    ...state,
    loading: false,
  })),
  on(ChatbotActions.changeDefaultChatbotError, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  }))
);
