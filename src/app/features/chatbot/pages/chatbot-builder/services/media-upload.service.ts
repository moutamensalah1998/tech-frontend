// services/media-upload.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface MediaUploadResult {
  fileName: string;
  mimeType: string;
  base64Data: string;
  size: number;
  previewUrl?: string;
  thumbnailUrl?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MediaUploadService {
  private uploadProgress = new BehaviorSubject<Map<string, UploadProgress>>(new Map());

  uploadProgress$ = this.uploadProgress.asObservable();

  private readonly MAX_SIZES = {
    image: 5,
    video: 15,
    audio: 5,
    document: 10
  };

  private readonly SUPPORTED_TYPES = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi'],
    audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
    document: [
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ]
  };

  async convertFileToBase64(file: File, mediaType: 'image' | 'video' | 'audio' | 'document'): Promise<MediaUploadResult> {
    return new Promise((resolve, reject) => {
      const validation = this.validateFile(file, mediaType);
      if (!validation.isValid) {
        reject(new Error(validation.error));
        return;
      }

      const uploadId = this.generateUploadId();
      this.updateProgress(uploadId, {
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      });

      const reader = new FileReader();

      reader.onloadstart = () => {
        this.updateProgress(uploadId, {
          fileName: file.name,
          progress: 0,
          status: 'uploading'
        });
      };

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 70); // 70% for reading
          this.updateProgress(uploadId, {
            fileName: file.name,
            progress,
            status: 'uploading'
          });
        }
      };

      reader.onload = async (event) => {
        try {
          this.updateProgress(uploadId, {
            fileName: file.name,
            progress: 80,
            status: 'processing'
          });

          const result = event.target?.result as string;
          if (!result) {
            throw new Error('Failed to read file');
          }
          const base64Data = result.split(',')[1];

          const uploadResult: MediaUploadResult = {
            fileName: file.name,
            mimeType: file.type,
            base64Data,
            size: file.size
          };

          if (mediaType === 'image') {
            uploadResult.previewUrl = result;
            uploadResult.thumbnailUrl = await this.generateImageThumbnail(result);
          } else if (mediaType === 'video') {
            uploadResult.thumbnailUrl = await this.generateVideoThumbnail(file);
          }

          this.updateProgress(uploadId, {
            fileName: file.name,
            progress: 100,
            status: 'complete'
          });

          setTimeout(() => this.clearProgress(uploadId), 2000);

          resolve(uploadResult);
        } catch (error) {
          this.updateProgress(uploadId, {
            fileName: file.name,
            progress: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Processing failed'
          });
          reject(error);
        }
      };

      reader.onerror = () => {
        const error = new Error('Failed to read file');
        this.updateProgress(uploadId, {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: error.message
        });
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  }

  private validateFile(file: File, mediaType: 'image' | 'video' | 'audio' | 'document'): { isValid: boolean; error?: string } {
    const maxSizeMB = this.MAX_SIZES[mediaType];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size exceeds ${maxSizeMB}MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      };
    }

    const supportedTypes = this.SUPPORTED_TYPES[mediaType];
    if (!supportedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Unsupported file type: ${file.type}. Supported types: ${supportedTypes.join(', ')}`
      };
    }

    return { isValid: true };
  }

  private async generateImageThumbnail(dataUrl: string, maxWidth = 150, maxHeight = 150): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        const { width, height } = this.calculateThumbnailDimensions(
          img.width, img.height, maxWidth, maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
      img.src = dataUrl;
    });
  }

  private async generateVideoThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration * 0.1);
      };

      video.onseeked = () => {
        const { width, height } = this.calculateThumbnailDimensions(
          video.videoWidth, video.videoHeight, 150, 150
        );

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video for thumbnail'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  private calculateThumbnailDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  base64ToBlob(base64: string, mimeType: string): Blob {
    const byteString = atob(base64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: mimeType });
  }

  createObjectUrlFromBase64(base64: string, mimeType: string): string {
    const blob = this.base64ToBlob(base64, mimeType);
    return URL.createObjectURL(blob);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getMediaTypeFromMime(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateProgress(uploadId: string, progress: UploadProgress): void {
    const current = this.uploadProgress.value;
    current.set(uploadId, progress);
    this.uploadProgress.next(new Map(current));
  }

  private clearProgress(uploadId: string): void {
    const current = this.uploadProgress.value;
    current.delete(uploadId);
    this.uploadProgress.next(new Map(current));
  }

  getCurrentUploads(): Map<string, UploadProgress> {
    return this.uploadProgress.value;
  }

  clearAllProgress(): void {
    this.uploadProgress.next(new Map());
  }
}
