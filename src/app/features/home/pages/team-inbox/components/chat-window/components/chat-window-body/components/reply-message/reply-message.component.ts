import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMessage } from '../../../../../../../../../../core/models/chat.types';
import { Store } from '@ngrx/store';
import { Observable, of, map, catchError } from 'rxjs';
import { selectMessages } from '../../../../../../../../../../core/services/messages/ngrx/messages.selectors';
import { ButtonMessageComponent } from "../button-message/button-message.component";

@Component({
  selector: 'app-reply-message',
  standalone: true,
  imports: [CommonModule, ButtonMessageComponent],
  templateUrl: './reply-message.component.html',
  styleUrls: ['./reply-message.component.css']
})
export class ReplyMessageComponent implements OnInit {
  @Input() message!: BaseMessage;
  @Output() openFullScreen = new EventEmitter<{url: string, type: 'image' | 'video', mimeType?: string}>();

  originalMessage$: Observable<BaseMessage | null> = of(null);

  constructor(private store: Store) {}

  ngOnInit() {
    this.loadOriginalMessage();
  }

  private loadOriginalMessage() {
    const repliedMessageId = this.message.context?.replied_message_id;
    if (!repliedMessageId) {
      this.originalMessage$ = of(null);
      return;
    }

    this.originalMessage$ = this.store.select(selectMessages).pipe(
      map(messages => {
        let originalMsg = messages.find(msg => msg.wa_message_id === repliedMessageId);

        if (!originalMsg) {
          originalMsg = messages.find(msg => msg._id === repliedMessageId);
        }

        return originalMsg || null;
      }),
      catchError(() => of(null))
    );
  }

  getMessageClasses(): string {
    return this.message.is_from_contact ? 'from-contact' : 'from-user';
  }

  getDocumentName(): string {
    return this.message.content?.filename ||
           this.message.content?.file_name ||
           'Document';
  }

  getOriginalDocumentName(originalMsg: BaseMessage): string {
    return originalMsg.content?.filename ||
           originalMsg.content?.file_name ||
           'Document';
  }

  getFallbackText(): string {
    const context = this.message.context;
    if (!context?.original_content) return 'Original message not found';

    const content = context.original_content;

    if (content.question_text) return content.question_text;
    if (content.text) return content.text;
    if (content.text_body) return content.text_body;
    if (content.caption) return content.caption;

    if (content.cdn_url || content.media_id) {
      const mimeType = content.mime_type || '';
      const fileName = content.file_name || '';

      if (mimeType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return `📷 ${fileName || 'Image'}`;
      } else if (mimeType.startsWith('video/') || fileName.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
        return `🎥 ${fileName || 'Video'}`;
      } else if (mimeType.startsWith('audio/') || fileName.match(/\.(mp3|wav|ogg|aac|m4a)$/i)) {
        return `🎵 ${fileName || 'Audio'}`;
      } else if (fileName) {
        return `📄 ${fileName}`;
      } else {
        return '📎 Media file';
      }
    }

    return 'Original message';
  }

  onImageClick(): void {
    if (this.message.content?.cdn_url) {
      this.openFullScreen.emit({
        url: this.message.content.cdn_url,
        type: 'image'
      });
    }
  }

  onVideoClick(): void {
    if (this.message.content?.cdn_url) {
      this.openFullScreen.emit({
        url: this.message.content.cdn_url,
        type: 'video',
        mimeType: this.message.content?.mime_type
      });
    }
  }

  onOriginalImageClick(originalMsg: BaseMessage): void {
    if (originalMsg.content?.cdn_url) {
      this.openFullScreen.emit({
        url: originalMsg.content.cdn_url,
        type: 'image'
      });
    }
  }

  onOriginalVideoClick(originalMsg: BaseMessage): void {
    if (originalMsg.content?.cdn_url) {
      this.openFullScreen.emit({
        url: originalMsg.content.cdn_url,
        type: 'video',
        mimeType: originalMsg.content?.mime_type
      });
    }
  }
}
