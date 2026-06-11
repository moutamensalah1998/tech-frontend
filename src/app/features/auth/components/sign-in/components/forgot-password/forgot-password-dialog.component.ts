import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  AfterViewInit,
  QueryList,
  ViewChildren,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subscription, timer } from 'rxjs';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

// <-- Adjust these paths to match your project structure -->
import {
  forgotSendEmail,
  forgotVerifyCode,
  forgotResetPassword
} from '../../../../../../core/services/user-management/ngrx/user-management.actions';
import {
  selectForgotSending,
  selectForgotVerifying,
  selectForgotResetting,
  selectForgotError,
  selectForgotResetToken,
  selectForgotResendTtl
} from '../../../../../../core/services/user-management/ngrx/user-management.selectors';

@Component({
  selector: 'app-forgot-password-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './forgot-password-dialog.component.html',
  styleUrls: ['./forgot-password-dialog.component.css']
})
export class ForgotPasswordDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  step: 'email' | 'code' | 'reset' | 'success' = 'email';

  emailForm!: FormGroup;
  codeForm!: FormGroup;
  resetForm!: FormGroup;

  sending = false;
  verifying = false;
  resetting = false;
  errorMessage: string | null = null;

  private verifiedOtpCode: string | null = null;

  resendCooldown = 0;
  private cooldownSub: Subscription | null = null;

  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private subs = new Subscription();

  constructor(private fb: FormBuilder, private store: Store) { }

  ngOnInit(): void {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.codeForm = this.fb.group({
      digits: this.fb.array(
        Array.from({ length: 6 }, () => new FormControl('', [
          Validators.required,
          Validators.pattern(/^\d$/)
        ]))
      )
    });

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(passwordPattern)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatchValidator });

    // Subscribe to sending state and navigate to 'code' step on success
    let wasSending = false;
    this.subs.add(
      this.store.select(selectForgotSending).subscribe(v => {
        const isSending = !!v;
        // If we were sending and now finished, check if we should navigate
        if (wasSending && !isSending && this.step === 'email' && !this.errorMessage) {
          this.step = 'code';
          // Focus first code input after change detection
          setTimeout(() => {
            const firstInput = this.codeInputs?.first;
            if (firstInput) firstInput.nativeElement.focus();
          }, 0);
        }
        wasSending = isSending;
        this.sending = isSending;
      })
    );
    // Subscribe to verifying state and navigate to 'reset' step on success
    let wasVerifying = false;
    this.subs.add(
      this.store.select(selectForgotVerifying).subscribe(v => {
        const isVerifying = !!v;
        // If we were verifying and now finished, check if we should navigate
        if (wasVerifying && !isVerifying && this.step === 'code' && !this.errorMessage && this.verifiedOtpCode) {
          this.step = 'reset';
          // Focus password input after change detection
          setTimeout(() => {
            const el = document.querySelector<HTMLInputElement>('input[name="password"]');
            if (el) el.focus();
          }, 0);
        }
        wasVerifying = isVerifying;
        this.verifying = isVerifying;
      })
    );
    this.subs.add(
      this.store.select(selectForgotResetting).subscribe(v => this.resetting = !!v)
    );
    this.subs.add(
      this.store.select(selectForgotError).subscribe(e => this.errorMessage = e ?? null)
    );
    // TTL for resend: start local cooldown if TTL provided
    this.subs.add(
      this.store.select(selectForgotResendTtl).subscribe(ttl => {
        if (typeof ttl === 'number' && ttl > 0) {
          this.startCooldown(ttl);
        }
      })
    );
  }

  ngAfterViewInit(): void {
    // nothing to do initially
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.clearCooldown();
  }

  // Custom validator to make sure password === confirmPassword
  private passwordsMatchValidator(group: FormGroup) {
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    return p === c ? null : { passwordsMismatch: true };
  }

  open() {
    this.step = 'email';
    this.errorMessage = null;
    this.emailForm.reset();
    (this.codeForm.get('digits') as FormArray).controls.forEach(c => c.reset());
    this.resetForm.reset();
    // clear any stored OTP code and cancel cooldown
    this.verifiedOtpCode = null;
    this.clearCooldown();
  }

  cancel() {
    this.close.emit();
  }

  // Step 1: Send email -> dispatch action (NgRx)
  sendEmail() {
    this.errorMessage = null;
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    // dispatch the forgot-send-email action
    const email = this.emailForm.get('email')!.value;
    this.store.dispatch(forgotSendEmail({ email }));

    // UI will update from selectors (sending flag)
    // The effect is expected to set resend TTL in state if backend returns it
  }

  // Resend uses same action but guarded by cooldown
  resend() {
    if (this.resendCooldown > 0) return;
    // re-dispatch using same email in the form
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    const email = this.emailForm.get('email')!.value;
    this.store.dispatch(forgotSendEmail({ email }));
  }

  // Helpers for code inputs
  get codeArray(): FormArray {
    return this.codeForm.get('digits') as FormArray;
  }

  // accept Event from (input) and cast target to HTMLInputElement
  onDigitInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = (input.value || '').replace(/\D/g, '').slice(0, 1); // only digits
    input.value = value;
    this.codeArray.at(index).setValue(value);

    if (value && index < this.codeArray.length - 1) {
      // move to next
      const arr = this.codeInputs.toArray();
      const next = arr[index + 1];
      if (next) next.nativeElement.focus();
    }
  }

  onDigitKeyDown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;
    const key = event.key;

    if (key === 'Backspace' && !input.value && index > 0) {
      const arr = this.codeInputs.toArray();
      const prev = arr[index - 1];
      if (prev) {
        prev.nativeElement.focus();
        prev.nativeElement.value = '';
        this.codeArray.at(index - 1).setValue('');
      }
    }

    // allow digits and control keys
    if (
      !(
        (key >= '0' && key <= '9') ||
        key === 'Backspace' ||
        key === 'Tab' ||
        key === 'ArrowLeft' ||
        key === 'ArrowRight' ||
        key === 'Enter'
      )
    ) {
      event.preventDefault();
    }
  }

  // Combine digits and verify -> dispatch verify action
  submitCode() {
    this.errorMessage = null;
    // mark touched
    this.codeArray.controls.forEach(c => c.markAsTouched());
    if (this.codeForm.invalid) {
      return;
    }

    const code = this.codeArray.controls.map(c => c.value).join('');
    const email = this.emailForm.get('email')!.value;

    // Store the OTP code for later use in password reset
    this.verifiedOtpCode = code;

    // dispatch the verify action; effect will confirm if OTP is valid
    this.store.dispatch(forgotVerifyCode({ email, otp_code: code }));

    // verifying flag will be updated via selector subscription
  }

  // Step 3: Reset password -> dispatch reset action using OTP code
  submitReset() {
    this.errorMessage = null;
    this.resetForm.markAllAsTouched();
    if (this.resetForm.invalid) {
      return;
    }

    if (!this.verifiedOtpCode) {
      this.errorMessage = 'Verification code missing. Please re-verify the code.';
      return;
    }

    const email = this.emailForm.get('email')!.value;
    const newPassword = this.resetForm.get('password')!.value;

    this.store.dispatch(forgotResetPassword({ email, newPassword, otpCode: this.verifiedOtpCode }));

    // Monitor resetting flag and navigate to success when complete
    const onceSub = this.store.select(selectForgotResetting).subscribe(isResetting => {
      if (!isResetting && !this.errorMessage) {
        setTimeout(() => {
          // If resetting complete and no error -> mark success
          if (!this.errorMessage) {
            this.step = 'success';
          }
        }, 0);
        onceSub.unsubscribe();
      }
    });
  }

  // cooldown utilities (same pattern as earlier)
  private startCooldown(seconds: number) {
    this.clearCooldown();
    this.resendCooldown = seconds;
    // timer emits 0,1,2...
    this.cooldownSub = timer(0, 1000).subscribe(tick => {
      this.resendCooldown = Math.max(0, seconds - tick);
      if (this.resendCooldown === 0) {
        this.clearCooldown();
      }
    });
  }

  private clearCooldown() {
    if (this.cooldownSub) {
      this.cooldownSub.unsubscribe();
      this.cooldownSub = null;
    }
    this.resendCooldown = 0;
  }

  // utility to show control errors in template
  ctrl(form: FormGroup, name: string) {
    return form.get(name);
  }
}
