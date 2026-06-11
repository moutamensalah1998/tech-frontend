import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  HostListener,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { skip, Subscription, take } from 'rxjs';

import { Conversation } from '../../../../../../../../core/models/conversation.model';
import {
  clearMessages,
  loadMessagesByConversation,
} from '../../../../../../../../core/services/messages/ngrx/messages.actions';
import {
  selectMessages,
  selectMessagesMeta,
} from '../../../../../../../../core/services/messages/ngrx/messages.selectors';
import { DateUtilsPipe } from '../../../../../../../../utils/date-utils/date-utils-pipe.component';

import { TextMessageComponent } from './components/text-message/text-message.component';
import { ImageMessageComponent } from './components/image-message/image-message.component';
import { VideoMessageComponent } from './components/video-message/video-message.component';
import { AudioMessageComponent } from './components/audio-message/audio-message.component';
import { DocumentMessageComponent } from './components/document-message/document-message.component';
import { LocationMessageComponent } from './components/location-message/location-message.component';
import { TemplateMessageComponent } from './components/template-message/template-message.component';
import { InteractiveMessageComponent } from './components/interactive-message/interactive-message.component';
import { ButtonMessageComponent } from './components/button-message/button-message.component';
import { AssignMessageComponent } from './components/assign-message/assign-message.component';
import { MessageStatusComponent } from './components/message-status/message-status.component';
import { FullScreenModalComponent } from './components/full-screen-modal/full-screen-modal.component';
import { ReplyMessageComponent } from './components/reply-message/reply-message.component';
import { MessageContextMenuComponent } from './components/message-context-menu/message-context-menu.component';
import { ToastService } from '../../../../../../../../core/services/toast-message.service';
import { ReactionPickerComponent } from "./components/reaction-picker/reaction-picker.component";

interface FullScreenMedia {
  isOpen: boolean;
  url: string;
  type: 'image' | 'video';
  mimeType?: string;
}

interface DragDropState {
  isDragging: boolean;
  isValidDrop: boolean;
  dragCounter: number;
}

@Component({
  selector: 'app-chat-window-body',
  standalone: true,
  imports: [
    CommonModule,
    TextMessageComponent,
    ImageMessageComponent,
    VideoMessageComponent,
    AudioMessageComponent,
    DocumentMessageComponent,
    LocationMessageComponent,
    TemplateMessageComponent,
    InteractiveMessageComponent,
    ButtonMessageComponent,
    AssignMessageComponent,
    MessageStatusComponent,
    FullScreenModalComponent,
    ReplyMessageComponent,
    MessageContextMenuComponent,
    ReactionPickerComponent,
    DateUtilsPipe
],
  templateUrl: './chat-window-body.component.html',
  styleUrls: ['./chat-window-body.component.css'],
})
export class ChatWindowBodyComponent
  implements OnChanges, AfterViewInit, OnDestroy {
  @Input() conversation!: Conversation;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  @Output() filesDropped = new EventEmitter<File[]>();
  @Output() replyToMessage = new EventEmitter<any>();
  @Output() reaction = new EventEmitter<any>();

  messages$ = this.store.select(selectMessages);
  meta$ = this.store.select(selectMessagesMeta);

  currentPage = 1;
  loading = false;
  hasMore = false;
  before_id: string | null = null;
  before_created_at: string | null = null;
  showDebugInfo = false;

  fullScreenMedia: FullScreenMedia = {
    isOpen: false,
    url: '',
    type: 'image'
  };

  dragDropState: DragDropState = {
    isDragging: false,
    isValidDrop: false,
    dragCounter: 0
  };

  contextMenu = {
    isVisible: false,
    position: { x: 0, y: 0 },
    message: null as any
  };

  reactionPicker = {
    isVisible: false,
    position: { x: 0, y: 0 },
    message: null as any
  };

  private readonly supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  private readonly supportedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'];
  private readonly supportedAudioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a'];
  private readonly supportedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

  private messagesSub?: Subscription;
  private metaSub?: Subscription;

  constructor(
    private store: Store,
    private toaste: ToastService,
  ) { }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.fullScreenMedia.isOpen) {
      this.closeFullScreen();
    }
  }

  @HostListener('dragenter', ['$event'])
  onDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.dragDropState.dragCounter++;

    if (this.dragDropState.dragCounter === 1 || !this.dragDropState.isDragging) {
      if (this.hasValidFiles(event)) {
        this.dragDropState.isDragging = true;
        this.dragDropState.isValidDrop = true;
      } else {
        this.dragDropState.isDragging = true;
        this.dragDropState.isValidDrop = false;
        this.toaste.showToast('Invalid files detected - showing error overlay', 'error');
      }
    }
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.dragDropState.dragCounter--;

    if (this.dragDropState.dragCounter <= 0) {
      this.dragDropState.isDragging = false;
      this.dragDropState.isValidDrop = false;
      this.dragDropState.dragCounter = 0;
    }
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (this.dragDropState.isValidDrop) {
      event.dataTransfer!.dropEffect = 'copy';
    } else {
      event.dataTransfer!.dropEffect = 'none';
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.resetDragState();

    const files = Array.from(event.dataTransfer?.files || []);

    if (files.length === 0) {
      return;
    }

    const validFiles = this.filterValidFiles(files);

    if (validFiles.length > 0) {
      this.filesDropped.emit(validFiles);
    } else {
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['conversation'] && this.conversation?.id) {
      this.resetState();
      this.loadPage();
      this.setupSubscriptions();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.scrollToBottom();
    }, 0);
  }

  ngOnDestroy() {
    this.clearSubscriptions();
  }

  onScroll() {
    const c = this.scrollContainer.nativeElement;
    const THRESHOLD = 20;

    if (c.scrollTop <= THRESHOLD && this.hasMore && !this.loading) {
      this.loading = true;
      const prevHeight = c.scrollHeight;
      const prevScrollTop = c.scrollTop;
      this.currentPage++;

      this.store.dispatch(
        loadMessagesByConversation({
          conversationId: this.conversation.id,
          before_id: this.before_id ?? null,
          before_created_at: this.before_created_at ?? null,
        })
      );

      const subscription = this.messages$
        .pipe(skip(1), take(1))
        .subscribe(() => {
          setTimeout(() => {
            const newHeight = c.scrollHeight;
            c.scrollTop = newHeight - prevHeight + prevScrollTop;
            this.loading = false;
          }, 100);
        });
    }
  }

  openFullScreen(url: string, type: 'image' | 'video', mimeType?: string) {
    if (!url) {
      return;
    }

    this.fullScreenMedia = {
      isOpen: true,
      url,
      type,
      mimeType
    };
    document.body.style.overflow = 'hidden';
  }

  closeFullScreen() {
    this.fullScreenMedia = {
      isOpen: false,
      url: '',
      type: 'image'
    };
    document.body.style.overflow = 'auto';
  }

  onTemplateButton(msg: any, index: number) {
    const payload = msg.content.template.components.filter(
      (c: any) => c.type === 'button' && c.index === index
    )[0].parameters[0].payload;
  }

  onMessageRightClick(event: MouseEvent, message: any): void {
    event.preventDefault();
    this.contextMenu.isVisible = true;
    this.contextMenu.position = { x: event.clientX, y: event.clientY };
    this.contextMenu.message = message;
  }

  onMessageClick(message: any): void {
    if (this.contextMenu.isVisible) {
      this.contextMenu.isVisible = false;
    }
  }

  onContextMenuReply(message: any): void {
    this.replyToMessage.emit(message);
  }

  onContextMenuCopy(message: any): void {
    this.toaste.showToast('Message copied to clipboard', 'success');
  }

  onContextMenuDelete(message: any): void {
    this.toaste.showToast('Delete functionality not implemented', 'info');
  }
  onContextMenuReaction(message: any): void {
    this.reaction.emit(message);

  }

  onReactionSelected(reaction: any): void {
    this.reaction.emit(reaction);
  }
  onContextMenuClosed(): void {
    this.contextMenu.isVisible = false;
    this.contextMenu.message = null;
  }
