import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../../../../../../../core/models/conversation.model';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-contact-info',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './contact-info.component.html',
})
export class ContactInfoComponent {
  @Input() conversation?: Conversation;
  @Input() i: number = 0;


  private colorClasses = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-teal-600'
  ];

  getGradientClass(): string {
    return this.colorClasses[this.i % this.colorClasses.length];
  }
}
