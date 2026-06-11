import { createReducer, on } from '@ngrx/store';
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
  clearMessages,
  addLocalMessage,
  updateMessageStatus,
} from './messages.actions';

export interface MessagesState {
  loading: boolean;
  error: any | null;
  data: any;
  success: boolean | null;
  messages: any[];
  meta: any;
}

export const messageInitialState: MessagesState = {
  loading: false,
  error: null,
  data: null,
  success: null,
  messages: [],
  meta: null,
};
function mergeMessageWithServerResponse(localMessage: any, serverData: any) {
  const shouldPreserveLocalContext =
    localMessage.context &&
    localMessage.context.type === 'reply' &&
    (!serverData.context || !serverData.context.type);

  return {
    ...serverData,
    context: shouldPreserveLocalContext ? localMessage.context : serverData.context,
    is_from_contact: serverData.is_from_contact || false,
    conversationId: localMessage.conversationId,
  };
}
export const messageReducer = createReducer(
  messageInitialState,
  on(
    sendTextMessage,
    sendMediaMessage,
    sendLocationMessage,
    sendInteractiveReplyButtonMessage,
    sendReplyWithReactionMessage,
    sendTemplateMessage,
    loadMessagesByConversation,
    (state) => ({ ...state, loading: true, error: null })
  ),
  on(
    sendInteractiveReplyButtonMessageSuccess,
    sendReplyWithReactionMessageSuccess,
    (state, { data }) => ({ ...state, loading: false, data, success: true })
  ),
  on(
    sendTextMessageError,
    sendMediaMessageError,
    sendLocationMessageError,
    sendInteractiveReplyButtonMessageError,
    sendReplyWithReactionMessageError,
    sendTemplateMessageError,
    loadMessagesByConversationFailure,
    (state, { error }) => ({ ...state, loading: false, error })
  ),
  on(clearMessages, (state) => ({
    ...messageInitialState,
    messages: [],
    meta: null,
  })),
  on(sendTextMessageSuccess, (state, { data, client_message_id }) => ({
    ...state,
    loading: false,
    error: null,
    messages: state.messages.map(msg =>
      msg.client_message_id as string === client_message_id
        ? mergeMessageWithServerResponse(msg, data)
        : msg
    ),
  })),
  on(sendMediaMessageSuccess, (state, { data, client_message_id }) => ({
    ...state,
    loading: false,
    error: null,
    messages: state.messages.map(msg =>
      msg.client_message_id as string === client_message_id
        ? mergeMessageWithServerResponse(msg, data)
        : msg
    ),
  })),
  on(sendLocationMessageSuccess, (state, { data, client_message_id }) => ({
    ...state,
    loading: false,
    error: null,
    messages: state.messages.map(msg =>
      msg.client_message_id as string === client_message_id
        ? mergeMessageWithServerResponse(msg, data)
        : msg
    ),
  })),
  on(sendTemplateMessageSuccess, (state, { data, client_message_id }) => ({
    ...state,
    loading: false,
    error: null,
    messages: state.messages.map(msg =>
      msg.client_message_id as string === client_message_id
        ? data
        : msg
    ),
  })),
  on(addLocalMessage, (state, { message }) => ({
    ...state,
    messages: [message, ...state.messages],
  })),
  on(updateMessageStatus, (state, { message_id, status }) => ({
    ...state,
    messages: state.messages.map(msg =>
      msg._id === message_id ? { ...msg, message_status: status } : msg
    ),
  })),
  on(loadMessagesByConversationSuccess, (state, { data, meta }) => ({
    ...state,
    loading: false,
    messages: meta.current_page === 1 ? data : [...state.messages, ...data],
    meta,
  })),
);
