import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentItem } from '../../../../../../core/models/chatbot.model';
import { MediaUploadResult, MediaUploadService } from '../../services/media-upload.service';
import { MediaUploadComponent } from "../media-upload/media-upload.component";
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-content-item',
  standalone: true,
  imports: [CommonModule, FormsModule, MediaUploadComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content-item.component.html',
})
export class ContentItemComponent implements OnInit, OnDestroy {
  @Input() item!: ContentItem;
  @Input() index!: number;

  @Output() remove = new EventEmitter<number>();
  @Output() change = new EventEmitter<void>();

  hasError = false;
  errorMessage = '';
  private translationService = inject(TranslationService);
  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private mediaUploadService: MediaUploadService
  ) {}

  ngOnInit(): void {
    this.subscribeToTranslations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToTranslations(): void {
    // Subscribe to translation loading events to trigger change detection
    this.translationService.getTranslationsLoaded$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    // Also subscribe to language changes
    this.translationService.getCurrentLang()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  // Text content handlers
  onTextChange(value: string): void {
    if (this.item.content) {
      this.item.content.text_body = value;
      this.emitChange();
    }
  }

  // Media upload handlers
  onMediaUploaded(result: MediaUploadResult): void {
    if (this.item.content) {
      // Store all media information including base64
      this.item.content.file_name = result.fileName;
      this.item.content.mime_type = result.mimeType;
      this.item.content.bytes = result.base64Data; // Server expects base64 in 'bytes' field
      this.item.content.file_size = result.size;

      // Store preview URLs for UI purposes (not sent to server)
      if (result.previewUrl) {
        this.item.content.preview_url = result.previewUrl;
      }
      if (result.thumbnailUrl) {
        this.item.content.thumbnail_url = result.thumbnailUrl;
      }
    }

    this.clearError();
    this.emitChange();
  }

  onMediaRemoved(): void {
    if (this.item.content) {
      // Clear all media-related fields
      delete this.item.content.file_name;
      delete this.item.content.mime_type;
      delete this.item.content.bytes;
      delete this.item.content.file_size;
      delete this.item.content.preview_url;
      delete this.item.content.thumbnail_url;
    }

    this.clearError();
    this.emitChange();
  }

  onMediaError(error: string): void {
    this.hasError = true;
    this.errorMessage = error;
    this.cdr.markForCheck();
  }

  // Additional content handlers
  onCaptionChange(value: string): void {
    if (this.item.content) {
      this.item.content.caption = value;
      this.emitChange();
    }
  }

  onDocumentTitleChange(value: string): void {
    if (this.item.content) {
      this.item.content.document_title = value;
      this.emitChange();
    }
  }

  onDescriptionChange(value: string): void {
    if (this.item.content) {
      this.item.content.description = value;
      this.emitChange();
    }
  }

  // Utility methods
  getInitialMediaValue(): MediaUploadResult | undefined {
    if (!this.hasMediaContent()) return undefined;
    let previewUrl = this.item.content.preview_url;
    if (this.item.content.bytes && this.item.content.mime_type && !previewUrl) {
      previewUrl = `data:${this.item.content.mime_type};base64,${this.item.content.bytes}`;
    }
    return {
      fileName: this.item.content.file_name || '',
      mimeType: this.item.content.mime_type || '',
      base64Data: this.item.content.bytes || '',
      size: this.item.content.file_size || 0,
      previewUrl: previewUrl,
      thumbnailUrl: this.item.content.thumbnail_url
    };
  }

  hasMediaContent(): boolean {
    return !!(
      this.item.content?.file_name &&
      (this.item.content?.bytes || this.item.content?.preview_url)
    );
  }

  getContentTypeIcon(type: string): string {
    const icons = {
      text: 'chat',
      image: 'image',
      video: 'videocam',
      audio: 'audiotrack',
      document: 'description'
    };
    return icons[type as keyof typeof icons] || 'attach_file';
  }

  getContentTypeIconClass(type: string): string {
    const classes = {
      text: 'text-green-600',
      image: 'text-blue-600',
      video: 'text-purple-600',
      audio: 'text-orange-600',
      document: 'text-gray-600'
    };
    return classes[type as keyof typeof classes] || 'text-gray-600';
  }

  formatFileSize(bytes: number): string {
    return this.mediaUploadService.formatFileSize(bytes);
  }

  // Content validation methods
  isContentComplete(): boolean {
    if (this.item.type === 'text') {
      return !!(this.item.content?.text_body?.trim());
    }
    return this.hasMediaContent();
  }

  isContentPartial(): boolean {
    if (this.item.type === 'text') {
      return false; // Text is either complete or empty
    }

    // For media, partial means we have some info but not complete
    const hasFileName = !!(this.item.content?.file_name);
    const hasBytes = !!(this.item.content?.bytes);
    return hasFileName !== hasBytes;
  }

  isContentEmpty(): boolean {
    if (this.item.type === 'text') {
      return !(this.item.content?.text_body?.trim());
    }
    return !this.hasMediaContent();
  }

  getContentStatusText(): string {
    if (this.isContentComplete()) {
      return this.translationService.translate('chatbot.builder.shared.contentItem.status.contentReady');
    } else if (this.isContentPartial()) {
      return this.translationService.translate('chatbot.builder.shared.contentItem.status.incompleteContent');
    } else {
      return this.translationService.translate('chatbot.builder.shared.contentItem.status.noContentAdded');
    }
  }

  getItemStatusText(): string {
    if (this.item.type === 'text') {
      const length = this.item.content?.text_body?.length || 0;
      const charsText = this.translationService.translate('chatbot.builder.shared.contentItem.status.chars');
      const emptyText = this.translationService.translate('chatbot.builder.shared.contentItem.status.empty');
      return length > 0 ? `${length} ${charsText}` : emptyText;
    } else {
      const uploadedText = this.translationService.translate('chatbot.builder.shared.contentItem.status.uploaded');
      const noFileText = this.translationService.translate('chatbot.builder.shared.contentItem.status.noFile');
      return this.hasMediaContent() ? uploadedText : noFileText;
    }
  }

  private emitChange(): void {
    this.change.emit();
    this.cdr.markForCheck();
  }

  private clearError(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.cdr.markForCheck();
  }
}
