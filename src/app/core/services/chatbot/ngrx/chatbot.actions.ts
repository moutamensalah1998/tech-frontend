import { createAction, props } from '@ngrx/store';
import { SerializedNode } from '../utility';
export const createChatbotMetaData = createAction(
  '[Chatbot] Create Chatbot',
  props<{ chatbot: any }>()
);

export const createChatbotMetaDataSuccess = createAction(
  '[Chatbot] Create Chatbot Success',
  props<{ data: any }>()
);

export const createChatbotMetaDataError = createAction(
  '[Chatbot] Create Chatbot Error',
  props<{ error: any }>()
);

export const getChatbotsMetaData = createAction(
  '[Chatbot] Get Chatbots Meta Data',
  props<{ page: number; limit: number; search: string }>()
);

export const getChatbotsMetaDataSuccess = createAction(
  '[Chatbot] Get Chatbots Meta Data Success',
  props<{ data: any }>()
);

export const getChatbotsMetaDataError = createAction(
  '[Chatbot] Get Chatbots Meta Data Error',
  props<{ error: any }>()
);

export const updateChatbotMetaData = createAction(
  '[Chatbot] Update Chatbot Meta Data',
  props<{ chatbot: any }>()
);

export const updateChatbotMetaDataSuccess = createAction(
  '[Chatbot] Update Chatbot Meta Data Success',
  props<{ data: any }>()
);

export const updateChatbotMetaDataError = createAction(
  '[Chatbot] Update Chatbot Meta Data Error',
  props<{ error: any }>()
);

export const deleteChatbot = createAction(
  '[Chatbot] Delete Chatbot Meta Data',
  props<{ chatbotId: string }>()
);

export const deleteChatbotSuccess = createAction(
  '[Chatbot] Delete Chatbot Meta Data Success',

);

export const deleteChatbotError = createAction(
  '[Chatbot] Delete Chatbot Meta Data Error',
  props<{ error: any }>()
);

export const updateChatbotFlowNodes = createAction(
  '[Chatbot] Update Chatbot Flow Nodes',
  props<{ flowNodes: {
    chatbot_id: string;
    nodes: SerializedNode[];
  } }>()
);

export const updateChatbotFlowNodesSuccess = createAction(
  '[Chatbot] Update Chatbot Flow Nodes Success',
  props<{ data: any }>()
);

export const updateChatbotFlowNodesError = createAction(
  '[Chatbot] Update Chatbot Flow Nodes Error',
  props<{ error: any }>()
);

export const triggerChatbot = createAction(
  '[Chatbot] Trigger Chatbot',
  props<{ chat_bot_id: string; conversation_id: string; recipient_number: string }>()
);

export const triggerChatbotSuccess = createAction(
  '[Chatbot] Trigger Chatbot Success',
  props<{ data: any }>()
);

export const triggerChatbotError = createAction(
  '[Chatbot] Trigger Chatbot Error',
  props<{ error: any }>()
);

export const getChatbotFlow = createAction(
  '[Chatbot] Get Chatbot Flow',
  props<{ chatbotId: string }>()
);

export const getChatbotFlowSuccess = createAction(
  '[Chatbot] Get Chatbot Flow Success',
  props<{ data: any }>()
);

export const getChatbotFlowError = createAction(
  '[Chatbot] Get Chatbot Flow Error',
  props<{ error: any }>()
);

export const changeDefaultChatbot = createAction(
  '[Chatbot] Change Chatbot Default',
  props<{ chatbotId: string }>()
);

export const changeDefaultChatbotSuccess = createAction(
  '[Chatbot] Change Chatbot Default Success',
  props<{ data: any }>()
);

export const changeDefaultChatbotError = createAction(
  '[Chatbot] Change Chatbot Default Error',
  props<{ error: any }>()
);


