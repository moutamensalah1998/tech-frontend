import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'sb-status-badge',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './sb-status-badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SbStatusBadgeComponent {
  @Input() status?: string;
}
