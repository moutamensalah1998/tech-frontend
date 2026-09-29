import { Injectable } from '@angular/core';
import { environment } from '../../env/environment';
import { BehaviorSubject, Observable } from 'rxjs';

declare var FB: any;

export interface FBAuthResponse {
  status: string;
  authResponse?: {
    code: string;
    grantedScopes?: string;
  };
}

export interface MetaSessionInfo {
  waba_id: string | null;
  phone_number_id: string | null;
  business_id: string | null;
}

export interface EmbeddedSignupResult {
  code: string;
  waba_id: string | null;
  phone_number_id: string | null;
  business_id: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class FacebookSDKService {
  private readonly appId = environment.meta.appId;
  private readonly apiVersion = environment.meta.apiVersion;
  private initialized$ = new BehaviorSubject<boolean>(false);
  private initPromise: Promise<void> | null = null;
  private capturedSessionInfo: MetaSessionInfo | null = null;
  private sessionInfoListener: ((event: MessageEvent) => void) | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.initPromise) {
      return;
    }

    this.initPromise = new Promise<void>((resolve) => {
      // Wait for FB SDK script to load, then initialize
      const tryInit = () => {
        if (typeof FB !== 'undefined') {
          FB.init({
            appId: this.appId,
            cookie: true,
            xfbml: false,
            version: this.apiVersion
          });

          FB.getLoginStatus((response: any) => {
            console.log('[FB SDK] Init status:', response.status);
            this.initialized$.next(true);
            resolve();
          });
        } else {
          // FB SDK not loaded yet, wait and retry
          setTimeout(tryInit, 200);
        }
      };

      // Wait for window load or existing FB object
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        tryInit();
      } else {
        window.addEventListener('load', () => tryInit());
      }
    });
  }

  waitForInit(): Promise<void> {
    return this.initPromise || Promise.resolve();
  }

  isInitialized(): Observable<boolean> {
    return this.initialized$.asObservable();
  }

  getLoginStatus(): Promise<FBAuthResponse> {
    return this.waitForInit().then(() => {
      return new Promise<FBAuthResponse>((resolve) => {
        FB.getLoginStatus((response: FBAuthResponse) => {
          resolve(response);
        });
      });
    });
  }

  /**
   * Launch the Meta Embedded Signup flow and capture the WABA / phone
   * number IDs that Meta reports through the ``WA_EMBEDDED_SIGNUP``
   * postMessage event, in addition to the exchangeable authorization code.
   */
  launchEmbeddedSignup(configId: string): Promise<EmbeddedSignupResult> {
    return this.waitForInit().then(() => {
      return new Promise<EmbeddedSignupResult>((resolve, reject) => {
        // Reset any session info captured by a previous attempt.
        this.capturedSessionInfo = null;
        this.attachSessionInfoListener();

        FB.login(
          (response: FBAuthResponse) => {
            if (response.status === 'connected' && response.authResponse?.code) {
              // For Embedded Signup, the authResponse contains an authorization code.
              const code = response.authResponse.code;
              // Meta delivers the WABA / phone number IDs via postMessage; it
              // can arrive just after the login callback, so wait briefly.
              this.waitForSessionInfo(3000).then((info) => {
                this.detachSessionInfoListener();
                resolve({
                  code,
                  waba_id: info?.waba_id ?? null,
                  phone_number_id: info?.phone_number_id ?? null,
                  business_id: info?.business_id ?? null
                });
              });
            } else {
              this.detachSessionInfoListener();
              reject(new Error('User cancelled or authentication failed'));
            }
          },
          {
            config_id: configId,
            response_type: 'code',
            override_default_response_type: true,
            extras: {
              setup: {},
              featureType: '',
              sessionInfoVersion: '3'
            }
          }
        );
      });
    });
  }

  /**
   * Listen for the ``WA_EMBEDDED_SIGNUP`` postMessage that Meta sends from
   * the Embedded Signup dialog. It carries the session info (``waba_id``,
   * ``phone_number_id``, ``business_id``) of the business that just
   * completed signup.
   */
  private attachSessionInfoListener(): void {
    if (this.sessionInfoListener) {
      return;
    }

    this.sessionInfoListener = (event: MessageEvent) => {
      if (!event.origin || !event.origin.endsWith('facebook.com')) {
        return;
      }

      let data: any;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      if (!data || data.type !== 'WA_EMBEDDED_SIGNUP') {
        return;
      }

      const eventName = data.event;
      const payload = data.data ?? {};

      if (eventName === 'ERROR') {
        // ``error_message`` is a user-facing string and never contains
        // tokens or secrets, so it is safe to surface for debugging.
        console.warn('[EmbeddedSignup] Meta reported an error:', payload.error_message ?? eventName);
        return;
      }

      // Capture the session info on any completion event. Fields are absent
      // on cancel/intermediate steps, in which case we keep waiting.
      const completionEvents = [
        'FINISH',
        'FINISH_ONLY_WABA',
        'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
        'LOGIN_SUCCESS',
        'SESSION_LOGGING'
      ];
      if (!completionEvents.includes(eventName)) {
        return;
      }

      const wabaId = payload.waba_id ?? null;
      const phoneNumberId = payload.phone_number_id ?? null;
      const businessId = payload.business_id ?? null;

      if (wabaId || phoneNumberId || businessId) {
        this.capturedSessionInfo = {
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
          business_id: businessId
        };
      }
    };

    window.addEventListener('message', this.sessionInfoListener);
  }

  private detachSessionInfoListener(): void {
    if (this.sessionInfoListener) {
      window.removeEventListener('message', this.sessionInfoListener);
      this.sessionInfoListener = null;
    }
  }

  private waitForSessionInfo(timeoutMs: number): Promise<MetaSessionInfo | null> {
    return new Promise((resolve) => {
      const startedAt = Date.now();
      const check = () => {
        if (this.capturedSessionInfo) {
          resolve(this.capturedSessionInfo);
          return;
        }
        if (Date.now() - startedAt >= timeoutMs) {
          resolve(null);
          return;
        }
        setTimeout(check, 100);
      };
      check();
    });
  }
}