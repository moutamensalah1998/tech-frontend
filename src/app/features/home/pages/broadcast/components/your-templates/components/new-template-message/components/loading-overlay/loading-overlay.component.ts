// loading-overlay.component.ts - Reusable loading overlay component
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      *ngIf="visible"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-sm"
      [attr.aria-label]="loadingText"
      role="status"
      aria-live="polite">

      <div class="bg-surface dark:bg-dark-surface rounded-lg shadow-2xl dark:shadow-dark-xl p-8 max-w-sm mx-4 transform transition-all duration-300 border border-border dark:border-dark-border">
        <div class="flex flex-col items-center space-y-4">
          <!-- Main Loading Spinner -->
          <div class="relative">
            <div class="w-16 h-16 border-4 border-blue-100 dark:border-blue-900/30 border-t-primary dark:border-t-primary-dark rounded-full animate-spin"></div>
            <div class="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-300 dark:border-r-blue-700 rounded-full animate-spin animation-delay-150"></div>
          </div>

          <!-- Loading Text -->
          <div class="text-center">
            <h3 class="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-2">{{ title }}</h3>
            <p class="text-sm text-text-secondary dark:text-dark-text-secondary animate-pulse">{{ loadingText }}</p>
          </div>

          <!-- Progress Bar (optional) -->
          <div *ngIf="showProgress" class="w-full bg-surface-tertiary dark:bg-dark-surface-tertiary rounded-full h-2 overflow-hidden">
            <div class="h-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 rounded-full animate-progress"></div>
          </div>

          <!-- Steps indicator (optional) -->
          <div *ngIf="steps.length > 0" class="w-full">
            <div class="text-xs text-text-tertiary dark:text-dark-text-tertiary mb-2">Progress:</div>
            <div class="space-y-1">
              <div
                *ngFor="let step of steps; let i = index"
                class="flex items-center text-sm"
                [class.text-success]="i < currentStep"
                [class.dark:text-success-light]="i < currentStep"
                [class.text-primary]="i === currentStep"
                [class.dark:text-primary-dark]="i === currentStep"
                [class.text-text-disabled]="i > currentStep"
                [class.dark:text-dark-text-disabled]="i > currentStep">

                <div class="w-4 h-4 mr-2 flex items-center justify-center">
                  <div
                    *ngIf="i < currentStep"
                    class="w-3 h-3 bg-success dark:bg-success-dark rounded-full flex items-center justify-center">
                    <span class="text-white text-xs">✓</span>
                  </div>
                  <div
                    *ngIf="i === currentStep"
                    class="w-3 h-3 border-2 border-primary dark:border-primary-dark rounded-full animate-pulse">
                  </div>
                  <div
                    *ngIf="i > currentStep"
                    class="w-3 h-3 border-2 border-border dark:border-dark-border rounded-full">
                  </div>
                </div>
                {{ step }}
              </div>
            </div>
          </div>

          <!-- Cancel button (optional) -->
          <button
            *ngIf="showCancel && onCancel"
            (click)="onCancel!()"
            class="mt-4 px-4 py-2 text-sm text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes progress {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(400%); }
    }

    .animate-progress {
      animation: progress 2s ease-in-out infinite;
    }

    .animation-delay-150 {
      animation-delay: 150ms;
    }

    @media (prefers-reduced-motion: reduce) {
      .animate-spin,
      .animate-pulse,
      .animate-progress {
        animation: none;
      }
    }
  `]
})
export class LoadingOverlayComponent {
  @Input() visible = false;
  @Input() title = 'Processing';
  @Input() loadingText = 'Please wait...';
  @Input() showProgress = false;
  @Input() showCancel = false;
  @Input() steps: string[] = [];
  @Input() currentStep = 0;
  @Input() onCancel?: () => void;
}
