import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

import { CommonModule } from '@angular/common';
import { SbStatusBadgeComponent } from '../sb-status-badge/sb-status-badge.component';
import { BroadcastData } from '../../../../../../../../core/models/broadcast.model';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'sb-table',
  standalone: true,
  imports: [CommonModule, SbStatusBadgeComponent, TranslatePipe],
  templateUrl: './sb-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SbTableComponent {
  @Input() broadcasts: BroadcastData[] = [];
  @Input() loading = false;
  @Input() error: any = null;
  @Input() deleteLoading = false;

  @Output() view = new EventEmitter<BroadcastData>();
  @Output() edit = new EventEmitter<BroadcastData>();
  @Output() retry = new EventEmitter<BroadcastData>();
  @Output() duplicate = new EventEmitter<BroadcastData>();
  @Output() delete = new EventEmitter<BroadcastData>();

  trackById(index: number, item: BroadcastData) {
    return item.id;
  }
}
