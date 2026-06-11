import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import * as WhatsappIntegrationActions from '../../../../../../core/services/whatsapp-integration/ngrx/whatsapp-integration.actions';
import {
  selectConnectionId,
  selectConnectionStatus,
  selectIsSigningUp,
  selectIsPolling,
  selectIsConnected,
  selectWhatsappIntegrationError,
  selectSuccessMessage,
  selectPhoneNumber,
  selectVerifiedName,
  selectWabaId,
} from '../../../../../../core/services/whatsapp-integration/ngrx/whatsapp-integration.selectors';
import { AuthService } from '../../../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-connect-whatsapp',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connect-whatsapp.component.html',
  styleUrls: ['./connect-whatsapp.component.css']
})
export class ConnectWhatsappComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  connectionId$: Observable<string | null>;
  status$: Observable<string | null>;
  isSigningUp$: Observable<boolean>;
  isPolling$: Observable<boolean>;
  isConnected$: Observable<boolean>;
  error$: Observable<any>;
  successMessage$: Observable<string | null>;
  phoneNumber$: Observable<string | null>;
  verifiedName$: Observable<string | null>;
  wabaId$: Observable<string | null>;

  constructor(
    private store: Store,
    private authService: AuthService
  ) {
    this.connectionId$ = this.store.select(selectConnectionId);
    this.status$ = this.store.select(selectConnectionStatus);
    this.isSigningUp$ = this.store.select(selectIsSigningUp);
    this.isPolling$ = this.store.select(selectIsPolling);
    this.isConnected$ = this.store.select(selectIsConnected);
    this.error$ = this.store.select(selectWhatsappIntegrationError);
    this.successMessage$ = this.store.select(selectSuccessMessage);
    this.phoneNumber$ = this.store.select(selectPhoneNumber);
    this.verifiedName$ = this.store.select(selectVerifiedName);
    this.wabaId$ = this.store.select(selectWabaId);
  }

  ngOnInit() {
    // Auto-start polling if connection exists and is pending
    combineLatest([this.connectionId$, this.status$])
      .pipe(
        takeUntil(this.destroy$),
        filter(([connectionId, status]) => !!connectionId && status === 'pending')
      )
      .subscribe(([connectionId]) => {
        if (connectionId) {
          this.store.dispatch(
            WhatsappIntegrationActions.startPollingConnection({ connectionId })
          );
        }
      });
  }

  connect() {
    const user = this.authService.currentUser;
    const clientId = user?.client_id || user?.id;

    if (!clientId) {
      console.error('No client ID found');
      return;
    }

    // Use new embedded signup action
    this.store.dispatch(
      WhatsappIntegrationActions.startEmbeddedSignup({ clientId })
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.dispatch(WhatsappIntegrationActions.stopPollingConnection());
  }
}

