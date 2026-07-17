import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AuthActions from "../../../../core/services/auth/ngrx/auth.action";
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as SocketActions from '../../../../core/services/chat/ngrx/socket.actions';
import { selectAuthUser } from '../../../../core/services/auth/ngrx/auth.selector';
import { ToastService } from '../../../../core/services/toast-message.service';
import { NavigationItem, SharedSidebarComponent } from '../../../../shared/components/shared-sidebar/shared-sidebar.component';
import { TranslationService } from '../../../../core/services/translation/translation.service';
import { ApiService } from '../../../../core/api/api.service';
import { Subscription, Subject } from 'rxjs';

const PLATFORM_OWNER_PHONE = '+962790701714';

@Component({
  selector: 'app-profile-settings',
  imports: [CommonModule, RouterModule, SharedSidebarComponent],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css'
})
export class ProfileSettingsComponent implements OnDestroy {
  navigationItems: NavigationItem[] = [];
  sidebarOpen = true;
  private toggleSidebarHandler = this.toggleSidebar.bind(this);
  private destroy$ = new Subject<void>();
  private isOwner = false;
  private initialized = false;

  constructor(
    private store: Store,
    private actions$: Actions,
    private router: Router,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private toast: ToastService,
    private translationService: TranslationService,
    private apiService: ApiService
  ) {
    window.addEventListener('toggleSettingsSidebar', this.toggleSidebarHandler);

    // Build default items immediately so sidebar never appears empty
    this.buildNavigationItems();

    // Use business_profile.phone_number for platform owner check (not user.phone_number)
    this.checkPlatformOwner();
  }

  ngOnDestroy(): void {
    window.removeEventListener('toggleSettingsSidebar', this.toggleSidebarHandler);
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Query GET /v1/business-profile to determine if current user is
   * the platform owner (by business_profile.phone_number, not user.phone_number).
   */
  private checkPlatformOwner(): void {
    this.apiService.get('v1/business-profile').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        const bpPhoneNumber = res?.data?.business_profile?.phone_number || '';
        const match = bpPhoneNumber === PLATFORM_OWNER_PHONE;
        if (match !== this.isOwner) {
          this.isOwner = match;
          this.buildNavigationItems();
        }
      },
      error: () => {
        // On error, treat as non-owner (safest default)
        if (true !== this.isOwner) {
          // isOwner is already false, no change needed
        } else {
          this.isOwner = false;
          this.buildNavigationItems();
        }
      }
    });
  }

  toggleSidebar(): void {
    const event = new CustomEvent('openSettingsSidebar');
    window.dispatchEvent(event);
  }

  private buildNavigationItems(): void {
    const items: NavigationItem[] = [
      {
        label: 'profile.settings.navigation.businessProfile',
        icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>'),
        routerLink: '/dashboard/settings/business-profile',
        exact: true,
        translateLabel: true
      },
      {
        label: 'profile.settings.navigation.personalProfile',
        icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'),
        routerLink: '/dashboard/settings/personal-profile',
        exact: true,
        translateLabel: true
      },
      {
        label: 'profile.settings.navigation.tagsAttributes',
        icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>'),
        routerLink: '/dashboard/settings/tags-and-attributes',
        exact: true,
        translateLabel: true
      },
      {
        label: 'profile.settings.navigation.userPreferences',
        icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>'),
        routerLink: '/dashboard/settings/user-preferences',
        exact: true,
        translateLabel: true
      }
    ];

    // Insert "Invite Management" before Time & Area if platform owner
    if (this.isOwner) {
      console.log('[ProfileSettings] Adding Invite Management nav item');
      items.push({
        label: 'Invite Management',
        icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>'),
        routerLink: '/dashboard/settings/invite-management',
        exact: true,
        translateLabel: false
      });
    }

    // Time and Area + Logout (always at the bottom)
    items.push({
      label: 'profile.settings.navigation.timeAndArea',
      icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'),
      routerLink: '/dashboard/settings/time-and-area',
      exact: true,
      translateLabel: true
    });
    items.push({
      label: 'profile.settings.logout',
      icon: this.sanitizer.bypassSecurityTrustHtml('<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>'),
      routerLink: 'logout',
      exact: true,
      translateLabel: true,
      className: 'text-red-600 hover:bg-red-50',
      liClass: '!mt-auto !border-t !border-gray-200 !pt-4 !mb-16  '
    });

    this.navigationItems = items;
    this.initialized = true;
  }

  onNavigationItemClick(event: { item: NavigationItem, index: number }): void {
    if (event.item.routerLink === 'logout') {
      this.onLogout();
    } else {
      this.router.navigateByUrl(event.item.routerLink);
    }
  }

  onLogout(): void {
    console.log('Logout');
    this.store.dispatch(SocketActions.disconnectSocket());
    this.store.dispatch(AuthActions.logout());
    this.actions$.pipe(
      ofType(AuthActions.logoutSuccess),
      take(1)
    ).subscribe(() => {
      this.store.dispatch(SocketActions.disconnectSocket());
      this.router.navigate(['auth/sign-in'], { replaceUrl: true });
    });
    this.actions$.pipe(
      ofType(AuthActions.logoutFailure),
      take(1)
    ).subscribe(() => {
      this.store.dispatch(SocketActions.connectSocket());
      this.toast.showToast(this.translationService.translate('profile.settings.logoutFailed'), 'error');
    });
  }
}