import { Injectable, OnDestroy } from '@angular/core';
import { Subject, BehaviorSubject, Observable, interval } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { SocketService } from '../chat/socketio/socket.service';
import { ServerToClientEventsEnum } from '../../models/socket-event.enum';
import { ApiService } from '../../api/api.service';

export interface Notification {
  id: string;
  type: 'conversation_assignment' | 'new_message' | 'system';
  title: string;
  message: string;
  conversationId?: string;
  contactName?: string;
  contactPhone?: string;
  assignedBy?: string;
  timestamp: Date;
  read: boolean;
  icon?: string;
  actionUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  // Backend is the single source of truth
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);
  private destroy$ = new Subject<void>();
  private readonly API_URL = '/v1/notifications';

  // Debounce refresh to prevent multiple API calls from rapid socket events
  private refreshPending = false;
  private refreshTimer: any = null;

  constructor(
    private socketService: SocketService,
    private apiService: ApiService
  ) {
    this.initializeSocketListeners();
    this.loadNotificationsFromApi();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  }

  private startPolling(): void {
    // Poll every 30 seconds to sync with backend
    interval(30000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadNotificationsFromApi();
    });
  }

  /**
   * Load notifications from backend API.
   * This is the single source of truth - backend database.
   */
  private async loadNotificationsFromApi(): Promise<void> {
    try {
      const response: any = await this.apiService.get(this.API_URL).toPromise();
      if (response && response.data) {
        const notifications: Notification[] = response.data.map((n: any) => this.mapApiNotification(n));
        // Sort by timestamp descending (newest first)
        notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        this.notifications$.next(notifications);
        this.updateUnreadCount();
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  private mapApiNotification(apiNotif: any): Notification {
    return {
      id: apiNotif.id,
      type: apiNotif.type,
      title: apiNotif.title,
      message: apiNotif.message,
      conversationId: apiNotif.conversationId,
      contactName: apiNotif.contactName,
      contactPhone: apiNotif.contactPhone,
      assignedBy: apiNotif.assignedBy,
      timestamp: new Date(apiNotif.timestamp),
      read: apiNotif.read,
      icon: this.getIconForType(apiNotif.type)
    };
  }

  private getIconForType(type: string): string {
    switch (type) {
      case 'conversation_assignment': return 'assignment';
      case 'new_message': return 'message';
      default: return 'info';
    }
  }

  private initializeSocketListeners(): void {
    // When backend sends notification events, refresh from API
    // to get the canonical state (prevents duplicate IDs)
    this.socketService.on(ServerToClientEventsEnum.NewMessageNotification)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.scheduleRefresh();
      });

    this.socketService.on(ServerToClientEventsEnum.ConversationAssignedNotification)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.scheduleRefresh();
      });
  }

  /**
   * Schedule a debounced refresh from API.
   * Prevents multiple API calls when multiple socket events fire rapidly.
   */
  private scheduleRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = setTimeout(() => {
      this.loadNotificationsFromApi();
      this.refreshTimer = null;
    }, 500); // 500ms debounce
  }

  private updateUnreadCount(): void {
    const unread = this.notifications$.value.filter(n => !n.read).length;
    this.unreadCount$.next(unread);
  }

  // ─── Public API ──────────────────────────────────────────────

  getNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  /**
   * Mark a notification as read.
   * Updates local state immediately, then persists to backend.
   * On error, reverts local state.
   */
  async markAsRead(notificationId: string): Promise<void> {
    const current = this.notifications$.value;
    const previous = [...current];

    // Optimistic update
    const updated = current.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notifications$.next(updated);
    this.updateUnreadCount();

    // Persist to backend
    try {
      await this.apiService.post(`${this.API_URL}/${notificationId}/read`, {}).toPromise();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert on error
      this.notifications$.next(previous);
      this.updateUnreadCount();
    }
  }

  async markAllAsRead(): Promise<void> {
    const current = this.notifications$.value;
    const previous = [...current];

    // Optimistic update
    const updated = current.map(n => ({ ...n, read: true }));
    this.notifications$.next(updated);
    this.updateUnreadCount();

    // Persist to backend
    try {
      await this.apiService.post(`${this.API_URL}/read-all`, {}).toPromise();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Revert on error
      this.notifications$.next(previous);
      this.updateUnreadCount();
    }
  }

  async removeNotification(notificationId: string): Promise<void> {
    const current = this.notifications$.value;
    const previous = [...current];

    // Optimistic update
    const updated = current.filter(n => n.id !== notificationId);
    this.notifications$.next(updated);
    this.updateUnreadCount();

    // Persist to backend
    try {
      await this.apiService.delete(`${this.API_URL}/${notificationId}`).toPromise();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // Revert on error
      this.notifications$.next(previous);
      this.updateUnreadCount();
    }
  }

  async clearAll(): Promise<void> {
    const previous = [...this.notifications$.value];

    // Optimistic update
    this.notifications$.next([]);
    this.unreadCount$.next(0);

    // Persist to backend
    try {
      await this.apiService.delete(this.API_URL).toPromise();
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      // Revert on error
      this.notifications$.next(previous);
      this.updateUnreadCount();
    }
  }

  /**
   * Force refresh from backend API.
   */
  async refresh(): Promise<void> {
    await this.loadNotificationsFromApi();
  }
}