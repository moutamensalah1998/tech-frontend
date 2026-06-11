import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PhoneService {
  formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  if (cleanPhone.startsWith('+')) return cleanPhone;
  if (cleanPhone.match(/^[1-9]\d{0,3}/)) return `+${cleanPhone}`;
  return cleanPhone;
}


  formatPhoneNumberWithCountryCode(contact: any): string {
    if (!contact) return '';
    if (contact.country_code && contact.phone_number) {
      const cc = String(contact.country_code).replace(/[^\d]/g, '');
      const pn = String(contact.phone_number).replace(/[^\d]/g, '');
      if (cc && pn) return `+${cc}${pn}`;
    }
    return this.formatPhoneNumber(contact.phone_number || contact.phone || '');
  }

  validateAndFormatPhoneNumber(phone: string): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) console.warn('Suspicious phone number length', digits.length);
    return `+${digits}`;
  }
}
