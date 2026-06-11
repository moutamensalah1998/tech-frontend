import { Component, Input } from '@angular/core';
import { ChatWindowHeaderComponent } from "./components/chat-window-header/chat-window-header.component";
import { ChatWindowBodyComponent } from "./components/chat-window-body/chat-window-body.component";
import { ChatWindowInputComponent } from "./components/chat-window-input/chat-window-input.component";
import { Conversation } from '../../../../../../core/models/conversation.model';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [ChatWindowHeaderComponent, ChatWindowBodyComponent, ChatWindowInputComponent],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent {
  @Input() conversation!: Conversation;
  @Input() expiry_time: string | null = null;
  @Input() reset_counter: number = 0;
  @Input() isExpired: boolean = false;

  droppedFiles: File[] = [];
  replyingToMessage: any = null;

  onFilesDropped(files: File[]) {
    this.droppedFiles = [...files];
    setTimeout(() => {
      this.droppedFiles = [];
    }, 100);
  }

  onReplyToMessage(message: any) {
    this.replyingToMessage = message;
  }

  onReplyCleared() {
    this.replyingToMessage = null;
  }
}
