import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl } from '@angular/forms';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export abstract class BaseFormComponent {
  protected form!: FormGroup;

  constructor(protected fb: FormBuilder) {}

  protected createForm(config: { [key: string]: any }): FormGroup {
    return this.fb.group(config);
  }

  protected getFormControl(name: string): AbstractControl | null {
    return this.form.get(name);
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.getFormControl(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  protected getFieldError(fieldName: string): string | null {
    const field = this.getFormControl(fieldName);
    if (field && field.errors && field.touched) {
      const errors = field.errors;
      if (errors['required']) return `${fieldName} is required`;
      if (errors['maxlength']) return `${fieldName} is too long`;
      if (errors['minlength']) return `${fieldName} is too short`;
      if (errors['email']) return 'Invalid email format';
    }
    return null;
  }

  protected markAllFieldsAsTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }
}
