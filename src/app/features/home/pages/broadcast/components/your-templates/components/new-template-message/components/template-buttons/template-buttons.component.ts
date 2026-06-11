// template-buttons.component.ts - UPDATED with Enhanced Marketing Enforcement
import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ButtonService } from '../../services/button.service';
import { TemplateFormService } from '../../services/template-form.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { ActionButtonsComponent } from './components/action-buttons/action-buttons.component';
import { QuickReplyButtonsComponent } from './components/quick-reply-buttons/quick-reply-buttons.component';
import { WebsiteButtonsComponent } from './components/website-buttons.component.ts/website-buttons.component';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-template-buttons',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    WebsiteButtonsComponent,
    ActionButtonsComponent,
    QuickReplyButtonsComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './template-buttons.component.html',
})
export class TemplateButtonsComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;

  buttonsEnabled = false;
  private destroy$ = new Subject<void>();

  constructor(
    public buttonService: ButtonService,
    public formService: TemplateFormService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.buttonService.registerChangeDetector(this.cdr);
    this.initializeButtonState();
    this.subscribeToFormChanges();
    this.subscribeToButtonService();
    this.subscribeToTranslations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get currentCategory(): string {
    return this.form.get('category')?.value || '';
  }

  get isAuthenticationCategory(): boolean {
    return this.currentCategory.toUpperCase() === 'AUTHENTICATION';
  }

  get isMarketingCategory(): boolean {
    return this.currentCategory.toUpperCase() === 'MARKETING';
  }

  get isUtilityCategory(): boolean {
    return this.currentCategory.toUpperCase() === 'UTILITY';
  }

  get hasAnyButtons(): boolean {
    return this.buttonService.hasAnyButtons(this.form);
  }

  get categoryRestrictions() {
    return this.formService.getCategoryRestrictions(this.currentCategory);
  }

  // Enhanced validation for marketing templates
  get isMarketingCompliant(): boolean {
    if (!this.isMarketingCategory) {
      return true; // Not a marketing template, so compliance check doesn't apply
    }
    return this.hasAnyButtons;
  }

  get showMarketingWarning(): boolean {
    return this.isMarketingCategory && !this.hasAnyButtons;
  }

  private initializeButtonState(): void {
    this.buttonsEnabled =
      this.buttonService.hasAnyButtons(this.form) ||
      this.buttonService.websiteButtons.length > 0 ||
      this.buttonService.hasPhoneButton ||
      this.buttonService.hasCopyButton ||
      this.buttonService.hasAuthCopyButton;

    // For marketing templates, buttons should be enabled by default
    if (this.isMarketingCategory && !this.buttonsEnabled) {
      this.buttonsEnabled = true;
    }

    // Disable buttons for restricted categories
    if (!this.categoryRestrictions.allowsButtons) {
      this.buttonsEnabled = false;
      this.buttonService.clearAllButtons(this.form);
    }

    this.cdr.detectChanges();
  }

  private subscribeToButtonService(): void {
    this.buttonService.websiteButtons$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.buttonService.hasPhoneButton$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.buttonService.hasCopyButton$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.buttonService.hasAuthCopyButton$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.buttonService.updates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.detectChanges());
  }

  private subscribeToTranslations(): void {
    // Subscribe to translation loading events to trigger change detection
    this.translationService.getTranslationsLoaded$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    // Also subscribe to language changes
    this.translationService.getCurrentLang()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  private subscribeToFormChanges(): void {
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(100))
      .subscribe(() => this.updateButtonState());

    // Watch for category changes specifically
    this.form
      .get('category')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((category) => {
        this.handleCategoryChange(category);
      });
  }

  private handleCategoryChange(category: string): void {
    const upperCategory = category?.toUpperCase();

    // Clear restricted buttons when category changes
    this.buttonService.clearRestrictedButtons(category, this.form);

    // Update button state based on category
    if (upperCategory === 'AUTHENTICATION') {
      this.buttonsEnabled = false;
    } else if (upperCategory === 'MARKETING') {
      // For marketing templates, enable buttons by default if none exist
      if (!this.hasAnyButtons) {
        this.buttonsEnabled = true;
      }
    } else {
      // For other categories, maintain button state but respect restrictions
      this.buttonsEnabled =
        this.buttonService.hasAnyButtons(this.form) || this.buttonsEnabled;
    }

    this.cdr.detectChanges();
  }

  toggleButtons(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newState = target.checked;

    // Don't allow enabling buttons for restricted categories
    if (!this.categoryRestrictions.allowsButtons && newState) {
      target.checked = false;
      this.buttonsEnabled = false;
      return;
    }

    // For marketing templates, warn if trying to disable all buttons
    if (this.isMarketingCategory && !newState && this.hasAnyButtons) {
      const confirmed = confirm(
        'Marketing templates require at least one button. Are you sure you want to disable all buttons? This will prevent template submission.'
      );

      if (!confirmed) {
        target.checked = true;
        return;
      }
    }

    this.buttonsEnabled = newState;

    if (!this.buttonsEnabled) {
      this.buttonService.clearAllButtons(this.form);
    }

    this.cdr.detectChanges();
  }

  private updateButtonState(): void {
    // Disable buttons for restricted categories
    if (!this.categoryRestrictions.allowsButtons) {
      this.buttonsEnabled = false;
    }

    // For marketing templates, show warning if no buttons
    if (
      this.isMarketingCategory &&
      !this.hasAnyButtons &&
      this.buttonsEnabled
    ) {
      // This will trigger the warning display in the template
    }

    this.cdr.markForCheck();
  }

  // Helper method to get button count for validation display
getButtonCount(): number {
    let count = 0;

    // Count website buttons
    count += this.buttonService.websiteButtons.filter(
      (btn) => btn.text.trim() && btn.url.trim()
    ).length;

    // Count phone button
    if (
      this.buttonService.hasPhoneButton &&
      this.form?.get('callButtonText')?.value?.trim() &&
      this.form?.get('phoneNumber')?.value?.trim()
    ) {
      count++;
    }

    // Count copy button
    if (
      this.buttonService.hasCopyButton &&
      this.form?.get('offerCode')?.value?.trim()
    ) {
      count++;
    }

    // Count auth copy button
    if (
      this.buttonService.hasAuthCopyButton &&
      this.form?.get('authCopyButtonText')?.value?.trim()
    ) {
      count++;
    }

    // Count quick replies - with null check
    if (this.form) {
      try {
        const quickReplies = this.form.get('quickReplyTexts')?.value || [];
        count += quickReplies.filter((text: string) => text?.trim()).length;
      } catch (error) {
        console.warn('Error getting quick replies count:', error);
        // Fallback to checking FormArray directly
        const quickReplyArray = this.form.get('quickReplyTexts') as any;
        if (quickReplyArray && quickReplyArray.controls) {
          count += quickReplyArray.controls.filter((control: any) =>
            control.value?.trim()
          ).length;
        }
      }
    }

    return count;
  }

  // Helper method for enhanced marketing template validation
  getMarketingValidationMessage(): string {
    if (!this.isMarketingCategory) {
      return '';
    }

    if (!this.buttonsEnabled) {
      return 'Marketing templates require buttons to be enabled with at least one button configured.';
    }

    if (!this.hasAnyButtons) {
      return 'Please add at least one button (Website, Phone, Copy Code, or Quick Reply) to comply with marketing template requirements.';
    }

    return '';
  }
}
