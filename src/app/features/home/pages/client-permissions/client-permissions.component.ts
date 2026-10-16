import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../../core/api/api.service';
import { ToastService } from '../../../../core/services/toast-message.service';

const PLATFORM_OWNER_PHONE = '+966 50 122 9022';

export interface ClientQuotaInfo {
  limit: number | null;
  used: number;
  remaining: number | null;
}

export interface ClientPermissions {
  client_id: string;
  client_number?: number;
  business_name?: string;
  phone_number?: string;
  users_count?: number;
  message_quota: ClientQuotaInfo;
  template_quota: ClientQuotaInfo;
  csv_contact_limit: number | null;
  broadcast_recipient_limit: number | null;
  is_active: boolean;
  ai_enabled: boolean;
  auto_reply_enabled: boolean;
}

/** Editable draft for a single client. Limits are null = unlimited. */
export interface ClientPermissionsDraft {
  message_quota_limit: number | null;
  template_create_limit: number | null;
  csv_contact_limit: number | null;
  broadcast_recipient_limit: number | null;
  is_active: boolean;
  ai_enabled: boolean;
  auto_reply_enabled: boolean;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-client-permissions',
  templateUrl: './client-permissions.component.html',
  styleUrls: ['./client-permissions.component.css'],
})
export class ClientPermissionsComponent implements OnInit, OnDestroy {
  clients: ClientPermissions[] = [];
  filteredClients: ClientPermissions[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';

  // Platform owner check
  isOwner = false;
  ownerCheckLoading = false;

  // Per-client edit state
  expandedClientId: string | null = null;
  draft: ClientPermissionsDraft | null = null;
  savingClientId: string | null = null;
  resettingClientId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.checkPlatformOwner();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if the current user is the platform owner by comparing
   * business_profile.phone_number against PLATFORM_OWNER_PHONE —
   * the same gate used for Invite Management.
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
          this.loadClients();
        }
      },
      error: () => {
        this.ownerCheckLoading = false;
        this.isOwner = false;
      }
    });
  }

  loadClients(): void {
    this.loading = true;
    this.error = null;
    this.apiService.get('v1/admin/permissions/clients').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.clients = res?.data?.items || [];
        this.applyFilter();
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load client permissions';
        this.toast.showToast(this.error || 'Error', 'error');
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredClients = [...this.clients];
      return;
    }
    this.filteredClients = this.clients.filter(c =>
      (c.business_name || '').toLowerCase().includes(term) ||
      (c.phone_number || '').toLowerCase().includes(term) ||
      String(c.client_number || '').includes(term)
    );
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  toggleExpand(client: ClientPermissions): void {
    if (this.expandedClientId === client.client_id) {
      this.expandedClientId = null;
      this.draft = null;
      return;
    }
    this.expandedClientId = client.client_id;
    this.draft = {
      message_quota_limit: client.message_quota?.limit ?? null,
      template_create_limit: client.template_quota?.limit ?? null,
      csv_contact_limit: client.csv_contact_limit ?? null,
      broadcast_recipient_limit: client.broadcast_recipient_limit ?? null,
      is_active: client.is_active !== false,
      ai_enabled: !!client.ai_enabled,
      auto_reply_enabled: client.auto_reply_enabled !== false,
    };
  }

  cancelEdit(): void {
    this.expandedClientId = null;
    this.draft = null;
  }

  savePermissions(client: ClientPermissions): void {
    if (!this.draft) {
      return;
    }
    this.savingClientId = client.client_id;
    this.apiService.put(
      `v1/admin/permissions/clients/${client.client_id}`,
      {
        message_quota_limit: this.draft.message_quota_limit,
        template_create_limit: this.draft.template_create_limit,
        csv_contact_limit: this.draft.csv_contact_limit,
        broadcast_recipient_limit: this.draft.broadcast_recipient_limit,
        is_active: this.draft.is_active,
        ai_enabled: this.draft.ai_enabled,
        auto_reply_enabled: this.draft.auto_reply_enabled,
      }
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.savingClientId = null;
        if (res?.success && res?.data) {
          this.replaceClient(res.data as ClientPermissions);
        }
        this.expandedClientId = null;
        this.draft = null;
        this.toast.showToast('Permissions updated successfully', 'success');
      },
      error: (err: any) => {
        this.savingClientId = null;
        this.toast.showToast(err?.error?.message || 'Failed to update permissions', 'error');
      }
    });
  }

  resetUsage(client: ClientPermissions): void {
    this.resettingClientId = client.client_id;
    this.apiService.post(
      `v1/admin/permissions/clients/${client.client_id}/reset-usage`
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.resettingClientId = null;
        if (res?.success && res?.data) {
          this.replaceClient(res.data as ClientPermissions);
        }
        this.toast.showToast('Usage counters reset successfully', 'success');
      },
      error: (err: any) => {
        this.resettingClientId = null;
        this.toast.showToast(err?.error?.message || 'Failed to reset usage', 'error');
      }
    });
  }

  private replaceClient(updated: ClientPermissions): void {
    const index = this.clients.findIndex(c => c.client_id === updated.client_id);
    if (index >= 0) {
      this.clients[index] = updated;
    }
    this.applyFilter();
  }

  onLimitChange(field: keyof ClientPermissionsDraft, value: string): void {
    if (!this.draft) {
      return;
    }
    const parsed = parseInt(value, 10);
    (this.draft as any)[field] = value === '' || isNaN(parsed) || parsed < 0 ? null : parsed;
  }

  displayLimit(value: number | null | undefined): string {
    return value === null || value === undefined ? 'Unlimited' : String(value);
  }

  usagePercent(quota: ClientQuotaInfo | undefined): number {
    if (!quota || !quota.limit || quota.limit <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((quota.used / quota.limit) * 100));
  }

  statusClass(client: ClientPermissions): string {
    return client.is_active
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }

  trackByClientId(_index: number, client: ClientPermissions): string {
    return client.client_id;
  }
}