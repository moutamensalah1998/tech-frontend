import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

export interface MediaDownloadResult {
  success: boolean;
  base64Data?: string;
  mimeType?: string;
  fileName?: string;
  size?: number;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  thumbnailUrl?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MediaDownloadService {

  private readonly MEDIA_TYPE_MAP: Record<string, 'image' | 'video' | 'audio' | 'document'> = {
    // Images
    'image/jpeg': 'image', 'image/jpg': 'image', 'image/png': 'image',
    'image/gif': 'image', 'image/webp': 'image', 'image/svg+xml': 'image',

    // Videos
    'video/mp4': 'video', 'video/webm': 'video', 'video/ogg': 'video',
    'video/avi': 'video', 'video/mov': 'video', 'video/wmv': 'video',

    // Audio
    'audio/mp3': 'audio', 'audio/mpeg': 'audio', 'audio/wav': 'audio',
    'audio/ogg': 'audio', 'audio/m4a': 'audio', 'audio/aac': 'audio',

    // Documents
    'application/pdf': 'document', 'application/msword': 'document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
    'application/vnd.ms-excel': 'document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
    'application/vnd.ms-powerpoint': 'document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document',
    'text/plain': 'document', 'text/csv': 'document'
  };


  constructor(private http: HttpClient) { }

  downloadAndConvertToBase64(mediaUrl: string, fileName?: string, expectedMimeType?: string): Observable<MediaDownloadResult> {
    if (!mediaUrl) {
      return of({
        success: false,
        error: 'No media URL provided'
      });
    }

    return this.http.get(mediaUrl, {
      responseType: 'blob',
      headers: {
        'Accept': '*/*'
      }
    }).pipe(
      switchMap((blob: Blob) => {
        let actualMimeType = blob.type;

        if (!actualMimeType || actualMimeType === 'binary/octet-stream' || actualMimeType === 'application/octet-stream') {
          actualMimeType = expectedMimeType || this.guessMimeTypeFromUrl(mediaUrl);
        }

        if (!actualMimeType || actualMimeType === 'binary/octet-stream' || actualMimeType === 'application/octet-stream') {
          actualMimeType = this.guessMimeTypeFromUrl(mediaUrl);
        }

        const mediaType = this.getMediaTypeFromMimeType(actualMimeType);
        const finalFileName = fileName || this.extractFileNameFromUrl(mediaUrl, actualMimeType);

        return from(this.convertBlobToBase64(blob, finalFileName, actualMimeType, mediaType));
      }),
      catchError((error) => {
        return of({
          success: false,
          error: `Failed to download media: ${error.message || 'Unknown error'}`
        });
      })
    );
  }

  downloadMultipleMedia(mediaUrls: string[]): Observable<MediaDownloadResult[]> {
    const downloads = mediaUrls.map(url => this.downloadAndConvertToBase64(url));

    return from(Promise.allSettled(downloads.map(obs => obs.toPromise()))).pipe(
      map(results => results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value!;
        } else {
          return {
            success: false,
            error: `Failed to download media ${index + 1}: ${result.reason}`
          };
        }
      }))
    );
  }

  private async convertBlobToBase64(
    blob: Blob,
    fileName: string,
    mimeType: string,
    mediaType: 'image' | 'video' | 'audio' | 'document'
  ): Promise<MediaDownloadResult> {
    try {
      return new Promise(async (resolve) => {
        const reader = new FileReader();

        reader.onload = async () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];

          const downloadResult: MediaDownloadResult = {
            success: true,
            base64Data,
            mimeType,
            fileName,
            size: blob.size,
            mediaType
          };

          if (mediaType === 'video') {
            try {
              downloadResult.thumbnailUrl = await this.generateVideoThumbnail(result);
            } catch (error) {
            }
          }

          resolve(downloadResult);
        };

        reader.onerror = () => {
          resolve({
            success: false,
            error: `Failed to convert ${mediaType} to base64`
          });
        };

        reader.readAsDataURL(blob);
      });
    } catch (error) {
      return {
        success: false,
        error: `Conversion error: ${error}`
      };
    }
  }

  private getMediaTypeFromMimeType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
    const mediaType = this.MEDIA_TYPE_MAP[mimeType.toLowerCase()];
    if (mediaType) {
      return mediaType as 'image' | 'video' | 'audio' | 'document';
    }

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';

    return 'document';
  }

  private guessMimeTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();

    const extensionMap: { [key: string]: string } = {
      // Images
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
      'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml',

      // Videos
      'mp4': 'video/mp4', 'webm': 'video/webm', 'ogg': 'video/ogg',
      'avi': 'video/avi', 'mov': 'video/mov', 'wmv': 'video/wmv',

      // Audio
      'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'm4a': 'audio/m4a',

      // Documents
      'pdf': 'application/pdf', 'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'csv': 'text/csv'
    };

    return extensionMap[extension || ''] || 'application/octet-stream';
  }

  private extractFileNameFromUrl(url: string, mimeType?: string): string {
    try {
      const urlPath = new URL(url).pathname;
      let fileName = urlPath.split('/').pop() || 'downloaded-file';

      if (!fileName.includes('.') && mimeType) {
        const extension = this.getExtensionFromMimeType(mimeType);
        fileName = `${fileName}.${extension}`;
      }

      return fileName;
    } catch {
      const timestamp = Date.now();
      const extension = mimeType ? this.getExtensionFromMimeType(mimeType) : 'bin';
      return `downloaded-file-${timestamp}.${extension}`;
    }
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const extensionMap: { [key: string]: string } = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
      'image/webp': 'webp', 'image/svg+xml': 'svg',
      'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogg',
      'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/m4a': 'm4a',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };

    return extensionMap[mimeType.toLowerCase()] || 'bin';
  }

  private generateVideoThumbnail(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration * 0.1);
      };

      video.onseeked = () => {
        try {
          const { width, height } = this.calculateThumbnailDimensions(
            video.videoWidth,
            video.videoHeight,
            150,
            150
          );

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(video, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', 0.7));
          URL.revokeObjectURL(video.src);
        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video for thumbnail'));
      };

      setTimeout(() => {
        if (video.readyState < 2) {
          reject(new Error('Video thumbnail generation timeout'));
        }
      }, 10000);

      video.preload = 'metadata';
      video.src = dataUrl;
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

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  checkMediaAccessibility(mediaUrl: string): Observable<boolean> {
    return this.http.head(mediaUrl, { observe: 'response' }).pipe(
      map(response => response.status === 200),
      catchError(() => of(false))
    );
  }

  getMediaSize(mediaUrl: string): Observable<number> {
    return this.http.head(mediaUrl, { observe: 'response' }).pipe(
      map(response => {
        const contentLength = response.headers.get('content-length');
        return contentLength ? parseInt(contentLength, 10) : 0;
      }),
      catchError(() => of(0))
    );
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  validateMedia(file: { size: number; mimeType: string; mediaType: string }): {
    isValid: boolean;
    errors: string[]
  } {
    const errors: string[] = [];
    const maxSizes = {
      image: 5 * 1024 * 1024,   // 5MB
      video: 15 * 1024 * 1024,  // 15MB
      audio: 5 * 1024 * 1024,   // 5MB
      document: 10 * 1024 * 1024  // 10MB
    };

    const maxSize = maxSizes[file.mediaType as keyof typeof maxSizes] || maxSizes.document;

    if (file.size > maxSize) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)}) for ${file.mediaType} files`);
    }

    if (!this.MEDIA_TYPE_MAP[file.mimeType.toLowerCase()]) {
      errors.push(`Unsupported media type: ${file.mimeType}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
