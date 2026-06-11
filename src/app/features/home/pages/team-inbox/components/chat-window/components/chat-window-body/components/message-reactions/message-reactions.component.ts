// message-reactions.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message-reactions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="reactions && reactions.length > 0" class="reactions-container">
      <div
        *ngFor="let reaction of reactions"
        class="reaction-item"
        [title]="getReactionTooltip(reaction)">
        <span class="reaction-emoji">{{ reaction.emoji }}</span>
        <span *ngIf="reaction.count > 1" class="reaction-count">{{ reaction.count }}</span>
      </div>
    </div>
  `,
  styles: [`
    .reactions-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
      align-items: center;
    }

    .reaction-item {
      display: inline-flex;
      align-items: center;
      background: rgba(0, 123, 255, 0.1);
      border: 1px solid rgba(0, 123, 255, 0.2);
      border-radius: 12px;
      padding: 2px 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 20px;
    }

    .reaction-item:hover {
      background: rgba(0, 123, 255, 0.15);
      transform: scale(1.05);
    }

    .reaction-emoji {
      font-size: 14px;
      margin-right: 2px;
    }

    .reaction-count {
      font-size: 10px;
      font-weight: 500;
      color: #007bff;
      margin-left: 2px;
    }
  `]
})
export class MessageReactionsComponent {
  @Input() reactions: Array<{emoji: string, count: number, users?: string[]}> = [];

  getReactionTooltip(reaction: any): string {
    if (reaction.users && reaction.users.length > 0) {
      return `${reaction.emoji} ${reaction.users.join(', ')}`;
    }
    return `${reaction.emoji} ${reaction.count} reaction${reaction.count > 1 ? 's' : ''}`;
  }
}
