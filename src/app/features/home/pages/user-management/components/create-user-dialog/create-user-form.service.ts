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
export class CreateUserFormService {
  constructor(private fb: FormBuilder) { }

  createForm(): FormGroup {
    const form = this.fb.group({
      firstName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      lastName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/),
        ],
      ],
      countryCode: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      role: [[], Validators.required],
      team: [[], Validators.required],
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
}
