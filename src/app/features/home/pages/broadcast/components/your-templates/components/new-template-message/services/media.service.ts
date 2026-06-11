import { Injectable } from '@angular/core';
import { ToastService } from '../../../../../../../../../core/services/toast-message.service';
import { TemplateConstants } from '../../../../../../../../../core/utils/template-constants';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private selectedFiles: { [key: string]: File | null } = {};
  private previewUrls: { [key: string]: string } = {};

  constructor(private toastService: ToastService) {}

  selectFile(file: File, mediaType: string): boolean {
    if (!this.validateFile(file, mediaType)) {
      return false;
    }

    this.clearMedia();

    const type = mediaType.toLowerCase();
    this.selectedFiles[type] = file;

    if (type === 'image' || type === 'video') {
      this.previewUrls[type] = URL.createObjectURL(file);
    }

    return true;
  }

  clearMedia(): void {
    // Clean up existing URLs
    Object.values(this.previewUrls).forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });

    this.selectedFiles = {};
    this.previewUrls = {};
  }

  hasSelectedMedia(mediaType: string): boolean {
    return !!this.selectedFiles[mediaType.toLowerCase()];
  }

  getSelectedFileName(mediaType: string): string {
    const file = this.selectedFiles[mediaType.toLowerCase()];
    return file?.name || '';
  }

  getFileSize(mediaType: string): string {
    const file = this.selectedFiles[mediaType.toLowerCase()];
    if (!file) return '';

    const sizeInMB = file.size / (1024 * 1024);
    return sizeInMB < 1
      ? `${Math.round(file.size / 1024)} KB`
      : `${sizeInMB.toFixed(1)} MB`;
  }

  getPreviewUrl(mediaType: string): string {
    return this.previewUrls[mediaType.toLowerCase()] || '';
  }

  getSelectedFile(mediaType: string): File | null {
    return this.selectedFiles[mediaType.toLowerCase()] || null;
  }

  private validateFile(file: File, mediaType: string): boolean {
    // Size validation
    if (file.size > TemplateConstants.MAX_FILE_SIZE) {
      this.toastService.showToast(
        `File size must be less than 16MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        'error'
      );
      return false;
    }

    // Type validation
    const allowedTypes = TemplateConstants.FILE_TYPES[mediaType.toLowerCase() as keyof typeof TemplateConstants.FILE_TYPES];
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      this.toastService.showToast(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        'error'
      );
      return false;
    }

    return true;
  }
}
