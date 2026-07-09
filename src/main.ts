import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/features/app/app.component';
import { appConfig } from './app/app.config';
import './app/core/config/chart.config';
import { DateUtils } from './app/core/utils/datetime.pipe';
import { TimezoneService } from './app/core/services/timezone/timezone.service';

bootstrapApplication(AppComponent, appConfig)
  .then((ref) => {
    // Initialize DateUtils with TimezoneService for static method usage
    const timezoneService = ref.injector.get(TimezoneService);
    DateUtils.initialize(timezoneService);
  })
  .catch((err) => console.error(err));
