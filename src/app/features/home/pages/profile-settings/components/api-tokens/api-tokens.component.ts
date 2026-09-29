import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiTokenService } from '../../../../../../core/services/api-token/api-token.service';
import { ToastService } from '../../../../../../core/services/toast-message.service';

const MAX_TOKENS = 10;

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-api-tokens',
  templateUrl: './api-tokens.component.html',
  styleUrl: './api-tokens.component.css',
})
export class ApiTokensComponent implements OnInit, OnDestroy {
  tokens: any[] = [];
  newTokenName = '';
  createdToken: any = null;
  loading = false;
  creating = false;
  maxTokens = MAX_TOKENS;

  private destroy$ = new Subject<void>();

  constructor(
    private apiTokenService: ApiTokenService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadTokens();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get canCreate(): boolean {
    return this.tokens.length < this.maxTokens && this.newTokenName.trim().length > 0;
  }

  loadTokens(): void {
    this.loading = true;
    this.apiTokenService
      .list()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.tokens = res?.data || [];
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.toast.showToast('Failed to load API tokens', 'error');
        },
      });
  }

  createToken(): void {
    const name = this.newTokenName.trim();
    if (!name || this.tokens.length >= this.maxTokens) {
      return;
    }
    this.creating = true;
    this.apiTokenService
      .create(name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.createdToken = res?.data || null;
          this.newTokenName = '';
          this.creating = false;
          this.loadTokens();
          this.toast.showToast('API token created', 'success');
        },
        error: () => {
          this.creating = false;
          this.toast.showToast('Failed to create API token', 'error');
        },
      });
  }

  revokeToken(id: string): void {
    this.apiTokenService
      .revoke(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toast.showToast('API token revoked', 'success');
          this.loadTokens();
        },
        error: () => this.toast.showToast('Failed to revoke API token', 'error'),
      });
  }

  copyToken(): void {
    const value = this.createdToken?.token;
    if (!value) {
      return;
    }
    navigator.clipboard?.writeText(value).then(
      () => this.toast.showToast('Token copied to clipboard', 'success'),
      () => this.toast.showToast('Copy failed — select and copy manually', 'error')
    );
  }

  dismissCreatedToken(): void {
    this.createdToken = null;
  }
}
