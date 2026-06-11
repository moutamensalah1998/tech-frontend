import { Component, Input, ChangeDetectionStrategy, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';

export interface SelectOption {
  value: any;
  label: string;
}

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule,FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldComponent),
      multi: true
    }
  ],
  templateUrl: './form-field.component.html',
})
export class FormFieldComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() type: 'text' | 'textarea' | 'select' = 'text';
  @Input() placeholder?: string;
  @Input() maxLength?: number;
  @Input() rows?: number;
  @Input() required = false;
  @Input() showCharacterCount = true;
  @Input() options: SelectOption[] = [];
  @Input() control?: AbstractControl | null;
  private translationService = inject(TranslationService);

  value: any = '';
  onChange = (value: any) => {};
  onTouched = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  getInputClasses(): string {
    const baseClasses = 'w-full p-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent transition-colors';
    const errorClasses = this.control?.errors && this.control?.touched
      ? 'border-red-300 focus:ring-red-500'
      : 'border-gray-300 focus:ring-blue-500';
    return `${baseClasses} ${errorClasses}`;
  }

  getTextareaClasses(): string {
    const baseClasses = 'w-full p-3 border rounded-lg text-sm resize-none focus:ring-2 focus:border-transparent transition-colors';
    const errorClasses = this.control?.errors && this.control?.touched
      ? 'border-red-300 focus:ring-red-500'
      : 'border-gray-300 focus:ring-blue-500';
    return `${baseClasses} ${errorClasses}`;
  }

  getSelectClasses(): string {
    const baseClasses = 'w-full p-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent transition-colors';
    const errorClasses = this.control?.errors && this.control?.touched
      ? 'border-red-300 focus:ring-red-500'
      : 'border-gray-300 focus:ring-blue-500';
    return `${baseClasses} ${errorClasses}`;
  }

  getErrorMessage(): string {
    if (!this.control?.errors) return '';

    const errors = this.control.errors;
    if (errors['required']) {
      return this.label 
        ? `${this.label} ${this.translationService.translate('chatbot.builder.shared.formField.fieldRequired')}`
        : this.translationService.translate('chatbot.builder.shared.formField.thisFieldRequired');
    }
    if (errors['maxlength']) {
      const maxLength = errors['maxlength'].requiredLength;
      return this.label
        ? `${this.label} ${this.translationService.translate('chatbot.builder.shared.formField.fieldTooLong', { max: maxLength })}`
        : this.translationService.translate('chatbot.builder.shared.formField.maximumCharacters', { max: maxLength });
    }
    if (errors['minlength']) {
      const minLength = errors['minlength'].requiredLength;
      return this.label
        ? `${this.label} ${this.translationService.translate('chatbot.builder.shared.formField.fieldTooShort', { min: minLength })}`
        : this.translationService.translate('chatbot.builder.shared.formField.minimumCharacters', { min: minLength });
    }
    if (errors['requiredText']) {
      return this.label 
        ? `${this.label} ${this.translationService.translate('chatbot.builder.shared.formField.fieldCannotBeEmpty')}`
        : this.translationService.translate('chatbot.builder.shared.formField.thisFieldCannotBeEmpty');
    }
    if (errors['invalidVariableName']) {
      return this.translationService.translate('chatbot.builder.shared.formField.variableNamePattern');
    }

    return this.label 
      ? `${this.label} ${this.translationService.translate('chatbot.builder.shared.formField.fieldInvalid')}`
      : this.translationService.translate('chatbot.builder.shared.formField.invalidInput');
  }
}

