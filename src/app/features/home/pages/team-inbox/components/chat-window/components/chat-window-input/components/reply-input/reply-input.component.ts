import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMessage } from '../../../../../../../../../../core/models/chat.types';

@Component({
  selector: 'app-reply-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reply-input.component.html',
  styleUrls: ['./reply-input.component.css'],
})
export class ReplyInputComponent {
  @Input() replyingToMessage: BaseMessage | null = null;
  @Output() replyCleared = new EventEmitter<void>();

  cancelReply(): void {
    this.replyCleared.emit();
  }

  getReplyPreviewText(): string {
    if (!this.replyingToMessage) return '';

    const msg = this.replyingToMessage;

    switch (msg.message_type) {
      case 'text':
      case 'question':
        return msg.content?.text || msg.content?.text_body || msg.content?.question_text || '';

      case 'image':
        return msg.content?.caption || '📷 Image';

      case 'video':
        return msg.content?.caption || '🎥 Video';

      case 'audio':
        return '🎵 Audio message';

      case 'document':
        const fileName = msg.content?.filename || msg.content?.file_name || 'Document';
        return `📄 ${fileName}`;

      case 'location':
        return '📍 Location';

      case 'template':
        return '📄 Template message';

      case 'interactive':
        return '🔘 Interactive message';

      default:
        return msg.content?.text || 'Message';
    }
  }
}
