import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, switchMap, takeUntil, interval } from 'rxjs';
import * as WhatsappIntegrationActions from './whatsapp-integration.actions';
import { WhatsappIntegrationService } from '../whatsapp-integration.service';
import { MetaSdkService } from '../../meta/meta-sdk.service';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../env/environment';

@Injectable()
export class WhatsappIntegrationEffects {
  constructor(
    private actions$: Actions,
    private whatsappIntegrationService: WhatsappIntegrationService,
    private metaSdkService: MetaSdkService,
    private authService: AuthService
  ) {}

  startWhatsAppSignup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WhatsappIntegrationActions.startWhatsAppSignup),
      mergeMap(async (action) => {
        try {
          // Initialize Meta SDK
          await this.metaSdkService.init();

          // Get authorization code from Meta
          const code = await this.whatsappIntegrationService.loginAndGetCode();

          // Get tenant ID from current user
          const user = this.authService.currentUser;
          const tenantId = user?.client_id || user?.id || action.tenantId;

          // Exchange code with backend
          return this.whatsappIntegrationService
            .exchangeCode({
              tenant_id: tenantId,
              code,
              redirect_uri: environment.meta.redirectUri,
            })
            .pipe(
              map((response) =>
                WhatsappIntegrationActions.startWhatsAppSignupSuccess({ response })
              ),
              catchError((error) =>
                of(WhatsappIntegrationActions.startWhatsAppSignupFailure({ error }))
              )
            );
        } catch (error) {
          return of(
            WhatsappIntegrationActions.startWhatsAppSignupFailure({ error })
          );
        }
      }),
      switchMap((result) => result)
    )
  );

  checkConnectionStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WhatsappIntegrationActions.checkConnectionStatus),
      mergeMap((action) =>
        this.whatsappIntegrationService
          .getConnectionStatus(action.connectionId)
          .pipe(
            map((response) =>
              WhatsappIntegrationActions.checkConnectionStatusSuccess({ response })
            ),
            catchError((error) =>
              of(WhatsappIntegrationActions.checkConnectionStatusFailure({ error }))
            )
          )
      )
    )
  );

  // Poll connection status every 3 seconds until connected or failed
  pollConnectionStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WhatsappIntegrationActions.startPollingConnection),
      switchMap((action) =>
        interval(3000).pipe(
          takeUntil(
            this.actions$.pipe(
              ofType(WhatsappIntegrationActions.stopPollingConnection)
            )
          ),
          switchMap(() =>
            this.whatsappIntegrationService
              .getConnectionStatus(action.connectionId)
              .pipe(
                map((response) => {
                  // Stop polling if connected or failed
                  if (response.status === 'connected' || response.status === 'failed') {
                    return [
                      WhatsappIntegrationActions.checkConnectionStatusSuccess({ response }),
                      WhatsappIntegrationActions.stopPollingConnection(),
                    ];
                  }
                  return WhatsappIntegrationActions.checkConnectionStatusSuccess({ response });
                }),
                catchError((error) =>
                  of(WhatsappIntegrationActions.checkConnectionStatusFailure({ error }))
                )
              )
          )
        )
      ),
      mergeMap((actions) => (Array.isArray(actions) ? actions : [actions]))
    )
  );

  // Embedded Signup effect
  startEmbeddedSignup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WhatsappIntegrationActions.startEmbeddedSignup),
      mergeMap(async (action) => {
        try {
          // Initialize Meta SDK (will check HTTPS)
          await this.metaSdkService.init();

          // Get authorization code from Meta
          const code = await this.whatsappIntegrationService.loginAndGetCode();

          // Exchange code for token via backend
          return this.whatsappIntegrationService
            .exchangeToken({
              code,
              client_id: action.clientId,
            })
            .pipe(
              map((response) =>
                WhatsappIntegrationActions.startEmbeddedSignupSuccess({ response })
              ),
              catchError((error) =>
                of(WhatsappIntegrationActions.startEmbeddedSignupFailure({
                  error: error?.error || error?.error_description || error
                }))
              )
            );
        } catch (error: any) {
          // Handle HTTPS requirement and other initialization errors
          return of(
            WhatsappIntegrationActions.startEmbeddedSignupFailure({
              error: error?.error || error?.error_description || error?.message || error
            })
          );
        }
      }),
      switchMap((result) => result)
    )
  );
}

