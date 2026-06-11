import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, takeUntil, filter } from 'rxjs';
import { Subject } from 'rxjs';
import {
  loadOpenApiSpec,
  generateToken,
} from '../../../../core/services/api-doc/ngrx/api-doc.actions';
import {
  selectOpenApiSpec,
  selectLoading,
  selectError,
  selectAccessToken,
  selectGeneratingToken,
  selectTokenError,
} from '../../../../core/services/api-doc/ngrx/api-doc.selectors';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { environment } from '../../../../core/env/environment';

@Component({
  selector: 'app-api-doc',
  standalone: true,
  imports: [CommonModule, TranslatePipe, LoaderComponent],
  templateUrl: './api-doc.component.html',
  styleUrls: ['./api-doc.component.css'],
})
export class ApiDocComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('swaggerContainer', { static: false })
  swaggerContainer!: ElementRef;

  spec$: Observable<any>;
  loading$: Observable<boolean>;
  error$: Observable<any>;
  accessToken$: Observable<string | null>;
  generatingToken$: Observable<boolean>;
  tokenError$: Observable<any>;
  baseUrl: string = environment.apiUrl.replace(/\/api\/?$/, '');
  private destroy$ = new Subject<void>();
  private swaggerUI: any;
  copiedToken = false;
  copiedBaseUrl = false;

  /**
   * Get the base URL without the trailing /api for Swagger UI
   * This prevents double /api/api in the request URLs
   */
  private getSwaggerBaseUrl(): string {
    return this.baseUrl.replace(/\/api\/?$/, '');
  }

  constructor(private store: Store, private cdr: ChangeDetectorRef) {
    this.spec$ = this.store.select(selectOpenApiSpec);
    this.loading$ = this.store.select(selectLoading);
    this.error$ = this.store.select(selectError);
    this.accessToken$ = this.store.select(selectAccessToken);
    this.generatingToken$ = this.store.select(selectGeneratingToken);
    this.tokenError$ = this.store.select(selectTokenError);
  }

  ngOnInit(): void {
    this.store.dispatch(loadOpenApiSpec());
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.spec$
        .pipe(
          takeUntil(this.destroy$),
          filter((spec) => spec !== null && spec !== undefined)
        )
        .subscribe((spec) => {
          if (spec && this.swaggerContainer?.nativeElement) {
            this.waitForSwaggerUI(() => {
              this.initializeSwaggerUI(spec);
            });
          } else {
          }
        });
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.swaggerUI) {
      this.swaggerUI = null;
    }
  }

  private waitForSwaggerUI(
    callback: () => void,
    maxAttempts: number = 50,
    attempt: number = 0
  ): void {
    const windowAny = window as any;
    if (windowAny.SwaggerUIBundle) {
      callback();
    } else if (attempt < maxAttempts) {
      if (attempt === 0) {
      }
      setTimeout(() => {
        this.waitForSwaggerUI(callback, maxAttempts, attempt + 1);
      }, 100);
    } else {
    }
  }

  private initializeSwaggerUI(spec: any): void {
    const windowAny = window as any;
    const SwaggerUIBundle = windowAny.SwaggerUIBundle;

    if (!SwaggerUIBundle) {
      return;
    }

    if (!this.swaggerContainer?.nativeElement) {
      return;
    }

    if (!spec) {
      return;
    }

    // Get base URL without trailing /api to avoid double /api/api in paths
    const swaggerBaseUrl = this.getSwaggerBaseUrl();

    // Create a modified spec with the base URL (without /api)
    const modifiedSpec = {
      ...spec,
      servers: [
        {
          url: swaggerBaseUrl,
          description: 'API Server',
        },
      ],
    };

    if (this.swaggerUI) {
      try {
        this.swaggerUI.specActions.updateSpec(modifiedSpec);
      } catch (error) {
        this.swaggerUI = null;
        this.initializeSwaggerUI(spec);
      }
      return;
    }

    // Clear the container first
    this.swaggerContainer.nativeElement.innerHTML = '';

    try {
      const config: any = {
        spec: modifiedSpec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        requestInterceptor: (request: any) => {
          // Swagger UI already constructs the URL from server + path
          // The server URL is set without /api, so paths like /api/v1/... will work correctly
          // No need to modify the URL here as Swagger UI handles it
          return request;
        },
      };

      if (SwaggerUIBundle.presets) {
        const presets = [];
        if (SwaggerUIBundle.presets.apis) {
          presets.push(SwaggerUIBundle.presets.apis);
        }
        if (SwaggerUIBundle.presets.standalone) {
          presets.push(SwaggerUIBundle.presets.standalone);
          config.layout = 'StandaloneLayout';
        }
        if (presets.length > 0) {
          config.presets = presets;
        }
      }

      if (SwaggerUIBundle.plugins?.DownloadUrl) {
        config.plugins = [SwaggerUIBundle.plugins.DownloadUrl];
      }

      this.swaggerUI = SwaggerUIBundle(config);
    } catch (error) {
      try {
        this.swaggerUI = SwaggerUIBundle({
          spec: modifiedSpec,
          dom_id: '#swagger-ui',
        });
      } catch (fallbackError) {}
    }
  }

  onGenerateToken(): void {
    this.store.dispatch(generateToken());
  }

  copyToClipboard(text: string, type: 'token' | 'baseUrl'): void {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (type === 'token') {
          this.copiedToken = true;
          setTimeout(() => {
            this.copiedToken = false;
          }, 2000);
        } else {
          this.copiedBaseUrl = true;
          setTimeout(() => {
            this.copiedBaseUrl = false;
          }, 2000);
        }
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
      });
  }
}
