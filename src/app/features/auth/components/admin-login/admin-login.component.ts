import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import * as AdminAuthSelectors from '../../../../core/services/auth/admin-ngrx/admin-auth.selectors';
import { LoadingButtonComponent } from '../../../../shared/components/loading-button/loading-button.component';
import { adminLogin } from '../../../../core/services/auth/admin-ngrx/admin-auth.actions';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    LoadingButtonComponent,
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  localError: string | null = null;

  constructor(
    private router: Router,
    private store: Store,
  ) {
    this.loading$ = this.store.select(AdminAuthSelectors.selectAdminAuthLoading);
    this.error$ = this.store.select(AdminAuthSelectors.selectAdminAuthError);
  }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)])
    });
  }

  onSubmit(): void {
    this.localError = null;

    if (this.loginForm.invalid) {
      this.localError = 'Please fill all required fields correctly before submitting.';
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    this.store.dispatch(adminLogin({ email, password }));
  }
}

