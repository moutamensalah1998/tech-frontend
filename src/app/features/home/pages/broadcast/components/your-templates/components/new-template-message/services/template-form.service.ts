// template-form.service.ts - FIXED VERSION with enhanced validation
import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { TemplateConstants } from '../../../../../../../../../core/utils/template-constants';
import { ButtonService } from './button.service';
import { VariableService } from './variable.service';
import { TranslationService } from '../../../../../../../../../core/services/translation/translation.service';

export interface TemplateFormData {
  templateName: string;
  category: string;
  language: string;
  broadcastTitle: string;
  text: string;
  body: string;
  footer: string;
  callButtonText: string;
  phoneNumber: string;
  offerCode: string;
  authCopyButtonText: string;
  includeSecurityText: boolean;
  quickReplyTexts: string[];
  variables?: { [placeholder: string]: string };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable({
  providedIn: 'root',
})
export class TemplateFormService {
  public form!: FormGroup;
  private translationService = inject(TranslationService);

  constructor(
    private fb: FormBuilder,
    private buttonService: ButtonService,
    private variableService: VariableService
  ) {}

  initializeForm(): void {
    this.form = this.fb.group({
      templateName: [
        '',
        [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/)],
      ],
      category: ['', Validators.required],
      language: ['', Validators.required],
      broadcastTitle: [TemplateConstants.MEDIA_TYPES.NONE],
      text: [''],
      body: [''], // Remove required validator - will be added conditionally
      footer: [''],
      callButtonText: [''],
      phoneNumber: ['', [Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      offerCode: [''],
      authCopyButtonText: [''],
      includeSecurityText: [false],
      quickReplyTexts: this.fb.array([])
    });

    // Watch for category changes to enforce restrictions
    this.form.get('category')?.valueChanges.subscribe(category => {
      this.handleCategoryChange(category);
    });

    // Watch for quick reply changes and trigger updates
    this.getQuickReplyArray().valueChanges.subscribe(() => {
      setTimeout(() => {
        this.form.updateValueAndValidity();
        this.form.markAsDirty();
      }, 0);
    });
  }

  private handleCategoryChange(category: string): void {
    const upperCategory = category?.toUpperCase();

    // Clear restricted buttons when category changes
    this.buttonService.clearRestrictedButtons(category, this.form);

    // Handle authentication template specific logic
    if (upperCategory === 'AUTHENTICATION') {
      this.form.patchValue({
        body: '{{code}} is your verification code.',
        includeSecurityText: false
      });

      // Remove required validator from body for authentication templates
      const bodyControl = this.form.get('body');
      if (bodyControl) {
        bodyControl.clearValidators();
        bodyControl.updateValueAndValidity();
      }

      setTimeout(() => {
        this.variableService.extractVariablesFromText('{{code}} is your verification code.', 'body');
      }, 100);
    } else {
      // Add required validator back for non-authentication templates
      const bodyControl = this.form.get('body');
      if (bodyControl) {
        bodyControl.setValidators([Validators.required]);
        bodyControl.updateValueAndValidity();
      }

      const currentBody = this.form.get('body')?.value;
      if (currentBody === '{{code}} is your verification code. For your security, do not share this code.' ||
          currentBody === '{{code}} is your verification code.') {
        this.form.patchValue({
          body: '',
          includeSecurityText: false
        });
      }
    }
    this.variableService.clearAllVariables();
    this.updateFormValidators(upperCategory);
  }

  private updateFormValidators(category: string): void {
    this.form.get('callButtonText')?.clearValidators();
    this.form.get('phoneNumber')?.clearValidators();
    this.form.get('offerCode')?.clearValidators();
    this.form.get('authCopyButtonText')?.clearValidators();

    this.form.get('phoneNumber')?.setValidators([Validators.pattern(/^\+?[1-9]\d{1,14}$/)]);

    this.form.get('callButtonText')?.updateValueAndValidity();
    this.form.get('phoneNumber')?.updateValueAndValidity();
    this.form.get('offerCode')?.updateValueAndValidity();
    this.form.get('authCopyButtonText')?.updateValueAndValidity();
  }

  getFormData(): TemplateFormData {
    const formValue = this.form.value;
    const quickReplyArray = this.getQuickReplyArray();

    // CRITICAL FIX: Ensure all required fields have values
    const data: TemplateFormData = {
      templateName: formValue.templateName || '',
      category: formValue.category || '',
      language: formValue.language || '',
      broadcastTitle: formValue.broadcastTitle || TemplateConstants.MEDIA_TYPES.NONE,
      text: formValue.text || '',
      body: formValue.body || '',
      footer: formValue.footer || '',
      callButtonText: formValue.callButtonText || '',
      phoneNumber: formValue.phoneNumber || '',
      offerCode: formValue.offerCode || '',
      authCopyButtonText: formValue.authCopyButtonText || '',
      includeSecurityText: formValue.includeSecurityText || false,
      quickReplyTexts: quickReplyArray.value || [],
      variables: this.variableService.getVariableValues()
    };

    return data;
  }

  resetForm(): void {
    this.form.reset({
      broadcastTitle: TemplateConstants.MEDIA_TYPES.NONE,
      includeSecurityText: false,
    });

    const quickReplyArray = this.getQuickReplyArray();
    while (quickReplyArray.length !== 0) {
      quickReplyArray.removeAt(0);
    }

    this.buttonService.clearAllButtons(this.form);
    this.variableService.clearAllVariables();
  }

  markAllFieldsAsTouched(): void {
    this.form.markAllAsTouched();

    const quickReplyArray = this.getQuickReplyArray();
    quickReplyArray.controls.forEach(control => {
      control.markAsTouched();
    });

    this.variableService.markAllVariablesAsTouched();
  }

  prefillForm(templateData: any): void {
    this.resetForm();

    this.form.patchValue({
      templateName: templateData.name || '',
      category: templateData.category || '',
      language: templateData.language || '',
      body: templateData.body || '',
      footer: templateData.footer || '',
      text: templateData.text || '',
      broadcastTitle: templateData.broadcastTitle || TemplateConstants.MEDIA_TYPES.NONE,
      callButtonText: templateData.callButtonText || '',
      phoneNumber: templateData.phoneNumber || '',
      offerCode: templateData.offerCode || '',
      authCopyButtonText: templateData.authCopyButtonText || '',
      includeSecurityText: templateData.includeSecurityText || false,
    });

    if (templateData.quickReplyTexts?.length) {
      const quickReplyArray = this.getQuickReplyArray();
      templateData.quickReplyTexts.forEach((text: string) => {
        quickReplyArray.push(new FormControl(text, [Validators.maxLength(20)]));
      });
    }

    if (templateData.websiteButtons && Array.isArray(templateData.websiteButtons)) {
      this.buttonService.setWebsiteButtonsDirectly(templateData.websiteButtons);
    }

    const category = templateData.category?.toUpperCase();
    if (category === 'AUTHENTICATION') {
      this.buttonService.hasAuthCopyButton = !!templateData.authCopyButtonText;
    } else {
      this.buttonService.hasPhoneButton = !!(templateData.phoneNumber || templateData.callButtonText);
      if (category !== 'UTILITY') {
        this.buttonService.hasCopyButton = !!templateData.offerCode;
      }
    }

    setTimeout(() => {
      if (templateData.body) {
        this.variableService.extractVariablesFromText(templateData.body, 'body');
      }
      if (templateData.text && templateData.broadcastTitle === 'Text') {
        this.variableService.extractVariablesFromText(templateData.text, 'text');
      }

      if (templateData.variables) {
        const variables = this.variableService.variables;
        variables.forEach(variable => {
          if (templateData.variables[variable.placeholder]) {
            this.variableService.updateVariableValue(
              variable.id,
              templateData.variables[variable.placeholder]
            );
          }
        });
      }
    }, 100);
  }

  private shouldValidateBodyField(category?: string): boolean {
    // Authentication templates have pre-filled body content, so don't require validation
    return category?.toUpperCase() !== 'AUTHENTICATION';
  }

  ensureAuthenticationTemplateBody(): void {
    const category = this.form.get('category')?.value?.toUpperCase();
    if (category === 'AUTHENTICATION') {
      const bodyControl = this.form.get('body');
      const currentBody = bodyControl?.value;

      if (!currentBody || currentBody.trim() === '') {
        bodyControl?.setValue('{{code}} is your verification code.');
        bodyControl?.clearValidators();
        bodyControl?.updateValueAndValidity();

        // Extract variables after setting the body
        setTimeout(() => {
          this.variableService.extractVariablesFromText('{{code}} is your verification code.', 'body');
        }, 100);
      }
    }
  }

  validateSubmission(): ValidationResult {
    const errors: string[] = [];
    const formData = this.getFormData();

    // CRITICAL FIX: Enhanced basic field validation
    if (!formData.templateName || formData.templateName.trim() === '') {
      errors.push(this.translationService.translate('broadcast.createTemplate.basicInfo.templateNameRequiredError'));
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.templateName)) {
      errors.push(this.translationService.translate('broadcast.createTemplate.basicInfo.templateNamePatternError'));
    }

    if (!formData.category || formData.category.trim() === '') {
      errors.push(this.translationService.translate('broadcast.createTemplate.basicInfo.categoryRequiredError'));
    }

    if (!formData.language || formData.language.trim() === '') {
      errors.push(this.translationService.translate('broadcast.createTemplate.basicInfo.languageRequiredError'));
    }

    const category = formData.category?.toUpperCase();

    // Body validation - SKIP for authentication templates
    if (this.shouldValidateBodyField(formData.category)) {
      if (!formData.body || formData.body.trim() === '') {
        errors.push(this.translationService.translate('broadcast.createTemplate.content.bodyRequiredError'));
      }
    } else if (category === 'AUTHENTICATION') {
      // For authentication templates, ensure body has content
      if (!formData.body || formData.body.trim() === '') {
        this.form.patchValue({ body: '{{code}} is your verification code.' });
        formData.body = '{{code}} is your verification code.';
      }
    }

    // Additional form validation - but handle auth template body specially
    if (this.form.invalid) {
      const invalidControls = Object.keys(this.form.controls).filter(
        key => this.form.get(key)?.invalid
      );

      // If auth template and only body is invalid, fix it
      if (category === 'AUTHENTICATION' && invalidControls.length === 1 && invalidControls[0] === 'body') {
        const bodyControl = this.form.get('body');
        if (bodyControl) {
          bodyControl.clearValidators();
          bodyControl.setValue('{{code}} is your verification code.');
          bodyControl.updateValueAndValidity();
        }
      } else if (invalidControls.length > 0) {
        errors.push('Please correct the errors in the form fields.');
      }
    }
    // Variable validation with enhanced error handling
    try {
      const variables = this.variableService.variables;
      const uniqueVariableNames = [...new Set(variables.map(v => v.name))];

      if (variables.length > 0) {
        const variableForm = this.variableService.variableForm;
        const formControlCount = Object.keys(variableForm.controls).length;

        if (formControlCount === 0) {
          errors.push('Variable form controls are not initialized. Please refresh the page.');
        } else {
          uniqueVariableNames.forEach(variableName => {
            const variable = variables.find(v => v.name === variableName);
            if (variable) {
              const control = variableForm.get(variable.id);
              if (!control) {
                console.warn(`No form control found for variable: ${variable.id}`);
                errors.push(`Variable "${variableName}" is not properly configured.`);
              } else {
                const hasValue = variable.value && variable.value.trim() !== '';
                const controlValue = control.value && control.value.trim() !== '';

                if (!hasValue && !controlValue) {
                  errors.push(`Variable "${variableName}" requires a value.`);
                } else if (!control.valid) {
                  control.setValue(variable.value || '');
                  control.markAsTouched();
                  control.updateValueAndValidity();

                  if (!control.valid) {
                    console.error(`Could not fix control for ${variableName}:`, control.errors);
                    errors.push(`Variable "${variableName}" validation failed.`);
                  }
                }
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error during variable validation:', error);
      errors.push('There was an error validating template variables. Please refresh the page.');
    }

    // Category-specific validation
    switch (category) {
      case 'AUTHENTICATION':
        if (this.buttonService.hasPhoneButton || this.buttonService.hasCopyButton ||
            this.buttonService.websiteButtons.length > 0) {
          errors.push('Authentication templates can only have copy buttons with custom text.');
        }

        const quickRepliesAuth = this.getQuickReplyArray();
        if (quickRepliesAuth.length > 0) {
          errors.push('Authentication templates cannot have quick reply buttons.');
        }

        if (this.buttonService.hasAuthCopyButton && !formData.authCopyButtonText?.trim()) {
          errors.push(this.translationService.translate('broadcast.createTemplate.actionButtons.buttonTextRequiredError'));
        }
        break;

      case 'MARKETING':
        if (!this.buttonService.hasAnyButtons(this.form)) {
          errors.push('Marketing templates require at least one interactive button (Website, Phone, Copy Code, or Quick Reply).');
        }

        const marketingValidation = this.buttonService.validateMarketingButtons(this.form);
        if (!marketingValidation.isValid && marketingValidation.error) {
          errors.push(marketingValidation.error);
        }
        break;

      case 'UTILITY':
        if (this.buttonService.hasCopyButton) {
          errors.push('Utility templates cannot have copy code buttons.');
        }

        if (formData.offerCode?.trim()) {
          errors.push('Utility templates cannot include offer codes.');
        }
        break;
    }

    // Header text validation
    if (formData.broadcastTitle === 'Text' && !formData.text?.trim()) {
      errors.push(this.translationService.translate('broadcast.createTemplate.media.headerTextRequiredError'));
    }

    // Button-specific validation (only for categories that allow buttons)
    if (category !== 'AUTHENTICATION') {
      if (this.buttonService.hasPhoneButton) {
        if (!formData.callButtonText?.trim()) {
          errors.push(this.translationService.translate('broadcast.createTemplate.actionButtons.buttonTextRequiredError'));
        }
        if (!formData.phoneNumber?.trim()) {
          errors.push(this.translationService.translate('broadcast.createTemplate.actionButtons.phoneNumberRequiredError'));
        }
      }

      if (this.buttonService.hasCopyButton && category !== 'UTILITY') {
        if (!formData.offerCode?.trim()) {
          errors.push(this.translationService.translate('broadcast.createTemplate.actionButtons.offerCodeRequiredError'));
        }
      }

      // Website button validation
      this.buttonService.websiteButtons.forEach((btn, index) => {
        if (btn.text?.trim() && !btn.url?.trim()) {
          errors.push(`Website button ${index + 1} is missing a URL.`);
        }
        if (btn.url?.trim() && !btn.text?.trim()) {
          errors.push(`Website button ${index + 1} is missing button text.`);
        }
        if (btn.url?.trim() && !this.isValidUrl(btn.url.trim())) {
          errors.push(`Website button ${index + 1} has an invalid URL format.`);
        }
      });

      // Quick reply validation
      const quickReplies = this.getQuickReplyArray();
      quickReplies.controls.forEach((control, index) => {
        const value = control.value?.trim();
        if (value && value.length > 20) {
          errors.push(`Quick reply ${index + 1} must be 20 characters or less.`);
        }
      });
    }

    const result = {
      isValid: errors.length === 0,
      errors,
    };

    return result;
  }

  getCategoryRestrictions(category: string): {
    allowsButtons: boolean;
    allowsCopyCode: boolean;
    requiresButtons: boolean;
    description: string;
  } {
    const upperCategory = category?.toUpperCase();

    switch (upperCategory) {
      case 'AUTHENTICATION':
        return {
          allowsButtons: true,
          allowsCopyCode: false,
          requiresButtons: false,
          description: 'Authentication templates can only have copy buttons with custom text for security compliance.'
        };

      case 'MARKETING':
        return {
          allowsButtons: true,
          allowsCopyCode: true,
          requiresButtons: true,
          description: 'Marketing templates must include at least one interactive button to comply with WhatsApp policies.'
        };

      case 'UTILITY':
        return {
          allowsButtons: true,
          allowsCopyCode: false,
          requiresButtons: false,
          description: 'Utility templates can have buttons but cannot include copy code functionality.'
        };

      default:
        return {
          allowsButtons: true,
          allowsCopyCode: true,
          requiresButtons: false,
          description: 'Choose the purpose of your template to see specific requirements.'
        };
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      try {
        new URL(`https://${url}`);
        return true;
      } catch {
        return false;
      }
    }
  }

  getQuickReplyArray(): FormArray {
    return this.form.get('quickReplyTexts') as FormArray;
  }

  addQuickReply(text: string = ''): void {
    const quickReplyArray = this.getQuickReplyArray();
    if (quickReplyArray.length < TemplateConstants.MAX_QUICK_REPLIES) {
      const newControl = new FormControl(text, [Validators.maxLength(20)]);
      quickReplyArray.push(newControl);

      this.form.updateValueAndValidity();
      this.form.markAsDirty();
    }
  }

  removeQuickReply(index: number): void {
    const quickReplyArray = this.getQuickReplyArray();
    if (index >= 0 && index < quickReplyArray.length) {
      quickReplyArray.removeAt(index);

      this.form.updateValueAndValidity();
      this.form.markAsDirty();
    }
  }

  isAuthenticationTemplate(): boolean {
    return this.form.get('category')?.value?.toUpperCase() === 'AUTHENTICATION';
  }

  isBodyReadOnly(): boolean {
    return this.isAuthenticationTemplate();
  }

  getProcessedText(fieldName: 'body' | 'footer' | 'text'): string {
    const text = this.form.get(fieldName)?.value || '';
    return this.variableService.replaceVariablesInText(text);
  }
}
