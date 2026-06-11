import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chatbot-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatbot-tabs.component.html',
  styleUrl: './chatbot-tabs.component.css'
})
export class ChatbotTabsComponent {
  activeTab = 'your-bots';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
