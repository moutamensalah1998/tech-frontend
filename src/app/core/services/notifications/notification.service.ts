import { Injectable, OnDestroy } from '@angular/core';
import { Subject, BehaviorSubject, Observable, interval } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
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
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);
  private destroy$ = new Subject<void>();
  private readonly API_URL = '/notifications';

  constructor(
    private socketService: SocketService,
    private apiService: ApiService
  ) {
    this.initializeSocketListeners();
    this.loadNotificationsFromApi();
    // Poll for new notifications every 30 seconds
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startPolling(): void {
    interval(30000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadNotificationsFromApi();
    });
  }

  private async loadNotificationsFromApi(): Promise<void> {
    try {
      const response: any = await this.apiService.get(this.API_URL).toPromise();
      if (response && response.data) {
        const notifications = response.data.map((n: any) => this.mapApiNotification(n));
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
    // Listen for new message notifications
    this.socketService.on(ServerToClientEventsEnum.NewMessageNotification)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.handleNewMessage(data);
      });

    // Listen for conversation assignment notifications
    this.socketService.on(ServerToClientEventsEnum.ConversationAssignedNotification)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.handleConversationAssignment(data);
      });

    // Also listen to business message received for new message notifications
    this.socketService.on(ServerToClientEventsEnum.BusinessGroupMessageReceived)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        // Only create notification if message is from contact (not from business)
        if (data.is_from_contact !== false) {
          this.handleNewMessage({
            conversation_id: data.conversation_id,
            contact_name: data.contact_name,
            contact_phone: data.contact_phone,
            message: data.last_message_content,
            timestamp: data.last_message_time
          });
        }
      });

    // Listen for conversation assignment events
    this.socketService.on(ServerToClientEventsEnum.ConversationUserAssignment)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.handleConversationAssignment({
          conversation_id: data.conversation_id,
          assigned_to: data.assigned_to,
          assigned_by_name: data.assigned_by_name,
          contact_name: data.contact_name,
          contact_phone: data.contact_phone,
          message: data.message || `A conversation has been assigned to you`,
          timestamp: data.timestamp || new Date().toISOString()
        });
      });
  }

  private async handleConversationAssignment(data: any): Promise<void> {
    const notification: Notification = {
      id: this.generateId(),
      type: 'conversation_assignment',
      title: 'Conversation Assigned',
      message: data.message || `A conversation has been assigned to you`,
      conversationId: data.conversation_id,
      contactName: data.contact_name,
      contactPhone: data.contact_phone,
      assignedBy: data.assigned_by_name || data.assigned_by,
      timestamp: new Date(data.timestamp || Date.now()),
      read: false,
      icon: 'assignment'
    };
    await this.addNotification(notification);
  }

  private async handleNewMessage(data: any): Promise<void> {
    const notification: Notification = {
      id: this.generateId(),
      type: 'new_message',
      title: 'New Message',
      message: data.message || `New message from ${data.contact_name || 'a contact'}`,
      conversationId: data.conversation_id,
      contactName: data.contact_name,
      contactPhone: data.contact_phone,
      timestamp: new Date(data.timestamp || Date.now()),
      read: false,
      icon: 'message'
    };
    await this.addNotification(notification);
  }

  private async addNotification(notification: Notification): Promise<void> {
    // Add to local state immediately for responsiveness
    const current = this.notifications$.value;
    this.notifications$.next([notification, ...current]);
    this.updateUnreadCount();
    
    // Note: Backend should persist notifications when events are triggered
    // This is a real-time notification, backend handles persistence
  }

  private updateUnreadCount(): void {
    const unread = this.notifications$.value.filter(n => !n.read).length;
    this.unreadCount$.next(unread);
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API
  getNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  async markAsRead(notificationId: string): Promise<void> {
    const current = this.notifications$.value;
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
    }
  }

  async markAllAsRead(): Promise<void> {
    const current = this.notifications$.value;
    const updated = current.map(n => ({ ...n, read: true }));
    this.notifications$.next(updated);
    this.updateUnreadCount();
    
    // Persist to backend
    try {
      await this.apiService.post(`${this.API_URL}/read-all`, {}).toPromise();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  async removeNotification(notificationId: string): Promise<void> {
    const current = this.notifications$.value;
    const updated = current.filter(n => n.id !== notificationId);
    this.notifications$.next(updated);
    this.updateUnreadCount();
    
    // Persist to backend
    try {
      await this.apiService.delete(`${this.API_URL}/${notificationId}`).toPromise();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  async clearAll(): Promise<void> {
    this.notifications$.next([]);
    this.unreadCount$.next(0);
    
    // Persist to backend
    try {
      await this.apiService.delete(this.API_URL).toPromise();
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }

  // Refresh notifications from API
  async refresh(): Promise<void> {
    await this.loadNotificationsFromApi();
  }
}