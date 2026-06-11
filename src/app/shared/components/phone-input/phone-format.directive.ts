// src/app/phone-format.directive.ts
import { Directive, ElementRef, HostListener, Input, Output, EventEmitter, Renderer2 } from '@angular/core';
import { NgControl } from '@angular/forms';
import { parsePhoneNumberFromString, CountryCode, formatIncompletePhoneNumber } from 'libphonenumber-js';

@Directive({
  selector: '[phoneFormat]',
  standalone: true
})
export class PhoneFormatDirective {

  @Input() countryCode: CountryCode = 'US';

  @Output() phoneNumberValid = new EventEmitter<boolean>();
  @Output() formattedNumber = new EventEmitter<string>();

  constructor(
    private el: ElementRef<HTMLInputElement>,
    private ngControl: NgControl,
    private renderer: Renderer2
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: InputEvent): void {
    const input = event.target as HTMLInputElement;
    // Remove any non-digit characters
    let value = input.value.replace(/\D/g, '');

    try {
      // Ensure a valid country code is used—fallback to 'US' if needed
      const effectiveCountryCode = this.countryCode || 'US';
      // Format the phone number as the user types
      const formattedValue = formatIncompletePhoneNumber(value, effectiveCountryCode);

      // Update the input's displayed value using Renderer2 for Angular compatibility
      this.renderer.setProperty(input, 'value', formattedValue);

      if (this.ngControl?.control) {
        // Update the form control with the raw numeric value (alternatively, store formattedValue)
        this.ngControl.control.setValue(value, { emitEvent: false });
        this.validateNumber(value);
      }

      // Emit the formatted phone number for external handling if needed
      this.formattedNumber.emit(formattedValue);
    } catch (error) {
      console.error('Phone formatting error:', error);
      // On error, revert to the raw numeric value
      this.renderer.setProperty(input, 'value', value);
    }
  }

  /**
   * Validates the phone number using libphonenumber-js.
   * Emits a boolean indicating whether the phone number is valid.
   */
  private validateNumber(value: string): void {
    if (!value) {
      this.phoneNumberValid.emit(false);
      return;
    }

    const effectiveCountryCode = this.countryCode || 'US';
    const phoneNumber = parsePhoneNumberFromString(value, effectiveCountryCode);
    this.phoneNumberValid.emit(phoneNumber ? phoneNumber.isValid() : false);
  }
}
