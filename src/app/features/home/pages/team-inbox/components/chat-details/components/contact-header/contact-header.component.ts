import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../../../../../../../core/models/conversation.model';

@Component({
  selector: 'app-contact-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-header.component.html',
})
export class ContactHeaderComponent {
  @Input() conversation?: Conversation;
  @Input() i: number = 0;

  // Tailwind gradient sets (from your config)
  private colorClasses = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-teal-600'
  ];

  getGradientClass(): string {
    return this.colorClasses[this.i % this.colorClasses.length];
  }

  getInitials(name?: string): string {
    if (!name) return 'NA';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0].charAt(0) + ' ' + names[names.length - 1].charAt(0)).toUpperCase();
  }
}
