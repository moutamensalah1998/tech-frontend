import {
  Component,
  Input,
  NgZone,
  ChangeDetectorRef,
  OnInit,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  Output,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../../../../../core/services/toast-message.service';
import { map, Observable } from 'rxjs';
import { WhatsAppTemplate } from '../../../../../../../../core/models/whatsapp-template.model';
import { loadTemplates } from '../../../../../../../../core/services/broadcast/template/ngrx/your-template.actions';
import { selectTemplateLoading, selectTemplates } from '../../../../../../../../core/services/broadcast/template/ngrx/your-template.selectors';
import { triggerChatbot } from '../../../../../../../../core/services/chatbot/ngrx/chatbot.actions';
import { ChatbotData } from '../../../../../../../../core/models/chatbot.model';
import { selectChatbotState } from '../../../../../../../../core/services/chatbot/ngrx/chatbot.selectors';
import { FilePreview, FilePreviewService } from './services/file-preview.service';
import { MessageSendingService, MessageContext, LocationData } from './services/message-sending.service';
import { FilePreviewComponent } from './components/file-preview/file-preview.component';
import { TemplatePickerComponent, TemplateItem } from './components/template-picker/template-picker.component';
import { LocationPreviewComponent, LocationPreviewData } from './components/location-preview/location-preview.component';
import { ReplyInputComponent } from "./components/reply-input/reply-input.component";
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../core/services/translation/translation.service';

type PreviewType = 'video' | 'image' | 'document' | 'location' | null;

@Component({
  standalone: true,
  selector: 'app-chat-window-input',
  imports: [
    FormsModule,
    CommonModule,
    FilePreviewComponent,
    TemplatePickerComponent,
    LocationPreviewComponent,
    ReplyInputComponent,
    TranslatePipe
  ],
  templateUrl: './chat-window-input.component.html',
})
export class ChatWindowInputComponent implements OnInit, OnChanges {
  messageBody = '';
  @Input() recipientNumber!: string;
  @Input() contextMessageId: string | null = null;
  @Input() isExpired: boolean = false;
  @Input() conversationId: string | null = null;
  @Input() droppedFiles: File[] = [];
  @Input() replyingToMessage: any = null;
  @Output() replyCleared = new EventEmitter<void>();

  private previewFileUrl: string | null = null;

  templates$!: Observable<TemplateItem[]>;
  chatBots$!: Observable<ChatbotData[]>;
  loading$!: Observable<boolean>;
  showTemplatePicker = false;
  showChatBotPicker = false;
  selectedTemplateItem: TemplateItem | null = null;
  selectedChatBotId: string | null = null;

  filePreviews: FilePreview[] = [];
  isPreviewMode = false;

  previewType: PreviewType = null;
  previewFile: File | null = null;
  previewCaption = '';
  locationPreviewData: LocationPreviewData | null = null;
  private translationService = inject(TranslationService);

  constructor(
    private store: Store,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService,
    private filePreviewService: FilePreviewService,
    private messageSendingService: MessageSendingService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isExpired']) {
      this.isExpired = changes['isExpired'].currentValue;
    }

    if (changes['droppedFiles'] && changes['droppedFiles'].currentValue?.length > 0) {
      this.handleDroppedFiles(changes['droppedFiles'].currentValue);
    }
  }

  ngOnInit(): void {
    this.initializeTemplatesAndChatbots();
  }

  private initializeTemplatesAndChatbots(): void {
    this.store.dispatch(loadTemplates({ page_number: 1, limit: 1000 }));

    this.chatBots$ = this.store
      .select(selectChatbotState)
      .pipe(map((state) => (state.data ? state.data.chatbots : [])));

    this.templates$ = this.store
      .select(selectTemplates)
      .pipe(
        map((resp: any) => {
          if (!resp || !resp.data) return [];
          return resp.data
            .filter((item: any) => item.template.status === 'APPROVED')
            .map((item: any) => ({
              template: item.template,
              variables: item.variables || []
            } as TemplateItem));
        })
      );

    this.loading$ = this.store.select(selectTemplateLoading);
  }

  private get messageContext(): MessageContext {
    return {
      conversationId: this.conversationId!,
      recipientNumber: this.recipientNumber,
      contextMessageId: this.replyingToMessage?.wa_message_id || this.contextMessageId,
      replyingToMessage: this.replyingToMessage,
    };
  }

  private handleDroppedFiles(files: File[]): void {
    files.forEach(file => {
      const preview = this.filePreviewService.createFilePreview(file);
      this.filePreviews.push(preview);
    });

    this.isPreviewMode = this.filePreviews.length > 0;
    this.cdr.detectChanges();
  }

  onFileRemoved(previewId: string): void {
    this.filePreviews = this.filePreviewService.removeFilePreview(this.filePreviews, previewId);
    this.isPreviewMode = this.filePreviews.length > 0;
  }

  onCaptionUpdated(event: { id: string; caption: string }): void {
    this.filePreviews = this.filePreviewService.updateFileCaption(
      this.filePreviews,
      event.id,
      event.caption
    );
  }

  onSendAllFiles(): void {
    this.filePreviews.forEach(preview => {
      this.messageSendingService.sendMediaFile(preview, this.messageContext);
    });
    this.onClearAllFiles();
    this.clearReply();
  }

  onClearAllFiles(): void {
    this.filePreviewService.clearAllPreviews(this.filePreviews);
    this.filePreviews = [];
    this.isPreviewMode = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file) {
      this.zone.run(() => {
        if (this.previewFileUrl) {
          this.filePreviewService.revokeFilePreviewUrl(this.previewFileUrl);
        }

        this.previewType = 'document';
        this.previewFile = file;
        this.previewCaption = '';

        this.previewFileUrl = this.filePreviewService.getFilePreviewUrl(file);

        this.cdr.detectChanges();
      });
    }
    input.value = '';
  }

  get filePreviewUrl(): string {
    return this.previewFileUrl || '';
  }

  submitSingleMediaPreview(): void {
    if (this.previewFile && this.previewFileUrl) {
      const preview: FilePreview = {
        file: this.previewFile,
        type: this.getFileTypeFromFile(this.previewFile),
        url: this.previewFileUrl,
        caption: this.previewCaption,
        id: 'single-preview'
      };

      this.messageSendingService.sendMediaFile(preview, this.messageContext);
      this.cancelSinglePreview();
      this.clearReply();
    }
  }

  private getFileTypeFromFile(file: File): 'image' | 'video' | 'audio' | 'document' {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  }

  cancelSinglePreview(): void {
    if (this.previewFileUrl) {
      this.filePreviewService.revokeFilePreviewUrl(this.previewFileUrl);
      this.previewFileUrl = null;
    }

    this.previewType = null;
    this.previewFile = null;
    this.previewCaption = '';
    this.locationPreviewData = null;
    this.cdr.detectChanges();
  }

  sendLocation(): void {
    if (!navigator.geolocation) {
      this.toastService.showToast(this.translationService.translate('common.messages.geolocationNotSupported'), 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
      this.zone.run(() => {
        this.previewType = 'location';
        this.locationPreviewData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          name: '',
          address: '',
        };
        this.cdr.detectChanges();
      });
    });
  }

  onLocationDataChange(locationData: LocationPreviewData): void {
    this.locationPreviewData = locationData;
  }

  onLocationSent(locationData: LocationPreviewData): void {
    const locationToSend: LocationData = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      name: locationData.name,
      address: locationData.address,
    };

    this.messageSendingService.sendLocationMessage(locationToSend, this.messageContext);
    this.cancelSinglePreview();
    this.clearReply();
  }

  sendText(): void {
    const body = this.messageBody.trim();
    if (!body) return;

    this.messageSendingService.sendTextMessage(body, this.messageContext);
    this.messageBody = '';
    this.clearReply();
  }

  openTemplatePicker(): void {
    this.showTemplatePicker = true;
  }

  onTemplateSelected(templateItem: TemplateItem): void {
    this.selectedTemplateItem = templateItem;
  }

  onTemplateSent(data: { template: TemplateItem, parameters: { [key: string]: string }, mediaUrl?: string }): void {
    this.messageSendingService.sendTemplateMessage(data.template, data.parameters, this.messageContext, data.mediaUrl);
    this.resetTemplatePicker();
    this.clearReply();
  }

  onTemplatePickerCancelled(): void {
    this.resetTemplatePicker();
  }

  private resetTemplatePicker(): void {
    this.showTemplatePicker = false;
    this.selectedTemplateItem = null;
  }

  openChatBotPicker(): void {
    this.showChatBotPicker = true;
  }

  chooseChatBot(chatBotId: string): void {
    this.selectedChatBotId = chatBotId;
  }

  sendTriggerChatBot(): void {
    this.store.dispatch(triggerChatbot({
      chat_bot_id: this.selectedChatBotId!,
      conversation_id: this.conversationId!,
      recipient_number: this.recipientNumber
    }));
    this.resetChatBotPicker();
    this.clearReply();
  }

  cancelChatBot(): void {
    this.resetChatBotPicker();
  }

  private resetChatBotPicker(): void {
    this.showChatBotPicker = false;
    this.selectedChatBotId = null;
  }

  get showRegularInput(): boolean {
    return !this.isPreviewMode && !this.isExpired;
  }

  get showSingleMediaPreview(): boolean {
    return this.previewType === 'document' || this.previewType === 'image' || this.previewType === 'video';
  }

  get showLocationPreview(): boolean {
    return this.previewType === 'location' && this.locationPreviewData !== null;
  }

  get showMainToolbar(): boolean {
    return this.showRegularInput && !this.previewType;
  }

  ngOnDestroy(): void {
    if (this.previewFileUrl) {
      this.filePreviewService.revokeFilePreviewUrl(this.previewFileUrl);
    }
    this.filePreviewService.clearAllPreviews(this.filePreviews);
  }

  clearReply(): void {
    this.replyCleared.emit();
  }

  onReplyCleared(): void {
    this.clearReply();
  }
}
