import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from '../../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  // Default timezone for new accounts
  private static readonly DEFAULT_TIMEZONE = 'Asia/Riyadh';
  
  private timezoneSubject = new BehaviorSubject<string>(TimezoneService.DEFAULT_TIMEZONE);
  public timezone$ = this.timezoneSubject.asObservable();

  constructor(private api: ApiService) {
    this.loadTimezone();
  }

  private loadTimezone(): void {
    this.api.get('/v1/business-profile/time-area-settings').subscribe({
      next: (response: any) => {
        if (response?.data?.timeZone) {
          this.timezoneSubject.next(response.data.timeZone);
        }
        // If no timezone exists, keep the default (Asia/Riyadh)
      },
      error: () => {
        // Keep default Asia/Riyadh if API fails
        console.warn('Failed to load timezone settings, using Asia/Riyadh');
      }
    });
  }

  getTimezone(): string {
    return this.timezoneSubject.value;
  }

  setTimezone(timezone: string): void {
    this.timezoneSubject.next(timezone);
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
      // If timestamp is in seconds (< 10000000000), convert to milliseconds
      const ms = value < 10000000000 ? value * 1000 : value;
      return new Date(ms);
    }
    if (typeof value === 'string') {
      // If it's a numeric string (timestamp)
      if (/^\d+$/.test(value)) {
        const ts = parseInt(value, 10);
        const ms = ts < 10000000000 ? ts * 1000 : ts;
        return new Date(ms);
      }
      
      // For ISO date strings, we need to ensure they're treated as UTC
      // Check if the string already has timezone info
      const hasTimezoneInfo = value.endsWith('Z') || 
                              value.match(/[+-]\d{2}:\d{2}$/) ||
                              value.match(/[+-]\d{4}$/);
      
      if (!hasTimezoneInfo) {
        // No timezone info - assume UTC and add 'Z'
        // This is critical: without 'Z', JavaScript treats the string as local time
        return new Date(value + 'Z');
      }
      
      return new Date(value);
    }
    return new Date(value);
  }

  /**
   * Format a UTC date using the selected timezone
   * This is the single source of truth for all date formatting
   */
  formatDate(utcDate: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    const date = this.toDate(utcDate);
    const timezone = this.getTimezone();
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    
    const mergedOptions = { ...defaultOptions, ...options, timeZone: timezone };
    return new Intl.DateTimeFormat('en-US', mergedOptions).format(date);
  }

  /**
   * Format date for chat display (Today/Yesterday/Date)
   */
  formatChatDate(utcDate: Date | string | number): string {
    const date = this.toDate(utcDate);
    const timezone = this.getTimezone();
    
    // Get current date in the selected timezone
    const nowInTz = new Date(this.formatDate(new Date(), { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }));
    
    // Get the date in the selected timezone
    const dateInTz = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    }).format(date);
    
    const nowDateInTz = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
    
    const timeStr = this.formatDate(date, { hour: '2-digit', minute: '2-digit' });
    
    if (dateInTz === nowDateInTz) {
      return `Today ${timeStr}`;
    }
    
    // Check if yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayInTz = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(yesterday);
    
    if (dateInTz === yesterdayInTz) {
      return `Yesterday ${timeStr}`;
    }
    
    // Return full date
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
    
    // For older dates, return formatted date
    return this.formatDate(date, { month: 'short', day: 'numeric' });
  }
}
