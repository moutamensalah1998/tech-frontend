import { Pipe, PipeTransform, inject } from "@angular/core";
import { TimezoneService } from "../../core/services/timezone/timezone.service";

@Pipe({
  name: 'dateUtils',
  pure: false, // React to timezone changes
})
export class DateUtilsPipe implements PipeTransform {
  private timezoneService = inject(TimezoneService);

  transform(value: any, formatType: string = 'default', locale: string = 'en-US'): any {
    if (!value) return '';

    // Use the timezone service as the single source of truth
    switch (formatType) {
      case 'chat':
        return this.timezoneService.formatChatDate(value);
      case 'relative':
        return this.timezoneService.getRelativeTime(value);
      case 'short':
        return this.timezoneService.formatDate(value, { month: '2-digit', day: '2-digit', year: 'numeric' });
      case 'long':
        return this.timezoneService.formatDate(value, { month: 'long', day: 'numeric', year: 'numeric' });
      case 'full':
        return this.timezoneService.formatDate(value, { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
      case 'time':
        return this.timezoneService.formatDate(value, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      case 'time12':
        return this.timezoneService.formatDate(value, { hour: '2-digit', minute: '2-digit', hour12: true });
      case 'timestamp':
        return new Date(value).getTime();
      default:
        return this.timezoneService.formatDate(value, { 
          month: 'short', day: 'numeric', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
    }
  }

}
