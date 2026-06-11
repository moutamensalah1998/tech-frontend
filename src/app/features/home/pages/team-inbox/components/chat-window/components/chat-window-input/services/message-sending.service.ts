import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { uuidv7 } from 'uuidv7';
import {
  sendTextMessage,
  sendMediaMessage,
  sendLocationMessage,
  sendTemplateMessage,
  addLocalMessage,
} from '../../../../../../../../../core/services/messages/ngrx/messages.actions';
import { FilePreview } from './file-preview.service';
import { changeTriggerdChatBot, updateLastMessage } from '../../../../../../../../../core/services/conversations/ngrx/conversations.actions';
import { TemplateItem } from '../components/template-picker/template-picker.component';

export interface LocationData {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface MessageContext {
  conversationId: string;
  recipientNumber: string;
  contextMessageId?: string | null;
  replyingToMessage?: any;
}

@Injectable({
  providedIn: 'root'
})
export class MessageSendingService {

  constructor(private store: Store) { }

  sendTextMessage(messageBody: string, context: MessageContext): void {
    const messageId = uuidv7();
    const messageContext = this.buildMessageContext(context);
    const timestamp = Date.now();
    const newMsg = {
      conversationId: context.conversationId,
      client_message_id: messageId,
      message_type: 'text',
      message_status: 'loading',
      content: {
        text: messageBody,
      },
      ...(messageContext && { context: messageContext }),
      recipient_number: context.recipientNumber,
      context_message_id: context.contextMessageId,
      created_at: timestamp,
    };

    this.store.dispatch(addLocalMessage({ message: newMsg }));
    this.store.dispatch(
      sendTextMessage({
        messageBody,
        recipientNumber: context.recipientNumber,
        contextMessageId: context.contextMessageId || null,
        client_message_id: messageId,
      })
    );

    this.store.dispatch(
      updateLastMessage({
        conversationId: context.conversationId,
        lastMessage: newMsg.content.text,
        lastMessageTimestamp: timestamp,
      })
    );
    this.store.dispatch(changeTriggerdChatBot({
      conversationId: context.conversationId, isTriggered: false
    }));
  }

  sendMediaFile(preview: FilePreview, context: MessageContext): void {
    const messageId = uuidv7();
    const messageContext = this.buildMessageContext(context);
    const timestamp = Date.now();
    const newMsg = {
      conversationId: context.conversationId,
      client_message_id: messageId,
      message_type: preview.type,
      message_status: 'loading',
      content: {
        media: preview.file,
        caption: preview.caption || null,
      },
      ...(messageContext && { context: messageContext }),
      recipient_number: context.recipientNumber,
      context_message_id: context.contextMessageId,
      created_at: timestamp,
    };

    this.store.dispatch(addLocalMessage({ message: newMsg }));
    this.store.dispatch(
      sendMediaMessage({
        recipientNumber: context.recipientNumber,
        file: preview.file,
        contextMessageId: context.contextMessageId || null,
        caption: preview.caption || null,
        mediaLink: preview.file.name,
        client_message_id: messageId,
      })
    );

    this.store.dispatch(
      updateLastMessage({
        conversationId: context.conversationId,
        lastMessage: preview.caption || `${preview.type}: ${preview.file.name}`,
        lastMessageTimestamp: timestamp,
      })
    );
    this.store.dispatch(changeTriggerdChatBot({
      conversationId: context.conversationId, isTriggered: false
    }));
  }

  sendLocationMessage(locationData: LocationData, context: MessageContext): void {
    const messageId = uuidv7();
    const messageContext = this.buildMessageContext(context);
    const timestamp = Date.now();
    const newLocationMessage = {
      conversationId: context.conversationId,
      client_message_id: messageId,
      message_type: 'location',
      message_status: 'loading',
      content: {
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          name: locationData.name || '',
          address: locationData.address || '',
        },
      },
      ...(messageContext && { context: messageContext }),
      recipient_number: context.recipientNumber,
      context_message_id: context.contextMessageId,
      created_at: timestamp,
    };

    this.store.dispatch(addLocalMessage({ message: newLocationMessage }));

    this.store.dispatch(
      sendLocationMessage({
        recipientNumber: context.recipientNumber,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        name: locationData.name || null,
        address: locationData.address || null,
        contextMessageId: context.contextMessageId || null,
        client_message_id: messageId,
      })
    );

    this.store.dispatch(
      updateLastMessage({
        conversationId: context.conversationId,
        lastMessage: 'Shared location',
        lastMessageTimestamp: timestamp,
      })
    );
    this.store.dispatch(changeTriggerdChatBot({
      conversationId: context.conversationId, isTriggered: false
    }));
  }

  sendTemplateMessage(templateItem: TemplateItem, parameters: { [key: string]: string }, context: MessageContext, mediaUrl?: string): void {
    const messageId = uuidv7();
    const messageContext = this.buildMessageContext(context);
    const timestamp = Date.now();
    const parametersArray = templateItem.variables.map((variable: string) => parameters[variable] || '');

    const newMsg = {
      conversationId: context.conversationId,
      client_message_id: messageId,
      message_type: 'template',
      content: {
        template_name: templateItem.template.name,
        template_language: templateItem.template.language,
        parameters: parametersArray,
        ...(mediaUrl && { media_url: mediaUrl }),
      },
      message_status: 'loading',
      ...(messageContext && { context: messageContext }),
      recipient_number: context.recipientNumber,
      context_message_id: context.contextMessageId,
      created_at: timestamp,
    };

    this.store.dispatch(addLocalMessage({ message: newMsg }));
    this.store.dispatch(
      sendTemplateMessage({
        recipientNumber: context.recipientNumber,
        templateId: templateItem.template.id,
        parameters: parametersArray,
        client_message_id: messageId,
        media_url: mediaUrl || null,
      })
    );

    this.store.dispatch(
      updateLastMessage({
        conversationId: context.conversationId,
        lastMessage: `Template: ${templateItem.template.name}`,
        lastMessageTimestamp: timestamp,
      })
    );

    this.store.dispatch(changeTriggerdChatBot({
      conversationId: context.conversationId,
      isTriggered: false
    }));
  }

  private buildMessageContext(context: MessageContext): any | null {
    if (!context.contextMessageId || !context.replyingToMessage) {
      return null;
    }

    return {
      type: 'reply',
      replied_message_id: context.contextMessageId,
      original_content: {
        text: context.replyingToMessage.content?.text,
        text_body: context.replyingToMessage.content?.text_body,
        question_text: context.replyingToMessage.content?.question_text,
        caption: context.replyingToMessage.content?.caption,
        cdn_url: context.replyingToMessage.content?.cdn_url,
        file_name: context.replyingToMessage.content?.file_name || context.replyingToMessage.content?.filename,
        mime_type: context.replyingToMessage.content?.mime_type,
        media_id: context.replyingToMessage.content?.media_id,
      }
    };
  }
}
