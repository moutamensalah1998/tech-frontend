import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, takeUntil, tap } from 'rxjs';
import { Subject } from 'rxjs';
import {
  selectMessagesByType,
  selectMessagesByTypeLoading,
  selectMessagesByTypeError,
} from '../../../../../../core/services/reports/ngrx/reports.selectors';
import { LoaderComponent } from '../../../../../../shared/components/loader/loader.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-messages-by-type',
  standalone: true,
  imports: [CommonModule, LoaderComponent, BaseChartDirective, TranslatePipe],
  templateUrl: './messages-by-type.component.html',
  styleUrls: ['./messages-by-type.component.css']
})
export class MessagesByTypeComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  messagesByType$: Observable<any>;
  loading$: Observable<boolean>;
  error$: Observable<any>;
  private destroy$ = new Subject<void>();

  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: []
  };

  public pieChartOptions: ChartOptions<'pie'> = {
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
            const percentage = ((value / total) * 100).toFixed(0);
            return `${label}: ${percentage}%`;
          }
        }
      }
    }
  };

  totalMessages: number = 0;
  currentData: any = null;

  constructor(
    private store: Store,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService
  ) {
    this.messagesByType$ = this.store.select(selectMessagesByType);
    this.loading$ = this.store.select(selectMessagesByTypeLoading);
    this.error$ = this.store.select(selectMessagesByTypeError);
  }

  getPercentage(type: string): number {
    if (!this.currentData) return 0;
    const total = (this.currentData.authentication || 0) + (this.currentData.marketing || 0) + (this.currentData.utility || 0);
    if (total === 0) return 0;
    const value = this.currentData[type] || 0;
    return Math.round((value / total) * 100);
  }

  getPercentageForData(data: any, type: string): number {
    if (!data) return 0;
    const total = (data.authentication || 0) + (data.marketing || 0) + (data.utility || 0);
    if (total === 0) return 0;
    const value = data[type] || 0;
    return Math.round((value / total) * 100);
  }

  ngOnInit(): void {
    this.messagesByType$.pipe(
      takeUntil(this.destroy$),
      tap(data => {
        if (!data) {
          this.currentData = null;
          this.totalMessages = 0;
          this.pieChartData = {
            labels: [],
            datasets: []
          };
          return;
        }
        
        this.currentData = data;
        this.totalMessages = (data.authentication || 0) + (data.marketing || 0) + (data.utility || 0);

        this.pieChartData = {
          labels: [
            this.translationService.translate('reports.messagesByType.service'),
            this.translationService.translate('reports.messagesByType.marketing'),
            this.translationService.translate('reports.messagesByType.utility'),
            this.translationService.translate('reports.messagesByType.authentication')
          ],
          datasets: [{
            data: [
              data.utility || 0,
              data.marketing || 0,
              data.utility || 0,
              data.authentication || 0
            ],
            backgroundColor: [
              'rgb(59, 130, 246)',
              'rgb(34, 197, 94)',
              'rgb(249, 115, 22)',
              'rgb(168, 85, 247)'
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
