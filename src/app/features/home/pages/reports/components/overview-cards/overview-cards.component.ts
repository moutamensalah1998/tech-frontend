import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
  selectOverview,
  selectOverviewLoading,
  selectOverviewError,
} from '../../../../../../core/services/reports/ngrx/reports.selectors';
import { LoaderComponent } from '../../../../../../shared/components/loader/loader.component';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-overview-cards',
  standalone: true,
  imports: [CommonModule, LoaderComponent, TranslatePipe],
  templateUrl: './overview-cards.component.html',
  styleUrls: ['./overview-cards.component.css']
})
export class OverviewCardsComponent implements OnInit {
  overview$: Observable<any>;
  loading$: Observable<boolean>;
  error$: Observable<any>;

  constructor(private store: Store) {
    this.overview$ = this.store.select(selectOverview);
    this.loading$ = this.store.select(selectOverviewLoading);
    this.error$ = this.store.select(selectOverviewError);
  }

  ngOnInit(): void {}
}

