import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-contact-progress-bar',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './contact-progress-bar.component.html',
})
export class ContactProgressBarComponent {
  @Input() currentValue = 0;
  @Input() maxValue = 1000;

  constructor(private translationService: TranslationService) { }

  getPercentage(): number {
    return Math.min((this.currentValue / this.maxValue) * 100, 100);
  }

  getProgressColorClass(): string {
    const percentage = this.getPercentage();

    if (percentage <= 50) {
      return 'bg-green-500';
    } else if (percentage <= 80) {
      return 'bg-yellow-500';
    } else if (percentage <= 95) {
      return 'bg-orange-500';
    } else {
      return 'bg-red-500';
    }
  }

  showWarning(): boolean {
    return this.getPercentage() > 80;
  }

  getWarningClass(): string {
    const percentage = this.getPercentage();

    if (percentage >= 100) {
      return 'bg-red-50 border border-red-200 text-red-800';
    } else if (percentage > 95) {
      return 'bg-orange-50 border border-orange-200 text-orange-800';
    } else {
      return 'bg-yellow-50 border border-yellow-200 text-yellow-800';
    }
  }

  getWarningMessage(): string {
    const remaining = this.maxValue - this.currentValue;

    if (this.currentValue >= this.maxValue) {
      return this.translationService.translate('broadcast.create.recipients.progress.maxReached');
    } else if (this.getPercentage() > 95) {
      return this.translationService.translate('broadcast.create.recipients.progress.almostLimit', { remaining });
    } else {
      return this.translationService.translate('broadcast.create.recipients.progress.approaching', { remaining });
    }
  }
}
