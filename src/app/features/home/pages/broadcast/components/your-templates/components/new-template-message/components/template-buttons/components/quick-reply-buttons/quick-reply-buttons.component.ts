// quick-reply-buttons.component.ts - FIXED VERSION for proper form integration
import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormArray } from '@angular/forms';
import { ButtonService } from '../../../../services/button.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { TranslatePipe } from '../../../../../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-quick-reply-buttons',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quick-reply-buttons.component.html'
})
export class QuickReplyButtonsComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private buttonService: ButtonService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscribeToFormArrayChanges();
    this.subscribeToButtonServiceUpdates();
    this.subscribeToCategoryChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get currentCategory(): string {
    return this.form?.get('category')?.value || '';
  }

  get isQuickReplyAllowed(): boolean {
    return this.buttonService.isButtonTypeAllowed('quickReply', this.currentCategory);
  }

  get quickReplyButtons(): FormArray<any> {
    try {
      const formArray = this.form?.get('quickReplyTexts') as FormArray<any>;
      return formArray || new FormArray<any>([]);
    } catch (error) {
      console.warn('Error getting quickReplyButtons FormArray:', error);
      return new FormArray<any>([]);
    }
  }

  get quickReplyControlsArray(): any[] {
    try {
      const formArray = this.quickReplyButtons;
      return formArray ? formArray.controls : [];
    } catch (error) {
      console.warn('Error getting quickReplyControlsArray:', error);
      return [];
    }
  }

  private subscribeToCategoryChanges(): void {
    this.form.get('category')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(category => {
        this.handleCategoryChange(category);
      });
  }

  private handleCategoryChange(category: string): void {
    const upperCategory = category?.toUpperCase();

    // Clear quick reply buttons for AUTH category
    if (upperCategory === 'AUTHENTICATION') {
      const quickReplyArray = this.quickReplyButtons;
      while (quickReplyArray.length !== 0) {
        quickReplyArray.removeAt(0);
      }
      this.cdr.detectChanges();
    }
  }

  private subscribeToFormArrayChanges(): void {
    this.quickReplyButtons.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(50))
      .subscribe((values) => {
        this.cdr.detectChanges();

        // Force the parent form to update
        setTimeout(() => {
          this.form.updateValueAndValidity();
          this.form.markAsDirty();
        }, 0);
      });

    this.quickReplyButtons.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.detectChanges();
      });
  }

  private subscribeToButtonServiceUpdates(): void {
    this.buttonService.updates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.detectChanges();
      });
  }

  addQuickReply(): void {
    // Check if quick replies are allowed for current category
    if (!this.isQuickReplyAllowed) {
      return;
    }

    if (this.quickReplyControlsArray.length < 3) {
      this.buttonService.addQuickReply(this.form);

      setTimeout(() => {
        this.cdr.detectChanges();
      }, 10);
    }
  }

  removeQuickReply(index: number): void {
    this.buttonService.removeQuickReply(index, this.form);

    setTimeout(() => {
      this.cdr.detectChanges();
    }, 10);
  }

  forceRefresh(): void {
    this.cdr.detectChanges();
  }
}
