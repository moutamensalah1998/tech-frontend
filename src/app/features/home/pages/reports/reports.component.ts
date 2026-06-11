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

  constructor(private store: Store) {
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
}

