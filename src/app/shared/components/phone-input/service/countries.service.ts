// src/app/services/countries.service.ts
import { Injectable } from "@angular/core";
import { Country } from "../model/country.interface";
import { CountryCode, getCountries, getCountryCallingCode } from "libphonenumber-js";

@Injectable({ providedIn: 'root' })
export class CountriesService {
  private countries: Country[] = [];

  constructor() {
    this.initializeCountries();
  }

  private initializeCountries() {
    this.countries = getCountries().map(countryCode => {
      const code = countryCode as CountryCode;
      return {
        name: this.getCountryName(code),
        code: code,
        dialCode: `+${getCountryCallingCode(code)}`,
        flag: this.getFlagEmoji(code),
        mask: this.getPhoneMask(code)
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }

  private getCountryName(code: string): string {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
    } catch {
      return code;
    }
  }

  private getFlagEmoji(countryCode: string): string {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  private getPhoneMask(countryCode: string): string {
    return '... ... ... ...';
  }

  getAllCountries(): Country[] {
    return this.countries;
  }

  getCountryByCode(code: string): Country | undefined {
    return this.countries.find(country => country.code === code);
  }
}
