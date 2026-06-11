
import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, Subject } from 'rxjs';
import { map, shareReplay, take, takeUntil } from 'rxjs/operators';
import { Actions, ofType } from '@ngrx/effects';

import { getAttributes } from '../../../../../../../../core/services/attributes/ngrx/attributes.actions';
import { selectAttributesList, selectAttributesLoading, selectAttributesPagination } from '../../../../../../../../core/services/attributes/ngrx/attributes.selectors';
import { Attribute } from '../../../../../../../../core/models/attribute.model';
import { PaginationData } from '../../../../../../../../core/models/pagination.model';
import { countries } from '../../../../../../../../utils/countries';
import { createContact, createContactSuccess, getContacts } from '../../../../../../../../core/services/contact/ngrx/contact.actions';
import { selectPagination as selectContactsPagination } from '../../../../../../../../core/services/contact/ngrx/contact.selectors';

import { CreateContactFormService } from './create-contact-form.service';
import { FormValidationUtils } from '../../../../../../../../utils/form-validation.utils';
import { ContactModel } from '../../../../../../../../core/models/contact.model';
import { AttributeItemComponent } from '../attribute-item/attribute-item.component';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';


@Component({
  selector: 'app-contact-header-add-contact-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AttributeItemComponent, TranslatePipe],
  templateUrl: './contact-header-add-contact-dialog.component.html',
  styleUrls: ['./contact-header-add-contact-dialog.component.css']
})
export class ContactHeaderAddContactDialogComponent implements OnInit, OnDestroy {
  @Output() closeDialog = new EventEmitter<void>();
  @Output() contactCreated = new EventEmitter<ContactModel>();

  contactForm: FormGroup;
  showDropdownMap: { [key: number]: boolean } = {};
  addNewModeMap: { [key: number]: boolean } = {};
  newAttributeNameMap: Record<number, string | undefined> = {};
  countries = countries;

  attributes$: Observable<Attribute[]>;
  pagination$: Observable<PaginationData | null>;
  loading$: Observable<boolean>;
  currentPage = 1;

  public formUtils = FormValidationUtils;

