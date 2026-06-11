// src/app/services/create-contact-form.service.ts
import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

@Injectable({ providedIn: 'root' })
export class CreateContactFormService {
  constructor(private fb: FormBuilder) {}

  createContactForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      countryCode: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required]],
      customAttributes: this.fb.array([])
    });
  }

  addCustomAttribute(form: FormGroup): void {
    const arr = form.get('customAttributes') as FormArray;
    arr.push(this.fb.group({
      attributeId: [null],
      attributeName: [''],
      value: [''],
      isNewAttribute: [false]
    }));
  }

  removeCustomAttribute(form: FormGroup, index: number): void {
    const arr = form.get('customAttributes') as FormArray;
    if (index >= 0 && index < arr.length) {
      arr.removeAt(index);
    }
  }

  parseAndFormatPhone(formValue: any) {
    const rawCountry = (formValue.countryCode || '').toString().trim();
    const rawNumber = (formValue.phoneNumber || '').toString().trim();

    let phoneNumberObj = null;

    const maybeISO = /^[A-Za-z]{2}$/i.test(rawCountry) ? rawCountry.toUpperCase() : undefined;
    const maybeCallingCode = /^\+?\d+$/.test(rawCountry) ? rawCountry.replace(/^\+/, '') : undefined;

    if (/^\+/.test(rawNumber)) {
      phoneNumberObj = parsePhoneNumberFromString(rawNumber);
    } else if (maybeISO) {
      phoneNumberObj = parsePhoneNumberFromString(rawNumber, maybeISO);
    } else if (maybeCallingCode) {
      phoneNumberObj = parsePhoneNumberFromString(`+${maybeCallingCode}${rawNumber}`);
    } else {
      phoneNumberObj = parsePhoneNumberFromString(`+${rawNumber}`);
    }

    let phoneE164: string | null = null;
    let countryCallingCode: number | null = null;
    let isValid = false;

    if (phoneNumberObj) {
      try {
        phoneE164 = phoneNumberObj.format('E.164');
      } catch (e) {
        phoneE164 = phoneNumberObj.number || null;
      }

      const country_calling_code = (phoneNumberObj as any).countryCallingCode;
      if (country_calling_code) {
        countryCallingCode = Number(country_calling_code);
      }

      try {
        isValid = phoneNumberObj.isValid ? phoneNumberObj.isValid() : !!phoneE164;
      } catch {
        isValid = !!phoneE164;
      }
    }

    return {
      phoneE164,
      countryCallingCode,
      isValid
    };
  }

  buildPayload(formValue: any) {
    const parsed = this.parseAndFormatPhone(formValue);

    const rawAttributes = (formValue.customAttributes || []).slice();

    const attributes = rawAttributes
      .filter((a: any) => {
        // احتفظ فقط بعناصر لها قيمة مفيدة أو معرف موجود
        const hasId = a && (a.attributeId !== null && a.attributeId !== undefined);
        const hasName = a && a.attributeName && a.attributeName.toString().trim().length > 0;
        const hasValue = a && a.value !== null && a.value !== undefined && a.value.toString().trim().length > 0;
        return hasId || hasName || hasValue;
      })
      .map((a: any) => ({
        name: (a.attributeName ?? '').toString(),
        value: a.value ?? '',
        isNew: !!a.isNewAttribute,
        attributeId: a.attributeId ?? null
      }));

    const payload: any = {
      name: formValue.name,
      phone_number: parsed.phoneE164,
      countryCode: parsed.countryCallingCode,
      phoneValid: parsed.isValid
    };

    if (attributes.length > 0) {
      payload.attributes = attributes;
    }

    return payload;
  }
}
