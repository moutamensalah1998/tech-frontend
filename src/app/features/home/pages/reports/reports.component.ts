import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import {
  loadOverviewReport,
  loadMessagesByType,
  loadMessagesGraph,
  loadTicketsStatusOverTime,
  loadTicketsTotalByStatus,
  loadOperatorsPerformance,
  loadTagsAnalytics,
} from '../../../../core/services/reports/ngrx/reports.actions';
import { selectCurrentPeriod } from '../../../../core/services/reports/ngrx/reports.selectors';
import { ReportPeriodParams } from '../../../../core/models/reports.model';
import { PeriodSelectorComponent } from './components/period-selector/period-selector.component';
import { OverviewCardsComponent } from './components/overview-cards/overview-cards.component';
import { MessagesByTypeComponent } from './components/messages-by-type/messages-by-type.component';
import { MessagesGraphComponent } from './components/messages-graph/messages-graph.component';
import { TicketsStatusOverTimeComponent } from './components/tickets-status-over-time/tickets-status-over-time.component';
import { TicketsTotalByStatusComponent } from './components/tickets-total-by-status/tickets-total-by-status.component';
import { OperatorsPerformanceTableComponent } from './components/operators-performance-table/operators-performance-table.component';
import { TagsAnalyticsComponent } from './components/tags-analytics/tags-analytics.component';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { ReportsService } from '../../../../core/services/reports/reports.service';
import { ToastService } from '../../../../core/services/toast-message.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    PeriodSelectorComponent,
    OverviewCardsComponent,
    MessagesByTypeComponent,
    MessagesGraphComponent,
    TicketsStatusOverTimeComponent,
    TicketsTotalByStatusComponent,
    OperatorsPerformanceTableComponent,
    TagsAnalyticsComponent,
    TranslatePipe,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentPeriod$ = this.store.select(selectCurrentPeriod);
  currentPeriod: ReportPeriodParams = { period_type: 'last_7_days' };

  isExporting = false;

  constructor(
    private store: Store,
    private reportsService: ReportsService,
    private toastService: ToastService,
  ) {
    this.currentPeriod$.pipe(takeUntil(this.destroy$)).subscribe(period => {
      if (period) {
        this.currentPeriod = period;
      }
    });
  }

  ngOnInit(): void {
    // Load all reports with default period
    const defaultPeriod: ReportPeriodParams = { period_type: 'last_7_days' };
    this.loadAllReports(defaultPeriod);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPeriodChange(period: ReportPeriodParams): void {
    this.loadAllReports(period);
  }

  private loadAllReports(period: ReportPeriodParams): void {
    this.store.dispatch(loadOverviewReport({ params: period }));
    this.store.dispatch(loadMessagesByType({ params: period }));
    this.store.dispatch(loadMessagesGraph({ params: period }));
    this.store.dispatch(loadTicketsStatusOverTime({ params: period }));
    this.store.dispatch(loadTicketsTotalByStatus({ params: period }));
    this.store.dispatch(loadOperatorsPerformance({ params: period }));
    this.store.dispatch(loadTagsAnalytics({ params: period }));
  }

  onExportReport(): void {
    if (this.isExporting) return;
    this.isExporting = true;
    this.toastService.showToast('Generating report export...', 'info');
    this.reportsService.exportReport(this.currentPeriod).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.download = `Proggate_Report_${timestamp}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isExporting = false;
        this.toastService.showToast('Report exported successfully!', 'success');
      },
      error: (err) => {
        console.error('Report export error:', err);
        this.isExporting = false;
        this.toastService.showToast('Failed to export report. Please try again.', 'error');
      },
    });
  }
}

