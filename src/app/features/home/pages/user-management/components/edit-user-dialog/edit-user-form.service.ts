import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import parsePhoneNumberFromString from 'libphonenumber-js';

@Injectable({ providedIn: 'root' })
export class EditUserFormService {
  constructor(private fb: FormBuilder) {}

  createForm(): FormGroup {
    const form = this.fb.group({
      firstName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      lastName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      countryCode: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      role: [Array, Validators.required],
      team: [Array, Validators.required],
    });
    this.initializePhoneValidation(form);

    return form;
  }

  private initializePhoneValidation(form: FormGroup): void {
    const phoneControl = form.get('phoneNumber');
    form.get('countryCode')?.valueChanges.subscribe((countryCode) => {
      phoneControl?.setValidators([
        Validators.required,
        this.createPhoneValidator(countryCode ?? ''),
      ]);
      phoneControl?.updateValueAndValidity();
    });
  }

  private createPhoneValidator(countryCode: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !countryCode) return null;
      try {
        const phoneNumber = parsePhoneNumberFromString(
          control.value,
          countryCode as any
        );
        return phoneNumber?.isValid() ? null : { invalidPhone: true };
      } catch (e) {
        return { invalidPhone: true };
      }
    };
  }

  getPhoneNumber(formValue: any): string {
    const phoneNumber = parsePhoneNumberFromString(
      formValue.phoneNumber,
      formValue.countryCode
    );
    return phoneNumber?.formatInternational() || '';
  }

  parsePhoneNumber(phoneNumberString: string): { countryCode: string; phoneNumber: string } {
    try {
      const phoneNumber = parsePhoneNumberFromString(phoneNumberString);
      if (phoneNumber) {
        return {
          countryCode: phoneNumber.country || 'US',
          phoneNumber: phoneNumber.nationalNumber || phoneNumberString
        };
      }
    } catch (e) {
      // If parsing fails, return default values
    }

    // Default fallback
    return {
      countryCode: 'US',
      phoneNumber: phoneNumberString
    };
  }
}
