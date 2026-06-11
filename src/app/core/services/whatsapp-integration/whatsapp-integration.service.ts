import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../api/api.service';
import { environment } from '../../env/environment';
import {
  ExchangeCodeRequest,
  ExchangeCodeResponse,
  ConnectionStatusResponse,
  ExchangeTokenRequest,
  ExchangeTokenResponse,
} from '../../models/whatsapp-integration.model';

@Injectable({ providedIn: 'root' })
export class WhatsappIntegrationService {
  constructor(private apiService: ApiService) {}

  exchangeCode(request: ExchangeCodeRequest): Observable<ExchangeCodeResponse> {
    return this.apiService.post<ExchangeCodeResponse>(
      'v1/meta/exchange-code',
      request
    );
  }

  exchangeToken(request: ExchangeTokenRequest): Observable<ExchangeTokenResponse> {
    return this.apiService.post<ExchangeTokenResponse>(
      'v1/embedded-signup/exchange-token',
      request
    );
  }

  getConnectionStatus(connectionId: string): Observable<ConnectionStatusResponse> {
    const params = new HttpParams().set('connection_id', connectionId);
    return this.apiService.get<ConnectionStatusResponse>(
      'v1/meta/connection-status',
      { params }
    );
  }

  // Helper method to get code from FB.login
  async loginAndGetCode(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check if we're on HTTPS
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
        reject({
          error: 'HTTPS_REQUIRED',
          error_description: 'Meta SDK requires HTTPS. Please access this page via HTTPS or use localhost for development.'
        });
        return;
      }

      if (!window.FB) {
        reject(new Error('Meta SDK not loaded'));
        return;
      }

      try {
        window.FB.login(
          (response: any) => {
            const code = response?.authResponse?.code;
            if (code) {
              return resolve(code);
            }
            reject({
              error: 'User cancelled login or did not fully authorize.',
              error_description: response.error?.message || 'Unknown error'
            });
          },
          {
            config_id: environment.meta.configId,
            response_type: 'code',
            override_default_response_type: true,
            extras: {
              setup: {},
              featureType: '',
              sessionInfoVersion: 2
            }
          }
        );
      } catch (error: any) {
        reject({
          error: 'FB_LOGIN_ERROR',
          error_description: error?.message || 'Failed to initiate Facebook login. Please ensure you are using HTTPS.'
        });
      }
    });
  }
}

