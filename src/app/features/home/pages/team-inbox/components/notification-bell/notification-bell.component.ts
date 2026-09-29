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
    
    // Get computed direction from the element itself - this is the most reliable way
    // It will always reflect the current direction regardless of how it's set
    const computedStyle = getComputedStyle(this.bellButton.nativeElement);
    const isRTL = computedStyle.direction === 'rtl';
    
    if (isRTL) {
      // RTL mode: position from the right side
      const wouldOverflowLeft = bellRect.left - dropdownWidth < margin;
      
      if (wouldOverflowLeft) {
        // Position from the left edge of viewport
        this.dropdownStyle = {
          'position': 'fixed',
          'top': `${bellRect.bottom + 8}px`,
          'left': `${margin}px`,
          'right': 'auto',
          'max-width': `calc(100vw - ${margin * 2}px)`
        };
      } else {
        // Position aligned with the bell button (right-aligned)
        this.dropdownStyle = {
          'position': 'fixed',
          'top': `${bellRect.bottom + 8}px`,
          'right': `${viewportWidth - bellRect.right}px`,
          'left': 'auto',
          'max-width': `calc(100vw - ${margin * 2}px)`
        };
      }
    } else {
      // LTR mode: position from the left side
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
        // Position aligned with the bell button (left-aligned)
        this.dropdownStyle = {
          'position': 'fixed',
          'top': `${bellRect.bottom + 8}px`,
          'left': `${bellRect.left}px`,
          'right': 'auto',
          'max-width': `calc(100vw - ${margin * 2}px)`
        };
      }
    }
  }

  markAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id);
    
    // Navigate to conversation if applicable
    if (notification.conversationId) {
      this.router.navigate(['/dashboard/team-inbox'], {
        queryParams: { conversationId: notification.conversationId }
      });
    } else if (notification.templateId) {
      // Navigate to the template this notification refers to
      this.router.navigate(['/dashboard/broadcast/your-templates'], {
        queryParams: { templateId: notification.templateId }
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
      case 'template':
        return 'template';
      default:
        return 'info';
    }
  }

  getTemplateStatusLabel(status?: string): string {
    if (!status) return '';
    const normalized = status.toUpperCase();
    const labels: Record<string, string> = {
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      PENDING: 'Pending',
      PENDING_DELETION: 'Pending Deletion',
      DISABLED: 'Disabled',
      PAUSED: 'Paused',
      DRAFT: 'Draft',
      FAILED: 'Failed',
    };
    return labels[normalized] || status;
  }

  getTemplateStatusClass(status?: string): string {
    if (!status) return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'REJECTED':
      case 'FAILED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'PENDING':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'DISABLED':
      case 'PAUSED':
        return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  }

  clearAll(): void {
    this.notificationService.clearAll();
  }
}