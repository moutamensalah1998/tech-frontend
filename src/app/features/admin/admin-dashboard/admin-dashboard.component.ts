import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as WhatsappIntegrationActions from '../../../core/services/whatsapp-integration/ngrx/whatsapp-integration.actions';
import {
  selectIsSigningUp,
  selectIsConnected,
  selectWhatsappIntegrationError,
  selectSuccessMessage,
} from '../../../core/services/whatsapp-integration/ngrx/whatsapp-integration.selectors';
import { MetaSdkService } from '../../../core/services/meta/meta-sdk.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  isSigningUpWhatsApp$: Observable<boolean>;
  isConnectedWhatsApp$: Observable<boolean>;
  whatsappError$: Observable<any>;
  whatsappSuccessMessage$: Observable<string | null>;

  // Expose window for template access
  get isHttpsOrLocalhost(): boolean {
    const hostname = window.location.hostname;
    return window.location.protocol === 'https:' ||
           hostname === 'localhost' ||
           hostname === '127.0.0.1' ||
           hostname === '[::1]';
  }

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private metaSdkService: MetaSdkService
  ) {
    this.isSigningUpWhatsApp$ = this.store.select(selectIsSigningUp);
    this.isConnectedWhatsApp$ = this.store.select(selectIsConnected);
    this.whatsappError$ = this.store.select(selectWhatsappIntegrationError);
    this.whatsappSuccessMessage$ = this.store.select(selectSuccessMessage);
  }

  ngOnInit(): void {
    // Initialize Meta SDK (only if HTTPS or localhost)
    const isLocalhost = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '[::1]';
    const isHttps = window.location.protocol === 'https:';

    if (isHttps || isLocalhost) {
      this.metaSdkService.init().catch((error: any) => {
        console.error('Failed to initialize Meta SDK:', error);
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  connectWhatsApp(): void {
    // For admin, we can pass an empty clientId or handle it differently
    // The backend should handle admin-specific WhatsApp integration
    this.store.dispatch(
      WhatsappIntegrationActions.startEmbeddedSignup({ clientId: '' })
    );
  }
}

