import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { selectAuthUser } from '../../../core/services/auth/ngrx/auth.selector';
import { Role } from '../../../core/models/auth.types';
import { DashboardNavigationItem } from './navigation.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { NotificationBellComponent } from '../../../features/home/pages/team-inbox/components/notification-bell/notification-bell.component';


@Component({
  selector: 'app-home-base-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, TranslatePipe, NotificationBellComponent],
  templateUrl: './home-base-nav.component.html',
  styleUrls: ['./home-base-nav.component.css']
})
export class HomeBaseNavComponent implements OnInit, OnDestroy {
  isMobileMenuOpen: boolean = false;
  isScrolled: boolean = false;

  private destroy$ = new Subject<void>();

  // Current user data
  currentUser$: Observable<any>;
  userRoles: string[] = [];

  // Connection status
  phoneNumber: string = '';
  isOnline: boolean = false;

  // Navigation items with proper role requirements
  navigationItems: DashboardNavigationItem[] = [
    {
      label: 'navigation.teamInbox',
      route: ['/dashboard', 'team-inbox'],
      // Available to all authenticated users
    },
    {
      label: 'navigation.broadcast',
      route: ['/dashboard', 'broadcast', 'your-templates'],
      requiredRoles: [
        Role.ADMINISTRATOR,
        Role.BROADCAST_MANAGER,
        Role.TEMPLATE_MANAGER
      ]
    },
    {
      label: 'navigation.contacts',
      route: ['/dashboard', 'contacts'],
      requiredRoles: [
        Role.ADMINISTRATOR,
        Role.CONTACT_MANAGER,
        Role.OPERATOR
      ]
    },
    {
      label: 'navigation.chatbot',
      route: ['/dashboard', 'chatbot'],
      requiredRoles: [
        Role.ADMINISTRATOR,
        Role.AUTOMATION_MANAGER,
        Role.DEVELOPER
      ]
    },
    {
      label: 'navigation.aiSupport',
      route: ['/dashboard', 'ai'],
      requiredRoles: [
        Role.ADMINISTRATOR,
        Role.AUTOMATION_MANAGER
      ]
    },
    {
      label: 'navigation.userManagement',
      route: ['/dashboard', 'user-dashboard-table'],
      requiredRoles: [Role.ADMINISTRATOR] // Only admins
    },
    {
      label: 'navigation.reports',
      route: ['/dashboard', 'reports'],
      requiredRoles: [Role.ADMINISTRATOR, Role.DASHBOARD_VIEWER]
    },
    {
      label: 'navigation.apiDoc',
      route: ['/dashboard', 'api-doc'],
      requiredRoles: [Role.ADMINISTRATOR, Role.DEVELOPER]
    }
  ];

  visibleNavItems: DashboardNavigationItem[] = [];

  constructor(
    private router: Router,
    private store: Store
  ) {
    this.currentUser$ = this.store.select(selectAuthUser);
  }

  ngOnInit(): void {
    this.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user && user.roles) {
          this.userRoles = user.roles.map((role: any) => role.role_name || role.name || role);
          this.updateVisibleNavItems();
        }
        // Extract phone number and online status for connection indicator
        if (user) {
          this.phoneNumber = user.phone_number || user.phoneNumber || '';
          this.isOnline = user.online_status === true;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateVisibleNavItems(): void {
    this.visibleNavItems = this.navigationItems.filter(item => {
      if (!item.requiredRoles || item.requiredRoles.length === 0) {
        return true;
      }
      return item.requiredRoles.some(requiredRole =>
        this.userRoles.includes(requiredRole)
      );
    });
  }

  hasRole(role: Role): boolean {
    return this.userRoles.includes(role);
  }

  hasAnyRole(roles: Role[]): boolean {
    return roles.some(role => this.userRoles.includes(role));
  }

  get isAdmin(): boolean {
    return this.hasRole(Role.ADMINISTRATOR);
  }

  get canManageBroadcasts(): boolean {
    return this.hasAnyRole([
      Role.ADMINISTRATOR,
      Role.BROADCAST_MANAGER,
      Role.TEMPLATE_MANAGER
    ]);
  }

  get canManageContacts(): boolean {
    return this.hasAnyRole([
      Role.ADMINISTRATOR,
      Role.CONTACT_MANAGER,
      Role.OPERATOR
    ]);
  }

  get canManageAutomations(): boolean {
    return this.hasAnyRole([
      Role.ADMINISTRATOR,
      Role.AUTOMATION_MANAGER,
      Role.DEVELOPER
    ]);
  }

  get canViewDashboard(): boolean {
    return this.hasAnyRole([
      Role.ADMINISTRATOR,
      Role.DASHBOARD_VIEWER,
      Role.BILLING_MANAGER
    ]);
  }

  get canManageBilling(): boolean {
    return this.hasAnyRole([
      Role.ADMINISTRATOR,
      Role.BILLING_MANAGER
    ]);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  isSettingsPage(): boolean {
    return this.router.url.includes('/settings');
  }

  toggleSettingsSidebar(): void {
    // Dispatch custom event to trigger sidebar toggle
    const event = new CustomEvent('toggleSettingsSidebar');
    window.dispatchEvent(event);
  }

  isActiveRoute(routePath: string): boolean {
    return this.router.url.includes(routePath);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.isScrolled = scrollPosition > 10;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('nav') && this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }
}
