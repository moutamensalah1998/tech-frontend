import { Injectable } from '@angular/core';
import { environment } from '../../env/environment';

@Injectable({ providedIn: 'root' })
export class MetaSdkService {
  private initialized = false;

  init(appId?: string, version?: string): Promise<void> {
    if (this.initialized) return Promise.resolve();

    // Check if we're on HTTPS (required by Meta SDK)
    const isLocalhost = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '[::1]';
    const isHttps = window.location.protocol === 'https:';

    if (!isHttps && !isLocalhost) {
      return Promise.reject({
        error: 'HTTPS_REQUIRED',
        error_description: 'Meta SDK requires HTTPS. Please access this page via HTTPS or use localhost for development.'
      });
    }

    const appIdToUse = appId || environment.meta.appId;
    const versionToUse = version || environment.meta.apiVersion || 'v21.0';

    return new Promise((resolve, reject) => {
      const waitForFb = () => {
        if (typeof window.FB !== 'undefined') {
          try {
            window.FB.init({
              appId: appIdToUse,
              cookie: true,
              xfbml: true,
              version: versionToUse,
            });
            this.initialized = true;
            resolve();
          } catch (e) {
            reject({
              error: 'SDK_INIT_ERROR',
              error_description: e instanceof Error ? e.message : 'Failed to initialize Meta SDK'
            });
          }
        } else {
          setTimeout(waitForFb, 50);
        }
      };

      try {
        waitForFb();
      } catch (e) {
        reject({
          error: 'SDK_LOAD_ERROR',
          error_description: e instanceof Error ? e.message : 'Failed to load Meta SDK'
        });
      }
    });
  }
}

