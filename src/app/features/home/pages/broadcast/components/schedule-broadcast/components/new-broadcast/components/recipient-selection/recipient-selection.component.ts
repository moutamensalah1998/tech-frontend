import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { ContactModel } from '../../../../../../../../../../core/models/contact.model';
import { ContactProgressBarComponent } from "../contact-progress-bar/contact-progress-bar.component";
import { ImportResultDialogComponent, ImportResultData } from '../import-result-dialog/import-result-dialog.component';
import { ToastService } from '../../../../../../../../../../core/services/toast-message.service';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../../../core/services/translation/translation.service';

import * as ContactActions from '../../../../../../../../../../core/services/contact/ngrx/contact.actions';
import {
  selectContactState
} from '../../../../../../../../../../core/services/contact/ngrx/contact.selectors';
import { SeeAllContactsDialogComponent } from '../see-all-contacts-dialog/see-all-contacts-dialog.component';

@Component({
  selector: 'app-recipient-selection',
  standalone: true,
  imports: [CommonModule, ContactProgressBarComponent, TranslatePipe],
  templateUrl: './recipient-selection.component.html',
})
export class RecipientSelectionComponent implements OnInit, OnDestroy {
  @Input() selectedContacts: ContactModel[] = [];
  @Output() contactsChanged = new EventEmitter<ContactModel[]>();
  @Output() openContactDialog = new EventEmitter<void>();

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  maxDisplayedContacts = 5;
  isImporting = false;

