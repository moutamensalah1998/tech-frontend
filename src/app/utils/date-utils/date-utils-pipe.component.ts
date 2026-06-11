import { Pipe, PipeTransform } from "@angular/core";
import { DateUtils } from "../../core/utils/datetime.pipe";

@Pipe({
  name: 'dateUtils',
  pure: true,
})
export class DateUtilsPipe implements PipeTransform {
  transform(value: any, formatType: string = 'default', locale: string = 'en-US'): any {
    if (!value) return '';

    switch (formatType) {
      case 'short':
        return DateUtils.shortDate(value, locale);
      case 'long':
        return DateUtils.longDate(value, locale);
      case 'full':
        return DateUtils.fullDateTime(value, locale);
      case 'time':
        return DateUtils.timeOnly(value, locale);
      case 'time12':
        return DateUtils.time12Hour(value, locale);
      case 'chat':
        return DateUtils.chatFormat(value, locale);
      case 'relative':
        return DateUtils.relative(value);
      case 'timestamp':
        return DateUtils.toTimestamp(value);
      default:
        return DateUtils.format(value, { locale });
    }
  }

}
