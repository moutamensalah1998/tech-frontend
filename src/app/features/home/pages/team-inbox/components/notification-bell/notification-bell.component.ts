import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService, Notification } from '../../../../../../core/services/notifications/notification.service';
import { TimezoneService } from '../../../../../../core/services/timezone/timezone.service';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  @ViewChild('bellButton') bellButton!: ElementRef<HTMLButtonElement>;
  
  notifications: Notification[] = [];
  unreadCount = 0;
  isDropdownOpen = false;
  dropdownStyle: { [key: string]: string } = {};
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private timezoneService: TimezoneService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notificationService.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
      });

    this.notificationService.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-bell-container')) {
      this.isDropdownOpen = false;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isDropdownOpen) {
      this.calculateDropdownPosition();
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.isDropdownOpen) {
      this.calculateDropdownPosition();
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.calculateDropdownPosition();
    }
  }

  private calculateDropdownPosition(): void {
    if (!this.bellButton) return;
    
    const bellRect = this.bellButton.nativeElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const dropdownWidth = 384; // max width of dropdown (24rem = 384px)
    const margin = 16; // 1rem margin from edge
    
    // Calculate if dropdown would overflow on the right side
    const wouldOverflowRight = bellRect.right + dropdownWidth > viewportWidth - margin;
    
    if (wouldOverflowRight) {
      // Position from the right edge of viewport
      this.dropdownStyle = {
        'position': 'fixed',
        'top': `${bellRect.bottom + 8}px`,
        'right': `${margin}px`,
        'left': 'auto',
        'max-width': `calc(100vw - ${margin * 2}px)`
      };
    } else {
      // Position aligned with the bell button
      this.dropdownStyle = {
        'position': 'fixed',
        'top': `${bellRect.bottom + 8}px`,
        'right': `${viewportWidth - bellRect.right}px`,
        'left': 'auto',
        'max-width': `calc(100vw - ${margin * 2}px)`
      };
    }
  }

  markAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id);
    
    // Navigate to conversation if applicable
    if (notification.conversationId) {
      this.router.navigate(['/dashboard/team-inbox'], {
        queryParams: { conversationId: notification.conversationId }
      });
    }
    
    this.isDropdownOpen = false;
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  removeNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.removeNotification(notification.id);
  }

  getRelativeTime(timestamp: Date): string {
    // Use the timezone service as the single source of truth
    return this.timezoneService.getRelativeTime(timestamp);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'conversation_assignment':
        return 'assignment';
      case 'new_message':
        return 'message';
      default:
        return 'info';
    }
  }

  clearAll(): void {
    this.notificationService.clearAll();
  }
}