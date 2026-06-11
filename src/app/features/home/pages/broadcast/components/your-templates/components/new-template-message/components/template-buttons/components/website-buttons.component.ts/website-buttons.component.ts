// website-buttons.component.ts - UPDATED with category restrictions
import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { ButtonService } from '../../../../services/button.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslatePipe } from '../../../../../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-website-buttons',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './website-buttons.component.html'
})
export class WebsiteButtonsComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    public buttonService: ButtonService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Watch for category changes to enforce restrictions
    if (this.form) {
      this.form.get('category')?.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(category => {
          this.handleCategoryChange(category);
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get currentCategory(): string {
    return this.form?.get('category')?.value || '';
  }

  get isWebsiteButtonsAllowed(): boolean {
    return this.buttonService.isButtonTypeAllowed('website', this.currentCategory);
  }

  get websiteButtons() {
    return this.buttonService.websiteButtons;
  }

  private handleCategoryChange(category: string): void {
    const upperCategory = category?.toUpperCase();

    // Clear website buttons for AUTH category
    if (upperCategory === 'AUTHENTICATION') {
      this.buttonService.setWebsiteButtonsDirectly([]);
    }
  }

  addButton(): void {
    // Check if website buttons are allowed for current category
    if (!this.isWebsiteButtonsAllowed) {
      return;
    }

    if (this.websiteButtons.length < 2) {
      this.buttonService.addWebsiteButton(this.form);
    }
  }

  removeButton(index: number): void {
    this.buttonService.removeWebsiteButton(index);
  }

  updateButton(index: number, field: 'text' | 'url', event: Event): void {
    const target = event.target as HTMLInputElement;
    this.buttonService.updateWebsiteButton(index, field, target.value);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
