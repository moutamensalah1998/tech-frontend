import { formatDate } from '@angular/common';

export enum DifferenceUnit {
  Seconds = 'seconds',
  Minutes = 'minutes',
  Hours = 'hours',
  Days = 'days',
}

export class DateUtils {
  private constructor() { }

  private static toDate(date: any): Date | null {
    if (!date) return null;

    if (date instanceof Date) {
      return date;
    }

    if (typeof date === 'number') {
      const timestamp = date < 10000000000 ? date * 1000 : date;
      return new Date(timestamp);
    }

    // If it's a string timestamp (all digits)
    if (typeof date === 'string' && /^\d+$/.test(date)) {
      const timestamp = parseInt(date, 10);
      const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
      return new Date(ms);
    }

    // If it's a date string (ISO format, etc.)
    if (typeof date === 'string') {
      return new Date(date);
    }

    return null;
  }

  static toLocal(dateString: string): Date {
    return new Date(dateString);
  }

  static toTimestamp(date: any): number {
    const dateTime = this.toDate(date);
    if (!dateTime || isNaN(dateTime.getTime())) return 0;
    return dateTime.getTime();
  }

  static format(
    date: any,
    options?: {
      pattern?: string;
      locale?: string;
    }
  ): string {
    const dateTime = this.toDate(date);
    if (!dateTime) return '';

    const locale = options?.locale || 'en-US';
    const pattern = options?.pattern || 'MMM dd, yyyy HH:mm';
    return formatDate(dateTime, pattern, locale);
  }

  static shortDate(date: any, locale = 'en-US'): string {
    return this.format(date, { pattern: 'MM/dd/yyyy', locale });
  }

  static longDate(date: any, locale = 'en-US'): string {
    return this.format(date, { pattern: 'MMMM dd, yyyy', locale });
  }

  static fullDateTime(date: any, locale = 'en-US'): string {
    return this.format(date, { pattern: 'EEEE, MMMM dd, yyyy HH:mm:ss', locale });
  }

  static timeOnly(date: any, locale = 'en-US'): string {
    return this.format(date, { pattern: 'HH:mm:ss', locale });
  }

  static time12Hour(date: any, locale = 'en-US'): string {
    return this.format(date, { pattern: 'hh:mm a', locale });
  }

  static relative(date: any): string {
    const dateTime = this.toDate(date);
    if (!dateTime) return '';

    const now = new Date();
    const diff = now.getTime() - dateTime.getTime();
    const absDiff = Math.abs(diff);

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;
    const year = 365 * day;

    if (diff < 0) {
      // Future
      if (absDiff > year) {
        const years = Math.floor(absDiff / year);
        return `in ${years} ${years === 1 ? 'year' : 'years'}`;
      } else if (absDiff > month) {
        const months = Math.floor(absDiff / month);
        return `in ${months} ${months === 1 ? 'month' : 'months'}`;
      } else if (absDiff > day) {
        const days = Math.floor(absDiff / day);
        return `in ${days} ${days === 1 ? 'day' : 'days'}`;
      } else if (absDiff > hour) {
        const hours = Math.floor(absDiff / hour);
        return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      } else if (absDiff > minute) {
        const mins = Math.floor(absDiff / minute);
        return `in ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
      } else {
        return 'in a few seconds';
      }
    } else {
      // Past
      if (diff > year) {
        const years = Math.floor(diff / year);
        return `${years} ${years === 1 ? 'year' : 'years'} ago`;
      } else if (diff > month) {
        const months = Math.floor(diff / month);
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
      } else if (diff > day) {
        const days = Math.floor(diff / day);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      } else if (diff > hour) {
        const hours = Math.floor(diff / hour);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diff > minute) {
        const mins = Math.floor(diff / minute);
        return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
      } else {
        return 'just now';
      }
    }
  }

  static chatFormat(date: any, locale: string = 'en-US'): string {
    const dateTime = this.toDate(date);
    if (!dateTime) return '';

    const now = new Date();
    const diff = now.getTime() - dateTime.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay && dateTime.getDate() === now.getDate()) {
      return `Today ${dateTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diff < 2 * oneDay && dateTime.getDate() === now.getDate() - 1) {
      return `Yesterday ${dateTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return dateTime.toLocaleDateString(locale, {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  static isToday(date: any): boolean {
    const dateTime = this.toDate(date);
    if (!dateTime) return false;

    const now = new Date();
    return (
      dateTime.getFullYear() === now.getFullYear() &&
      dateTime.getMonth() === now.getMonth() &&
      dateTime.getDate() === now.getDate()
    );
  }

  static isPast(date: any): boolean {
    const dateTime = this.toDate(date);
    return !!dateTime && dateTime.getTime() < Date.now();
  }

  static isFuture(date: any): boolean {
    const dateTime = this.toDate(date);
    return !!dateTime && dateTime.getTime() > Date.now();
  }

  static difference(
    date1: any,
    date2: any,
    unit: DifferenceUnit = DifferenceUnit.Days
  ): number {
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);

    if (!d1 || !d2) return 0;

    const diff = d1.getTime() - d2.getTime();

    switch (unit) {
      case DifferenceUnit.Seconds:
        return Math.floor(diff / 1000);
      case DifferenceUnit.Minutes:
        return Math.floor(diff / (1000 * 60));
      case DifferenceUnit.Hours:
        return Math.floor(diff / (1000 * 60 * 60));
      case DifferenceUnit.Days:
      default:
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
  }

  static toUtc(localDate: Date): string {
    return localDate.toISOString();
  }

  static nowUtc(): string {
    return new Date().toISOString();
  }
}
