import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';
import { ThemeService } from '../../../../../../core/services/theme/theme.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-user-preferences',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    templateUrl: './user-preferences.component.html',
    styleUrls: ['./user-preferences.component.css']
})
export class UserPreferencesComponent implements OnInit, OnDestroy {
    isDarkMode: boolean = false;
    currentLang: string = 'en';
    private destroy$ = new Subject<void>();

    constructor(
        private translationService: TranslationService,
        private themeService: ThemeService
    ) { }

    ngOnInit(): void {
        // Subscribe to theme changes from the central service
        this.themeService.resolvedTheme$
            .pipe(takeUntil(this.destroy$))
            .subscribe(theme => {
                this.isDarkMode = theme === 'dark';
            });

        // Subscribe to language changes
        this.translationService.getCurrentLang()
            .pipe(takeUntil(this.destroy$))
            .subscribe(lang => {
                this.currentLang = lang;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    toggleDarkMode(): void {
        this.themeService.toggleTheme();
    }

    setLanguage(lang: string): void {
        if (lang !== this.currentLang) {
            this.translationService.setLanguage(lang);
        }
    }
}

