// src/app/store/conversations/conversations.actions.ts

import { createAction, props } from '@ngrx/store';
import { Conversation, Meta } from '../../../models/conversation.model';

export const loadConversations = createAction(
  '[Conversations] Load Conversations',
  props<{ page: number; size: number; search_terms?: string | null; status?: string | null }>()
);

export const changeTriggerdChatBot = createAction(
  '[Conversations] Change Triggerd Chat Bot',
  props<{ conversationId: string; isTriggered: boolean; }>()
)

export const updateConversationExpiration = createAction(
  '[Conversations] Update Conversation Expiration',
  props<{ conversationId: string; expirationTime: string; isExpired: boolean; isFromContact?: boolean }>()
);
export const resetUnreadCount = createAction(
  '[Conversations] Reset Unread Count',
  props<{ conversationId: string; }>()
);
export const updateConversationStatusLocally = createAction(
  '[Conversations] Update Conversation Status Locally',
  props<{ conversationId: string; status: 'OPEN' | 'SOLVED' | 'PENDING' | string }>()
);

export const updateConversationUserAssignment = createAction(
  '[Conversations] Update Conversation User Assignment',
  props<{ conversationId: string; userId: string; }>()
);

export const updateLastMessage = createAction(
  '[Conversations] Update Last Message',
  props<{ conversationId: string; lastMessage: string; lastMessageTimestamp: number, unreadCount?: number }>()
);
export const updateConversationStatus = createAction(
  '[Conversations] Update Conversation Status',
  props<{ conversationId: string; status: 'OPEN' | 'SOLVED' | 'PENDING' | string }>()
);

export const updateConversationStatusSuccess = createAction(
  '[Conversations] Update Conversation Status Success',
);

export const updateConversationStatusFailure = createAction(
  '[Conversations] Update Conversation Status Failure',
  props<{ error: any }>()
);

export const sortConversations = createAction(
  '[Conversations] Sort Conversations',
  props<{ conversationId: string;}>()
);

export const loadConversationsSuccess = createAction(
  '[Conversations] Load Conversations Success',
  props<{ conversations: Conversation[]; meta: Meta }>()
);

export const loadConversationsFailure = createAction(
  '[Conversations] Load Conversations Failure',
  props<{ error: any }>()
);

export const assignConversation = createAction(
  '[Conversations] Assign Conversation',
  props<{ conversationId: string; userId: string }>()
);
export const assignConversationSuccess = createAction(
  '[Conversations] Assign Conversation Success',
);

export const assignConversationFailure = createAction(
  '[Conversations] Assign Conversation Failure',
  props<{ error: any }>()
);

export const NewConversationReceived = createAction(
  '[Messages] New Conversation Received',
  props<{ conversation: any }>()
);
