import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy, inject } from '@angular/core';
import { TranslationService } from '../services/translation/translation.service';
import { Subject, merge } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false 
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  private initialized = false;

  transform(key: string, params?: { [key: string]: any }): string {
    if (!this.initialized) {
      this.initialized = true;
      merge(
        this.translationService.getCurrentLang().pipe(distinctUntilChanged()),
        this.translationService.getTranslationsLoaded$()
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
    }

    return this.translationService.translate(key, params);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
