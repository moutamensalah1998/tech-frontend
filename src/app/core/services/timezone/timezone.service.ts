import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from '../../api/api.service';

export interface TimeSettings {
  timeZone: string;
  timeFormat: '12h' | '24h';
  dateFormat: string;
  firstDayOfWeek: string;
}

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  // Default settings for new accounts
  private static readonly DEFAULT_TIMEZONE = 'Asia/Riyadh';
  private static readonly DEFAULT_TIME_FORMAT: '12h' | '24h' = '12h';
  private static readonly DEFAULT_DATE_FORMAT = 'MM/DD/YYYY';
  private static readonly DEFAULT_FIRST_DAY = 'sunday';
  
  private settingsSubject = new BehaviorSubject<TimeSettings>({
    timeZone: TimezoneService.DEFAULT_TIMEZONE,
    timeFormat: TimezoneService.DEFAULT_TIME_FORMAT,
    dateFormat: TimezoneService.DEFAULT_DATE_FORMAT,
    firstDayOfWeek: TimezoneService.DEFAULT_FIRST_DAY
  });
  
  public settings$ = this.settingsSubject.asObservable();

  constructor(private api: ApiService) {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.api.get('/v1/business-profile/time-area-settings').subscribe({
      next: (response: any) => {
        if (response?.data) {
          const data = response.data;
          this.settingsSubject.next({
            timeZone: data.timeZone || data.time_zone || TimezoneService.DEFAULT_TIMEZONE,
            timeFormat: data.timeFormat || data.time_format || TimezoneService.DEFAULT_TIME_FORMAT,
            dateFormat: data.dateFormat || data.date_format || TimezoneService.DEFAULT_DATE_FORMAT,
            firstDayOfWeek: data.firstDayOfWeek || data.first_day_of_week || TimezoneService.DEFAULT_FIRST_DAY
          });
        }
      },
      error: () => {
        console.warn('Failed to load time settings, using defaults (Asia/Riyadh, 12h)');
      }
    });
  }

  getSettings(): TimeSettings {
    return this.settingsSubject.value;
  }

  getTimezone(): string {
    return this.settingsSubject.value.timeZone;
  }

  getTimeFormat(): '12h' | '24h' {
    return this.settingsSubject.value.timeFormat;
  }

  is12HourFormat(): boolean {
    return this.settingsSubject.value.timeFormat === '12h';
  }

  setTimezone(timezone: string): void {
    const current = this.settingsSubject.value;
    this.settingsSubject.next({ ...current, timeZone: timezone });
  }

  setTimeFormat(format: '12h' | '24h'): void {
    const current = this.settingsSubject.value;
    this.settingsSubject.next({ ...current, timeFormat: format });
  }

  updateSettings(settings: Partial<TimeSettings>): void {
    const current = this.settingsSubject.value;
    this.settingsSubject.next({ ...current, ...settings });
  }

  /**
   * Convert any date input to a proper Date object
   * Handles: Date objects, ISO strings, numeric timestamps (seconds or ms), string timestamps
   * 
   * IMPORTANT: All timestamps from the backend are in UTC. If a string doesn't have
   * explicit timezone info (Z or +/-offset), we MUST treat it as UTC by adding 'Z'.
   */
  private toDate(value: any): Date {
    if (!value) return new Date(0);
    if (value instanceof Date) return value;
    if (typeof value === 'number') {
      const ms = value < 10000000000 ? value * 1000 : value;
      return new Date(ms);
    }
    if (typeof value === 'string') {
      if (/^\d+$/.test(value)) {
        const ts = parseInt(value, 10);
        const ms = ts < 10000000000 ? ts * 1000 : ts;
        return new Date(ms);
      }
      
      const hasTimezoneInfo = value.endsWith('Z') || 
                              value.match(/[+-]\d{2}:\d{2}$/) ||
                              value.match(/[+-]\d{4}$/);
      
      if (!hasTimezoneInfo) {
        return new Date(value + 'Z');
      }
      
      return new Date(value);
    }
    return new Date(value);
  }

  /**
   * Format a UTC date using the selected timezone and time format
   * This is the single source of truth for all date/time formatting
   */
  formatDate(utcDate: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    const date = this.toDate(utcDate);
    const settings = this.settingsSubject.value;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: settings.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: settings.timeFormat === '12h'
    };
    
    const mergedOptions = { ...defaultOptions, ...options, timeZone: settings.timeZone };
    
    // Ensure hour12 is always set based on user preference
    if (options?.hour !== undefined || options?.minute !== undefined) {
      mergedOptions.hour12 = settings.timeFormat === '12h';
    }
    
    return new Intl.DateTimeFormat('en-US', mergedOptions).format(date);
  }

  /**
   * Format time only (respects 12h/24h setting)
   */
  formatTime(utcDate: Date | string | number): string {
    return this.formatDate(utcDate, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format date for chat display (Today/Yesterday/Date)
   */
  formatChatDate(utcDate: Date | string | number): string {
    const date = this.toDate(utcDate);
    const settings = this.settingsSubject.value;
    
    const nowInTz = new Intl.DateTimeFormat('en-US', {
      timeZone: settings.timeZone,
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    }).format(new Date());
    
    const dateInTz = new Intl.DateTimeFormat('en-US', {
      timeZone: settings.timeZone,
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    }).format(date);
    
    const timeStr = this.formatTime(date);
    
    if (dateInTz === nowInTz) {
      return `Today ${timeStr}`;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayInTz = new Intl.DateTimeFormat('en-US', {
      timeZone: settings.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(yesterday);
    
    if (dateInTz === yesterdayInTz) {
      return `Yesterday ${timeStr}`;
    }
    
    return this.formatDate(date, {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get relative time (e.g., "5m ago", "2h ago")
   */
  getRelativeTime(utcDate: Date | string | number): string {
    const date = this.toDate(utcDate);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return this.formatDate(date, { month: 'short', day: 'numeric' });
  }

  /**
   * Format full date and time
   */
  formatDateTime(utcDate: Date | string | number): string {
    return this.formatDate(utcDate, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format date only (no time)
   */
  formatDateOnly(utcDate: Date | string | number): string {
    const settings = this.settingsSubject.value;
    const date = this.toDate(utcDate);
    
    return new Intl.DateTimeFormat('en-US', {
      timeZone: settings.timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
}