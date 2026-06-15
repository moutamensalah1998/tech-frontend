import { Component, EventEmitter, Output, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, filter } from 'rxjs';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';
import { ToastService } from '../../../../../../core/services/toast-message.service';
import * as ContactActions from '../../../../../../core/services/contact/ngrx/contact.actions';
import { selectContactState } from '../../../../../../core/services/contact/ngrx/contact.selectors';

@Component({
  selector: 'app-import-contacts-dialog',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './import-contacts-dialog.component.html',
  styleUrls: ['./import-contacts-dialog.component.css'],
})
export class ImportContactsDialogComponent implements OnDestroy {
  @Output() closeDialog = new EventEmitter<void>();
  @Output() importCompleted = new EventEmitter<void>();
  @ViewChild('fileInput', { static: false }) fileInputRef!: ElementRef<HTMLInputElement>;

  isImporting = false;
  importResult: any = null;
  showResults = false;
  selectedFile: File | null = null;

  private hasInitiatedImport = false;
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private translationService: TranslationService,
    private toastService: ToastService,
  ) {
    this.store.select(selectContactState)
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.hasInitiatedImport),
      )
      .subscribe(state => {
        this.isImporting = state.contactBulkUploadLoading;

        if (state.contactBulkUploadData && !state.contactBulkUploadLoading && !state.contactBulkUploadError) {
          this.handleImportSuccess(state.contactBulkUploadData);
          this.hasInitiatedImport = false;
        }

        if (state.contactBulkUploadError && !state.contactBulkUploadLoading) {
          this.handleImportError(state.contactBulkUploadError);
          this.hasInitiatedImport = false;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.dispatch(ContactActions.clearContactBulkUploadState());
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowedExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        this.toastService.showToast(
          this.translationService.translate('contacts.import.invalidFile'),
          'error'
        );
        return;
      }

      const maxSizeInBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        this.toastService.showToast(
          this.translationService.translate('contacts.import.fileTooLarge'),
          'error'
        );
        return;
      }

      this.selectedFile = file;
    }
  }

  startImport() {
    if (!this.selectedFile || this.isImporting) return;

    this.hasInitiatedImport = true;
    this.store.dispatch(ContactActions.contactBulkUpload({ file: this.selectedFile }));
  }

  private handleImportSuccess(data: any) {
    const importData = data?.data || data;
    this.importResult = {
      total_processed: importData?.total_processed || 0,
      successful_uploads: importData?.successful_uploads || 0,
      failed_uploads: importData?.failed_uploads || 0,
      list_phone_numbers: importData?.list_phone_numbers || [],
      already_exist_numbers: importData?.already_exist_numbers || [],
      invalid_format_numbers: importData?.invalid_format_numbers || [],
      errors: importData?.errors || [],
      message: importData?.message || 'Import completed',
    };
    this.showResults = true;

    if (this.importResult.successful_uploads > 0) {
      this.toastService.showToast(this.importResult.message, 'success');
      this.importCompleted.emit();
    } else {
      this.toastService.showToast(this.importResult.message, 'info');
    }
  }

  private handleImportError(error: any) {
    let errorMessage = this.translationService.translate('contacts.import.importFailed');
    if (error?.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    this.toastService.showToast(errorMessage, 'error');
    this.store.dispatch(ContactActions.clearContactBulkUploadState());
  }

  close() {
    this.store.dispatch(ContactActions.clearContactBulkUploadState());
    this.closeDialog.emit();
  }

  downloadSample(): void {
    const sampleData = [
      ['name', 'country_code', 'phone_number', 'tags', 'attributes'],
      ['John Doe', '+1', '1234567890', 'vip, customer', 'email:john@example.com; city:New York'],
      ['Jane Smith', '+1', '0987654321', 'lead', 'source:website'],
      ['Ahmed Ali', '+20', '1122334455', 'partner', 'company:TechCo; role:CTO'],
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'contacts_import_sample.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.importResult = null;
    this.showResults = false;
  }

  closeResults(): void {
    this.importResult = null;
    this.showResults = false;
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}