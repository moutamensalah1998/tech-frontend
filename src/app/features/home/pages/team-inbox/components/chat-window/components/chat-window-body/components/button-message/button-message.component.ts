import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMessage } from '../../../../../../../../../../core/models/chat.types';

interface ButtonView {
  text: string;
  contextId?: string;
  buttonType?: 'quick_reply' | 'url' | 'phone_number' | 'generic';
  metadata?: any;
}

@Component({
  selector: 'app-button-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button-message.component.html',
  styleUrls: ['./button-message.component.css']
})
export class ButtonMessageComponent {
  @Input() message!: BaseMessage;

  buttonView!: ButtonView;

  ngOnInit() {
    this.buttonView = this.parseButtonMessage();
  }

  private parseButtonMessage(): ButtonView {
    // Handle interactive button reply
    const interactive = this.message.content?.interactive?.button_reply;
    if (interactive) {
      return {
        text: interactive.title || 'Button Reply',
        contextId: this.message.context_message_id,
        buttonType: 'quick_reply',
        metadata: interactive
      };
    }

    // Handle payload-based button
    const payload = this.message.content?.payload;
    if (payload) {
      return {
        text: payload,
        contextId: this.message.context_message_id,
        buttonType: this.determineButtonType(payload),
        metadata: { payload }
      };
    }

    // Handle text-based button
    const text = this.message.content?.text ||
      this.message.content?.button_text ||
      'Button';

    return {
      text,
      contextId: this.message.context_message_id,
      buttonType: 'generic'
    };
  }

  private determineButtonType(payload: string): 'quick_reply' | 'url' | 'phone_number' | 'generic' {
    if (payload.startsWith('http') || payload.startsWith('www')) {
      return 'url';
    }

    if (payload.startsWith('tel:') || /^\+?[\d\s\-\(\)]+$/.test(payload)) {
      return 'phone_number';
    }

    return 'quick_reply';
  }

  getMessageClasses(): string {
    const baseClasses = 'button-reply';
    return baseClasses;
  }

  getButtonTypeLabel(): string {
    switch (this.buttonView.buttonType) {
      case 'quick_reply':
        return 'Reply';
      case 'url':
        return 'Link';
      case 'phone_number':
        return 'Call';
      default:
        return 'Button';
    }
  }
}
