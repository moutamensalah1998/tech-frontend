import { Injectable, signal, effect, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly STORAGE_KEY = 'app_theme';

    // Using signals for reactive state
    private themeSignal = signal<Theme>('system');
    private resolvedThemeSignal = signal<ResolvedTheme>('light');

    // Observable for components that prefer RxJS
    private themeSubject = new BehaviorSubject<Theme>('system');
    private resolvedThemeSubject = new BehaviorSubject<ResolvedTheme>('light');

    // Public observables
    theme$: Observable<Theme> = this.themeSubject.asObservable();
    resolvedTheme$: Observable<ResolvedTheme> = this.resolvedThemeSubject.asObservable();

    // Computed signal for isDarkMode
    readonly isDarkMode = computed(() => this.resolvedThemeSignal() === 'dark');

    // For template binding
    get isDarkModeValue(): boolean {
        return this.resolvedThemeSignal() === 'dark';
    }

    constructor() {
        this.initializeTheme();
        this.setupSystemThemeListener();

        // Effect to sync signal changes with BehaviorSubjects and DOM
        effect(() => {
            const theme = this.themeSignal();
            const resolvedTheme = this.resolvedThemeSignal();

            this.themeSubject.next(theme);
            this.resolvedThemeSubject.next(resolvedTheme);
            this.applyTheme(resolvedTheme);
        });
    }

    /**
     * Get the current theme setting
     */
    get theme(): Theme {
        return this.themeSignal();
    }

    /**
     * Get the resolved theme (actual light/dark value)
     */
    get resolvedTheme(): ResolvedTheme {
        return this.resolvedThemeSignal();
    }

    /**
     * Set the theme
     */
    setTheme(theme: Theme): void {
        this.themeSignal.set(theme);
        this.saveTheme(theme);
        this.updateResolvedTheme();
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme(): void {
        const currentResolved = this.resolvedThemeSignal();
        const newTheme: Theme = currentResolved === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Set to system preference
     */
    useSystemPreference(): void {
        this.setTheme('system');
    }

    /**
     * Initialize theme from storage or system preference
     */
    private initializeTheme(): void {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY) as Theme;
            if (saved === 'dark' || saved === 'light' || saved === 'system') {
                this.themeSignal.set(saved);
            } else {
                this.themeSignal.set('system');
            }
            this.updateResolvedTheme();
        } catch (error) {
            console.error('Failed to load theme:', error);
            this.themeSignal.set('system');
            this.updateResolvedTheme();
        }
    }

    /**
     * Update the resolved theme based on current setting
     */
    private updateResolvedTheme(): void {
        const theme = this.themeSignal();

        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.resolvedThemeSignal.set(prefersDark ? 'dark' : 'light');
        } else {
            this.resolvedThemeSignal.set(theme);
        }
    }

    /**
     * Apply theme to the DOM
     */
    private applyTheme(theme: ResolvedTheme): void {
        const root = document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
        }

        // Also update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
    }

    /**
     * Update meta theme-color for mobile browsers
     */
    private updateMetaThemeColor(theme: ResolvedTheme): void {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        const color = theme === 'dark' ? '#0F1419' : '#F5F5F5';

        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', color);
        } else {
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = color;
            document.head.appendChild(meta);
        }
    }

    /**
     * Save theme to localStorage
     */
    private saveTheme(theme: Theme): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    }

    /**
     * Listen for system theme changes
     */
    private setupSystemThemeListener(): void {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        mediaQuery.addEventListener('change', (e) => {
            if (this.themeSignal() === 'system') {
                this.resolvedThemeSignal.set(e.matches ? 'dark' : 'light');
            }
        });
    }
}
