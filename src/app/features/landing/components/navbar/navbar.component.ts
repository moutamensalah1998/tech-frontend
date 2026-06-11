import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Router} from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageSwitcherComponent } from '../../../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, TranslatePipe, LanguageSwitcherComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
    @Input() isDarkMode = false;
    @Output() toggleDarkMode = new EventEmitter<void>();
    
    isMobileMenuOpen: boolean = false;

    constructor(private router: Router) { }

    goToLogin() {
        this.router.navigate(['/auth/sign-in']);
    }

    onToggleDarkMode() {
        this.toggleDarkMode.emit();
    }

    toggleMobileMenu(): void {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        // Prevent body scroll when menu is open
        if (this.isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    closeMobileMenu(): void {
        this.isMobileMenuOpen = false;
        document.body.style.overflow = '';
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        // Close menu if clicking outside of it
        if (this.isMobileMenuOpen && 
            mobileMenu && 
            mobileMenuButton &&
            !mobileMenu.contains(target) && 
            !mobileMenuButton.contains(target)) {
            this.closeMobileMenu();
        }
    }

    @HostListener('window:resize', [])
    onWindowResize(): void {
        // Close mobile menu when window is resized to desktop size
        if (window.innerWidth >= 768 && this.isMobileMenuOpen) {
            this.closeMobileMenu();
        }
    }
}
