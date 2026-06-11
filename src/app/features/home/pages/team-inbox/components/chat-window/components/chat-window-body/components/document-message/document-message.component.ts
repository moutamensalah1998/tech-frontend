import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMessage } from '../../../../../../../../../../core/models/chat.types';

@Component({
  selector: 'app-document-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-message.component.html',
  styleUrls: ['./document-message.component.css']
})
export class DocumentMessageComponent {
  @Input() message!: BaseMessage;

  getMessageClasses(): string {
    return this.message.is_from_contact
      ? 'border-gray-200'
      : 'border-green-200 bg-green-50';
  }

  getFileName(): string {
    return this.message.content?.filename ||
           this.message.content?.file_name ||
           this.message.content?.name ||
           'Document';
  }

  getFileExtension(): string {
    const fileName = this.getFileName();
    const extension = fileName.split('.').pop();
    return extension?.toUpperCase() || 'FILE';
  }

  getFileType(): string {
    const mimeType = this.message.content?.mime_type || this.message.content?.content_type || '';
    const extension = this.getFileExtension().toLowerCase();

    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    }

    if (mimeType.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
      return 'video';
    }

    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
      return 'audio';
    }

    if (mimeType.includes('pdf') || extension === 'pdf') {
      return 'pdf';
    }

    return 'document';
  }

  getFileSize(): string {
    const size = this.message.content?.file_size || this.message.content?.size;

    if (!size) return '';

    const bytes = parseInt(size);
    if (isNaN(bytes)) return '';

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  getDownloadUrl(): string {
    return this.message.content?.cdn_url ||
           this.message.content?.url ||
           '#';
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
