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

@Injectable({
  providedIn: 'root'
})
export class FacebookSDKService {
  private readonly appId = environment.meta.appId;
  private readonly apiVersion = environment.meta.apiVersion;
  private initialized$ = new BehaviorSubject<boolean>(false);
  private initPromise: Promise<void> | null = null;

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
   * Launch the Meta Embedded Signup flow.
   * Uses the configuration ID for the embedded signup experience.
   */
  launchEmbeddedSignup(configId: string): Promise<{ code: string }> {
    return this.waitForInit().then(() => {
      return new Promise<{ code: string }>((resolve, reject) => {
        FB.login(
          (response: FBAuthResponse) => {
            if (response.status === 'connected' && response.authResponse) {
              // For Embedded Signup, the authResponse contains an authorization code
              const code = response.authResponse.code;
              if (code) {
                resolve({ code });
              } else {
                reject(new Error('No authorization code received from Meta'));
              }
            } else {
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
              sessionInfoVersion: '2'
            }
          }
        );
      });
    });
  }
}