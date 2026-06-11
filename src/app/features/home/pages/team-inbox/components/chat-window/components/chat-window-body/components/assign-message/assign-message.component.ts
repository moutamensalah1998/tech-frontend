import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMessage } from '../../../../../../../../../../core/models/chat.types';

@Component({
  selector: 'app-assign-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: `./assign-message.component.html`,
})
export class AssignMessageComponent {
  @Input() message!: BaseMessage;
}