  isSubmitting = false;
  errorMessage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<any>,
    public formService: CreateContactFormService,
    private actions$: Actions
  ) {
    this.contactForm = this.formService.createContactForm();
    this.loading$ = this.store.select(selectAttributesLoading);
    this.pagination$ = this.store.select(selectAttributesPagination);
    this.attributes$ = new Observable<Attribute[]>();
  }

  ngOnInit(): void {
    // if ((this.customAttributes?.length ?? 0) === 0) {
    //   this.addCustomAttribute();
    // }

    this.attributes$ = combineLatest([
      this.store.select(selectAttributesList),
      this.pagination$
    ]).pipe(
      map(([attributes, pagination]) => {
        this.currentPage = this.getPageFromPagination(pagination);
        return attributes ?? [];
      }),
      shareReplay(1),
      takeUntil(this.destroy$)
    );

    this.loadAttributes(1);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getPageFromPagination(pagination: any): number {
    if (!pagination) return 1;
    const v = (pagination as any).page ?? (pagination as any).currentPage ?? (pagination as any).current_page ?? (pagination as any).current ?? 1;
    const n = Number(v);
    return Number.isNaN(n) ? 1 : n;
  }

  private getTotalPagesFromPagination(pagination: any): number {
    if (!pagination) return 1;
    const v = (pagination as any).total_pages ?? (pagination as any).totalPages ?? (pagination as any).total ?? 1;
    const n = Number(v);
    return Number.isNaN(n) ? 1 : n;
  }

  private getLimitFromPagination(pagination: any): number {
    if (!pagination) return 10;
    const v = (pagination as any).limit ?? (pagination as any).per_page ?? (pagination as any).pageSize ?? 10;
    const n = Number(v);
    return Number.isNaN(n) ? 10 : n;
  }

  get customAttributes(): FormArray {
    return this.contactForm.get('customAttributes') as FormArray;
  }

  addCustomAttribute(): void {
    this.formService.addCustomAttribute(this.contactForm);
    const newIndex = this.customAttributes.length - 1;
    this.showDropdownMap[newIndex] = false;
    this.addNewModeMap[newIndex] = false;
    this.newAttributeNameMap[newIndex] = '';
  }

  removeCustomAttribute(index: number): void {
    this.formService.removeCustomAttribute(this.contactForm, index);
    this.updateDropdownMap(index);
    this.updateAddNewModeMap(index);
    this.updateNewAttributeNameMap(index);
  }

  private updateDropdownMap(removedIndex: number): void {
    const updatedMap: { [key: number]: boolean } = {};
    Object.keys(this.showDropdownMap).forEach(key => {
      const numKey = parseInt(key, 10);
      if (numKey < removedIndex) {
        updatedMap[numKey] = this.showDropdownMap[numKey];
      } else if (numKey > removedIndex) {
        updatedMap[numKey - 1] = this.showDropdownMap[numKey];
      }
    });
    this.showDropdownMap = updatedMap;
  }

  private updateAddNewModeMap(removedIndex: number): void {
    const updatedMap: { [key: number]: boolean } = {};
    Object.keys(this.addNewModeMap).forEach(key => {
      const numKey = parseInt(key, 10);
      if (numKey < removedIndex) {
        updatedMap[numKey] = this.addNewModeMap[numKey];
      } else if (numKey > removedIndex) {
        updatedMap[numKey - 1] = this.addNewModeMap[numKey];
      }
    });
    this.addNewModeMap = updatedMap;
  }

  private updateNewAttributeNameMap(removedIndex: number): void {
    const updatedMap: Record<number, string | undefined> = {};
    Object.keys(this.newAttributeNameMap).forEach(key => {
      const numKey = parseInt(key, 10);
      if (numKey < removedIndex) {
        updatedMap[numKey] = this.newAttributeNameMap[numKey];
      } else if (numKey > removedIndex) {
        updatedMap[numKey - 1] = this.newAttributeNameMap[numKey];
      }
    });
    this.newAttributeNameMap = updatedMap;
  }

  toggleDropdown(index: number): void {
    Object.keys(this.showDropdownMap).forEach(key => {
      const k = parseInt(key, 10);
      if (k !== index) {
        this.showDropdownMap[k] = false;
        this.addNewModeMap[k] = false;
      }
    });

    if (this.addNewModeMap[index]) {
      this.showDropdownMap[index] = false;
      return;
    }

    this.showDropdownMap[index] = !this.showDropdownMap[index];

    if (!this.showDropdownMap[index]) {
      this.addNewModeMap[index] = false;
      this.newAttributeNameMap[index] = '';
    }
  }

  enterAddNewMode(index: number): void {
    this.showDropdownMap[index] = false;
    this.addNewModeMap[index] = true;
    this.newAttributeNameMap[index] = '';

    setTimeout(() => {
      const input = document.querySelector(`#inlineNewAttrInput${index}`) as HTMLInputElement | null;
      if (input) {
        input.focus();
        const val = input.value;
        input.value = '';
        input.value = val;
      }
    }, 50);
  }

  exitAddNewMode(index: number): void {
    this.addNewModeMap[index] = false;
    this.newAttributeNameMap[index] = '';
  }

  onNewAttributeNameChange(index: number, value: string): void {
    if (!this.newAttributeNameMap) {
      this.newAttributeNameMap = {};
    }
    this.newAttributeNameMap[index] = value ?? '';
  }

  saveNewAttribute(index: number): void {
    const newName = (this.newAttributeNameMap[index] ?? '').trim();
    if (!newName) {
      return;
    }

    const attributeForm = this.customAttributes.at(index) as FormGroup;
    attributeForm.patchValue({
      attributeId: null,
      attributeName: newName,
      isNewAttribute: true
    });

    if (attributeForm.errors) {
      attributeForm.setErrors(null);
    }

    this.addNewModeMap[index] = false;
    this.newAttributeNameMap[index] = '';
    this.showDropdownMap[index] = false;
  }

  onNewAttributeKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveNewAttribute(index);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.exitAddNewMode(index);
    }
  }

  selectAttribute(attr: Attribute, index: number): void {
    const attributeForm = this.customAttributes.at(index) as FormGroup;
    attributeForm.patchValue({
      attributeId: attr.id,
      attributeName: attr.name,
      isNewAttribute: false
    });
    if (attributeForm.errors) {
      attributeForm.setErrors(null);
    }
    this.showDropdownMap[index] = false;
    this.addNewModeMap[index] = false;
    this.newAttributeNameMap[index] = '';
  }

  loadAttributes(page: number): void {
    this.store.dispatch(getAttributes({
      page,
      limit: 10,
      searchTerm: ''
    }));
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const atBottom = Math.abs((element.scrollHeight - element.scrollTop) - element.clientHeight) < 2;

    if (!atBottom) {
      return;
    }

    combineLatest([this.pagination$.pipe(take(1)), this.loading$.pipe(take(1))])
      .pipe(take(1))
      .subscribe(([pagination, loading]) => {
        const currentPage = this.getPageFromPagination(pagination);
        const totalPages = this.getTotalPagesFromPagination(pagination);

        if (!loading && currentPage < totalPages) {
          this.loadAttributes(currentPage + 1);
        }
      });
  }

  closeDialogHandler(): void {
    this.closeDialog.emit();
  }

  onSubmit(): void {
    if (!this.contactForm.valid || this.isSubmitting) {
      this.markFormGroupTouched(this.contactForm);
      return;
    }

    const formValue = this.contactForm.value;
    this.isSubmitting = true;
    this.errorMessage = null;

    const payload = this.formService.buildPayload(formValue);

    this.store.select(selectContactsPagination).pipe(take(1)).subscribe(pagination => {
      const pageToReload = this.getPageFromPagination(pagination);
      const limitToReload = this.getLimitFromPagination(pagination);
      const currentSearchTerm = (pagination as any)?.searchTerm ?? '';

      this.store.dispatch(createContact({
        ...formValue,
        ...payload
      }));

      this.actions$
        .pipe(
          ofType(createContactSuccess),
          take(1),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (action: any) => {
            const createdContact = this.extractCreatedContactFromAction(action);
            if (createdContact) {
              this.contactCreated.emit(createdContact);
            }

            this.store.dispatch(getContacts({
              page: pageToReload,
              limit: limitToReload,
              searchTerm: currentSearchTerm || ''
            }));

            this.isSubmitting = false;
            this.closeDialogHandler();
          },
          error: (err) => {
            this.isSubmitting = false;
            this.errorMessage = 'An unexpected error occurred.';
          }
        });

    });
  }

  private extractCreatedContactFromAction(action: any): ContactModel | undefined {
    if (!action) return undefined;

    const tries = [
      action?.contact,
      action?.payload?.contact,
      action?.response?.contact,
      action?.response?.data,
      action?.data,
      action?.payload,
      action?.response,
    ];

    for (const t of tries) {
      if (t && typeof t === 'object' && ('id' in t || 'phone_number' in t || 'name' in t)) {
        return t as ContactModel;
      }
    }

    return undefined;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if ((control as any) instanceof FormGroup) {
        this.markFormGroupTouched(control as FormGroup);
      } else if ((control as any) instanceof FormArray) {
        (control as FormArray).controls.forEach(arrayControl => {
          if ((arrayControl as any) instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl as FormGroup);
          }
        });
      }
    });
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(): void {
    this.closeDialogHandler();
  }
}
