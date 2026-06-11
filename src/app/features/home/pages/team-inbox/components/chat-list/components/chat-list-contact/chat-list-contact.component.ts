import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Conversation } from '../../../../../../../../core/models/conversation.model';
import { DateUtilsPipe } from '../../../../../../../../utils/date-utils/date-utils-pipe.component';

@Component({
  selector: 'app-chat-list-contact',
  imports: [CommonModule, DateUtilsPipe],
  templateUrl: './chat-list-contact.component.html',
  styleUrl: './chat-list-contact.component.css'
})
export class ChatListContactComponent {
  @Input() conversation!: Conversation;
  @Input() selectedConversationId: string | null = null;
  @Output() select = new EventEmitter<Conversation>();
  @Input() i!: number;

  onClick() {
    this.select.emit(this.conversation);
  }

  get isSelected(): boolean {
    return this.selectedConversationId === this.conversation.id;
  }
  getInitials(name: string): string {
    if (!name) return 'NA';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0].charAt(0) + ' ' + names[names.length - 1].charAt(0)).toUpperCase();
  }
}
