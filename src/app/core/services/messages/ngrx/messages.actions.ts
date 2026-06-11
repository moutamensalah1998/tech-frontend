import { createAction, props } from "@ngrx/store";


export const addLocalMessage = createAction(
  '[Messages] Add Local Message',
  props<{ message: any }>()
);

export const updateMessageStatus = createAction(
  '[Messages] Update Message Status',
  props<{ message_id: any, status : string }>()
);


export const sendTextMessage = createAction(
    '[Messages] Send Text Message',
    props<{ messageBody: string, recipientNumber: string, contextMessageId: string | null , client_message_id: string | null }>()
);

export const sendTextMessageSuccess = createAction(
    '[Messages] Send Text Message Success',
    props<{ data: any, client_message_id: string }>()
);

export const sendTextMessageError = createAction(
    '[Messages] Send Text Message Error',
    props<{ error: any }>()
);

export const sendMediaMessage = createAction(
    '[Messages] Send Media Message',
    props<{ recipientNumber: string, file: File | null, contextMessageId: string | null, mediaLink: string | null, caption: string | null, client_message_id: string | null }>()
);

export const sendMediaMessageSuccess = createAction(
    '[Messages] Send Media Message Success',
    props<{ data: any, client_message_id: string }>()
);

export const sendMediaMessageError = createAction(
    '[Messages] Send Media Message Error',
    props<{ error: any }>()
);

export const sendReplyWithReactionMessage = createAction(
    '[Messages] Send Reply With Reaction Message',
    props<{ emoji: string, recipientNumber: string, contextMessageId: string | null }>()
)

export const sendReplyWithReactionMessageSuccess = createAction(
    '[Messages] Send Reply With Reaction Message Success',
    props<{ data: any }>()
)

export const sendReplyWithReactionMessageError = createAction(
    '[Messages] Send Reply With Reaction Message Error',
    props<{ error: any }>()
)

export const sendLocationMessage = createAction(
    '[Messages] Send Location Message',
    props<{ recipientNumber: string, latitude: number, longitude: number, name: string | null, address: string | null, contextMessageId: string | null, client_message_id: string | null }>()
)

export const sendLocationMessageSuccess = createAction(
    '[Messages] Send Location Message Success',
    props<{ data: any, client_message_id: string }>()
)

export const sendLocationMessageError = createAction(
    '[Messages] Send Location Message Error',
    props<{ error: any }>()
)

export const sendInteractiveReplyButtonMessage = createAction(
    '[Messages] Send Interactive Reply Button Message',
    props<{ recipientNumber: string, button_text: string, buttons: Array<{ id: string, title: string }>, contextMessageId: string | null }>()
)

export const sendInteractiveReplyButtonMessageSuccess = createAction(
    '[Messages] Send Interactive Reply Button Message Success',
    props<{ data: any }>()
)

export const sendInteractiveReplyButtonMessageError = createAction(
    '[Messages] Send Interactive Reply Button Message Error',
    props<{ error: any }>()
)

export const sendTemplateMessage = createAction(
    '[Messages] Send Template Message',
    props<{ recipientNumber: string, templateId: string, parameters: string[], client_message_id: string | null, media_url: string | null }>()
)

export const sendTemplateMessageSuccess = createAction(
    '[Messages] Send Template Message Success',
    props<{ data: any, client_message_id: string | null }>()
)

export const sendTemplateMessageError = createAction(
    '[Messages] Send Template Message Error',
    props<{ error: any }>()
)

export const loadMessagesByConversation = createAction(
  '[Messages] Load Messages By Conversation',
  props<{ conversationId: string; before_id?: string|null; before_created_at?: string|null; limit?: number }>()
);

export const loadMessagesByConversationSuccess = createAction(
  '[Messages] Load Messages By Conversation Success',
  props<{ data: any; meta: any }>()
);

export const loadMessagesByConversationFailure = createAction(
  '[Messages] Load Messages By Conversation Failure',
  props<{ error: any }>()
);

export const clearMessages = createAction(
  '[Messages] Clear Messages'
);