  private hasInitiatedImport = false;
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private toastService: ToastService,
    private translationService: TranslationService
  ) {
    this.store.select(selectContactState)
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.hasInitiatedImport)
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

  ngOnInit() {
    this.store.dispatch(ContactActions.clearContactBulkUploadState());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.dispatch(ContactActions.clearContactBulkUploadState());
  }

  clearAllContacts() {
    this.contactsChanged.emit([]);
  }

  removeContact(index: number) {
    const newContacts = [...this.selectedContacts];
    newContacts.splice(index, 1);
    this.contactsChanged.emit(newContacts);
  }

  getDisplayedContacts(): ContactModel[] {
    return this.selectedContacts.slice(0, this.maxDisplayedContacts);
  }

  getOriginalIndex(contact: ContactModel): number {
    return this.selectedContacts.findIndex(c => c.id === contact.id);
  }

  getContactInitials(name: string): string {
    if (!name) return '?';

    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  trackByContactId(index: number, contact: ContactModel): string {
    return contact.id;
  }

  openSeeAllDialog() {
    const dialogRef = this.dialog.open(SeeAllContactsDialogComponent, {
      width: '90vw',
      height: '90vh',
      maxWidth: '1200px',
      data: {
        contacts: this.selectedContacts
      },
      panelClass: 'see-all-contacts-dialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.updatedContacts) {
        this.contactsChanged.emit(result.updatedContacts);
      }
    });
  }

  importContacts() {
    if (this.isImporting) {
      this.toastService.showToast(this.translationService.translate('broadcast.create.recipients.messages.importInProgress'), 'info');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.style.display = 'none';

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.handleFileSelection(file);
      }
    };

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }

  private handleFileSelection(file: File) {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      this.toastService.showToast(this.translationService.translate('broadcast.create.recipients.messages.invalidFile'), 'error');
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      this.toastService.showToast(this.translationService.translate('broadcast.create.recipients.messages.fileSizeError'), 'error');
      return;
    }

    this.toastService.showToast(this.translationService.translate('broadcast.create.recipients.messages.uploading'), 'info');

    this.hasInitiatedImport = true;

    this.store.dispatch(ContactActions.contactBulkUpload({ file }));
  }

  private handleImportSuccess(data: any) {
    console.log('Raw server response:', data);

    const importData = data?.data || data;

    const dialogData: ImportResultData = {
      total_processed: importData?.total_processed || 0,
      successful_uploads: importData?.successful_uploads || 0,
      failed_uploads: importData?.failed_uploads || 0,
      list_phone_numbers: importData?.list_phone_numbers || [],
      already_exist_numbers: importData?.already_exist_numbers || [],
      invalid_format_numbers: importData?.invalid_format_numbers || [],
      errors: importData?.errors || [],
      message: importData?.message || 'Import completed'
    };

    console.log('Processed dialog data:', dialogData);

    const dialogRef = this.dialog.open(ImportResultDialogComponent, {
      width: '90vw',
      height: '90vh',
      maxWidth: '1200px',
      data: dialogData,
      panelClass: 'import-result-dialog',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.addToRecipients && (result.phoneNumbers || result.existingNumbers)) {
        const allPhoneNumbers = [
          ...(result.phoneNumbers || []),
          ...(result.existingNumbers || [])
        ];
        this.addPhoneNumbersToRecipients(allPhoneNumbers);
      }

      this.store.dispatch(ContactActions.clearContactBulkUploadState());
    });
  }

  private handleImportError(error: any) {
    console.error('Import error:', error);
    let errorMessage = this.translationService.translate('broadcast.create.recipients.messages.importFailed');

    if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    this.toastService.showToast(errorMessage, 'error');

    this.store.dispatch(ContactActions.clearContactBulkUploadState());
  }

  private addPhoneNumbersToRecipients(phoneNumbers: string[]) {
    const newContacts: ContactModel[] = phoneNumbers.map((phoneNumber, index) => ({
      id: `imported_${Date.now()}_${index}`,
      name: `Contact ${phoneNumber}`,
      country_code: phoneNumber.substring(0, phoneNumber.length - 10),
      phone_number: phoneNumber.substring(phoneNumber.length - 10),
      status: 'valid',
      allow_broadcast: true,
      allow_sms: true,
      tag_links: [],
      attribute_links: []
    }));

    const existingPhoneNumbers = this.selectedContacts.map(c => `${c.country_code}${c.phone_number}`);
    const uniqueNewContacts = newContacts.filter(contact =>
      !existingPhoneNumbers.includes(`${contact.country_code}${contact.phone_number}`)
    );

    if (uniqueNewContacts.length > 0) {
      const updatedContacts = [...this.selectedContacts, ...uniqueNewContacts];

      if (updatedContacts.length > 1000) {
        const contactsToAdd = uniqueNewContacts.slice(0, 1000 - this.selectedContacts.length);
        this.contactsChanged.emit([...this.selectedContacts, ...contactsToAdd]);
        this.toastService.showToast(
          `Added ${contactsToAdd.length} new contacts. ${uniqueNewContacts.length - contactsToAdd.length} contacts were skipped due to the 1000 contact limit.`,
          'info'
        );
      } else {
        this.contactsChanged.emit(updatedContacts);
        this.toastService.showToast(
          this.translationService.translate('broadcast.create.recipients.messages.addedNew', { count: uniqueNewContacts.length }),
          'success'
        );
      }
    } else {
      this.toastService.showToast(this.translationService.translate('broadcast.create.recipients.messages.allNewExists'), 'info');
    }
  }

  private addExistingContactsToRecipients(existingPhoneNumbers: string[]) {
    const existingContacts: ContactModel[] = existingPhoneNumbers.map((phoneNumber, index) => ({
      id: `existing_${Date.now()}_${index}`,
      name: `Contact ${phoneNumber}`,
      country_code: phoneNumber.substring(0, phoneNumber.length - 10),
      phone_number: phoneNumber.substring(phoneNumber.length - 10),
      status: 'valid',
      allow_broadcast: true,
      allow_sms: true,
      tag_links: [],
      attribute_links: []
    }));

    const currentlySelectedNumbers = this.selectedContacts.map(c => `${c.country_code}${c.phone_number}`);
    const contactsToAdd = existingContacts.filter(contact =>
      !currentlySelectedNumbers.includes(`${contact.country_code}${contact.phone_number}`)
    );

    if (contactsToAdd.length > 0) {
      const updatedContacts = [...this.selectedContacts, ...contactsToAdd];

      if (updatedContacts.length > 1000) {
        const finalContactsToAdd = contactsToAdd.slice(0, 1000 - this.selectedContacts.length);
        this.contactsChanged.emit([...this.selectedContacts, ...finalContactsToAdd]);
        this.toastService.showToast(
          `Added ${finalContactsToAdd.length} existing contacts to recipients. ${contactsToAdd.length - finalContactsToAdd.length} contacts were skipped due to the 1000 contact limit.`,
          'info'
        );
      } else {
        this.contactsChanged.emit(updatedContacts);
        this.toastService.showToast(
          this.translationService.translate('broadcast.create.recipients.messages.addedExisting', { count: contactsToAdd.length }),
          'success'
        );
      }
    } else if (existingPhoneNumbers.length > 0) {
      this.toastService.showToast(this.translationService.translate('broadcast.create.recipients.messages.allExistingExists'), 'info');
    }
  }

  downloadSample() {
    const sampleData = [
      ['name', 'phone_number', 'country_code'],
      ['John Doe', '1234567890', '+1'],
      ['Jane Smith', '0987654321', '+1'],
      ['Ahmed Ali', '1122334455', '+20'],
      ['Maria Garcia', '5566778899', '+52']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'contacts_sample.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}
