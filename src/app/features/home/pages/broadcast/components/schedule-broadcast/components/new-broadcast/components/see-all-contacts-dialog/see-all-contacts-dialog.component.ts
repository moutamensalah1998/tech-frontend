import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ContactModel } from '../../../../../../../../../../core/models/contact.model';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../../../core/services/translation/translation.service';

export interface SeeAllContactsDialogData {
  contacts: ContactModel[];
}

export interface SeeAllContactsResult {
  updatedContacts: ContactModel[];
}

@Component({
  selector: 'app-see-all-contacts-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, TranslatePipe],
  templateUrl: './see-all-contacts-dialog.component.html',
  styleUrls: ['./see-all-contacts-dialog.component.css']
})
export class SeeAllContactsDialogComponent implements OnInit {
  searchTerm = '';
  filteredContacts: ContactModel[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SeeAllContactsDialogData,
    private dialogRef: MatDialogRef<SeeAllContactsDialogComponent>,
    private translationService: TranslationService
  ) { }

  ngOnInit() {
    this.filteredContacts = [...this.data.contacts];
  }

  onSearchChange(value: string) {
    this.searchTerm = value.toLowerCase().trim();

    if (!this.searchTerm) {
      this.filteredContacts = [...this.data.contacts];
    } else {
      this.filteredContacts = this.data.contacts.filter(contact =>
        contact.name.toLowerCase().includes(this.searchTerm) ||
        contact.phone_number.includes(this.searchTerm) ||
        contact.country_code.includes(this.searchTerm)
      );
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.onSearchChange('');
  }

  removeContact(contact: ContactModel) {
    const message = this.translationService.translate('broadcast.create.recipients.seeAll.removeConfirm', { name: contact.name });
    if (!confirm(message)) {
      return;
    }

    const index = this.data.contacts.findIndex(c => c.id === contact.id);
    if (index > -1) {
      this.data.contacts.splice(index, 1);
    }

    const filteredIndex = this.filteredContacts.findIndex(c => c.id === contact.id);
    if (filteredIndex > -1) {
      this.filteredContacts.splice(filteredIndex, 1);
    }

    if (this.data.contacts.length === 0) {
      this.saveChanges();
    }
  }

  getRowNumber(index: number): number {
    if (!this.searchTerm) {
      return index + 1;
    } else {
      const contact = this.filteredContacts[index];
      const originalIndex = this.data.contacts.findIndex(c => c.id === contact.id);
      return originalIndex + 1;
    }
  }

  trackByContactId(index: number, contact: ContactModel): string {
    return contact.id;
  }

  getContactInitials(name: string): string {
    if (!name) return '?';

    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  saveChanges() {
    const result: SeeAllContactsResult = {
      updatedContacts: [...this.data.contacts]
    };
    this.dialogRef.close(result);
  }

  closeDialog() {
    const result: SeeAllContactsResult = {
      updatedContacts: [...this.data.contacts]
    };
    this.dialogRef.close(result);
  }
}
