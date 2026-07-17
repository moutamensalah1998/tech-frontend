import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InvitationService } from '../../../../core/services/invitation/invitation.service';
import { InvitationItem } from '../../../../core/models/invitation.model';
import { ToastService } from '../../../../core/services/toast-message.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { ApiService } from '../../../../core/api/api.service';

const PLATFORM_OWNER_PHONE = '+962790701714';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  selector: 'app-invite-management',
  templateUrl: './invite-management.component.html',
  styleUrls: ['./invite-management.component.css']
})
export class InviteManagementComponent implements OnInit, OnDestroy {
  invitations: InvitationItem[] = [];
  total = 0;
  loading = false;
  creating = false;
  error: string | null = null;

  // Create invitation form
  inviteEmail = '';
  inviteCompanyName = '';
  inviteExpiresInDays = 30;

  // Platform owner check
  isOwner = false;
  ownerCheckLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private invitationService: InvitationService,
    private store: Store,
    private toast: ToastService,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.checkPlatformOwner();
  }

  /**
   * Check if the current user is the platform owner by comparing
   * business_profile.phone_number (not user.phone_number) against PLATFORM_OWNER_PHONE.
   */
  private checkPlatformOwner(): void {
    this.ownerCheckLoading = true;
    this.apiService.get('v1/business-profile').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        this.ownerCheckLoading = false;
        const bpPhoneNumber = res?.data?.business_profile?.phone_number || '';
        this.isOwner = bpPhoneNumber === PLATFORM_OWNER_PHONE;
        if (this.isOwner) {
          this.loadInvitations();
        }
      },
      error: () => {
        this.ownerCheckLoading = false;
        this.isOwner = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInvitations(): void {
    this.loading = true;
    this.error = null;
    this.invitationService.listInvitations(0, 100).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.invitations = res.data.items;
          this.total = res.data.total;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load invitations';
        this.toast.showToast(this.error || 'Error', 'error');
      }
    });
  }

  createInvitation(): void {
    this.creating = true;
    this.error = null;
    this.invitationService.createInvitation(
      this.inviteEmail || undefined,
      this.inviteCompanyName || undefined,
      this.inviteExpiresInDays
    ).subscribe({
      next: (res) => {
        this.creating = false;
        if (res.success && res.data) {
          this.toast.showToast('Invitation created successfully', 'success');
          this.inviteEmail = '';
          this.inviteCompanyName = '';
          this.loadInvitations();
        }
      },
      error: (err) => {
        this.creating = false;
        this.error = err?.error?.message || 'Failed to create invitation';
        this.toast.showToast(this.error || 'Error', 'error');
      }
    });
  }

  copyInvitationLink(link: string): void {
    navigator.clipboard.writeText(link).then(() => {
      this.toast.showToast('Invitation link copied to clipboard', 'success');
    });
  }

  disableInvitation(id: string): void {
    this.invitationService.disableInvitation(id).subscribe({
      next: () => {
        this.toast.showToast('Invitation disabled', 'success');
        this.loadInvitations();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to disable invitation';
        this.toast.showToast(this.error || 'Error', 'error');
      }
    });
  }

  resendInvitation(id: string): void {
    this.invitationService.resendInvitation(id, 30).subscribe({
      next: (res) => {
        this.toast.showToast('Invitation resent successfully', 'success');
        this.loadInvitations();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to resend invitation';
        this.toast.showToast(this.error || 'Error', 'error');
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'used': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'disabled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}