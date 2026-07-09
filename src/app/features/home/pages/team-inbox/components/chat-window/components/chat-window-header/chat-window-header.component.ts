import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Observable, Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import {
  assignConversation,
  updateConversationStatus,
} from '../../../../../../../../core/services/conversations/ngrx/conversations.actions';
import { Conversation } from '../../../../../../../../core/models/conversation.model';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../../../../../core/models/user-management.model';
import { selectAllUsers } from '../../../../../../../../core/services/user-management/ngrx/user-management.selectors';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../core/services/translation/translation.service';
import { ConversationsService } from '../../../../../../../../core/services/conversations/conversations.service';

@Component({
  selector: 'app-chat-window-header',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './chat-window-header.component.html',
  styleUrls: ['./chat-window-header.component.css'],
})
export class ChatWindowHeaderComponent implements OnInit, OnDestroy, OnChanges {
  private translationService = inject(TranslationService);
  private conversationsService = inject(ConversationsService);
  
  constructor(private store: Store) {}
  
  // Ownership
  isHumanOwned = false;
  isAiOwned = false;
  isChatbotOwned = false;
  isNoneOwned = true;
  ownerLabel = '';
  ownerBadgeClass = 'bg-gray-500';
  updatingOwner = false;

  @Input() expiry_time: string | null = null;
  remainingTime: string | null = null;
  @Input() reset_counter: number = 0;
  @Input() conversation!: Conversation;
  isExpired: boolean = false;
  users$: Observable<User[]> = this.store.select(selectAllUsers);
  selectedUserId: string = '';
  selectedStatus: string = '';

  get statusList() {
    return [
      { value: 'OPEN', label: this.translationService.translate('teamInbox.chatWindowHeader.status.open') },
      { value: 'SOLVED', label: this.translationService.translate('teamInbox.chatWindowHeader.status.solved') },
      { value: 'PENDING', label: this.translationService.translate('teamInbox.chatWindowHeader.status.pending') },
    ];
  }
  

  selectStatus(value: string) {
    this.selectedStatus = value;
    this.store.dispatch(
      updateConversationStatus({
        conversationId: this.conversation.id,
        status: value,
      })
    );
  }

  onUserChange(userId: string) {
    this.selectedUserId = userId;
    this.store.dispatch(assignConversation({
      conversationId: this.conversation.id,
      userId: userId,
    }));
  }

  private totalSeconds = 0;
  private timerSub?: Subscription;

  ngOnInit() {
    this.resetAndStart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['conversation'] && this.conversation) {
      this.selectedStatus = this.conversation.status;
      this.selectedUserId = this.conversation.user_assignments_id;
      this.isExpired = this.conversation.conversation_is_expired;
      this.expiry_time = this.conversation.conversation_expiration_time;
      this.updateOwnershipState();
    }

    if (changes['expiry_time'] || changes['reset_counter']) {
      this.resetAndStart();
    }
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  private resetAndStart() {
    this.clearTimer();

    if (this.expiry_time && this.expiry_time !== 'None') {
      const [h, m, s] = this.expiry_time
        .split(':')
        .map((str) => parseInt(str, 10));
      this.totalSeconds = h * 3600 + m * 60 + s;
      this.updateDisplay();

      this.timerSub = interval(1000).subscribe(() => {
        if (this.totalSeconds > 0) {
          this.totalSeconds--;
          this.updateDisplay();
        } else {
          this.clearTimer();
          this.expiry_time = 'None';
          this.remainingTime = null;
        }
      });
    } else {
      this.remainingTime = null;
    }
  }

  private clearTimer() {
    this.timerSub?.unsubscribe();
    this.timerSub = undefined;
  }

  private updateDisplay() {
    const h = Math.floor(this.totalSeconds / 3600);
    const m = Math.floor((this.totalSeconds % 3600) / 60);
    const s = this.totalSeconds % 60;
    this.remainingTime = [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0'),
    ].join(':');
  }

  // --- Ownership methods ---

  private updateOwnershipState() {
    const owner = this.conversation?.owner || 'NONE';
    this.isHumanOwned = owner === 'HUMAN';
    this.isAiOwned = owner === 'AI';
    this.isChatbotOwned = owner === 'CHATBOT';
    this.isNoneOwned = owner === 'NONE';

    switch (owner) {
      case 'AI':
        this.ownerLabel = this.translationService.translate('teamInbox.chatWindowHeader.owners.ai');
        this.ownerBadgeClass = 'bg-blue-500';
        break;
      case 'CHATBOT':
        this.ownerLabel = this.translationService.translate('teamInbox.chatWindowHeader.owners.chatbot');
        this.ownerBadgeClass = 'bg-purple-500';
        break;
      case 'HUMAN':
        this.ownerLabel = this.translationService.translate('teamInbox.chatWindowHeader.owners.human');
        this.ownerBadgeClass = 'bg-green-500';
        break;
      default:
        this.ownerLabel = this.translationService.translate('teamInbox.chatWindowHeader.owners.none');
        this.ownerBadgeClass = 'bg-gray-500';
    }
  }

  takeOverConversation() {
    if (!this.conversation?.id || this.updatingOwner) return;
    this.updatingOwner = true;
    this.conversationsService.takeOverConversation(this.conversation.id).subscribe({
      next: () => {
        this.isHumanOwned = true;
        this.isAiOwned = false;
        this.isChatbotOwned = false;
        this.isNoneOwned = false;
        this.ownerLabel = this.translationService.translate('teamInbox.chatWindowHeader.owners.human');
        this.ownerBadgeClass = 'bg-green-500';
        if (this.conversation) {
          this.conversation.owner = 'HUMAN';
        }
        this.updatingOwner = false;
      },
      error: () => {
        this.updatingOwner = false;
      }
    });
  }

  resumeAI() {
    if (!this.conversation?.id || this.updatingOwner) return;
    this.updatingOwner = true;
    this.conversationsService.resumeAI(this.conversation.id).subscribe({
      next: () => {
        this.isHumanOwned = false;
        this.isAiOwned = true;
        this.isChatbotOwned = false;
        this.isNoneOwned = false;
        this.ownerLabel = this.translationService.translate('teamInbox.chatWindowHeader.owners.ai');
        this.ownerBadgeClass = 'bg-blue-500';
        if (this.conversation) {
          this.conversation.owner = 'AI';
        }
        this.updatingOwner = false;
      },
      error: () => {
        this.updatingOwner = false;
      }
    });
  }

  resumeChatbot() {
    if (!this.conversation?.id || this.updatingOwner) return;
    this.updatingOwner = true;
    this.conversationsService.resumeChatbot(this.conversation.id).subscribe({
      next: () => {
        this.isHumanOwned = false;
        this.isAiOwned = false;
        this.isChatbotOwned = true;
        this.isNoneOwned = false;
        this.ownerLabel = this.translationService.translate('teamInbox.chatWindowHeader.owners.chatbot');
        this.ownerBadgeClass = 'bg-purple-500';
        if (this.conversation) {
          this.conversation.owner = 'CHATBOT';
        }
        this.updatingOwner = false;
      },
      error: () => {
        this.updatingOwner = false;
      }
    });
  }
}