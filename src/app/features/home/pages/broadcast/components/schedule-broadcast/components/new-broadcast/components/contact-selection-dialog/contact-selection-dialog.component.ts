import { Component, Inject, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, map, take } from 'rxjs/operators';

import * as ContactActions from '../../../../../../../../../../core/services/contact/ngrx/contact.actions';
import {
  selectContacts,
  selectLoading as selectContactLoading,
  selectPagination
} from '../../../../../../../../../../core/services/contact/ngrx/contact.selectors';
import { ContactModel } from '../../../../../../../../../../core/models/contact.model';
import { ProgressBarComponent } from "../progress-bar/progress-bar.component";
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';

export interface ContactSelectionDialogData {
  selectedContacts: string[];
}

export interface ContactSelectionResult {
  selectedContacts: string[];
  selectedContactObjects: ContactModel[];
}

@Component({
  selector: 'app-contact-selection-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ProgressBarComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-selection-dialog.component.html',
  styleUrls: ['./contact-selection-dialog.component.css']
})
export class ContactSelectionDialogComponent implements OnInit, OnDestroy {
  contacts$: Observable<ContactModel[]>;
  contactLoading$: Observable<boolean>;
  pagination$: Observable<any>;

  selectedContactIds: string[] = [];
  selectedContactsCache: Map<string, ContactModel> = new Map();
  searchTerm = '';
  currentPage = 1;
  limit = 10;

  private destroy$ = new Subject<void>();
  private searchSubject = new BehaviorSubject<string>('');

  Math = Math;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ContactSelectionDialogData,
    private dialogRef: MatDialogRef<ContactSelectionDialogComponent>,
    private store: Store
  ) {
    this.contacts$ = this.store.select(selectContacts);
    this.contactLoading$ = this.store.select(selectContactLoading);
    this.pagination$ = this.store.select(selectPagination);

    this.selectedContactIds = [...(data.selectedContacts || [])];
  }

  ngOnInit() {
    this.loadContacts();
    this.setupSearchDebouncing();
    this.cacheInitialSelectedContacts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebouncing() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.currentPage = 1;
      this.loadContacts(searchTerm);
    });
  }

  private cacheInitialSelectedContacts() {
    if (this.selectedContactIds.length > 0) {
    }
  }

  loadContacts(searchTerm: string = '') {
    this.store.dispatch(ContactActions.getContacts({
      page: this.currentPage,
      limit: this.limit,
      searchTerm: searchTerm || undefined
    }));
  }

  onSearchChange(value: string) {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  clearSearch() {
    this.searchTerm = '';
    this.onSearchChange('');
  }

  toggleContact(contact: ContactModel) {
    const index = this.selectedContactIds.indexOf(contact.id);

    if (index > -1) {
      this.selectedContactIds.splice(index, 1);
      this.selectedContactsCache.delete(contact.id);
    } else {
      if (this.selectedContactIds.length < 1000) {
        this.selectedContactIds.push(contact.id);
        this.selectedContactsCache.set(contact.id, contact);
      }
    }
  }

  isContactSelected(contactId: string): boolean {
    return this.selectedContactIds.includes(contactId);
  }

  areAllVisibleContactsSelected(): boolean {
    let result = false;
    this.contacts$.pipe(take(1)).subscribe(contacts => {
      if (contacts && contacts.length > 0) {
        result = contacts.every(contact => this.isContactSelected(contact.id));
      }
    });
    return result;
  }

  isIndeterminate(): boolean {
    let result = false;
    this.contacts$.pipe(take(1)).subscribe(contacts => {
      if (contacts && contacts.length > 0) {
        const selectedCount = contacts.filter(contact => this.isContactSelected(contact.id)).length;
        result = selectedCount > 0 && selectedCount < contacts.length;
      }
    });
    return result;
  }

  onSelectAllVisible(event: Event) {
    const target = event.target as HTMLInputElement;

    this.contacts$.pipe(take(1)).subscribe(contacts => {
      if (!contacts) return;

      if (target.checked) {
        contacts.forEach(contact => {
          if (!this.isContactSelected(contact.id) && this.selectedContactIds.length < 1000) {
            this.selectedContactIds.push(contact.id);
            this.selectedContactsCache.set(contact.id, contact);
          }
        });
      } else {
        const visibleContactIds = contacts.map(c => c.id);
        this.selectedContactIds = this.selectedContactIds.filter(id => {
          const shouldRemove = visibleContactIds.includes(id);
          if (shouldRemove) {
            this.selectedContactsCache.delete(id);
          }
          return !shouldRemove;
        });
      }
    });
  }

  goToPage(page: number) {
    if (page < 1) return;

    this.pagination$.pipe(take(1)).subscribe(pagination => {
      if (page > pagination.totalPages) return;

      this.currentPage = page;
      this.loadContacts(this.searchTerm);
    });
  }

  getVisiblePages(pagination: any): number[] {
    const totalPages = pagination.totalPages;
    const currentPage = pagination.currentPage;
    const pages: number[] = [];

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
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

  confirmSelection() {
    const selectedContactObjects = Array.from(this.selectedContactsCache.values());

    const result: ContactSelectionResult = {
      selectedContacts: this.selectedContactIds,
      selectedContactObjects: selectedContactObjects
    };

    this.dialogRef.close(result);
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
