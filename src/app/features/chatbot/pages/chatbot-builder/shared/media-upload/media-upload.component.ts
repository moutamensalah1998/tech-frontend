import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaUploadService, MediaUploadResult, UploadProgress } from '../../services/media-upload.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-media-upload',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './media-upload.component.html',
  styleUrls: ['./media-upload.component.css']
})
export class MediaUploadComponent implements OnDestroy {
  @Input() mediaType: 'image' | 'video' | 'audio' | 'document' = 'image';
  @Input() initialValue?: MediaUploadResult;
  @Input() maxSizeMB?: number;
  @Input() placeholder?: string;

  @Output() mediaUploaded = new EventEmitter<MediaUploadResult>();
  @Output() mediaRemoved = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<string>();

  isDragOver = false;
  hasError = false;
  errorMessage = '';
  currentUpload: UploadProgress | null = null;
  mediaResult: MediaUploadResult | null = null;

  private destroy$ = new Subject<void>();

  private readonly FILE_ACCEPTS = {
    image: 'image/*',
    video: 'video/*',
    audio: 'audio/*',
    document: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
  };

  private readonly DEFAULT_MAX_SIZES = {
    image: 5,
    video: 15,
    audio: 5,
    document: 10
  };

  constructor(
    public mediaUploadService: MediaUploadService,
    private cdr: ChangeDetectorRef
  ) {
    this.mediaUploadService.uploadProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(uploads => {
        const currentUploads = Array.from(uploads.values());
        this.currentUpload = currentUploads.length > 0 ? currentUploads[currentUploads.length - 1] : null;
        this.cdr.markForCheck();
      });
  }

  ngOnInit(): void {
    if (this.initialValue) {
      this.mediaResult = this.initialValue;
      this.clearError();

      if (this.mediaResult.mimeType === 'binary/octet-stream' ||
        this.mediaResult.mimeType === 'application/octet-stream' ||
        !this.mediaResult.mimeType) {
        const correctedMimeType = this.guessMimeTypeFromFilename(this.mediaResult.fileName);
        if (correctedMimeType) {
          this.mediaResult.mimeType = correctedMimeType;
        }
      }

      if (!this.mediaResult.previewUrl && this.mediaResult.base64Data && this.mediaResult.mimeType) {
        this.mediaResult.previewUrl = `data:${this.mediaResult.mimeType};base64,${this.mediaResult.base64Data}`;
      }
    }
  }
  private guessMimeTypeFromFilename(filename: string): string | null {
    if (!filename) return null;

    const extension = filename.split('.').pop()?.toLowerCase();
    if (!extension) return null;

    const mimeMap: { [key: string]: string } = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',

      // Videos
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',

      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',

      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'csv': 'text/csv'
    };

    return mimeMap[extension] || null;
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get acceptedTypes(): string {
    return this.FILE_ACCEPTS[this.mediaType];
  }

  get mxSizeMB(): number {
    return this.maxSizeMB || this.DEFAULT_MAX_SIZES[this.mediaType];
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
      input.value = '';
    }
  }

  async processFile(file: File): Promise<void> {
    this.clearError();

    try {
      const result = await this.mediaUploadService.convertFileToBase64(file, this.mediaType);
      this.mediaResult = result;
      this.mediaUploaded.emit(result);
      this.cdr.markForCheck();
    } catch (error) {
      this.handleError(error instanceof Error ? error.message : 'Upload failed');
    }
  }

  removeMedia(): void {
    this.mediaResult = null;
    this.clearError();
    this.mediaRemoved.emit();
    this.cdr.markForCheck();
  }

  async copyBase64ToClipboard(): Promise<void> {
    if (!this.mediaResult) return;

    try {
      await navigator.clipboard.writeText(this.mediaResult.base64Data);
    } catch (error) {
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  getUploadIcon(): string {
    const icons = {
      image: 'image',
      video: 'videocam',
      audio: 'audiotrack',
      document: 'description'
    };
    return icons[this.mediaType];
  }

  getUploadText(): string {
    const texts = {
      image: 'Click to upload image or drag and drop',
      video: 'Click to upload video or drag and drop',
      audio: 'Click to upload audio or drag and drop',
      document: 'Click to upload document or drag and drop'
    };
    return this.placeholder || texts[this.mediaType];
  }

  getAllowedFormatsText(): string {
    const formats = {
      image: 'PNG, JPG, GIF, WebP',
      video: 'MP4, WebM, OGG, AVI',
      audio: 'MP3, WAV, OGG, M4A',
      document: 'PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX'
    };
    return formats[this.mediaType];
  }

  private handleError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.uploadError.emit(message);
    this.cdr.markForCheck();
  }

  private clearError(): void {
    this.hasError = false;
    this.errorMessage = '';
  }
}
