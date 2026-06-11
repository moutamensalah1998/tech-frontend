import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-progress-header',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './progress-header.component.html',
})
export class ProgressHeaderComponent {
  @Input() progress = 0;
  @Output() cancel = new EventEmitter<void>();
}
