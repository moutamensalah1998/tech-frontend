// button.service.ts - FIXED VERSION with better change detection
import { Injectable, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { TemplateConstants } from '../../../../../../../../../core/utils/template-constants';

export interface WebsiteButton {
  text: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class ButtonService {
  // Use BehaviorSubjects for reactive updates
  private websiteButtonsSubject = new BehaviorSubject<WebsiteButton[]>([]);
  private hasPhoneButtonSubject = new BehaviorSubject<boolean>(false);
  private hasCopyButtonSubject = new BehaviorSubject<boolean>(false);
  private hasAuthCopyButtonSubject = new BehaviorSubject<boolean>(false);
  private updateSubject = new BehaviorSubject<number>(0);

  // Public observables
  websiteButtons$ = this.websiteButtonsSubject.asObservable();
  hasPhoneButton$ = this.hasPhoneButtonSubject.asObservable();
  hasCopyButton$ = this.hasCopyButtonSubject.asObservable();
  hasAuthCopyButton$ = this.hasAuthCopyButtonSubject.asObservable();
  updates$ = this.updateSubject.asObservable();

  // Store reference to component's change detector
  private componentCdr?: ChangeDetectorRef;

  // Getter properties for template access
  get websiteButtons(): WebsiteButton[] {
    return this.websiteButtonsSubject.value;
  }

  private setWebsiteButtons(buttons: WebsiteButton[]): void {
    const newButtons = buttons.map(btn => ({ ...btn }));
    this.websiteButtonsSubject.next(newButtons);
    this.triggerUpdate();
  }

  get hasPhoneButton(): boolean {
    return this.hasPhoneButtonSubject.value;
  }

  set hasPhoneButton(value: boolean) {
    if (this.hasPhoneButtonSubject.value !== value) {
      this.hasPhoneButtonSubject.next(value);
      this.triggerUpdate();
    }
  }

  get hasCopyButton(): boolean {
    return this.hasCopyButtonSubject.value;
  }

  set hasCopyButton(value: boolean) {
    if (this.hasCopyButtonSubject.value !== value) {
      this.hasCopyButtonSubject.next(value);
      this.triggerUpdate();
    }
  }

  get hasAuthCopyButton(): boolean {
    return this.hasAuthCopyButtonSubject.value;
  }

  set hasAuthCopyButton(value: boolean) {
    if (this.hasAuthCopyButtonSubject.value !== value) {
      this.hasAuthCopyButtonSubject.next(value);
      this.triggerUpdate();
    }
  }

  get hasWebsiteButtons(): boolean {
    return this.websiteButtons.some(btn => btn.text.trim() && btn.url.trim());
  }

  registerChangeDetector(cdr: ChangeDetectorRef): void {
    this.componentCdr = cdr;
  }

  private triggerUpdate(): void {
    const currentValue = this.updateSubject.value;
    this.updateSubject.next(currentValue + 1);

    // Trigger change detection immediately
    if (this.componentCdr) {
      this.componentCdr.markForCheck();
      this.componentCdr.detectChanges();
    }
  }

  setWebsiteButtonsDirectly(buttons: WebsiteButton[]): void {
    this.setWebsiteButtons(buttons);
  }

  addWebsiteButton(form?: FormGroup): void {
    const category = form?.get('category')?.value?.toUpperCase();

    // Check if website buttons are allowed for this category
    if (category === 'AUTHENTICATION') {
      return; // Not allowed for AUTH
    }

    const currentButtons = this.websiteButtons;
    if (currentButtons.length < 2) {
      const newButtons = [...currentButtons, { text: '', url: '' }];
      this.setWebsiteButtons(newButtons);
    }
  }

  removeWebsiteButton(index: number): void {
    const currentButtons = this.websiteButtons;
    if (index >= 0 && index < currentButtons.length) {
      const newButtons = currentButtons.filter((_, i) => i !== index);
      this.setWebsiteButtons(newButtons);
    }
  }

  updateWebsiteButton(index: number, field: 'text' | 'url', value: string): void {
    const currentButtons = this.websiteButtons;
    if (currentButtons[index]) {
      const newButtons = currentButtons.map((btn, i) =>
        i === index ? { ...btn, [field]: value } : { ...btn }
      );
      this.setWebsiteButtons(newButtons);
    }
  }

  toggleButton(type: 'phone' | 'copy' | 'website' | 'quickReply' | 'authCopy', form: FormGroup): void {
    const category = form.get('category')?.value?.toUpperCase();

    switch (type) {
      case 'phone':
        // Phone buttons not allowed for AUTH
        if (category === 'AUTHENTICATION') {
          this.hasPhoneButton = false;
          form.patchValue({
            callButtonText: '',
            phoneNumber: ''
          });
          return;
        }

        this.hasPhoneButton = !this.hasPhoneButton;
        if (!this.hasPhoneButton) {
          form.patchValue({
            callButtonText: '',
            phoneNumber: ''
          });
        }
        break;

      case 'copy':
        // Copy buttons not allowed for AUTH or UTILITY
        if (category === 'AUTHENTICATION' || category === 'UTILITY') {
          this.hasCopyButton = false;
          form.patchValue({ offerCode: '' });
          return;
        }

        this.hasCopyButton = !this.hasCopyButton;
        if (!this.hasCopyButton) {
          form.patchValue({ offerCode: '' });
        }
        break;

      case 'authCopy':
        // Auth copy button only allowed for AUTH
        if (category === 'AUTHENTICATION') {
          this.hasAuthCopyButton = !this.hasAuthCopyButton;
          if (!this.hasAuthCopyButton) {
            form.patchValue({ authCopyButtonText: '' });
          }
        }
        break;
    }
  }

  // Check if button type is allowed for current category
  isButtonTypeAllowed(type: 'phone' | 'copy' | 'website' | 'quickReply' | 'authCopy', category: string): boolean {
    const upperCategory = category?.toUpperCase();

    switch (upperCategory) {
      case 'AUTHENTICATION':
        return type === 'authCopy'; // Only auth copy button allowed for AUTH

      case 'UTILITY':
        return type !== 'copy'; // All buttons except copy code

      case 'MARKETING':
      default:
        return type !== 'authCopy'; // All buttons allowed except auth copy
    }
  }

  addQuickReply(form: FormGroup): void {
    const category = form.get('category')?.value?.toUpperCase();

    // Quick replies not allowed for AUTH
    if (category === 'AUTHENTICATION') {
      return;
    }

    const quickReplyArray = form.get('quickReplyTexts') as FormArray;
    if (quickReplyArray && quickReplyArray.length < TemplateConstants.MAX_QUICK_REPLIES) {
      const newControl = new FormControl('', [Validators.maxLength(20)]);
      quickReplyArray.push(newControl);

      this.triggerUpdate();
      form.updateValueAndValidity();
      quickReplyArray.updateValueAndValidity();

      // Use setTimeout to ensure form updates are processed
      setTimeout(() => {
        form.markAsDirty();
        this.triggerUpdate();
      }, 0);
    }
  }

  removeQuickReply(index: number, form: FormGroup): void {
    const quickReplyArray = form.get('quickReplyTexts') as FormArray;
    if (quickReplyArray && index >= 0 && index < quickReplyArray.length) {
      quickReplyArray.removeAt(index);

      this.triggerUpdate();
      form.updateValueAndValidity();
      quickReplyArray.updateValueAndValidity();

      // Use setTimeout to ensure form updates are processed
      setTimeout(() => {
        form.markAsDirty();
        this.triggerUpdate();
      }, 0);
    }
  }

  clearAllButtons(form?: FormGroup): void {
    this.setWebsiteButtons([]);
    this.hasPhoneButton = false;
    this.hasCopyButton = false;
    this.hasAuthCopyButton = false;

    if (form) {
      const quickReplyArray = form.get('quickReplyTexts') as FormArray;
      if (quickReplyArray) {
        while (quickReplyArray.length !== 0) {
          quickReplyArray.removeAt(0);
        }
      }
      form.patchValue({
        callButtonText: '',
        phoneNumber: '',
        offerCode: '',
        authCopyButtonText: ''
      });
    }
  }

  clearRestrictedButtons(category: string, form?: FormGroup): void {
    const upperCategory = category?.toUpperCase();

    if (upperCategory === 'AUTHENTICATION') {
      // Clear all buttons except auth copy for AUTH
      this.setWebsiteButtons([]);
      this.hasPhoneButton = false;
      this.hasCopyButton = false;

      if (form) {
        const quickReplyArray = form.get('quickReplyTexts') as FormArray;
        if (quickReplyArray) {
          while (quickReplyArray.length !== 0) {
            quickReplyArray.removeAt(0);
          }
        }
        form.patchValue({
          callButtonText: '',
          phoneNumber: '',
          offerCode: ''
        });
      }
    } else {
      // Clear auth copy button for non-AUTH categories
      this.hasAuthCopyButton = false;
      if (form) {
        form.patchValue({ authCopyButtonText: '' });
      }

      if (upperCategory === 'UTILITY') {
        // Clear only copy code button for UTILITY
        this.hasCopyButton = false;
        if (form) {
          form.patchValue({ offerCode: '' });
        }
      }
    }
  }

  hasAnyButtons(form?: FormGroup): boolean {
    // Check website buttons
    const hasWebsite = this.websiteButtons.some(btn =>
      btn.text.trim() !== '' && btn.url.trim() !== ''
    );

    // Check phone button
    const hasPhone = this.hasPhoneButton &&
      form?.get('callButtonText')?.value?.trim() &&
      form?.get('phoneNumber')?.value?.trim();

    // Check copy button
    const hasCopy = this.hasCopyButton && form?.get('offerCode')?.value?.trim();

    // Check auth copy button
    const hasAuthCopy = this.hasAuthCopyButton && form?.get('authCopyButtonText')?.value?.trim();

    // Check quick replies
    let hasQuickReplies = false;
    if (form) {
      const quickReplyArray = form.get('quickReplyTexts') as FormArray;
      hasQuickReplies = quickReplyArray?.length > 0 &&
        quickReplyArray.controls.some(control => control.value?.trim());
    }

    return hasWebsite || !!hasPhone || !!hasCopy || !!hasAuthCopy || hasQuickReplies;
  }

  validateMarketingButtons(form: FormGroup): { isValid: boolean; error?: string } {
    const category = form.get('category')?.value?.toUpperCase();

    if (category !== 'MARKETING') {
      return { isValid: true };
    }

    if (!this.hasAnyButtons(form)) {
      return {
        isValid: false,
        error: 'Marketing templates must have at least one interactive button (Website, Phone, Copy Code, or Quick Reply).'
      };
    }

    return { isValid: true };
  }

  getPreviewButtons(formData: any): any[] {
    const buttons: any[] = [];

    // Add website buttons
    this.websiteButtons.forEach(btn => {
      if (btn.text.trim() && btn.url.trim()) {
        buttons.push({
          type: 'URL',
          text: btn.text.trim(),
          url: btn.url.trim()
        });
      }
    });

    // Add phone button
    if (this.hasPhoneButton && formData.callButtonText?.trim() && formData.phoneNumber?.trim()) {
      buttons.push({
        type: 'PHONE_NUMBER',
        text: formData.callButtonText.trim(),
        phoneNumber: formData.phoneNumber.trim()
      });
    }

    // Add copy code button
    if (this.hasCopyButton && formData.offerCode?.trim()) {
      buttons.push({
        type: 'QUICK_REPLY',
        text: 'Copy Offer Code'
      });
    }

    // Add auth copy button
    if (this.hasAuthCopyButton && formData.authCopyButtonText?.trim()) {
      buttons.push({
        type: 'QUICK_REPLY',
        text: formData.authCopyButtonText.trim()
      });
    }

    // FIXED: Add quick reply buttons - ensure proper array handling
    if (formData.quickReplyTexts) {
      // Handle both array and object formats
      let quickReplies: string[] = [];

      if (Array.isArray(formData.quickReplyTexts)) {
        quickReplies = formData.quickReplyTexts;
      } else if (typeof formData.quickReplyTexts === 'object') {
        // Handle FormArray case where it might be an object with numeric keys
        quickReplies = Object.values(formData.quickReplyTexts).filter(v => typeof v === 'string');
      }

      quickReplies.forEach((text: string) => {
        if (text && text.trim()) {
          buttons.push({
            type: 'QUICK_REPLY',
            text: text.trim()
          });
        }
      });
    }

    return buttons;
  }

  getDebugState(form?: FormGroup): any {
    const quickReplyArray = form?.get('quickReplyTexts') as FormArray;
    return {
      websiteButtons: this.websiteButtons,
      websiteButtonsCount: this.websiteButtons.length,
      hasPhoneButton: this.hasPhoneButton,
      hasCopyButton: this.hasCopyButton,
      hasAuthCopyButton: this.hasAuthCopyButton,
      quickReplyCount: quickReplyArray?.length || 0,
      quickReplyValues: quickReplyArray?.value || [],
      hasAnyButtons: this.hasAnyButtons(form),
      updateCounter: this.updateSubject.value
    };
  }
}
