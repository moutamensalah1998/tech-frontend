import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/features/app/app.component';
import { appConfig } from './app/app.config';
import './app/core/config/chart.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
