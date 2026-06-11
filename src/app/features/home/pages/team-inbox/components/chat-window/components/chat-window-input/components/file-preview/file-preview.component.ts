import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilePreview, FilePreviewService } from '../../services/file-preview.service';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-preview.component.html',
})
export class FilePreviewComponent {
  @Input() filePreviews: FilePreview[] = [];
  @Output() fileRemoved = new EventEmitter<string>();
  @Output() captionUpdated = new EventEmitter<{ id: string; caption: string }>();
  @Output() sendAllFiles = new EventEmitter<void>();
  @Output() clearAllFiles = new EventEmitter<void>();

  constructor(public filePreviewService: FilePreviewService) {}

  removeFile(previewId: string): void {
    this.fileRemoved.emit(previewId);
  }

  updateCaption(previewId: string, caption: string): void {
    this.captionUpdated.emit({ id: previewId, caption });
  }

  sendAll(): void {
    this.sendAllFiles.emit();
  }

  clearAll(): void {
    this.clearAllFiles.emit();
  }
}

