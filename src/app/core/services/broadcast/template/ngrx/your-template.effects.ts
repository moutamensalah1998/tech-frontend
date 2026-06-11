import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import * as TemplateActions from './your-template.actions';
import { YourTemplateService } from '../your-template.service';
import { ToastService } from '../../../toast-message.service';
import { TranslationService } from '../../../translation/translation.service';

@Injectable()
export class TemplateEffects {
  constructor(
    private actions$: Actions,
    private yourTemplateService: YourTemplateService,
    private toastService: ToastService,
    private translationService: TranslationService
  ) {}

  loadTemplates$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TemplateActions.loadTemplates),
      tap(),
      mergeMap((action) =>
        this.yourTemplateService
          .getTemplates(
            action.page_number,
            action.limit,
            action.sort_by,
            action.search_name
          )
          .pipe(
            tap(),
            map((response) => {
              return TemplateActions.loadTemplatesSuccess({ templates: response });
            }),
            catchError((error) => {
              return of(TemplateActions.loadTemplatesFailure({ error }));
            })
          )
      )
    )
  );

  createTemplate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TemplateActions.createTemplate),
      mergeMap((action) =>
        this.yourTemplateService.createTemplate(action.request).pipe(
          map((template) => {
            return TemplateActions.createTemplateSuccess({ template });
          }),
          catchError((error) => {
            return of(TemplateActions.createTemplateFailure({ error }));
          })
        )
      )
    )
  );

  createTemplateWithWorkingStructure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TemplateActions.createTemplateWithWorkingStructure),
      mergeMap((action) =>
        this.yourTemplateService.createTemplateWithWorkingStructure(action.request).pipe(
          map((template) => {
            return TemplateActions.createTemplateSuccess({ template });
          }),
          catchError((error) => {
            return of(TemplateActions.createTemplateFailure({ error }));
          })
        )
      )
    )
  );



  deleteTemplate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TemplateActions.deleteTemplate),
      mergeMap((action) =>
        this.yourTemplateService
          .deleteTemplate(action.name, action.template_id)
          .pipe(
            map((response) =>
              TemplateActions.deleteTemplateSuccess({ response })
            ),
            catchError((error) =>
              of(TemplateActions.deleteTemplateFailure({ error }))
            )
          )
      )
    )
  );

  uploadMedia$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TemplateActions.uploadMedia),
      mergeMap((action) =>
        this.yourTemplateService.uploadMedia(action.file).pipe(
          map((response) =>
            TemplateActions.uploadMediaSuccess({
              response,
              mediaType: action.mediaType,
            })
          ),
          catchError((error) => {
            return of(TemplateActions.uploadMediaFailure({ error }));
          })
        )
      )
    )
  );
  
  syncTemplates$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TemplateActions.syncTemplates),
      mergeMap(() =>
        this.yourTemplateService.syncTemplates().pipe(
          mergeMap((response) => {
            const successMsg = this.translationService.translate('toast.templateSyncSuccessful');
            this.toastService.showToast(successMsg, 'success');
            return [
              TemplateActions.syncTemplatesSuccess({ response }),
              TemplateActions.loadTemplates({ page_number: 1, limit: 10, sort_by: '', search_name: '' })
            ];
          }),
          catchError((error) => {
            const errorMsg = this.translationService.translate('toast.templateSyncFailed');
            this.toastService.showToast(errorMsg, 'error');
            return of(TemplateActions.syncTemplatesFailure({ error }));
          })
        )
      )
    )
  );

}
