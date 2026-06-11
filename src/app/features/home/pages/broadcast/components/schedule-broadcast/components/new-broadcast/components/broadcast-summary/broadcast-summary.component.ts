import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-broadcast-summary',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './broadcast-summary.component.html',
})
export class BroadcastSummaryComponent {
  @Input() contactCount = 0;
  @Input() templateName = '';
  @Input() isNow = true;
  @Input() scheduledTime: string | null = null;
}
