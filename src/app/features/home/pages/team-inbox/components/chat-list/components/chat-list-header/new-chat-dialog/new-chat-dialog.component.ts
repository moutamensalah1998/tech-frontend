import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MatDialogRef } from '@angular/material/dialog';
import { take, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { getContacts } from '../../../../../../../../../core/services/contact/ngrx/contact.actions';
import { FormValidationUtils } from '../../../../../../../../../utils/form-validation.utils';
import { countries } from '../../../../../../../../../utils/countries';
import { selectContacts, selectLoading, selectPagination } from '../../../../../../../../../core/services/contact/ngrx/contact.selectors';
import { YourTemplateService } from '../../../../../../../../../core/services/broadcast/template/your-template.service';
import { ConversationsService } from '../../../../../../../../../core/services/conversations/conversations.service';
import { WhatsAppTemplate } from '../../../../../../../../../core/models/whatsapp-template.model';
import { TranslatePipe } from '../../../../../../../../../core/pipes/translate.pipe';

export interface TemplateItem {
  template: {
    id: string;
    name: string;
    language: string;
    status: string;
    category: string;
    components: TemplateComponent[];
    [key: string]: any;
  };
  variables: string[];
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: string | null;
  text?: string | null;
  example?: {
    header_handle?: string[];
    header_text_named_params?: Array<{
      param_name: string;
      example: string;
    }>;
    body_text_named_params?: Array<{
      param_name: string;
      example: string;
    }>;
  } | null;
  buttons?: TemplateButton[] | null;
}

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text?: string;
  example?: string;
}

@Component({
  selector: 'app-new-chat-dialog',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, TranslatePipe ],
  templateUrl: './new-chat-dialog.component.html',
  styleUrls: ['./new-chat-dialog.component.css'],
})
export class NewChatDialogComponent implements OnInit {
  contactForm: FormGroup;
  public formUtils = FormValidationUtils;
  public countries = countries;

  contacts$             = this.store.select(selectContacts);
  contactsLoading$      = this.store.select(selectLoading);
  contactsPagination$   = this.store.select(selectPagination);
  showContactsDropdown  = false;
  templates: TemplateItem[] = [];
  templatesLoading = false;
  showTemplatesDropdown = false;
  selectedTemplateItem: TemplateItem | null = null;
  templateVariableValues: {[key: string]: string} = {};
  inputMode: 'contact' | 'phone' = 'contact';

  constructor(
    private store: Store,
    private fb: FormBuilder,
    private templateService: YourTemplateService,
    private conversationsService: ConversationsService,
    private dialogRef: MatDialogRef<NewChatDialogComponent>,
  ) {
    this.contactForm = this.createForm();
  }

