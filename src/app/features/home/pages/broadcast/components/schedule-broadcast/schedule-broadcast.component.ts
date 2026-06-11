import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import * as ScheduledBroadcastActions from '../../../../../../core/services/broadcast/scheduled broadcast/ngrx/scheduled-broadcast.actions';
import {
  selectBroadcasts,
  selectBroadcastsData,
  selectBroadcastsPagination,
  selectBroadcastsLoading,
  selectBroadcastsError,
  selectDeleteLoading,
  selectDeleteSuccess,
} from '../../../../../../core/services/broadcast/scheduled broadcast/ngrx/scheduled-broadcast.selectors';
import { BroadcastResponse, BroadcastData } from '../../../../../../core/models/broadcast.model';
import { ToastService } from '../../../../../../core/services/toast-message.service';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination.component';
import { BroadcastDetailsDialogComponent, BroadcastDialogData } from './components/broadcast-details-dialog/broadcast-details-dialog.component';
import { SbHeaderComponent } from './components/sb-header/sb-header.component';
import { SbTableComponent } from './components/sb-table/sb-table.component';
import { LoaderComponent } from "../../../../../../shared/components/loader/loader.component";
import { TranslationService } from '../../../../../../core/services/translation/translation.service';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-schedule-broadcast',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    SbHeaderComponent,
    SbTableComponent,
    PaginationComponent,
    LoaderComponent,
    TranslatePipe
  ],
  templateUrl: './schedule-broadcast.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleBroadcastComponent implements OnInit, OnDestroy {
  broadcasts$: Observable<BroadcastData[]>;
  broadcastsResponse$: Observable<BroadcastResponse | null>;
  // loading$: Observable<boolean>;
  error$: Observable<any>;
  deleteLoading$: Observable<boolean>;
  deleteSuccess$: Observable<boolean>;

  loading$ = this.store.select(selectBroadcastsLoading);

  currentPage = 1;
  limit = 10;
  totalPages = 1;
  totalCount = 0;

  currentSearch = '';
  currentSort = '';

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private router: Router,
    private dialog: MatDialog,
    private toastService: ToastService,
    private translationService: TranslationService
  ) {
    this.broadcastsResponse$ = this.store.select(selectBroadcasts);
    this.broadcasts$ = this.store.select(selectBroadcastsData);
    this.loading$ = this.store.select(selectBroadcastsLoading);
    this.error$ = this.store.select(selectBroadcastsError);
    this.deleteLoading$ = this.store.select(selectDeleteLoading);
    this.deleteSuccess$ = this.store.select(selectDeleteSuccess);
  }

  ngOnInit(): void {
    this.loadBroadcasts();

    this.store.select(selectBroadcastsPagination)
      .pipe(takeUntil(this.destroy$))
      .subscribe(pagination => {
        this.totalCount = pagination.total_count;
        this.totalPages = pagination.total_pages;
        this.currentPage = pagination.page;
        this.limit = pagination.limit;
      });

    this.deleteSuccess$
      .pipe(takeUntil(this.destroy$))
      .subscribe(success => {
        if (success) {
          this.toastService.showToast(this.translationService.translate('broadcast.scheduled.messages.deletedSuccess'), 'success');
          this.loadBroadcasts(this.currentSearch, this.currentSort);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBroadcasts(searchName?: string, sort_By?: string) {
    this.store.dispatch(ScheduledBroadcastActions.loadBroadcasts({
      limit: this.limit,
      page: this.currentPage,
      search_name: searchName,
      sort_by: sort_By,
    }));
  }

  onNewBroadcast() {
    this.router.navigate(['/dashboard/broadcast/scheduled-broadcasts/new']);
  }

  onSearchChanged(searchValue: string) {
    this.currentPage = 1;
    this.currentSearch = (searchValue ?? '').trim();
    this.loadBroadcasts(this.currentSearch, this.currentSort);
  }

  onSortByChange(sortBy: string) {
    this.currentPage = 1;
    this.currentSort = (sortBy ?? '').trim();
    this.loadBroadcasts(this.currentSearch, this.currentSort);
  }

  onPageChange(newPage: number) {
    this.currentPage = newPage;
    this.loadBroadcasts(this.currentSearch, this.currentSort);
  }

  onLimitChange(newLimit: number) {
    this.limit = newLimit;
    this.currentPage = 1;
    this.loadBroadcasts(this.currentSearch, this.currentSort);
  }

  onViewBroadcast(broadcast: BroadcastData) {
    const dialogRef = this.dialog.open(BroadcastDetailsDialogComponent, {
      width: '100%',
      height: '100%',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: { broadcast } as BroadcastDialogData,
      panelClass: 'broadcast-details-dialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
      }
    });
  }

  onDeleteBroadcast(broadcastId: string, broadcastName?: string) {
    const message = this.translationService.translate('broadcast.scheduled.messages.deleteConfirm', { name: broadcastName || 'this broadcast' });
    if (!confirm(message)) {
      return;
    }
    this.store.dispatch(ScheduledBroadcastActions.deleteBroadcast({ broadcast_id: broadcastId }));
  }

  onEditBroadcast(broadcast: BroadcastData) {
    this.router.navigate(['/dashboard/broadcast/scheduled-broadcasts/edit'], {
      queryParams: { broadcastId: broadcast.id }
    });
  }

  onRetryBroadcast(broadcast: BroadcastData) {
    const message = this.translationService.translate('broadcast.scheduled.messages.retryConfirm', { name: broadcast.name || 'this broadcast' });
    if (!confirm(message)) return;
    this.toastService.showToast(this.translationService.translate('broadcast.scheduled.messages.retryInitiated'), 'info');
  }

  onDuplicateBroadcast(broadcast: BroadcastData) {
    this.router.navigate(['/dashboard/broadcast/scheduled-broadcasts/new'], {
      queryParams: { duplicateFrom: broadcast.id }
    });
  }
}
