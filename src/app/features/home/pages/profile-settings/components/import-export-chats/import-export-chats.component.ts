import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../../../core/services/toast-message.service';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-import-export-chats',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './import-export-chats.component.html',
  styleUrls: ['./import-export-chats.component.css']
})
export class ImportExportChatsComponent implements OnInit {
  isDragOver = false;
  selectedFile: File | null = null;
  exportStatus = '';
  lastExportTime = '';
  private translationService = inject(TranslationService);

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    // Initialize component
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
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.handleFileSelection(target.files[0]);
    }
  }

  private handleFileSelection(file: File): void {
    // Check if file is a zip file
    if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
      this.selectedFile = file;
      this.toastService.showToast(this.translationService.translate('profile.importExport.fileSelectedSuccessfully', { fileName: file.name }), 'success');
      // Here you would typically upload the file to your backend
    } else {
      this.toastService.showToast(this.translationService.translate('profile.importExport.pleaseSelectValidZip'), 'error');
    }
  }

  startExport(): void {
    // Temporary implementation - just show toast message
    this.toastService.showToast(this.translationService.translate('profile.importExport.exportButtonClicked'), 'info');
  }

  startImport(): void {
    if (!this.selectedFile) {
      this.toastService.showToast(this.translationService.translate('profile.importExport.pleaseSelectFileToImport'), 'error');
      return;
    }
    
    // Simulate import process
    this.toastService.showToast(this.translationService.translate('profile.importExport.importProcessStarted', { fileName: this.selectedFile.name }), 'info');
  }

  downloadExportedFile(): void {
    // Temporary implementation - just show toast message
    this.toastService.showToast(this.translationService.translate('profile.importExport.downloadButtonClicked'), 'info');
  }
} 