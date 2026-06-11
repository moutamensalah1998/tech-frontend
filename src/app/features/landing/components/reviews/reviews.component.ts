import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

export interface Review {
  id: string;
  name: string;
  companyKey: string;
  companyUrl?: string;
  avatar: string;
  rating: number; // 0-5 integer
  textKey: string;
}

export const REVIEWS: ReadonlyArray<Review> = [
  {
    id: 'r1',
    name: 'Al Ghanim',
    companyKey: 'landing.reviews.linkCompany',
    companyUrl: 'https://alghanim-store.com/',
    avatar: 'assets/customers_logo/logo_alghanim.png',
    rating: 5,
    textKey: 'landing.reviews.reviews.alghanim'
  },
  {
    id: 'r2',
    name: 'Masdar Technologies',
    companyKey: 'landing.reviews.linkCompany',
    companyUrl: 'https://masdar.ae/',
    avatar: 'assets/customers_logo/logo_masdar.png',
    rating: 5,
    textKey: 'landing.reviews.reviews.masdar'
  },
  {
    id: 'r3',
    name: 'Techno Best',
    companyKey: 'landing.reviews.linkCompany',
    companyUrl: 'https://techno-best.com/',
    avatar: 'assets/customers_logo/logo_techno_best.png',
    rating: 5,
    textKey: 'landing.reviews.reviews.technoBest'
  },
  {
    id: 'r4',
    name: 'oodo',
    companyKey: 'landing.reviews.linkCompany',
    companyUrl: 'https://www.odoo.com/ar',
    avatar: 'assets/customers_logo/logo_oodo.png',
    rating: 5,
    textKey: 'landing.reviews.reviews.oodo'
  }
] as const;

@Component({
  standalone: true,
  selector: 'app-reviews',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewsComponent {
  readonly reviews = REVIEWS;

  @ViewChild('slider', { static: true }) slider!: ElementRef<HTMLElement>;

  // helpers for template loops
  createRange(n: number) {
    return Array.from({ length: Math.max(0, Math.floor(n)) });
  }

  // trackBy to avoid re-rendering
  trackByReview(_: number, r: Review) {
    return r.id;
  }

  private get sliderEl(): HTMLElement {
    return this.slider.nativeElement;
  }

  scrollNext() {
    const el = this.sliderEl;
    const cardWidth = this.getCardWidth();
    el.scrollBy({ left: cardWidth + 24, behavior: 'smooth' });
  }

  scrollPrev() {
    const el = this.sliderEl;
    const cardWidth = this.getCardWidth();
    el.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
  }

  scrollToIndex(index: number) {
    const el = this.sliderEl;
    const cardWidth = this.getCardWidth();
    el.scrollTo({ left: index * (cardWidth + 24), behavior: 'smooth' });
  }

  private getCardWidth(): number {
    const el = this.sliderEl;
    const first = el.querySelector<HTMLElement>('.review-card');
    if (!first) return 320; // fallback
    const style = getComputedStyle(first);
    const marginRight = parseFloat(style.marginRight || '0');
    return first.offsetWidth + marginRight;
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.scrollNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.scrollPrev();
    }
  }

  focusCard(ev: Event) {
    const target = ev.currentTarget as HTMLElement | null;
    if (target) target.focus();
  }
}
