// chatbot-table.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

interface ChatbotData {
  id: string;
  name: string;
  language: string;
  version: number;
  communicate_type: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  triggered?: number;
  stepsFinished?: number;
  finished?: number;
}

@Component({
  selector: 'app-chatbot-table',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './chatbot-table.component.html',
  styleUrl: './chatbot-table.component.css'
})
export class ChatbotTableComponent {
  @Input() chatbots: ChatbotData[] = [];
  @Input() loading = false;
  @Input() changingDefault = false; // New input for loading state
  @Output() editChatbot = new EventEmitter<ChatbotData>();
  @Output() deleteChatbot = new EventEmitter<ChatbotData>();
  @Output() changeDefaultChatbot = new EventEmitter<ChatbotData>(); // New output

  constructor(private router: Router) { }

  onEditChatbot(chatbot: ChatbotData) {
    this.router.navigate(['/dashboard/chatbot/builder'], {
      queryParams: {
        id: chatbot.id,
        name: chatbot.name,
        language: chatbot.language,
        version: chatbot.version
      }
    });
  }

  onDeleteChatbot(chatbot: ChatbotData) {
    this.deleteChatbot.emit(chatbot);
  }

  onCopyChatbot(chatbot: ChatbotData) {
    navigator.clipboard.writeText(chatbot.id).then(() => {
      // Could add a toast notification here
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }

  onToggleDefault(chatbot: ChatbotData, event: Event) {
    event.stopPropagation(); // Prevent row click events

    // Only emit if the chatbot is not already default
    if (!chatbot.is_default && !this.changingDefault) {
      this.changeDefaultChatbot.emit(chatbot);
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return '0 minutes ago';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  getPlatformIcon(platform: string): string {
    const icons: { [key: string]: string } = {
      'whatsapp': 'W',
      'telegram': 'T',
      'instagram': 'I',
      'messenger': 'M',
      'webpage': '🌐'
    };
    return icons[platform] || platform.charAt(0).toUpperCase();
  }

  getPlatformIconClass(platform: string): string {
    const classes: { [key: string]: string } = {
      'whatsapp': 'bg-green-500',
      'telegram': 'bg-blue-500',
      'instagram': 'bg-gradient-to-r from-purple-500 to-pink-500',
      'messenger': 'bg-blue-600',
      'webpage': 'bg-orange-500'
    };
    return classes[platform] || 'bg-gray-500';
  }
}
