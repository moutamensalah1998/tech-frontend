import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InvitationService } from '../../core/services/invitation/invitation.service';
import { FacebookSDKService } from '../../core/services/facebook/facebook-sdk.service';
import { environment } from '../../core/env/environment';
import { InvitationItem } from '../../core/models/invitation.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.css']
})
export class InviteComponent implements OnInit, OnDestroy {
  token: string = '';
  loading = true;
  metaConnecting = false;
  registering = false;
  error: string | null = null;
  success: string | null = null;
  invitation: InvitationItem | null = null;

  // Flow state
  showMetaButton = false;
  showRegisterForm = false;
  metaCode: string | null = null;

  private readonly metaConfigId = environment.meta.configId;
  private destroy$ = new Subject<void>();

  registerForm = new FormGroup({
    first_name: new FormControl('', [Validators.required]),
    last_name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    company_name: new FormControl('', [Validators.required]),
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invitationService: InvitationService,
    private fbSdk: FacebookSDKService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (this.token) {
      this.validateToken();
    } else {
      this.loading = false;
      this.error = 'Invalid invitation link. No token provided.';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Step 1: Validate the invitation token */
  validateToken(): void {
    this.loading = true;
    this.error = null;
    this.invitationService.validateInvitation(this.token).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.invitation = res.data;
          this.showMetaButton = true;
          // Pre-fill from invitation if available
          if (res.data.email) {
            this.registerForm.patchValue({ email: res.data.email });
          }
          if (res.data.company_name) {
            this.registerForm.patchValue({ company_name: res.data.company_name });
          }
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message || err?.error?.data?.message || 'Invalid or expired invitation link.';
        this.error = msg;
      }
    });
  }

  /** Step 2: Launch WhatsApp Embedded Signup via Meta */
  connectWithWhatsApp(): void {
    this.metaConnecting = true;
    this.error = null;

    this.fbSdk.launchEmbeddedSignup(this.metaConfigId)
      .then((result) => {
        this.metaConnecting = false;
        this.metaCode = result.code;
        this.showMetaButton = false;
        this.showRegisterForm = true;
      })
      .catch((err) => {
        this.metaConnecting = false;
        const msg = err?.message || 'WhatsApp connection was cancelled or failed.';
        // Only show error if it's not a user cancellation
        if (msg.includes('cancelled') || msg.includes('cancel')) {
          this.error = 'WhatsApp connection was cancelled. You can try again.';
          // Keep meta button visible so user can retry
        } else {
          this.error = msg;
        }
      });
  }

  /** Step 3: Complete registration with Meta code + user details */
  completeRegistration(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    if (!this.metaCode) {
      this.error = 'Missing WhatsApp authorization code. Please try connecting again.';
      this.showMetaButton = true;
      this.showRegisterForm = false;
      return;
    }

    this.registering = true;
    this.error = null;
    const form = this.registerForm.value;

    this.invitationService.registerWithEmbeddedSignup({
      token: this.token,
      meta_code: this.metaCode,
      first_name: form.first_name!,
      last_name: form.last_name!,
      email: form.email!,
      password: form.password!,
      company_name: form.company_name!,
    }).subscribe({
      next: (res) => {
        this.registering = false;
        if (res.success && res.data?.access_token) {
          this.success = res.data.message || 'Account created successfully!';
          // Store token in cookie matching auth flow
          document.cookie = `session=${res.data.access_token}; path=/; Secure; SameSite=None`;
          localStorage.setItem('access_token', res.data.access_token);
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard/team-inbox';
          }, 2000);
        } else {
          this.error = res.message || 'Registration failed. Please try again.';
        }
      },
      error: (err) => {
        this.registering = false;
        this.error = err?.error?.message || err?.error?.data?.message || 'Registration failed. Please try again.';
      }
    });
  }
}