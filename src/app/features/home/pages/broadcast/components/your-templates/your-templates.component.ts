import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, take, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import * as TemplateActions from '../../../../../../core/services/broadcast/template/ngrx/your-template.actions';
import { selectTemplates, selectTemplateError, selectSyncing } from '../../../../../../core/services/broadcast/template/ngrx/your-template.selectors';

// ✅ updated imports
import {
  WhatsAppTemplate,
  TemplateApiResponse,
  TemplateItem,
} from '../../../../../../core/models/whatsapp-template.model';

import {
  TemplateDetailsComponent,
  TemplateDialogData,
} from './components/edit-temp-dialog/edit-temp-dialog.component';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';
import { PaginationComponent } from '../../../../../../shared/components/pagination/pagination.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterOutlet, TranslatePipe, PaginationComponent],
  selector: 'app-your-templates',
  templateUrl: './your-templates.component.html',
})
export class YourTemplatesComponent implements OnInit, OnDestroy {
  template$: Observable<TemplateApiResponse>;
  error$: Observable<any>;
  isSyncing$: Observable<boolean>;
  newTemplate: boolean = false;

  sortedBy: 'NONE' | 'ASCENDING' | 'DESCENDING' = 'NONE';
  limit = 10;
  page = 1;
  searchTerm = '';

  private searchSubject = new Subject<string>();
  private sortSubject = new Subject<'NONE' | 'ASCENDING' | 'DESCENDING'>();
  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private store: Store,
    public router: Router,
    private route: ActivatedRoute,
    private translationService: TranslationService
  ) {
    this.template$ = this.store.select(selectTemplates);
    this.error$ = this.store.select(selectTemplateError);
    this.isSyncing$ = this.store.select(selectSyncing);
  }

  ngOnInit() {
    this.page = 1;
    this.limit = 10;
    this.sortedBy = 'NONE';
    this.searchTerm = '';

    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchTerm = term ?? '';
        this.page = 1;
        this.dispatchLoadTemplates();
        console.log('Debounced search fired:', this.searchTerm);
      });

    this.sortSubject
      .pipe(debounceTime(1000), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((sortVal) => {
        this.sortedBy = sortVal ?? 'NONE';
        this.page = 1;
        this.dispatchLoadTemplates();
        console.log('Debounced sort fired:', this.sortedBy);
      });

    this.dispatchLoadTemplates();

    this.template$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      console.log('Template Data length:', data?.data?.length);
    });

    this.error$.pipe(takeUntil(this.destroy$)).subscribe((error) => {
      if (error) {
        console.error('Template loading error:', error);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getSortParam(): string {
    switch (this.sortedBy) {
      case 'ASCENDING':
        return 'ASCENDING';
      case 'DESCENDING':
        return 'DESCENDING';
      case 'NONE':
      default:
        return '';
    }
  }

  private dispatchLoadTemplates() {
    this.store.dispatch(
      TemplateActions.loadTemplates({
        page_number: this.page,
        limit: this.limit,
        sort_by: this.getSortParam(),
        search_name: this.searchTerm,
      })
    );
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.dispatchLoadTemplates();
  }

  onNextPage() {
    this.template$.pipe(take(1)).subscribe((data) => {
      const afterCursor = data?.meta?.next_page;
      if (afterCursor) {
        this.page++;
        this.dispatchLoadTemplates();
      }
    });
  }

  onPreviousPage() {
    this.template$.pipe(take(1)).subscribe((data) => {
      const prevCursor = data?.meta?.prev_page;
      if (prevCursor && this.page > 1) {
        this.page = Math.max(1, this.page - 1);
        this.dispatchLoadTemplates();
      }
    });
  }

  onNewTemplate() {
    this.newTemplate = true;
  }

  onSearchChange(event: any) {
    const v = event?.target?.value ?? '';
    this.searchSubject.next(v);
    this.searchTerm = v;
  }

  onSortedByChange(event: any) {
    const v = (event?.target?.value ?? 'NONE') as
      | 'NONE'
      | 'ASCENDING'
      | 'DESCENDING';
    this.sortSubject.next(v);
    this.sortedBy = v;
  }

  onLimitChange(newLimit: number) {
    if (!isNaN(newLimit) && newLimit > 0) {
      this.limit = newLimit;
      this.page = 1;
      this.dispatchLoadTemplates();
    }
  }

  sendBroadcast(template: WhatsAppTemplate) {
    this.router.navigate(['/dashboard/broadcast/scheduled-broadcasts/new'], {
      queryParams: {
        templateId: template.id,
        templateName: template.name,
      },
    });
  }

  openDialog(template: WhatsAppTemplate) {
    const dialogRef = this.dialog.open(TemplateDetailsComponent, {
      width: '100%',
      height: '100%',
      maxWidth: '100vw',
      maxHeight: '100vh',
      data: { template } as TemplateDialogData,
      panelClass: 'template-details-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
      }
    });
  }

  onEditTemplate(template: WhatsAppTemplate) {
    this.router.navigate(['/dashboard/broadcast/your-templates/edit'], {
      queryParams: {
        templateId: template.id,
        templateName: template.name,
      },
    });
  }

  onDeleteTemplate(template: WhatsAppTemplate) {
    const message = this.translationService.translate('broadcast.templates.messages.deleteConfirm', { name: template.name });
    if (confirm(message)) {
      this.store.dispatch(
        TemplateActions.deleteTemplate({
          name: template.name,
          template_id: template.id,
        })
      );
      this.page = 1;
      this.dispatchLoadTemplates();
    }
  }

  onCopyTemplate(template: WhatsAppTemplate) {
    this.router.navigate(['new-template'], {
      state: { prefill: { components: template.components } },
      relativeTo: this.route,
    });
  }

  onSyncTemplates() {
    this.store.dispatch(TemplateActions.syncTemplates());
  }
}
