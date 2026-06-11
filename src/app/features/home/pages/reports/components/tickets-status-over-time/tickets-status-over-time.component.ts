import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, takeUntil, tap } from 'rxjs';
import { Subject } from 'rxjs';
import {
  selectTicketsStatusOverTime,
  selectTicketsStatusOverTimeLoading,
  selectTicketsStatusOverTimeError,
} from '../../../../../../core/services/reports/ngrx/reports.selectors';
import { LoaderComponent } from '../../../../../../shared/components/loader/loader.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { TicketsStatusOverTimeDataPoint } from '../../../../../../core/models/reports.model';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-tickets-status-over-time',
  standalone: true,
  imports: [CommonModule, LoaderComponent, BaseChartDirective, TranslatePipe],
  templateUrl: './tickets-status-over-time.component.html',
  styleUrls: ['./tickets-status-over-time.component.css']
})
export class TicketsStatusOverTimeComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  ticketsStatusOverTime$: Observable<any>;
  loading$: Observable<boolean>;
  error$: Observable<any>;
  private destroy$ = new Subject<void>();

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  constructor(
    private store: Store,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService
  ) {
    this.ticketsStatusOverTime$ = this.store.select(selectTicketsStatusOverTime);
    this.loading$ = this.store.select(selectTicketsStatusOverTimeLoading);
    this.error$ = this.store.select(selectTicketsStatusOverTimeError);
  }

  ngOnInit(): void {
    this.ticketsStatusOverTime$.pipe(
      takeUntil(this.destroy$),
      tap((data: TicketsStatusOverTimeDataPoint[] | null) => {
        if (!data || data.length === 0) {
          this.lineChartData = {
            labels: [],
            datasets: []
          };
          return;
        }
        
        const currentLang = this.translationService.getCurrentLangSync();
        const labels = data.map((item: TicketsStatusOverTimeDataPoint) => {
          const date = new Date(item.date);
          const month = date.toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' });
          return `${month} ${date.getDate()}`;
        });

        this.lineChartData = {
          labels: [...labels],
          datasets: [
            {
              data: [...data.map((item: TicketsStatusOverTimeDataPoint) => item.open)],
              label: this.translationService.translate('reports.ticketsStatusOverTime.open'),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: false,
            },
            {
              data: [...data.map((item: TicketsStatusOverTimeDataPoint) => item.pending)],
              label: this.translationService.translate('reports.ticketsStatusOverTime.pending'),
              borderColor: 'rgb(249, 115, 22)',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              tension: 0.4,
              fill: false,
            },
            {
              data: [...data.map((item: TicketsStatusOverTimeDataPoint) => item.solved)],
              label: this.translationService.translate('reports.ticketsStatusOverTime.solved'),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: false,
            },
            {
              data: [...data.map((item: TicketsStatusOverTimeDataPoint) => item.expired)],
              label: this.translationService.translate('reports.ticketsStatusOverTime.expired'),
              borderColor: 'rgb(107, 114, 128)',
              backgroundColor: 'rgba(107, 114, 128, 0.1)',
              tension: 0.4,
              fill: false,
            }
          ]
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
