import { Component, OnInit, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { PhoneFormatDirective } from './phone-format.directive';
import { Country } from './model/country.interface';
import { CountriesService } from './service/countries.service';
import { CountryCode, parsePhoneNumber } from 'libphonenumber-js';

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PhoneFormatDirective],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true
    }
  ],
  templateUrl: './phone-input.component.html',
  styleUrls: ['./phone-input.component.css']
})
export class PhoneInputComponent implements OnInit, ControlValueAccessor {
  @Input() id = `phone-input-${Math.random().toString(36).substring(2, 11)}`;
  @Input() label = '';
  @Input() required = false;
  @Input() placeholder = '';
  @Input() compact = false;
  @Input() showDialCode = true;
  @Input() showErrors = true;
  @Input() defaultCountry: CountryCode = 'US';
  @Input() containerClass = 'w-full';
  @Input() labelClass = 'text-gray-900';
  @Input() inputContainerClass = 'flex rounded-md';
  @Input() selectWidth = 'w-11';
  @Input() selectClass = '';
  @Input() inputClass = '';
  @Input() errorClass = '';
  @Input() requiredMessage = 'Phone number is required';
  @Input() invalidMessage = 'Please enter a valid phone number';

  // Events
  @Output() countryChange = new EventEmitter<Country>();
  @Output() validityChange = new EventEmitter<boolean>();
  @Output() valueChange = new EventEmitter<{
    country: Country;
    number: string;
    fullNumber: string;
    isValid: boolean;
  }>();

  phoneForm: FormGroup;
  countries: Country[] = [];
  selectedCountry?: Country;
  isPhoneValid = false;

  private onChange = (_: any) => {};
  private onTouched = () => {};

  constructor(
    private fb: FormBuilder,
    private countriesService: CountriesService
  ) {
    this.phoneForm = this.fb.group({
      country: [this.defaultCountry],
      phone: ['']
    });
  }

  ngOnInit() {
    this.countries = this.countriesService.getAllCountries();
    this.selectedCountry = this.countriesService.getCountryByCode(this.defaultCountry);

    this.phoneForm.valueChanges.subscribe(value => {
      if (this.selectedCountry) {
        const fullNumber = `${this.selectedCountry.dialCode}${value.phone}`;
        this.onChange(fullNumber);
        this.valueChange.emit({
          country: this.selectedCountry,
          number: value.phone,
          fullNumber,
          isValid: this.isPhoneValid
        });
      }
    });
  }

  writeValue(value: string): void {
    if (value) {
      try {
        const phoneNumber = parsePhoneNumber(value);
        if (phoneNumber && phoneNumber.country) {
          this.phoneForm.patchValue({
            country: phoneNumber.country,
            phone: phoneNumber.nationalNumber
          }, { emitEvent: false });
          this.selectedCountry = this.countriesService.getCountryByCode(phoneNumber.country);
        }
      } catch (e) {
        console.error('Error parsing phone number:', e);
      }
    } else {
      this.phoneForm.patchValue({ phone: '' }, { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.phoneForm.disable();
    } else {
      this.phoneForm.enable();
    }
  }

  onCountryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedCountry = this.countriesService.getCountryByCode(select.value);
    if (this.selectedCountry) {
      this.countryChange.emit(this.selectedCountry);
    }
  }

  onPhoneValidityChange(isValid: boolean) {
    this.isPhoneValid = isValid;
    this.validityChange.emit(isValid);
  }
}
