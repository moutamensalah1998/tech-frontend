import { Component, EventEmitter, HostListener, Input, Output, OnDestroy, inject } from '@angular/core';
import { ContactModel } from '../../../../../../core/models/contact.model';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ContactService } from '../../../../../../core/services/contact/contact.service';
import { ToastService } from '../../../../../../core/services/toast-message.service';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { ErrorTranslatorService } from '../../../../../../core/error/error-translator.service';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-edit-contact-dialog',
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './edit-contact-dialog.component.html',
  styleUrl: './edit-contact-dialog.component.css'
})
export class EditContactDialogComponent implements OnDestroy {
  private _contact?: ContactModel | null;

  // stable snapshot of the original contact for change detection
  private originalContactSnapshot?: string;

  @Input()
  set contact(value: ContactModel | null | undefined) {
    if (value) {
      // store deep-copied contact locally
      this._contact = this.deepCopyContact(value);
      // create stable snapshot for change detection
      this.originalContactSnapshot = this.stableStringify(this._contact);
    } else {
      this._contact = value;
      this.originalContactSnapshot = undefined;
    }
  }

  get contact(): ContactModel | null | undefined {
    return this._contact;
  }

  @Output() closeDialog = new EventEmitter<void>();
  @Output() contactUpdated = new EventEmitter<ContactModel>();

  isLoading: boolean = false;
  private subscription?: Subscription;
  private isDestroyed = false;
  private translationService = inject(TranslationService);

  constructor(
    private contactService: ContactService,
    private toastService: ToastService,
    private errorTranslator: ErrorTranslatorService
  ) {}

  ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private deepCopyContact(contact: ContactModel): ContactModel {
    return {
      ...contact,
      attribute_links: contact.attribute_links ? contact.attribute_links.map(attr => ({
        ...attr,
        attribute: { ...attr.attribute }
      })) : [],
      tag_links: contact.tag_links ? [...contact.tag_links] : []
    };
  }

  // stable stringify that sorts object keys recursively so comparison is reliable
  private stableStringify(obj: any): string {
    const sort = (v: any): any => {
      if (v === null || typeof v !== 'object') return v;
      if (Array.isArray(v)) return v.map(sort);
      const keys = Object.keys(v).sort();
      const res: any = {};
      for (const k of keys) {
        res[k] = sort(v[k]);
      }
      return res;
    };
    return JSON.stringify(sort(obj));
  }

  // exposed getter used by template to decide whether Save should be enabled
  get hasChanges(): boolean {
    if (!this._contact) return false;
    if (!this.originalContactSnapshot) return true; // defensive: if no snapshot, assume changes
    return this.stableStringify(this._contact) !== this.originalContactSnapshot;
  }

  closeDialogHandler(): void {
    this.closeDialog.emit();
  }

  onAddAttribute(): void {
    if (this.contact && this.contact.attribute_links) {
      this.contact.attribute_links.push({
        attribute: { name: '' },
        value: ''
      });
    }
  }

  onRemoveAttribute(index: number): void {
    if (this.contact && this.contact.attribute_links) {
      this.contact.attribute_links.splice(index, 1);
    }
  }

