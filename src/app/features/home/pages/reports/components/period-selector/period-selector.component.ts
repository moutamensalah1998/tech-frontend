import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportPeriodParams, PeriodType } from '../../../../../../core/models/reports.model';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-period-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './period-selector.component.html',
  styleUrls: ['./period-selector.component.css']
})
export class PeriodSelectorComponent implements OnInit {
  @Input() currentPeriod: ReportPeriodParams = { period_type: 'last_7_days' };
  @Output() periodChange = new EventEmitter<ReportPeriodParams>();

  periodType: PeriodType = 'last_7_days';
  startDate: string = '';
  endDate: string = '';
  showCustomDates = false;

  periodOptions: { value: PeriodType; label: string }[] = [
    { value: 'today', label: 'reports.period.today' },
    { value: 'yesterday', label: 'reports.period.yesterday' },
    { value: 'last_7_days', label: 'reports.period.last7Days' },
    { value: 'last_month', label: 'reports.period.lastMonth' },
    { value: 'custom', label: 'reports.period.custom' }
  ];

  ngOnInit(): void {
    if (this.currentPeriod) {
      this.periodType = this.currentPeriod.period_type;
      if (this.currentPeriod.start_date) {
        this.startDate = this.formatDateForInput(this.currentPeriod.start_date);
      }
      if (this.currentPeriod.end_date) {
        this.endDate = this.formatDateForInput(this.currentPeriod.end_date);
      }
      this.showCustomDates = this.periodType === 'custom';
    }
  }

  selectPeriod(period: PeriodType): void {
    this.periodType = period;
    this.onPeriodTypeChange();
  }

  onPeriodTypeChange(): void {
    this.showCustomDates = this.periodType === 'custom';
    
    if (this.periodType !== 'custom') {
      this.startDate = '';
      this.endDate = '';
    } else {
      // Set default dates when custom is selected: one year ago to today
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      this.startDate = oneYearAgo.toISOString().split('T')[0];
      this.endDate = today.toISOString().split('T')[0];
    }

    this.emitPeriodChange();
  }

  onDateChange(): void {
    if (this.periodType === 'custom') {
      this.emitPeriodChange();
    }
  }

  private emitPeriodChange(): void {
    const params: ReportPeriodParams = {
      period_type: this.periodType
    };

    if (this.periodType === 'custom') {
      if (this.startDate) {
        params.start_date = this.formatDateForAPI(this.startDate);
      }
      if (this.endDate) {
        params.end_date = this.formatDateForAPI(this.endDate);
      }
    }

    this.periodChange.emit(params);
  }

  private formatDateForInput(dateString: string): string {
    // Convert ISO date string to YYYY-MM-DD format for input[type="date"]
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  private formatDateForAPI(dateString: string): string {
    // Convert YYYY-MM-DD to ISO format
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString();
  }

  getMaxDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getPeriodDateRange(): string {
    const today = new Date();
    let start: Date;
    let end: Date = new Date(today);

    switch (this.periodType) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        break;
      case 'yesterday':
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        end = new Date(start);
        break;
      case 'last_7_days':
        start = new Date(today);
        start.setDate(start.getDate() - 6);
        break;
      case 'last_month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return '';
    }

    return `${this.formatDateDisplay(start.toISOString().split('T')[0])} - ${this.formatDateDisplay(end.toISOString().split('T')[0])}`;
  }

  formatDateDisplay(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
}

