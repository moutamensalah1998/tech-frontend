export enum ClientToServerEventsEnum {
  // Connection events
  Connect = 'connect',
  Disconnect = 'disconnect',

  // Business group events
  JoinBusinessGroup = 'join_business_group',
  LeaveBusinessGroup = 'leave_business_group',

  // Conversation events
  JoinConversation = 'join_conversation',
  LeaveConversation = 'leave_conversation',

  // Message events
  SendMessage = 'send_message',
}

export enum ServerToClientEventsEnum {
  // Session events
  Session = 'session',

  // Business group events
  BusinessGroupJoined = 'business_group_joined',
  BusinessGroupLeft = 'business_group_left',
  BusinessGroupJoinError = 'business_group_join_error',
  UserJoinedBusinessGroup = 'user_joined_business_group',
  NewConversationReceived = 'new_conversation',
  ChatbotTriggered = 'chatbot_triggered',

  // Conversation events
  ConversationJoined = 'conversation_joined',
  ConversationLeft = 'conversation_left',
  ConversationStatus = 'conversation_status_business_group',
  ConversationUserAssignment = 'conversation_assignment_chat',

  // Message events
  BusinessGroupMessageReceived = 'business_message_received',
  ConversationMessageReceived = 'conversation_message_received',
  ConversationMessageStatus = 'whatsapp_message_status',

  // Notification events
  NewMessageNotification = 'new_message_notification',
  ConversationAssignedNotification = 'conversation_assigned_notification',

  // Error events
  Error = 'error',
}
