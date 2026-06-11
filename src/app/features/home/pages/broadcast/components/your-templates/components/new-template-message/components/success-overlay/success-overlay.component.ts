import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div class="bg-surface dark:bg-dark-surface rounded-2xl p-8 shadow-2xl dark:shadow-dark-xl text-center max-w-md mx-4 transform transition-all duration-500 border border-border dark:border-dark-border">
        <div class="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-4">{{ title }}</h2>
        <p class="text-text-secondary dark:text-dark-text-secondary mb-6">{{ message }}</p>
        <div class="flex justify-center">
          <div class="w-8 h-8 border-4 border-green-200 dark:border-green-900/40 border-t-green-600 dark:border-t-green-500 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  `
})
export class SuccessOverlayComponent {
  @Input() title = 'Success!';
  @Input() message = 'Operation completed successfully';
}
