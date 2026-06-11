import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, takeUntil, tap } from 'rxjs';
import { Subject } from 'rxjs';
import {
  selectTicketsTotalByStatus,
  selectTicketsTotalByStatusLoading,
  selectTicketsTotalByStatusError,
} from '../../../../../../core/services/reports/ngrx/reports.selectors';
import { LoaderComponent } from '../../../../../../shared/components/loader/loader.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-tickets-total-by-status',
  standalone: true,
  imports: [CommonModule, LoaderComponent, BaseChartDirective, TranslatePipe],
  templateUrl: './tickets-total-by-status.component.html',
  styleUrls: ['./tickets-total-by-status.component.css']
})
export class TicketsTotalByStatusComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  ticketsTotalByStatus$: Observable<any>;
  loading$: Observable<boolean>;
  error$: Observable<any>;
  private destroy$ = new Subject<void>();

  public doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: []
  };

  public doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  totalTickets: number = 0;

  constructor(
    private store: Store,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService
  ) {
    this.ticketsTotalByStatus$ = this.store.select(selectTicketsTotalByStatus);
    this.loading$ = this.store.select(selectTicketsTotalByStatusLoading);
    this.error$ = this.store.select(selectTicketsTotalByStatusError);
  }

  ngOnInit(): void {
    this.ticketsTotalByStatus$.pipe(
      takeUntil(this.destroy$),
      tap(data => {
        if (!data) {
          this.totalTickets = 0;
          this.doughnutChartData = {
            labels: [],
            datasets: []
          };
          return;
        }
        
        this.totalTickets = data.open + data.pending + data.solved + data.expired;

          this.doughnutChartData = {
            labels: [
              this.translationService.translate('reports.ticketsTotalByStatus.open'),
              this.translationService.translate('reports.ticketsTotalByStatus.pending'),
              this.translationService.translate('reports.ticketsTotalByStatus.solved'),
              this.translationService.translate('reports.ticketsTotalByStatus.expired')
            ],
            datasets: [{
              data: [data.open, data.pending, data.solved, data.expired],
              backgroundColor: [
                'rgb(59, 130, 246)',
                'rgb(249, 115, 22)',
                'rgb(34, 197, 94)',
                'rgb(107, 114, 128)'
              ],
              borderWidth: 0,
            }]
          };
        this.cdr.detectChanges();
        setTimeout(() => {
          this.chart?.update();
        }, 0);
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
