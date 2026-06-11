// src/app/features/landing/components/footer/footer.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

export interface Social {
  id: string;
  label: string;
  href: string;
}

export const SOCIALS: ReadonlyArray<Social> = [
  { id: 'twitter',  label: 'Twitter',  href: '#' },
  { id: 'linkedin', label: 'LinkedIn', href: '#' },
  { id: 'github',   label: 'GitHub',   href: '#' },
  { id: 'facebook', label: 'Facebook', href: '#' },
  { id: 'instagram',label: 'Instagram',href: '#' },
  { id: 'youtube',  label: 'YouTube',  href: '#' },
  { id: 'telegram', label: 'Telegram', href: '#' },
  { id: 'whatsapp', label: 'WhatsApp', href: '#' }
] as const;

@Component({
  standalone: true,
  selector: 'app-footer',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  readonly socials = SOCIALS;
  readonly year = new Date().getFullYear();

  constructor(private router: Router) {}

  goToTerms(event?: MouseEvent) {
  if (event) event.preventDefault();
  this.router.navigate(['/terms-and-condtion'],);
}
}
