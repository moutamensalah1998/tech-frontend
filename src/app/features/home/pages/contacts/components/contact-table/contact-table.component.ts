import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  OnDestroy,
  inject
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { take, takeUntil, filter } from 'rxjs/operators';
import { ContactModel } from '../../../../../../core/models/contact.model';
import { Pagination } from '../../../../../../core/services/contact/ngrx/contact.reducer';
import {
  getContacts,
  deleteContact,
  deleteContactSuccess,
  deleteContactError,
  getContactsError,
  createContactSuccess,
  createContactError
} from '../../../../../../core/services/contact/ngrx/contact.actions';
import {
  selectContacts,
  selectError,
  selectLoading,
  selectPagination
} from '../../../../../../core/services/contact/ngrx/contact.selectors';
import { ConfirmDialogComponent } from '../../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Actions, ofType } from '@ngrx/effects';
import { ToastService } from '../../../../../../core/services/toast-message.service';
import { ContactHeaderAddContactDialogComponent } from "../contact-header/components/contact-header-add-contact-dialog/contact-header-add-contact-dialog.component";
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { ErrorTranslatorService } from '../../../../../../core/error/error-translator.service';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';
import { Role } from '../../../../../../core/models/auth.types';

@Component({
  selector: 'app-contact-table',
  standalone: true,
  imports: [CommonModule, ConfirmDialogComponent, ContactHeaderAddContactDialogComponent, TranslatePipe],
  templateUrl: './contact-table.component.html',
  styleUrls: ['./contact-table.component.css']
})
export class ContactTableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() searchTerm: string = '';
  @Input() currentPage: number = 1;
  @Input() limit: number = 5;
  @Input() sortBy: string | null = null;

  @Output() paginationChange = new EventEmitter<{
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  }>();
  @Output() contactSelected = new EventEmitter<ContactModel>();
  addContactDialog = false;
  contacts$: Observable<ContactModel[]>;
  contactsPagination$: Observable<Pagination>;
  loading$: Observable<boolean>;
  error$: Observable<any | null>;

  deleteDialog: boolean = false;
  contactIdSelected: string = '';
  expandedContactId: string | null = null;

  private destroy$ = new Subject<void>();
  private translationService = inject(TranslationService);
  private currentUser: any = null;

  constructor(
    private store: Store,
    private actions$: Actions,
    private toastService: ToastService,
    private errorTranslator: ErrorTranslatorService,
    private authService: AuthService
  ) {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
    });
    this.contacts$ = this.store.select(selectContacts);
    this.contactsPagination$ = this.store.select(selectPagination);
    this.loading$ = this.store.select(selectLoading);
    this.error$ = this.store.select(selectError);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchTerm'] || changes['currentPage'] || changes['limit'] || changes['sortBy']) {
      this.loadData(this.currentPage);
    }
  }

  ngOnInit() {
    this.loadData(this.currentPage);

    // forward pagination
    this.contactsPagination$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pagination => {
        this.paginationChange.emit({
          totalCount: pagination.totalCount,
          totalPages: pagination.totalPages,
          currentPage: pagination.currentPage,
          limit: pagination.limit
        });
      });

    // show toast for selector-level errors (fallback)
    this.error$
      .pipe(filter(err => !!err), takeUntil(this.destroy$))
      .subscribe(err => {
        const errorMessage = typeof err === 'string' 
          ? this.errorTranslator.translateError(err)
          : this.errorTranslator.translateHttpError(err);
        this.toastService.showToast(errorMessage, 'error');
      });

    // listen to failure actions
    this.actions$
      .pipe(ofType(deleteContactError, getContactsError, createContactError), takeUntil(this.destroy$))
      .subscribe((action: any) => {
        const err = action?.error ?? action?.payload ?? action;
        const errorMessage = typeof err === 'string' 
          ? this.errorTranslator.translateError(err)
          : this.errorTranslator.translateHttpError(err);
        this.toastService.showToast(errorMessage, 'error');
      });

    // listen to success actions
    this.actions$
      .pipe(ofType(deleteContactSuccess, createContactSuccess), takeUntil(this.destroy$))
      .subscribe((action: any) => {
        const payloadMsg = action?.data?.message ?? action?.data?.msg ?? action?.data;
        const message = typeof payloadMsg === 'string' ? payloadMsg : this.translationService.translate('common.messages.operationCompleted');
        this.toastService.showToast(message, 'success');

        if (action.type === deleteContactSuccess.type) {
          this.loadData(this.currentPage);
          this.deleteDialog = false;
          this.contactIdSelected = '';
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(page: number) {
    this.store.dispatch(getContacts({
      page,
      limit: this.limit,
      searchTerm: this.searchTerm,
      sort: this.sortBy ?? null
    }));
  }

  toggleExpanded(contactId: string): void {
    this.expandedContactId = this.expandedContactId === contactId ? null : contactId;
  }

  isCurrentUserAdmin(): boolean {
    if (!this.currentUser?.data?.roles && !this.currentUser?.roles) return false;
    const roles = this.currentUser?.data?.roles || this.currentUser?.roles || [];
    return roles.some((role: any) => role.role_name === Role.ADMINISTRATOR);
  }

  deleteOpenDialog(id: string) {
    if (!this.isCurrentUserAdmin()) {
      this.toastService.showToast(
        this.translationService.translate('contacts.deleteDialog.notAllowed'),
        'error'
      );
      return;
    }
    this.contactIdSelected = id;
    this.deleteDialog = true;
  }

  deleteCloseDialog() {
    this.deleteDialog = false;
    this.contactIdSelected = '';
  }

  deleteContact() {
    if (!this.contactIdSelected) return;

    this.store.dispatch(deleteContact({ id: this.contactIdSelected }));

    // fallback local wait for first result
    this.actions$
      .pipe(ofType(deleteContactSuccess, deleteContactError), take(1))
      .subscribe((action: any) => {
        if (action.type === deleteContactSuccess.type) {
          this.loadData(this.currentPage);
          this.deleteDialog = false;
          this.contactIdSelected = '';
        } else {
          const err = action?.error ?? 'Failed to delete contact';
          const message = typeof err === 'string' ? err : (err?.message ?? 'Failed to delete contact');
          this.toastService.showToast(message, 'error');
        }
      });
  }

  editContact(contact: ContactModel | null = null) {
    this.contactSelected.emit(contact!);
  }

  trackByContactId(index: number, contact: ContactModel): string | number {
    return (contact as any)?.id ?? index;
  }
  getInitials(name: string): string {
    if (!name) return 'NA';
    const normalized = name.trim();
    if (!normalized) return 'NA';
    const names = normalized.split(/\s+/);
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    const first = names[0].charAt(0);
    const last = names[names.length - 1].charAt(0);
    return (first + last).toUpperCase();
  }

  addContactDialogHandler() {
    this.addContactDialog = !this.addContactDialog;
  }
  getAttributeBadgeClass(attributeValue: string | null | undefined): string {
    if (!attributeValue) return 'bg-neutral-bg text-text-primary/70';


    const value = attributeValue.toLowerCase();

    if (value.includes('premium') || value.includes('vip') || value.includes('priority')) {
      return 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary';
    } else if (value.includes('customer') || value.includes('client')) {
      return 'bg-gradient-to-r from-secondary/10 to-primary/10 text-secondary';
    } else if (value.includes('partner') || value.includes('business')) {
      return 'bg-gradient-to-r from-accent/10 to-primary/10 text-accent';
    } else if (value.includes('lead') || value.includes('prospect')) {
      return 'bg-gradient-to-r from-primary/10 to-accent/10 text-primary';
    } else {
      return 'bg-neutral-bg text-text-primary/70';
    }
  }
}


// import { CommonModule } from '@angular/common';
// import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
// import { Store } from '@ngrx/store';
// import { Observable } from 'rxjs';
// import { take } from 'rxjs/operators';
// import { ContactModel } from '../../../../../../core/models/contact.model';
// import { Pagination } from '../../../../../../core/services/contact/ngrx/contact.reducer';
// import { deleteContact, deleteContactSuccess, getContacts } from '../../../../../../core/services/contact/ngrx/contact.actions';
// import { selectContacts, selectError, selectLoading, selectPagination } from '../../../../../../core/services/contact/ngrx/contact.selectors';
// import { ConfirmDialogComponent } from "../../../../../../shared/components/confirm-dialog/confirm-dialog.component";
// import { Actions, ofType } from '@ngrx/effects';

// @Component({
//   selector: 'app-contact-table',
//   standalone: true,
//   imports: [CommonModule, ConfirmDialogComponent],
//   templateUrl: './contact-table.component.html',
//   styleUrls: ['./contact-table.component.css']
// })
// export class ContactTableComponent implements OnInit, OnChanges {
//   @Input() searchTerm: string = '';
//   @Input() currentPage: number = 1;
//   @Input() limit: number = 5;
//   @Input() sortBy: string | null = null;
//   @Output() paginationChange = new EventEmitter<{
//     totalCount: number;
//     totalPages: number;
//     currentPage: number;
//     limit: number;
//   }>();
//   @Output() contactSelected = new EventEmitter<ContactModel>();

//   contacts$: Observable<ContactModel[]>;
//   contactsPagination$: Observable<Pagination>;
//   loading$: Observable<boolean>;
//   error$: Observable<string | null>;

//   deleteDialog: boolean = false;
//   contactIdSelected: string = '';
//   expandedContactId: string | null = null;

//   constructor(private store: Store, private actions$: Actions) {
//     this.contacts$ = this.store.select(selectContacts);
//     this.contactsPagination$ = this.store.select(selectPagination);
//     this.loading$ = this.store.select(selectLoading);
//     this.error$ = this.store.select(selectError);
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['searchTerm'] || changes['currentPage'] || changes['limit'] || changes['sortBy']) {
//       this.loadData(this.currentPage);
//     }
//   }

//   ngOnInit() {
//     this.loadData(this.currentPage);

//     this.contactsPagination$.subscribe(pagination => {
//       this.paginationChange.emit({
//         totalCount: pagination.totalCount,
//         totalPages: pagination.totalPages,
//         currentPage: pagination.currentPage,
//         limit: pagination.limit
//       });
//     });
//   }

//   loadData(page: number) {
//     this.store.dispatch(getContacts({
//       page,
//       limit: this.limit,
//       searchTerm: this.searchTerm,
//       sort: this.sortBy ?? null
//     }));
//   }

//   toggleExpanded(contactId: string): void {
//     this.expandedContactId = this.expandedContactId === contactId ? null : contactId;
//   }

//   deleteOpenDialog(id: string) {
//     this.contactIdSelected = id;
//     this.deleteDialog = true;
//   }

//   deleteCloseDialog() {
//     this.deleteDialog = false;
//     this.contactIdSelected = '';
//   }

//   deleteContact() {
//     if (!this.contactIdSelected) return;

//     this.store.dispatch(deleteContact({ id: this.contactIdSelected }));

//     this.actions$
//       .pipe(ofType(deleteContactSuccess), take(1))
//       .subscribe(() => {
//         this.loadData(this.currentPage);
//         this.deleteDialog = false;
//         this.contactIdSelected = '';
//       });
//   }

//   editContact(contact: ContactModel | null = null) {
//     this.contactSelected.emit(contact!);
//   }

//   // Helper method to get initials from name
//   getInitials(name: string): string {
//     if (!name) return 'NA';
//     const names = name.trim().split(' ');
//     if (names.length === 1) {
//       return names[0].substring(0, 2).toUpperCase();
//     }
//     return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
//   }

//   // Helper method to get attribute badge styling
//   getAttributeBadgeClass(attributeValue: string): string {
//     if (!attributeValue) return 'bg-gray-100 text-gray-600';

//     const value = attributeValue.toLowerCase();

//     if (value.includes('premium') || value.includes('vip') || value.includes('priority')) {
//       return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800';
//     } else if (value.includes('customer') || value.includes('client')) {
//       return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800';
//     } else if (value.includes('partner') || value.includes('business')) {
//       return 'bg-gradient-to-r from-green-100 to-teal-100 text-green-800';
//     } else if (value.includes('lead') || value.includes('prospect')) {
//       return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800';
//     } else {
//       return 'bg-gray-100 text-gray-600';
//     }
//   }
// }
