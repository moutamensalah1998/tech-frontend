import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { ChatListHeaderComponent } from "./components/chat-list-header/chat-list-header.component";
import { ChatListContactComponent } from "./components/chat-list-contact/chat-list-contact.component";
import { ConversationsFacade } from '../../../../../../core/services/conversations/ngrx/conversations.facade';
import { Conversation } from '../../../../../../core/models/conversation.model';
import { SocketService } from '../../../../../../core/services/chat/socketio/socket.service';
import { A11yModule } from "@angular/cdk/a11y";
import { Subject, takeUntil } from 'rxjs';
import { ConversationStateService } from '../conversation.state.service';


@Component({
  selector: 'app-chat-list',
  imports: [CommonModule, ChatListHeaderComponent, ChatListContactComponent, A11yModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.css'
})
export class ChatListComponent implements OnInit, OnDestroy {
  @Input() selectedConversationId: string | null = null;
  @Output() selectConversation = new EventEmitter<Conversation>();
  conversations$ = this.conversationsFacade.conversations$;
  meta$ = this.conversationsFacade.meta$;
  loading$ = this.conversationsFacade.loading$;
  error$ = this.conversationsFacade.error$;
  @Output() i = new EventEmitter<number>();
  private destroy$ = new Subject<void>();

  constructor(
    private conversationsFacade: ConversationsFacade,
    private socketService: SocketService,
    private conversationState: ConversationStateService
  ) {
    this.conversationsFacade.loadConversations(1, 10);
  }

  ngOnInit(): void {
    // No auto-select logic here - message loading is handled exclusively
    // by the conversation page when a conversation is selected
  }

  ngOnDestroy(): void {
    // No cleanup needed
  }

  onSelectConversation(conversation: Conversation, i: number) {
    this.i.emit(i);
    this.selectConversation.emit(conversation);
  }
}
