import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-chatbot-header',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './chatbot-header.component.html',
  styleUrl: './chatbot-header.component.css'
})
export class ChatbotHeaderComponent {
  @Output() openAddChatbot: EventEmitter<void> = new EventEmitter<void>();
  constructor() {}

  addChatbot() {
    this.openAddChatbot.emit();
  }
}
