import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-connection-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="connection-button output absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors z-10"
      (mousedown)="connectionStart.emit($event)"
      (touchstart)="connectionStart.emit($event)"
      title="Long press to connect to next node">
      <span class="material-icons text-xs">arrow_forward</span>
    </button>
  `
})
export class ConnectionButtonComponent {
  @Output() connectionStart = new EventEmitter<MouseEvent | TouchEvent>();
}
