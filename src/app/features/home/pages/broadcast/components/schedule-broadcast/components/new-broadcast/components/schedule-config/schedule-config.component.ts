import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-schedule-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './schedule-config.component.html',
})
export class ScheduleConfigComponent {
  @Input() form!: FormGroup;
  @Output() scheduleChanged = new EventEmitter<{ isNow: boolean; scheduledTime?: string }>();

  onScheduleChange(isNow: boolean) {
    const scheduledCtrl = this.form.get('scheduled_time');

    if (!isNow) {
      scheduledCtrl?.setValidators([Validators.required]);
    } else {
      scheduledCtrl?.clearValidators();
      this.form.patchValue({ scheduled_time: '' });
    }

    scheduledCtrl?.updateValueAndValidity();

    this.scheduleChanged.emit({
      isNow,
      scheduledTime: isNow ? '' : this.form.get('scheduled_time')?.value
    });
  }

  getMinDateTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  }
}
