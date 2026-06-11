import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface NavigationItem {
  label: string;
  icon: string | SafeHtml;
  routerLink: string;
  exact?: boolean;
  translateLabel?: boolean;
  className?: string; // Optional custom class for the inner link/button
  liClass?: string;   // Optional custom class for the list item (e.g., mt-auto)
}

@Component({
  selector: 'app-shared-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './shared-sidebar.component.html',
  styleUrls: []
})
export class SharedSidebarComponent implements OnInit, OnDestroy {
  @Input() title: string = 'broadcast.sidebar.title';
  @Input() subtitle: string = 'broadcast.sidebar.subtitle';
  @Input() navigationItems: NavigationItem[] = [];
  @Input() isOpen: boolean = true;
  @Input() activeTabIndex?: number; // Optional for backward compatibility
  @Input() useRouterLinks: boolean = true; // Toggle between router links and custom navigation

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() sidebarToggled = new EventEmitter<boolean>();
  @Output() navigationItemClicked = new EventEmitter<{ item: NavigationItem, index: number }>();
  @Output() mobileMenuToggle = new EventEmitter<boolean>();

  isMobile: boolean = false;
  isMobileOpen: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.checkMobile();
    // Listen for navbar button click to open sidebar
    window.addEventListener('openSettingsSidebar', this.handleOpenSidebarEvent);
  }

  private handleOpenSidebarEvent = (): void => {
    if (this.isMobile && !this.isMobileOpen) {
      this.toggle();
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = ''; // Reset body scroll
    // Remove event listener to prevent memory leaks
    window.removeEventListener('openSettingsSidebar', this.handleOpenSidebarEvent);
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', [])
  onResize(): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile) {
      this.isMobileOpen = false;
    }
  }

  toggle(_event?: Event): void {
    if (this.isMobile) {
      this.isMobileOpen = !this.isMobileOpen;
      this.mobileMenuToggle.emit(this.isMobileOpen);
      // Prevent body scroll when drawer is open
      if (this.isMobileOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    } else {
      this.isOpen = !this.isOpen;
      this.isOpenChange.emit(this.isOpen);
      this.sidebarToggled.emit(this.isOpen);
    }
  }

  closeMobileSidebar(): void {
    if (this.isMobile && this.isMobileOpen) {
      this.isMobileOpen = false;
      document.body.style.overflow = '';
      this.mobileMenuToggle.emit(false);
    }
  }

  onNavigationClick(item: NavigationItem, index: number, event?: Event): void {
    if (!this.useRouterLinks || this.navigationItemClicked.observers.length > 0) {
      // Use custom navigation if useRouterLinks is false or if there are listeners
      event?.preventDefault();
      this.navigationItemClicked.emit({ item, index });
    }
    // Close mobile sidebar after navigation
    if (this.isMobile) {
      this.isMobileOpen = false;
      document.body.style.overflow = ''; // Reset body scroll
    }
    // Otherwise, let the routerLink handle the navigation
  }

  getNavigationItemClass(index: number): string {
    if (this.activeTabIndex !== undefined && index === this.activeTabIndex) {
      return 'font-semibold text-white bg-[#4A5BD1] shadow-md';
    }
    return '';
  }

  isActiveRoute(routerLink: string): boolean {
    if (this.activeTabIndex !== undefined) {
      // If activeTabIndex is provided, use that for active state
      return false;
    }
    // Otherwise, use router to determine active state
    return this.router.isActive(routerLink, { paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' });
  }
}