  ngOnInit() {
    this.loadContacts(1);
    this.loadTemplates();

    this.contactForm.get('templateId')?.setValidators(Validators.required);
    this.contactForm.get('selectedContactId')?.setValidators(Validators.required);
    this.contactForm.updateValueAndValidity();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      selectedContactCountryCode: [''],
      selectedContactId: [''],
      selectedContactName: [''],
      selectedContactPhone: [''],
      selectedContactCountryId: [''],

      countryCode: [''],
      phoneNumber: [''],

      templateId: [''],
      parameters: this.fb.array([])
    });
  }

  private loadContacts(page: number) {
    this.store.dispatch(getContacts({ page, limit: 10 }));
  }

  private loadTemplates() {
    this.templatesLoading = true;

    this.templateService.getTemplates(1, 50).pipe(
      timeout(10000),
      catchError(error => {
        console.error('Template loading timeout or error:', error);
        return of(null);
      })
    ).subscribe({
      next: (response: any) => {
        if (response === null) {
          console.error('Template loading timeout or error');
          this.templatesLoading = false;
          return;
        }
        if (response.data && Array.isArray(response.data)) {
          this.templates = response.data
            .filter((item: any) => item.template.status === 'APPROVED')
            .map((item: any) => ({
              template: item.template,
              variables: item.variables || []
            } as TemplateItem));
        } else {
          this.templates = [];
        }
        this.templatesLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading templates:', error);
        this.templatesLoading = false;
      }
    });
  }

  setInputMode(mode: 'contact' | 'phone') {
    this.inputMode = mode;

    if (mode === 'contact') {
      this.contactForm.patchValue({ countryCode: '', phoneNumber: '' });
      this.contactForm.get('countryCode')?.clearValidators();
      this.contactForm.get('countryCode')?.updateValueAndValidity();
      this.contactForm.get('phoneNumber')?.clearValidators();
      this.contactForm.get('phoneNumber')?.updateValueAndValidity();

      this.contactForm.get('selectedContactId')?.setValidators(Validators.required);
      this.contactForm.get('selectedContactId')?.updateValueAndValidity();
    } else {
      this.contactForm.patchValue({ selectedContactCountryId: '', selectedContactId: '', selectedContactName: '', selectedContactPhone: '' });
      this.contactForm.get('selectedContactId')?.clearValidators();
      this.contactForm.get('selectedContactId')?.updateValueAndValidity();

      this.contactForm.get('countryCode')?.setValidators(Validators.required);
      this.contactForm.get('countryCode')?.updateValueAndValidity();

      this.contactForm.get('phoneNumber')?.setValidators([Validators.required, Validators.pattern(/^[\d\s\(\)\-\+]+$/)]);
      this.contactForm.get('phoneNumber')?.updateValueAndValidity();
    }

    this.contactForm.get('templateId')?.setValidators(Validators.required);
    this.contactForm.get('templateId')?.updateValueAndValidity();

    this.contactForm.updateValueAndValidity();
  }

  toggleContactsDropdown() {
    this.showContactsDropdown = !this.showContactsDropdown;
  }

  onContactsScroll(event: Event) {
    const el = event.target as HTMLElement;
    const atBottom = Math.abs((el.scrollHeight - el.scrollTop) - el.clientHeight) < 1;
    if (!atBottom) return;

    this.contactsPagination$.pipe(take(1)).subscribe(p => {
      if (p.currentPage < p.totalPages) {
        this.loadContacts(p.currentPage + 1);
      }
    });
  }

  selectContact(contact: any) {
    this.contactForm.patchValue({
      countryCode: contact.country_code,
      selectedContactId: contact.id,
      selectedContactName: contact.name,
      selectedContactPhone: contact.phone_number,
      selectedContactCountryId: contact.country_code || null
    });
    this.showContactsDropdown = false;
  }

  toggleTemplatesDropdown() {
    this.showTemplatesDropdown = !this.showTemplatesDropdown;
  }

  selectTemplate(templateItem: TemplateItem) {
    this.selectedTemplateItem = templateItem;
    this.contactForm.patchValue({
      templateId: templateItem.template.id
    });
    this.contactForm.get('templateId')?.updateValueAndValidity();
    this.templateVariableValues = {};
    templateItem.variables.forEach(variable => {
      this.templateVariableValues[variable] = '';
    });

    this.showTemplatesDropdown = false;
  }

  updateVariableValue(variable: string, value: string) {
    this.templateVariableValues[variable] = value;
  }

  isFormValidWithVariables(): boolean {
    if (!this.contactForm.valid) return false;

    if (!this.selectedTemplateItem) return false;

    if (this.selectedTemplateItem.variables.length > 0) {
      return this.selectedTemplateItem.variables.every(
        variable => this.templateVariableValues[variable]?.trim()
      );
    }

    return true;
  }

  getTemplatePreview(templateItem: TemplateItem): string {
    const text = templateItem.template.components.find(comp => comp.type === 'BODY')?.text;
    if (!text) return '';
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    this.dialogRef.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.template-dropdown-container') && !target.closest('.contact-dropdown-container')) {
      this.showTemplatesDropdown = false;
      this.showContactsDropdown = false;
    }
  }

  onSubmit() {
    if (this.isFormValidWithVariables()) {
      const formValue = this.contactForm.value;

      const payload: any = {
        contact_country_code: formValue.countryCode,
        template_id: formValue.templateId,
        parameters: this.selectedTemplateItem!.variables.map(
          variable => this.templateVariableValues[variable] || ''
        )
      };

      if (this.inputMode === 'contact') {
        payload.contact_phone_number = formValue.selectedContactPhone;
      } else {
        const countryCode = formValue.countryCode;
        const phoneNumber = formValue.phoneNumber.replace(/\D/g, '');
        payload.contact_phone_number = `${countryCode}${phoneNumber}`;
      }

      this.conversationsService.createConversation(payload).subscribe({
        next: (response: any) => {
          this.dialogRef.close(response);
        },
        error: (error: any) => {
          console.error('Error creating conversation:', error);
        }
      });
    } else {
      Object.values(this.contactForm.controls).forEach(c => c.markAsTouched());
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
