import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMessage } from '../../../../../../../../../../core/models/chat.types';

@Component({
  selector: 'app-image-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-message.component.html'
})
export class ImageMessageComponent {
  @Input() message!: BaseMessage;
  @Output() openFullScreen = new EventEmitter<{url: string, type: 'image'}>();

  onImageClick() {
    this.openFullScreen.emit({
      url: this.message.content?.cdn_url,
      type: 'image'
    });
  }
}
