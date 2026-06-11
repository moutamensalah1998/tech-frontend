import {
  Component,
  HostListener,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService } from '../../../core/services/toast-message.service';
import { PRIVACY_AND_TERMS_SECTIONS, Section } from '../../../core/utils/privacy-terms-constant';
import { TERMS_SECTIONS } from '../../../core/utils/terms-section-constant';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy-policy.component.html',
})
export class PrivacyPolicyComponent implements AfterViewInit, OnDestroy {
  @ViewChild('appHeader') appHeader!: ElementRef<HTMLElement>;
  @ViewChild('mainContent') mainContent!: ElementRef<HTMLElement>;
  @ViewChildren('sectionAnchor', { read: ElementRef }) sectionAnchors!: QueryList<ElementRef<HTMLElement>>;

  isDark = false;
  expandedSection: number | null = null;
  scrollProgress = 0;
  termsAccepted = false;
  termsAcceptedAt: string | null = null;
  privacyAcceptedAt: string | null = null;
  headerHeight = 0;
  sections: Section[] = PRIVACY_AND_TERMS_SECTIONS
    .filter(s => !TERMS_SECTIONS.some(t => t.title === s.title))
    .map(s => ({ ...s }));
  private routeSub?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private el: ElementRef,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.isDark = localStorage.getItem('darkMode') === '1';
    this.termsAccepted = localStorage.getItem('termsAccepted') === '1';
    this.termsAcceptedAt = localStorage.getItem('termsAcceptedAt');
    this.privacyAcceptedAt = localStorage.getItem('privacyAcceptedAt');
  }

  ngAfterViewInit(): void {
    Promise.resolve().then(() => {
      this.updateHeaderHeight();
      this.cdr.detectChanges();

      setTimeout(() => {
        this.updateHeaderHeight();
        this.cdr.detectChanges();
      }, 120);
    });

    this.routeSub = this.route.queryParams.subscribe(params => {
      const raw = params['scrollTo'] ?? params['section'];
      if (!raw) return;

      const parsed = Number(raw);
      if (!isNaN(parsed) && parsed >= 1) {
        const idx = parsed - 1;
        setTimeout(() => this.scrollToSection(idx), 60);
        return;
      }

      if (typeof raw === 'string') {
        const key = raw.toLowerCase();
        if (key === 'terms' || key === 'conditions' || key.includes('term')) {
          const idx = this.getSectionIndexByTitle('شروط الخدمة');
          if (idx >= 0) setTimeout(() => this.scrollToSection(idx), 60);
        } else {
          const idx = this.getSectionIndexByTitle(raw);
          if (idx >= 0) setTimeout(() => this.scrollToSection(idx), 60);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateHeaderHeight();
    this.cdr.detectChanges();
  }

  private updateHeaderHeight(): void {
    try {
      if (this.appHeader && this.appHeader.nativeElement) {
        this.headerHeight = Math.ceil(this.appHeader.nativeElement.getBoundingClientRect().height);
      }
    } catch {
      this.headerHeight = 64;
    }
  }

  onScroll(event: any): void {
    const element = event.target as HTMLElement;
    const scrolled = element.scrollTop;
    const height = element.scrollHeight - element.clientHeight;
    this.scrollProgress = height > 0 ? (scrolled / height) * 100 : 0;
  }

  accept(): void {
    if (!this.termsAccepted) {
      this.toastService.showToast('يرجى الموافقة على شروط الخدمة قبل المتابعة.', 'error');
      return;
    }
    localStorage.setItem('privacyAccepted', '1');
    localStorage.setItem('termsAccepted', '1');
    const now = new Date().toISOString();
    localStorage.setItem('termsAcceptedAt', now);
    localStorage.setItem('privacyAcceptedAt', now);
    this.termsAcceptedAt = now;
    this.privacyAcceptedAt = now;
    this.router.navigate(['/auth/sign-in']);
  }

  decline(): void {
    localStorage.removeItem('privacyAccepted');
    localStorage.removeItem('termsAccepted');
    this.router.navigate(['/auth/sign-in']);
  }

  toggleDark(): void {
    this.isDark = !this.isDark;
    localStorage.setItem('darkMode', this.isDark ? '1' : '0');

    setTimeout(() => {
      this.updateHeaderHeight();
      this.cdr.detectChanges();
    }, 80);
  }

  toggleSection(index: number): void {
    this.expandedSection = this.expandedSection === index ? null : index;
  }

  toggleTermsAccepted(): void {
    this.termsAccepted = !this.termsAccepted;
  }

  getSectionIndexByTitle(partialTitle: string): number {
    if (!partialTitle) return -1;
    const lowered = partialTitle.toLowerCase();
    return this.sections.findIndex(s => (s.title || '').toLowerCase().includes(lowered));
  }

  scrollToSection(index: number): void {
    if (index == null || index < 0 || index >= this.sections.length) return;

    this.expandedSection = index;

    setTimeout(() => {
      const anchors = this.sectionAnchors ? this.sectionAnchors.toArray() : [];
      const anchorRef = anchors[index];
      const mainEl = this.mainContent && this.mainContent.nativeElement ? this.mainContent.nativeElement : null;

      if (!anchorRef || !mainEl) return;

      const targetTop = anchorRef.nativeElement.offsetTop;
      const padding = 12;
      const scrollTo = Math.max(0, targetTop - this.headerHeight - padding);

      try {
        mainEl.scrollTo({ top: scrollTo, behavior: 'smooth' } as any);
      } catch {
        mainEl.scrollTop = scrollTo;
      }

    }, 80);
  }

  onRouteClick(event: MouseEvent): void {
  event.preventDefault();
  this.router.navigate(['/delete-data']);
}

}