  onSave(form?: NgForm): void {
    if (!this.contact) {
      this.toastService.showToast('No contact data available', 'error');
      return;
    }

    if (form && form.invalid) {
      try { form.form.markAllAsTouched(); } catch {}
      this.toastService.showToast('Please fix validation errors', 'error');
      return;
    }

    // Additional client-side checks for attributes
    if (this.contact.attribute_links && this.contact.attribute_links.length) {
      for (const attr of this.contact.attribute_links) {
        const name = (attr.attribute && (attr.attribute as any).name) ? String((attr.attribute as any).name).trim() : '';
        const value = attr.value ? String(attr.value).trim() : '';
        if (value && !name) {
          this.toastService.showToast(this.translationService.translate('common.messages.attributeNameRequired'), 'error');
          return;
        }
      }
    }

    if (!this.contact.name || !this.contact.name.toString().trim() || !this.contact.phone_number || !this.contact.phone_number.toString().trim()) {
      this.toastService.showToast('Name and phone number are required', 'error');
      return;
    }

    // prevent saving if nothing changed (safeguard)
    if (!this.hasChanges) {
      this.toastService.showToast('No changes to save', 'info');
      return;
    }

    this.isLoading = true;

    this.subscription = this.contactService.updateContact(this.contact).subscribe({
      next: (response) => {
        if (this.isDestroyed) return;

        this.isLoading = false;
        // update snapshot to current saved state
        this.originalContactSnapshot = this.stableStringify(this._contact);
        this.toastService.showToast('Contact updated successfully', 'success');
        this.contactUpdated.emit(this.contact!);
        this.closeDialogHandler();
      },
      error: (error) => {
        if (this.isDestroyed) return;

        this.isLoading = false;
        console.error('Error updating contact:', error);
        const errorMessage = this.errorTranslator.translateHttpError(error);
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  onPhoneInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (!input) return;
  let cleaned = (input.value || '').replace(/\D+/g, '');

  if (cleaned.length > 9) {
    cleaned = cleaned.slice(0, 9);
  }
  if (this.contact) {
    this.contact.phone_number = cleaned;
  }
  if (input.value !== cleaned) {
    input.value = cleaned;
  }
}

onPhonePaste(event: ClipboardEvent): void {
  event.preventDefault();
  const paste = event.clipboardData?.getData('text') ?? '';
  const cleaned = (paste || '').replace(/\D+/g, '').slice(0, 9);

  if (this.contact) {
    this.contact.phone_number = cleaned;
  }
  const target = event.target as HTMLInputElement | null;
  if (target) {
    target.value = cleaned;
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    this.closeDialogHandler();
  }
}


// import { Component, EventEmitter, HostListener, Input, input, Output, OnDestroy } from '@angular/core';
// import { ContactModel } from '../../../../../../core/models/contact.model';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ContactService } from '../../../../../../core/services/contact/contact.service';
// import { ToastService } from '../../../../../../core/services/toast-message.service';
// import { Subscription } from 'rxjs';

// @Component({
//   selector: 'app-edit-contact-dialog',
//   imports: [CommonModule, FormsModule],
//   templateUrl: './edit-contact-dialog.component.html',
//   styleUrl: './edit-contact-dialog.component.css'
// })
// export class EditContactDialogComponent implements OnDestroy {
//   private _contact?: ContactModel | null;
  
//   @Input() 
//   set contact(value: ContactModel | null | undefined) {
//     if (value) {
//       // Create a deep copy of the contact object to avoid read-only property errors
//       this._contact = this.deepCopyContact(value);
//     } else {
//       this._contact = value;
//     }
//   }
  
//   get contact(): ContactModel | null | undefined {
//     return this._contact;
//   }

//   @Output() closeDialog = new EventEmitter<void>();
//   @Output() contactUpdated = new EventEmitter<ContactModel>();

//   isLoading: boolean = false;
//   private subscription?: Subscription;
//   private isDestroyed = false;

//   constructor(
//     private contactService: ContactService,
//     private toastService: ToastService
//   ) {}

//   ngOnDestroy(): void {
//     this.isDestroyed = true;
//     if (this.subscription) {
//       this.subscription.unsubscribe();
//     }
//   }

//   private deepCopyContact(contact: ContactModel): ContactModel {
//     return {
//       ...contact,
//       attribute_links: contact.attribute_links ? contact.attribute_links.map(attr => ({
//         ...attr,
//         attribute: { ...attr.attribute }
//       })) : [],
//       tag_links: contact.tag_links ? [...contact.tag_links] : []
//     };
//   }

//   closeDialogHandler(): void {
//     this.closeDialog.emit();
//   }

//   onAddAttribute(): void {
//     if (this.contact && this.contact.attribute_links) {
//       this.contact.attribute_links.push({
//         attribute: { name: '' },
//         value: ''
//       });
//     }
//   }

//   onRemoveAttribute(index: number): void {
//     if (this.contact && this.contact.attribute_links) {
//       this.contact.attribute_links.splice(index, 1);
//     }
//   }

//   onSave(): void {
//     if (!this.contact) {
//       this.toastService.showToast('No contact data available', 'error');
//       return;
//     }

//     // Validate required fields
//     if (!this.contact.name || !this.contact.phone_number) {
//       this.toastService.showToast('Name and phone number are required', 'error');
//       return;
//     }

//     this.isLoading = true;

//     this.subscription = this.contactService.updateContact(this.contact).subscribe({
//       next: (response) => {
//         if (this.isDestroyed) return;
        
//         this.isLoading = false;
//         this.toastService.showToast('Contact updated successfully', 'success');
//         this.contactUpdated.emit(this.contact!);
//         this.closeDialogHandler();
//       },
//       error: (error) => {
//         if (this.isDestroyed) return;
        
//         this.isLoading = false;
//         console.error('Error updating contact:', error);
//         console.error('Error details:', error.error);
//         this.toastService.showToast('Failed to update contact. Please try again.', 'error');
//       }
//     });
//   }

//   @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(event: KeyboardEvent) {
//     this.closeDialogHandler();
//   }

// }
