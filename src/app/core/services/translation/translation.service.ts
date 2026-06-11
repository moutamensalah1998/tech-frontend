import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, ReplaySubject, firstValueFrom } from 'rxjs';
import { catchError, shareReplay, tap, map } from 'rxjs/operators';

export interface Translations {
  [key: string]: string | Translations;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLang$ = new BehaviorSubject<string>('en');
  private translationsLoaded$ = new ReplaySubject<string>(1); // replay last loaded lang
  private translations: { [lang: string]: Translations } = {};
  private translationObservables: { [lang: string]: Observable<Translations> } = {};
  private defaultLang = 'en';

  constructor(private http: HttpClient) {
    const savedLang = localStorage.getItem('app-language') || this.defaultLang;
    this.currentLang$.next(savedLang);
    this.updateDocumentDirection(savedLang);

    // Start loading initial translations (subscribe so it actually starts)
    this.loadTranslations$(savedLang).subscribe({
      next: () => {/* loaded */},
      error: err => console.error('Failed to load initial translations:', err)
    });
  }

  // Observables
  getTranslationsLoaded$(): Observable<string> {
    return this.translationsLoaded$.asObservable();
  }

  getCurrentLang(): Observable<string> {
    return this.currentLang$.asObservable();
  }

  getCurrentLangSync(): string {
    return this.currentLang$.value;
  }

  areTranslationsLoaded(lang?: string): boolean {
    const l = lang ?? this.currentLang$.value;
    const t = this.translations[l];
    return !!t && Object.keys(t).length > 0;
  }

  setLanguage(lang: string): void {
    if (lang === this.currentLang$.value) { return; }
    this.currentLang$.next(lang);
    localStorage.setItem('app-language', lang);
    this.updateDocumentDirection(lang);

    // Trigger loading (subscribe to start)
    this.loadTranslations$(lang).subscribe({
      next: () => {
        // after load: emit loaded lang (already done inside loadTranslations$ via tap)
        // also re-emit current language to force any listeners if needed
        this.currentLang$.next(lang);
      },
      error: err => {
        console.error('Error loading translations for', lang, err);
      }
    });
  }

  /**
   * Load translations as Observable and cache the observable (shareReplay)
   */
  loadTranslations$(lang: string): Observable<Translations> {
    if (this.translationObservables[lang]) {
      return this.translationObservables[lang];
    }

    // If already in memory, return it as of(...)
    if (this.translations[lang] && Object.keys(this.translations[lang]).length > 0) {
      const obs = of(this.translations[lang]);
      this.translationObservables[lang] = obs;
      return obs;
    }

    const url = `/assets/i18n/${lang}.json`;
    const obs$ = this.http.get<Translations>(url).pipe(
      tap(data => {
        this.translations[lang] = data || {};
        this.translationsLoaded$.next(lang); // notify listeners
      }),
      catchError(err => {
        console.error(`Failed to load translations for ${lang} from ${url}`, err);
        // Fallback to defaultLang if present
        if (lang !== this.defaultLang && this.translations[this.defaultLang]) {
          this.translations[lang] = this.translations[this.defaultLang];
          this.translationsLoaded$.next(lang);
          return of(this.translations[lang]);
        }
        // ensure we set an empty object to avoid re-trying repeatedly
        this.translations[lang] = {};
        return of(this.translations[lang]);
      }),
      shareReplay(1)
    );

    this.translationObservables[lang] = obs$;
    return obs$;
  }

  /**
   * Synchronous translate (best-effort). If translations not loaded yet returns the key.
   */
  translate(key: string, params?: { [key: string]: any }): string {
    if (!key) return '';

    const lang = this.currentLang$.value;
    let translations = this.translations[lang];

    if (!translations || Object.keys(translations).length === 0) {
      translations = this.translations[this.defaultLang];
    }

    if (!translations || Object.keys(translations).length === 0) {
      // trigger async load if not already loading
      if (!this.translationObservables[lang]) {
        this.loadTranslations$(lang).subscribe(); // start loading in background
      }
      return key;
    }

    const value = this.getNestedValue(translations, key);

    if (value === undefined || value === null) {
      // fallback to default lang if available
      if (lang !== this.defaultLang && this.translations[this.defaultLang]) {
        const defaultValue = this.getNestedValue(this.translations[this.defaultLang], key);
        if (defaultValue !== undefined && defaultValue !== null && typeof defaultValue === 'string') {
          return params ? this.replaceParams(defaultValue, params) : defaultValue;
        }
      }
      console.warn(`Translation missing for key: ${key} in language: ${lang}`);
      return key;
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string for key: ${key}`, value);
      return key;
    }

    return params ? this.replaceParams(value, params) : value;
  }

  /**
   * Optionally: an async variant that returns an Observable<string>
   */
  translate$(key: string, params?: { [key: string]: any }): Observable<string> {
    const lang = this.currentLang$.value;
    // Ensure loading triggered
    const load$ = this.loadTranslations$(lang);
    return load$.pipe(
      map(() => this.translate(key, params))
    );
  }

  // ----- helpers -----
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  private replaceParams(text: string, params: { [key: string]: any }): string {
    // Simple parameter replacement: {{param}} -> params.param
    // Also supports very simple conditional: {{flag ? 'Yes' : 'No'}}
    return text.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      const expr = expression.trim();

      // simple conditional detection
      const condMatch = expr.match(/^([^\?]+)\?(.+):(.+)$/);
      if (condMatch) {
        const condition = condMatch[1].trim();
        const truePart = condMatch[2].trim().replace(/^['"]|['"]$/g, '');
        const falsePart = condMatch[3].trim().replace(/^['"]|['"]$/g, '');
        const condValue = params[condition];
        return condValue ? truePart : falsePart;
      }

      // simple param
      return params.hasOwnProperty(expr) ? String(params[expr]) : match;
    });
  }

  private updateDocumentDirection(lang: string): void {
    const html = document.documentElement;
    if (lang === 'ar') {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'ar');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', lang || 'en');
    }
  }

  // initialize helper to be used by app initializer if desired
  async initialize(): Promise<void> {
    const lang = this.currentLang$.value;
    this.updateDocumentDirection(lang);
    try {
      await firstValueFrom(this.loadTranslations$(lang));
      this.currentLang$.next(lang);
    } catch (err) {
      console.error('Failed to initialize translations:', err);
      throw err;
    }
  }
}