onReactionPickerClosed(): void {
  this.reactionPicker.isVisible = false;
  this.reactionPicker.message = null;
}
  private hasValidFiles(event: DragEvent): boolean {
    const items = Array.from(event.dataTransfer?.items || []);

    if (items.length === 0) {
      return false;
    }

    const hasValidItem = items.some(item => {
      if (item.kind !== 'file') {
        return false;
      }

      const isValid = this.isValidFileTypeFromMime(item.type);
      return isValid;
    });

    return hasValidItem;
  }

  private isValidFileType(file: File): boolean {
    const isValid = this.supportedImageTypes.includes(file.type) ||
      this.supportedVideoTypes.includes(file.type) ||
      this.supportedAudioTypes.includes(file.type) ||
      this.supportedDocumentTypes.includes(file.type);

    return isValid;
  }

  private isValidFileTypeFromMime(mimeType: string): boolean {
    const isValid = this.supportedImageTypes.includes(mimeType) ||
      this.supportedVideoTypes.includes(mimeType) ||
      this.supportedAudioTypes.includes(mimeType) ||
      this.supportedDocumentTypes.includes(mimeType);

    return isValid;
  }

  private filterValidFiles(files: File[]): File[] {
    return files.filter(file => {
      if (!this.isValidFileType(file)) {
        return false;
      }

      const maxSize = 25 * 1024 * 1024;
      if (file.size > maxSize) {
        this.toaste.showToast(`File too large: ${file.name} (${this.formatFileSize(file.size)}). Max size: 25MB`, 'error');
        return false;
      }
      return true;
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private resetDragState() {
    this.dragDropState = {
      isDragging: false,
      isValidDrop: false,
      dragCounter: 0
    };
  }

  private resetState() {
    this.currentPage = 1;
    this.hasMore = false;
    this.before_id = null;
    this.before_created_at = null;
    this.clearSubscriptions();
    this.store.dispatch(clearMessages());
    this.resetDragState();
  }

  private loadPage() {
    this.store.dispatch(
      loadMessagesByConversation({
        conversationId: this.conversation.id,
        before_id: null,
        before_created_at: null,
      })
    );
  }

  private setupSubscriptions() {
    this.messagesSub = this.messages$.subscribe((messages) => {
      if (this.currentPage === 1) {
        setTimeout(() => this.scrollToBottom(), 0);
      }
    });

    this.metaSub = this.meta$.subscribe((meta) => {
      this.hasMore = !!meta?.has_more;
      this.before_id = meta?.cursor?.before_id || null;
      this.before_created_at = meta?.cursor?.before_created_at || null;
    });
  }

  private clearSubscriptions() {
    this.messagesSub?.unsubscribe();
    this.metaSub?.unsubscribe();
  }

  private scrollToBottom() {
    if (this.scrollContainer) {
      const c = this.scrollContainer.nativeElement;
      c.scrollTop = c.scrollHeight;
    }
  }
}
