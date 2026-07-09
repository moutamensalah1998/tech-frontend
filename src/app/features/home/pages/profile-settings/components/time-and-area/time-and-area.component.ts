import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';
import { ToastService } from '../../../../../../core/services/toast-message.service';
import { ApiService } from '../../../../../../core/api/api.service';
import { TimezoneService } from '../../../../../../core/services/timezone/timezone.service';

interface TimeZone {
  value: string;
  label: string;
  offset: string;
}

interface WorkingDay {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-time-and-area',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './time-and-area.component.html',
  styleUrls: ['./time-and-area.component.css']
})
export class TimeAndAreaComponent implements OnInit, OnDestroy {
  timeAreaForm!: FormGroup;
  private destroy$ = new Subject<void>();
  
  isLoading = false;
  isSaving = false;
  
  timeZones: TimeZone[] = [
    { value: 'UTC', label: 'UTC', offset: '+00:00' },
    { value: 'America/New_York', label: 'Eastern Time (US)', offset: '-05:00' },
    { value: 'America/Chicago', label: 'Central Time (US)', offset: '-06:00' },
    { value: 'America/Denver', label: 'Mountain Time (US)', offset: '-07:00' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US)', offset: '-08:00' },
    { value: 'Europe/London', label: 'London', offset: '+00:00' },
    { value: 'Europe/Paris', label: 'Paris', offset: '+01:00' },
    { value: 'Europe/Berlin', label: 'Berlin', offset: '+01:00' },
    { value: 'Asia/Dubai', label: 'Dubai', offset: '+04:00' },
    { value: 'Asia/Riyadh', label: 'Riyadh', offset: '+03:00' },
    { value: 'Asia/Kuwait', label: 'Kuwait', offset: '+03:00' },
    { value: 'Asia/Qatar', label: 'Qatar', offset: '+03:00' },
    { value: 'Asia/Karachi', label: 'Karachi', offset: '+05:00' },
    { value: 'Asia/Kolkata', label: 'Mumbai', offset: '+05:30' },
    { value: 'Asia/Singapore', label: 'Singapore', offset: '+08:00' },
    { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00' },
    { value: 'Australia/Sydney', label: 'Sydney', offset: '+11:00' },
  ];

  workingDays: WorkingDay[] = [
    { day: 'monday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'tuesday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'wednesday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'thursday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'friday', enabled: true, startTime: '09:00', endTime: '17:00' },
    { day: 'saturday', enabled: false, startTime: '09:00', endTime: '17:00' },
    { day: 'sunday', enabled: false, startTime: '09:00', endTime: '17:00' },
  ];

  regions = [
    { value: 'north-america', label: 'North America', flag: '🌎' },
    { value: 'south-america', label: 'South America', flag: '🌎' },
    { value: 'europe', label: 'Europe', flag: '🌍' },
    { value: 'africa', label: 'Africa', flag: '🌍' },
    { value: 'middle-east', label: 'Middle East', flag: '🌍' },
    { value: 'asia', label: 'Asia', flag: '🌏' },
    { value: 'oceania', label: 'Oceania', flag: '🌏' },
  ];

  currencies = [
    { value: 'USD', label: 'US Dollar', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
    { value: 'GBP', label: 'British Pound', symbol: '£' },
    { value: 'SAR', label: 'Saudi Riyal', symbol: '﷼' },
    { value: 'AED', label: 'UAE Dirham', symbol: 'د.إ' },
    { value: 'KWD', label: 'Kuwaiti Dinar', symbol: 'د.ك' },
    { value: 'QAR', label: 'Qatari Riyal', symbol: '﷼' },
    { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
    { value: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
    { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
  ];

  constructor(
    private fb: FormBuilder,
    private translationService: TranslationService,
    private toast: ToastService,
    private api: ApiService,
    private timezoneService: TimezoneService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.timeAreaForm = this.fb.group({
      timeZone: ['Asia/Riyadh', Validators.required],
      region: ['middle-east', Validators.required],
      currency: ['USD', Validators.required],
      dateFormat: ['MM/DD/YYYY', Validators.required],
      timeFormat: ['12h', Validators.required],
      firstDayOfWeek: ['sunday', Validators.required],
      enableWorkingHours: [true],
      workingDays: this.fb.array(
        this.workingDays.map(day => this.fb.group({
          day: [day.day],
          enabled: [day.enabled],
          startTime: [day.startTime],
          endTime: [day.endTime]
        }))
      )
    });
  }

  get workingDaysArray() {
    return this.timeAreaForm.get('workingDays') as any;
  }

  private loadSettings(): void {
    this.isLoading = true;
    this.api.get('/v1/business-profile/time-area-settings').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response?.data) {
          this.patchFormValues(response.data);
        }
      },
      error: () => {
        this.isLoading = false;
        // Use default values if API fails
      }
    });
  }

  private patchFormValues(data: any): void {
    if (data.timeZone) {
      this.timeAreaForm.patchValue({ timeZone: data.timeZone });
    }
    if (data.region) {
      this.timeAreaForm.patchValue({ region: data.region });
    }
    if (data.currency) {
      this.timeAreaForm.patchValue({ currency: data.currency });
    }
    if (data.dateFormat) {
      this.timeAreaForm.patchValue({ dateFormat: data.dateFormat });
    }
    if (data.timeFormat) {
      this.timeAreaForm.patchValue({ timeFormat: data.timeFormat });
    }
    if (data.firstDayOfWeek) {
      this.timeAreaForm.patchValue({ firstDayOfWeek: data.firstDayOfWeek });
    }
    if (data.enableWorkingHours !== undefined) {
      this.timeAreaForm.patchValue({ enableWorkingHours: data.enableWorkingHours });
    }
  }

  saveSettings(): void {
    if (this.timeAreaForm.invalid) {
      this.toast.showToast('Please fix the form errors before saving', 'error');
      return;
    }

    this.isSaving = true;
    const formData = this.timeAreaForm.value;

    this.api.put('/v1/business-profile/time-area-settings', formData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isSaving = false;
        // Update the timezone service immediately so all timestamps refresh
        if (formData.timeZone) {
          this.timezoneService.setTimezone(formData.timeZone);
        }
        this.toast.showToast(
          this.translationService.translate('profile.timeArea.saveSuccess'),
          'success'
        );
      },
      error: () => {
        this.isSaving = false;
        this.toast.showToast(
          this.translationService.translate('profile.timeArea.saveError'),
          'error'
        );
      }
    });
  }

  toggleDay(index: number): void {
    const dayGroup = this.workingDaysArray.at(index);
    dayGroup.patchValue({ enabled: !dayGroup.value.enabled });
  }

  getDayLabel(day: string): string {
    return this.translationService.translate(`profile.timeArea.days.${day}`);
  }

  getTimeZoneOffset(tz: TimeZone): string {
    return tz.offset;
  }
}