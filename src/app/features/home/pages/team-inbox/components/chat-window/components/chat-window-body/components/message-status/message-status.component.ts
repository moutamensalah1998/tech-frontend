import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-status.component.html',
})
export class MessageStatusComponent {
  @Input() status!: string;
}
