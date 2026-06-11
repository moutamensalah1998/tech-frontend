import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, takeUntil, tap, combineLatest } from 'rxjs';
import { Subject } from 'rxjs';
import {
  selectMessagesGraph,
  selectMessagesGraphLoading,
  selectMessagesGraphError,
} from '../../../../../../core/services/reports/ngrx/reports.selectors';
import { LoaderComponent } from '../../../../../../shared/components/loader/loader.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { MessagesGraphDataPoint } from '../../../../../../core/models/reports.model';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { ThemeService } from '../../../../../../core/services/theme/theme.service';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-messages-graph',
  standalone: true,
  imports: [CommonModule, LoaderComponent, BaseChartDirective, TranslatePipe],
  templateUrl: './messages-graph.component.html',
  styleUrls: ['./messages-graph.component.css']
})
export class MessagesGraphComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  messagesGraph$: Observable<any>;
  loading$: Observable<boolean>;
  error$: Observable<any>;
  private destroy$ = new Subject<void>();

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          display: true,
        }
      }
    }
  };

  constructor(
    private store: Store,
    private cdr: ChangeDetectorRef,
    private themeService: ThemeService,
    private translationService: TranslationService
  ) {
    this.messagesGraph$ = this.store.select(selectMessagesGraph);
    this.loading$ = this.store.select(selectMessagesGraphLoading);
    this.error$ = this.store.select(selectMessagesGraphError);
  }

  ngOnInit(): void {
    combineLatest([this.messagesGraph$, this.themeService.resolvedTheme$]).pipe(
      takeUntil(this.destroy$),
      tap(([data, theme]: [MessagesGraphDataPoint[] | null, 'light' | 'dark']) => {
        const isDark = theme === 'dark';
        
        // Update chart options colors based on theme
        this.barChartOptions = {
          ...this.barChartOptions,
          plugins: {
            ...this.barChartOptions.plugins,
            legend: {
              ...this.barChartOptions.plugins?.legend,
              labels: {
                color: isDark ? '#A0A0A0' : '#6B7280'
              }
            }
          },
          scales: {
            x: {
              ...this.barChartOptions.scales?.['x'],
              ticks: {
                color: isDark ? '#A0A0A0' : '#6B7280'
              },
              grid: {
                color: isDark ? 'rgba(45, 55, 72, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                display: false
              }
            },
            y: {
              ...this.barChartOptions.scales?.['y'],
              ticks: {
                color: isDark ? '#A0A0A0' : '#6B7280'
              },
              grid: {
                color: isDark ? 'rgba(45, 55, 72, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                display: true
              }
            }
          }
        };

        if (!data || data.length === 0) {
          this.barChartData = {
            labels: [],
            datasets: []
          };
          this.chart?.update();
          return;
        }

        const currentLang = this.translationService.getCurrentLangSync();
        const labels = data.map((item: MessagesGraphDataPoint) => {
          const date = new Date(item.date);
          const month = date.toLocaleString(currentLang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' });
          return `${month} ${date.getDate()}`;
        });

        this.barChartData = {
          labels: [...labels],
          datasets: [
            {
              data: [...data.map((item: MessagesGraphDataPoint) => item.sent)],
              label: this.translationService.translate('reports.messagesGraph.sent'),
              backgroundColor: isDark ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)',
            },
            {
              data: [...data.map((item: MessagesGraphDataPoint) => item.failed)],
              label: this.translationService.translate('reports.messagesGraph.failed'),
              backgroundColor: isDark ? 'rgb(248, 113, 113)' : 'rgb(239, 68, 68)',
            },
            {
              data: [...data.map((item: MessagesGraphDataPoint) => item.unread)],
              label: this.translationService.translate('reports.messagesGraph.unread'),
              backgroundColor: isDark ? 'rgb(251, 146, 60)' : 'rgb(249, 115, 22)',
            },
            {
              data: [...data.map((item: MessagesGraphDataPoint) => item.read)],
              label: this.translationService.translate('reports.messagesGraph.read'),
              backgroundColor: isDark ? 'rgb(74, 222, 128)' : 'rgb(34, 197, 94)',
            }
          ]
        };
        this.cdr.detectChanges();
        setTimeout(() => {
          if (this.chart) {
            this.chart.update();
          }
        }, 100);
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
