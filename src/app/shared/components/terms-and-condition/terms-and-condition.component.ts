import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
  HostListener,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { TERMS_SECTIONS } from '../../../core/utils/terms-section-constant';
import { Section } from '../../../core/utils/privacy-terms-constant';

@Component({
  selector: 'app-terms-and-condition',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms-and-condition.component.html',
})
export class TermsAndConditionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('appHeader') appHeader!: ElementRef<HTMLElement>;
  @ViewChild('mainContent') mainContent!: ElementRef<HTMLElement>;
  @ViewChildren('sectionAnchor', { read: ElementRef }) sectionAnchors!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('sectionContent', { read: ElementRef }) sectionContents!: QueryList<ElementRef<HTMLElement>>;

  private resizeObservers: ResizeObserver[] = [];

  headerHeight = 0;
  expandedSection: number | null = null;

  termsSections: Section[] = JSON.parse(JSON.stringify(TERMS_SECTIONS));

  contentHeights: number[] = [];

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    Promise.resolve().then(() => {
      this.updateHeaderHeight();
      this.ngZone.runOutsideAngular(() => {
        this.calculateContentHeights();
      });
      this.cdr.detectChanges();
    });

    this.sectionContents.changes.subscribe(() => {
      this.ngZone.runOutsideAngular(() => {
        this.calculateContentHeights();
      });
      Promise.resolve().then(() => this.cdr.detectChanges());
    });
  }

  ngOnDestroy(): void {
    this.resizeObservers.forEach(obs => obs.disconnect());
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateHeaderHeight();
    this.calculateContentHeights();
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

  toggleSection(i: number): void {
    this.expandedSection = this.expandedSection === i ? null : i;

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.calculateContentHeights(), 40);
    });
    Promise.resolve().then(() => this.cdr.detectChanges());
  }

  onScroll(evt: any): void {
  }

  goToPrivacy(): void {
    this.router.navigate(['/auth/privacy-policy']);
  }

  private calculateContentHeights(): void {
    const contents = this.sectionContents ? this.sectionContents.toArray() : [];
    this.contentHeights = contents.map((c) => {
      try {
        const el = c.nativeElement as HTMLElement;
        return Math.ceil(el.scrollHeight) + 8; // small buffer
      } catch {
        return 0;
      }
    });

    contents.forEach((c, idx) => {
      const el = c.nativeElement as HTMLElement;
      if ((el as any).__resize_observed) return;
      const ro = new ResizeObserver(() => {
        this.ngZone.run(() => {
          this.contentHeights[idx] = Math.ceil(el.scrollHeight) + 8;
          this.cdr.detectChanges();
        });
      });
      ro.observe(el);
      (el as any).__resize_observed = true;
      this.resizeObservers.push(ro);
    });
  }

  trackByIndex(_: number, __: Section) {
    return _;
  }
}
