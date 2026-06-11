import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactTableComponent } from "./components/contact-table/contact-table.component";
import { PaginationComponent } from "../../../../shared/components/pagination/pagination.component";
import { EditContactDialogComponent } from "./components/edit-contact-dialog/edit-contact-dialog.component";
import { ContactModel } from '../../../../core/models/contact.model';
import { Store } from '@ngrx/store';
import { getContacts } from '../../../../core/services/contact/ngrx/contact.actions';
import { ContactHeaderAddContactDialogComponent } from "./components/contact-header/components/contact-header-add-contact-dialog/contact-header-add-contact-dialog.component";
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ContactTableComponent,
    PaginationComponent,
    EditContactDialogComponent,
    ContactHeaderAddContactDialogComponent,
    TranslatePipe
  ],
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.css']
})
export class ContactsComponent implements OnInit {
  contact: ContactModel | null = null;
  editContactDialog = false;
  addContactDialog = false;
  sortBy: string | null = "";
  searchTerm = '';
  currentPage = 1;
  limit = 5;
  paginationData?: { totalCount: number; totalPages: number; currentPage: number; limit: number; };

  constructor(private store: Store<any>) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  private loadContacts() {
    this.store.dispatch(getContacts({
      page: this.currentPage,
      limit: this.limit,
      searchTerm: this.searchTerm || '',
      sort: (this.sortBy && this.sortBy.trim() !== '') ? this.sortBy : undefined
    }));
  }

  // Add contact dialog handlers
  openAddContact() {
    this.addContactDialog = true;
  }

  closeAddContact() {
    this.addContactDialog = false;
  }

  // Edit contact dialog handlers
  openEditContact(contact: ContactModel | null = null) {
    this.contact = contact;
    this.editContactDialog = true;
  }

  closeEditContact() {
    this.contact = null;
    this.editContactDialog = false;
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.currentPage = 1;
    this.loadContacts();
  }

  paginationChangeHandler(paginationData: { totalCount: number; totalPages: number; currentPage: number; limit: number; }) {
    this.paginationData = paginationData;
    this.currentPage = paginationData.currentPage;
    this.limit = paginationData.limit;
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.loadContacts();
  }

  onLimitChange(newLimit: number) {
    this.limit = newLimit;
    this.currentPage = 1;
    this.loadContacts();
  }

  onEditContact(contact: ContactModel | null = null) {
    this.openEditContact(contact);
  }

  onContactUpdated(): void {
  this.loadContacts();
}

  onSortChange(sortBy: string | null) {
    this.sortBy = sortBy;
    this.currentPage = 1;
    this.loadContacts();
  }
}
