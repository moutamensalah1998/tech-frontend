import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { NewChatDialogComponent } from './new-chat-dialog/new-chat-dialog.component';
import { NotificationBellComponent } from '../../../notification-bell/notification-bell.component';
import * as ConversationsActions from '../../../../../../../../core/services/conversations/ngrx/conversations.actions';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { selectConversationsTotalItems } from '../../../../../../../../core/services/conversations/ngrx/conversations.selectors';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-chat-list-header',
  imports: [CommonModule, TranslatePipe, NotificationBellComponent],
  templateUrl: './chat-list-header.component.html',
  styleUrls: ['./chat-list-header.component.css']
})
export class ChatListHeaderComponent implements OnInit, OnDestroy {
  isDropdownOpen = false;
  searchTerm: string = '';
  totalItems$: Observable<number>;

  selectedFilter: string | null = null;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private dialog: MatDialog, private store: Store) {
    this.totalItems$ = this.store.select(selectConversationsTotalItems);
  }

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((term: string) => {
      const cleaned = (term || '').trim();
      this.dispatchLoadConversations(cleaned.length ? cleaned : null, this.selectedFilter);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectFilter(option: string) {
    const map: Record<string, string | null> = {
      'Open': 'open',
      'Solved': 'solved',
      'Pending': 'pending',
      'Expired': 'expired',
      'Assign to Me': 'assigned_to_me',
      'All': null
    };

    this.selectedFilter = map[option] ?? null;
    this.isDropdownOpen = false;
    const cleanedSearch = (this.searchTerm || '').trim();
    this.dispatchLoadConversations(cleanedSearch.length ? cleanedSearch : null, this.selectedFilter);
  }

  private dispatchLoadConversations(search: string | null, status: string | null) {
    this.store.dispatch(
      ConversationsActions.loadConversations({
        page: 1,
        size: 20,
        search_terms: search ?? null,
        status: status ?? null
      })
    );
  }

  onNewChat() {
    const dialogRef = this.dialog.open(NewChatDialogComponent, {
      width: 'auto',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {

      }
    });
  }

  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.searchSubject.next(this.searchTerm);
  }
}
