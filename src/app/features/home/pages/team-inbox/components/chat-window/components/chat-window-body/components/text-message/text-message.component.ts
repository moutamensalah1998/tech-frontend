import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMessage } from '../../../../../../../../../../core/models/chat.types';

@Component({
  selector: 'app-text-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-message.component.html',
})
export class TextMessageComponent {
  @Input() message!: BaseMessage;
}
