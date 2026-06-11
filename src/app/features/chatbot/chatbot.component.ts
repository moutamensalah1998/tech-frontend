// chatbot.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { ChatbotHeaderComponent } from './components/chatbot-header/chatbot-header.component';
import { ChatbotSearchComponent } from './components/chatbot-search/chatbot-search.component';
import { ChatbotTableComponent } from './components/chatbot-table/chatbot-table.component';
import * as ChatbotActions from '../../core/services/chatbot/ngrx/chatbot.actions';
import { selectChatbotData, selectChatbotLoading, selectChatbotError } from '../../core/services/chatbot/ngrx/chatbot.selectors';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SharedSidebarComponent, NavigationItem } from '../../shared/components/shared-sidebar/shared-sidebar.component';
import { ApiResponse, ChatbotData } from '../../core/models/chatbot.model';
import { ConfirmDialogComponent } from "../../shared/components/confirm-dialog/confirm-dialog.component";
import { Actions, ofType } from '@ngrx/effects';
import { ToastService } from '../../core/services/toast-message.service';
import { AddChatbotDialogComponent } from "./components/add-chatbot-dialog/add-chatbot-dialog.component";
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation/translation.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    ChatbotHeaderComponent,
    ChatbotSearchComponent,
    ChatbotTableComponent,
    SharedSidebarComponent,
    PaginationComponent,
    ConfirmDialogComponent,
    AddChatbotDialogComponent,
    TranslatePipe
  ],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private translationService = inject(TranslationService);
  isAddingChatbot = false;

  
  sidebarOpen = true;
  navigationItems: NavigationItem[] = [
    {
      label: 'Chatbots',
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>',
      routerLink: '/dashboard/chatbot'
    },
  ];

  chatbots: ChatbotData[] = [];
  displayChatbots: ChatbotData[] = [];
  loading = false;
  changingDefault = false; // New property for default toggle loading
  error: any = null;
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  limit = 10;
  searchTerm = '';
  deleteChatbotDialogOpen = false;
  selectedChatbot: ChatbotData | null = null;

  constructor(private store: Store, private actions$: Actions, private toast: ToastService) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadChatbots();
    });

    // Handle delete success
    this.actions$.pipe(
      ofType(ChatbotActions.deleteChatbotSuccess),
      take(1)
    ).subscribe(() => {
      this.loadChatbots();
      this.toast.showToast(this.translationService.translate('chatbot.list.messages.deletedSuccessfully'), 'success');
      this.deleteChatbotDialogOpen = false;
    });

    // Handle change default success
    this.actions$.pipe(
      ofType(ChatbotActions.changeDefaultChatbotSuccess),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.changingDefault = false;
      this.loadChatbots(); // Reload to get updated default status
      this.toast.showToast(this.translationService.translate('chatbot.list.messages.defaultChangedSuccessfully'), 'success');
    });

    // Handle change default error
    this.actions$.pipe(
      ofType(ChatbotActions.changeDefaultChatbotError),
      takeUntil(this.destroy$)
    ).subscribe((action) => {
      this.changingDefault = false;
      const errorMessage = action.error?.error?.message || this.translationService.translate('chatbot.list.messages.failedToChangeDefault');
      this.toast.showToast(errorMessage, 'error');
    });
  }

  openAddChatbotDialog() {
    this.isAddingChatbot = true;
  }

  ngOnInit() {
    this.loadChatbots();
    this.subscribeToStore();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToStore() {
    this.store.select(selectChatbotLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    this.store.select(selectChatbotError)
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error = error);

    this.store.select(selectChatbotData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.handleApiResponse(data);
        }
      });
  }

  private handleApiResponse(data: ApiResponse) {
    this.chatbots = data.chatbots.map(chatbot => ({
      ...chatbot,
      triggered: 0,
      stepsFinished: 0,
      finished: 0
    }));

    this.displayChatbots = this.chatbots;
    this.totalCount = data.total_count;
    this.totalPages = data.total_pages;
    this.currentPage = data.page;
    this.limit = data.limit;
  }

  private loadChatbots() {
    this.store.dispatch(ChatbotActions.getChatbotsMetaData({
      page: this.currentPage,
      limit: this.limit,
      search: this.searchTerm
    }));
  }

  onSearchChange(searchTerm: string) {
    this.searchSubject.next(searchTerm);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadChatbots();
  }

  onLimitChange(limit: number) {
    this.limit = limit;
    this.currentPage = 1;
    this.loadChatbots();
  }

  onDeleteChatbot(chatbot: ChatbotData) {
    this.selectedChatbot = chatbot;
    this.deleteChatbotDialogOpen = true;
  }

  onConfirmDeleteChatbot() {
    if (this.selectedChatbot) {
      this.store.dispatch(ChatbotActions.deleteChatbot({ chatbotId: this.selectedChatbot.id }));
    }
    this.deleteChatbotDialogOpen = false;
  }

  // New method to handle default chatbot change
  onChangeDefaultChatbot(chatbot: ChatbotData) {
    if (!chatbot.is_default && !this.changingDefault) {
      this.changingDefault = true;
      this.store.dispatch(ChatbotActions.changeDefaultChatbot({
        chatbotId: chatbot.id
      }));
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
      return 'Created 0 minutes ago';
    } else if (diffMinutes < 60) {
      return `Created ${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `Created ${diffHours} hours ago`;
    } else if (diffDays < 30) {
      return `Created ${diffDays} days ago`;
    } else if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30);
      return `Created ${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  getPlatformIcon(communicateType: string): string {
    const icons: { [key: string]: string } = {
      'whatsapp': 'W',
      'telegram': 'T',
      'instagram': 'I',
      'messenger': 'M',
      'webpage': '🌐'
    };
    return icons[communicateType] || communicateType.charAt(0).toUpperCase();
  }

  getPlatformIconClass(communicateType: string): string {
    const classes: { [key: string]: string } = {
      'whatsapp': 'bg-green-500',
      'telegram': 'bg-blue-500',
      'instagram': 'bg-gradient-to-r from-purple-500 to-pink-500',
      'messenger': 'bg-blue-600',
      'webpage': 'bg-orange-500'
    };
    return classes[communicateType] || 'bg-gray-500';
  }
}
