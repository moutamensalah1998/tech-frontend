// reaction-picker.component.ts
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reaction-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isVisible"
      class="reaction-picker"
      [style.left.px]="position.x"
      [style.top.px]="position.y">

      <div class="reaction-grid">
        <button
          *ngFor="let emoji of availableEmojis"
          class="reaction-button"
          (click)="onReactionSelect(emoji)"
          [title]="emoji">
          {{ emoji }}
        </button>
      </div>
    </div>

    <div *ngIf="isVisible" class="reaction-backdrop" (click)="close()"></div>
  `,
  styles: [`
    .reaction-picker {
      position: fixed;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 1px solid #e5e7eb;
      padding: 8px;
      z-index: 1000;
      animation: reactionSlide 0.2s ease-out;
    }

    @keyframes reactionSlide {
      from {
        opacity: 0;
        transform: scale(0.8) translateY(-8px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .reaction-backdrop {
      position: fixed;
      inset: 0;
      z-index: 999;
      background: transparent;
    }

    .reaction-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      max-width: 200px;
    }

    .reaction-button {
      background: none;
      border: none;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
    }

    .reaction-button:hover {
      background-color: #f3f4f6;
      transform: scale(1.1);
    }

    .reaction-button:active {
      transform: scale(0.95);
    }
  `]
})
export class ReactionPickerComponent {
  @Input() isVisible = false;
  @Input() position = { x: 0, y: 0 };
  @Input() message: any = null;

  @Output() reactionSelected = new EventEmitter<{emoji: string, message: any}>();
  @Output() closed = new EventEmitter<void>();

  availableEmojis = [
    '👍', '👎', '❤️', '😍',
    '😂', '😮', '😢', '😡',
    '👏', '🙏', '🔥', '💯',
    '🎉', '✅', '❌', '⭐'
  ];

  @HostListener('document:keydown.escape', ['$event'])
  onEscape() {
    this.close();
  }

  onReactionSelect(emoji: string) {
    this.reactionSelected.emit({ emoji, message: this.message });
    this.close();
  }

  close() {
    this.closed.emit();
  }
}
