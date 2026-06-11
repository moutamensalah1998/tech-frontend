import { Injectable } from '@angular/core';
import { uuidv7 } from 'uuidv7';

export interface FilePreview {
  file: File;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  caption: string;
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilePreviewService {

  createFilePreview(file: File): FilePreview {
    return {
      file,
      type: this.getFileType(file),
      url: URL.createObjectURL(file),
      caption: '',
      id: uuidv7()
    };
  }

  private getFileType(file: File): 'image' | 'video' | 'audio' | 'document' {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  }

  getFileSize(file: File): string {
    const bytes = file.size;
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFilePreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  revokeFilePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  updateFileCaption(previews: FilePreview[], previewId: string, caption: string): FilePreview[] {
    return previews.map(preview =>
      preview.id === previewId ? { ...preview, caption } : preview
    );
  }

  removeFilePreview(previews: FilePreview[], previewId: string): FilePreview[] {
    const index = previews.findIndex(p => p.id === previewId);
    if (index !== -1) {
      this.revokeFilePreviewUrl(previews[index].url);
      return previews.filter(p => p.id !== previewId);
    }
    return previews;
  }

  clearAllPreviews(previews: FilePreview[]): void {
    previews.forEach(preview => {
      this.revokeFilePreviewUrl(preview.url);
    });
  }
}
