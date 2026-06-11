import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMessage } from '../../../../../../../../../../core/models/chat.types';

@Component({
  selector: 'app-video-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-message.component.html',
})
export class VideoMessageComponent {
  @Input() message!: BaseMessage;
  @Output() openFullScreen = new EventEmitter<{url: string, type: 'video', mimeType?: string}>();

  onVideoClick() {
    this.openFullScreen.emit({
      url: this.message.content?.cdn_url,
      type: 'video',
      mimeType: this.message.content?.mime_type
    });
  }
}
