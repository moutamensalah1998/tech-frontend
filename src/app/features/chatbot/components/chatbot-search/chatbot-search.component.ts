import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-chatbot-search',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './chatbot-search.component.html',
  styleUrl: './chatbot-search.component.css'
})
export class ChatbotSearchComponent {
  searchTerm = '';
  @Output() searchChange = new EventEmitter<string>();

  onSearchInput() {
    this.searchChange.emit(this.searchTerm);
  }
}
