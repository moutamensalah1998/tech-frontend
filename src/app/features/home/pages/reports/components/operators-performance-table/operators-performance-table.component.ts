import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
  selectOperatorsPerformance,
  selectOperatorsPerformanceLoading,
  selectOperatorsPerformanceError,
} from '../../../../../../core/services/reports/ngrx/reports.selectors';
import { LoaderComponent } from '../../../../../../shared/components/loader/loader.component';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-operators-performance-table',
  standalone: true,
  imports: [CommonModule, LoaderComponent, TranslatePipe],
  templateUrl: './operators-performance-table.component.html',
  styleUrls: ['./operators-performance-table.component.css']
})
export class OperatorsPerformanceTableComponent implements OnInit {
  operatorsPerformance$: Observable<any>;
  loading$: Observable<boolean>;
  error$: Observable<any>;

  constructor(private store: Store) {
    this.operatorsPerformance$ = this.store.select(selectOperatorsPerformance);
    this.loading$ = this.store.select(selectOperatorsPerformanceLoading);
    this.error$ = this.store.select(selectOperatorsPerformanceError);
  }

  ngOnInit(): void {}

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
