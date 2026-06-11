import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-bar.component.html',
})
export class ProgressBarComponent {
  @Input() currentValue = 0;
  @Input() maxValue = 1000;
  @Input() showWarnings = true;

  constructor(private translationService: TranslationService) { }

  getPercentage(): number {
    return Math.min((this.currentValue / this.maxValue) * 100, 100);
  }

  getProgressColorClass(): string {
    const percentage = this.getPercentage();

    if (percentage <= 50) {
      return 'bg-gradient-to-r from-green-400 to-green-500';
    } else if (percentage <= 70) {
      return 'bg-gradient-to-r from-blue-400 to-blue-500';
    } else if (percentage <= 80) {
      return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    } else if (percentage <= 95) {
      return 'bg-gradient-to-r from-orange-400 to-orange-500';
    } else {
      return 'bg-gradient-to-r from-red-500 to-red-600';
    }
  }

  getStatusMessage(): string {
    const percentage = this.getPercentage();

    if (this.currentValue === 0) {
      return this.translationService.translate('broadcast.create.recipients.progressBar.noContacts');
    } else if (percentage <= 25) {
      return this.translationService.translate('broadcast.create.recipients.progressBar.greatStart');
    } else if (percentage <= 50) {
      return this.translationService.translate('broadcast.create.recipients.progressBar.goodProgress');
    } else if (percentage <= 75) {
      return this.translationService.translate('broadcast.create.recipients.progressBar.halfway');
    } else if (percentage <= 90) {
      return this.translationService.translate('broadcast.create.recipients.progressBar.gettingClose');
    } else if (percentage < 100) {
      return this.translationService.translate('broadcast.create.recipients.progressBar.almostMax');
    } else {
      return this.translationService.translate('broadcast.create.recipients.progressBar.maxReached');
    }
  }

  getStatusMessageClass(): string {
    const percentage = this.getPercentage();

    if (percentage <= 50) {
      return 'text-green-600';
    } else if (percentage <= 80) {
      return 'text-yellow-600';
    } else if (percentage < 100) {
      return 'text-orange-600';
    } else {
      return 'text-red-600';
    }
  }
}
