import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CommonModule, NgIf } from '@angular/common';
import * as AuthSelectors from '../../../../core/services/auth/ngrx/auth.selector';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { login } from '../../../../core/services/auth/ngrx/auth.action';
import { SignInFormService } from './signin-form.service';
import { FormValidationUtils } from '../../../../utils/form-validation.utils';
import { ForgotPasswordDialogComponent } from "./components/forgot-password/forgot-password-dialog.component";
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-sign-in-section',
  standalone: true,
  imports: [
    LoadingButtonComponent,
    ReactiveFormsModule,
    CommonModule,
    NgIf,
    ForgotPasswordDialogComponent,
    TranslatePipe
  ],
  templateUrl: './sign-in-section.component.html',
  styleUrls: ['./sign-in-section.component.css']
})
export class SignInSectionComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  client_id?: string;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  response$: Observable<string | null>;
  localError: string | null = null;
  formValidator = FormValidationUtils;
  showForgot = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private signinValidator: SignInFormService
  ) {
    this.loading$ = this.store.select(AuthSelectors.selectAuthLoading);
    this.response$ = this.store.select(AuthSelectors.selectAuthResponse);
    this.error$ = this.store.select(AuthSelectors.selectAuthError);
  }

  ngOnInit(): void {
    this.loginForm = this.signinValidator.createForm();

    // Ensure privacy control exists and is requiredTrue
    if (!this.loginForm.get('privacy')) {
      this.loginForm.addControl('privacy', new FormControl(false, Validators.requiredTrue));
    } else {
      const ctrl = this.loginForm.get('privacy')!;
      ctrl.setValidators(Validators.requiredTrue);
      ctrl.updateValueAndValidity();
    }

    // Note: Privacy checkbox is now required and must be checked by user
    // Removed auto-apply of persisted privacy to ensure user explicitly accepts

    this.client_id = this.route.snapshot.paramMap.get('clientId') || '';
    if (this.client_id) {
      this.loginForm.patchValue({ client_id: this.client_id });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyPersistedPrivacy(): void {
    const accepted = !!localStorage.getItem('privacyAccepted');
    if (accepted) {
      this.loginForm.patchValue({ privacy: true });
      this.loginForm.get('privacy')?.markAsTouched();
      this.loginForm.get('privacy')?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    this.localError = null;

    if (this.loginForm.invalid) {
      if (!this.loginForm.get('privacy')?.value) {
        this.localError = 'You must accept the Privacy Policy to sign in.';
      } else {
        this.localError = 'Please fill all required fields correctly before submitting.';
      }
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, client_id } = this.loginForm.value;
    this.store.dispatch(login({ email, password, client_id }));
  }

  openForgot(): void {
    this.showForgot = true;
  }
  closeForgot(): void {
    this.showForgot = false;
  }
  openPrivacy(): void {
    this.router.navigate(['/auth/privacy-policy']);
  }
}
