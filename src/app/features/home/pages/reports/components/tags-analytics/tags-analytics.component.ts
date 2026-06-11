import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, takeUntil, tap } from 'rxjs';
import { Subject } from 'rxjs';
import {
  selectTagsAnalytics,
  selectTagsAnalyticsLoading,
  selectTagsAnalyticsError,
} from '../../../../../../core/services/reports/ngrx/reports.selectors';
import { LoaderComponent } from '../../../../../../shared/components/loader/loader.component';
import { BaseChartDirective } from 'ng2-charts';
import { TagAnalytics } from '../../../../../../core/models/reports.model';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-tags-analytics',
  standalone: true,
  imports: [CommonModule, LoaderComponent, BaseChartDirective, TranslatePipe],
  templateUrl: './tags-analytics.component.html',
  styleUrls: ['./tags-analytics.component.css']
})
export class TagsAnalyticsComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  tagsAnalytics$: Observable<any>;
  loading$: Observable<boolean>;
  error$: Observable<any>;
  private destroy$ = new Subject<void>();

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  public barChartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.parsed.x}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: false,
        }
      },
      y: {
        grid: {
          display: false,
        }
      }
    }
  };

  constructor(
    private store: Store,
    private cdr: ChangeDetectorRef
  ) {
    this.tagsAnalytics$ = this.store.select(selectTagsAnalytics);
    this.loading$ = this.store.select(selectTagsAnalyticsLoading);
    this.error$ = this.store.select(selectTagsAnalyticsError);
  }

  ngOnInit(): void {
    this.tagsAnalytics$.pipe(
      takeUntil(this.destroy$),
      tap((data: TagAnalytics[] | null) => {
        if (!data || data.length === 0) {
          this.barChartData = {
            labels: [],
            datasets: []
          };
          return;
        }
        
        // Sort by count descending and take top 6
        const sorted = [...data].sort((a: TagAnalytics, b: TagAnalytics) => b.count - a.count).slice(0, 6);
        const labels = sorted.map((item: TagAnalytics) => item.tag_name);
        const counts = sorted.map((item: TagAnalytics) => item.count);
        
        // Color palette
        const colors = [
          'rgb(59, 130, 246)',   // Blue
          'rgb(34, 197, 94)',    // Green
          'rgb(249, 115, 22)',   // Orange
          'rgb(147, 51, 234)',   // Purple
          'rgb(236, 72, 153)',   // Pink
          'rgb(14, 165, 233)'    // Cyan
        ];

        this.barChartData = {
          labels: [...labels],
          datasets: [{
            data: [...counts],
            backgroundColor: colors.slice(0, labels.length),
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
