// action-buttons.component.ts - UPDATED with category restrictions
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { ButtonService } from '../../../../services/button.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslatePipe } from '../../../../../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-action-buttons',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './action-buttons.component.html'
})
export class ActionButtonsComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(public buttonService: ButtonService) {}

  ngOnInit(): void {
    // Existing code...
    this.form.get('category')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(category => {
        this.handleCategoryChange(category);
      });

    /** ⬇️ Ensure offerCode is sanitized & validated */
    const offerCtrl = this.form.get('offerCode');
    if (offerCtrl) {
      offerCtrl.setValidators([
        Validators.maxLength(15),
        Validators.pattern('^[A-Za-z0-9]*$')
      ]);

      const sanitized = (offerCtrl.value || '').toString().replace(/[^A-Za-z0-9]/g, '');
      if (sanitized !== offerCtrl.value) {
        offerCtrl.setValue(sanitized, { emitEvent: false });
      }
      offerCtrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  onOfferCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value || '';
    const sanitized = raw.replace(/[^A-Za-z0-9]/g, '');
    if (sanitized !== raw) {
      input.value = sanitized;
      this.form.get('offerCode')?.setValue(sanitized, { emitEvent: true });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get currentCategory(): string {
    return this.form.get('category')?.value || '';
  }

  get isPhoneButtonAllowed(): boolean {
    return this.buttonService.isButtonTypeAllowed('phone', this.currentCategory);
  }

  get isCopyButtonAllowed(): boolean {
    return this.buttonService.isButtonTypeAllowed('copy', this.currentCategory);
  }

  get isAuthCopyButtonAllowed(): boolean {
    return this.buttonService.isButtonTypeAllowed('authCopy', this.currentCategory);
  }

  get showPhoneButtonDisabledMessage(): boolean {
    return !this.isPhoneButtonAllowed ;
  }



  get showCopyButtonDisabledMessage(): boolean {
    return !this.isCopyButtonAllowed;
  }

  private handleCategoryChange(category: string): void {
    const upperCategory = category?.toUpperCase();

    // Disable and clear phone button for AUTH
    if (upperCategory === 'AUTHENTICATION' && this.buttonService.hasPhoneButton) {
      this.buttonService.hasPhoneButton = false;
      this.form.patchValue({
        callButtonText: '',
        phoneNumber: ''
      });
    }

    // Disable and clear copy button for AUTH and UTILITY
    if ((upperCategory === 'AUTHENTICATION' || upperCategory === 'UTILITY') && this.buttonService.hasCopyButton) {
      this.buttonService.hasCopyButton = false;
      this.form.patchValue({
        offerCode: ''
      });
    }
  }

  toggleButton(type: 'phone' | 'copy' | 'authCopy'): void {
    // Check if button type is allowed for current category
    if (!this.buttonService.isButtonTypeAllowed(type, this.currentCategory)) {
      // Show user feedback that this action is not allowed
      return;
    }

    this.buttonService.toggleButton(type, this.form);
  }
}
