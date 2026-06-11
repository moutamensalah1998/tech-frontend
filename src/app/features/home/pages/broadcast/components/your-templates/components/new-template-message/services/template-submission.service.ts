import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import * as TemplateActions from '../../../../../../../../../core/services/broadcast/template/ngrx/your-template.actions';
import { TemplateFormService, TemplateFormData } from './template-form.service';
import { TemplateStateService } from './template-state.service';
import { MediaService } from './media.service';
import { ButtonService } from './button.service';
import { VariableService } from './variable.service';

export interface VariableMap {
  param_name: string;
  example: string;
}

@Injectable({
  providedIn: 'root',
})
export class TemplateSubmissionService {
  private submissionSuccessSubject = new Subject<void>();
  private submissionErrorSubject = new Subject<any>();

  public submissionSuccess$ = this.submissionSuccessSubject.asObservable();
  public submissionError$ = this.submissionErrorSubject.asObservable();

  constructor(
    private store: Store,
    private actions$: Actions,
    private formService: TemplateFormService,
    private stateService: TemplateStateService,
    private mediaService: MediaService,
    private buttonService: ButtonService,
    private variableService: VariableService
  ) {
    this.listenToSubmissionResults();
  }

  async submitTemplate(): Promise<void> {
    this.stateService.setLoading(true);

    try {
      const formData = this.formService.getFormData();

      if (!formData.templateName || !formData.category || !formData.language) {
        throw new Error('Template name, category, and language are required fields.');
      }

      const validationResult = this.formService.validateSubmission();
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(' '));
      }

      let mediaDict = {};
      if (this.needsMediaUpload(formData.broadcastTitle)) {
        mediaDict = await this.uploadMedia(formData.broadcastTitle);
      }

      const request = this.buildTemplateRequest(formData, mediaDict);

      this.store.dispatch(TemplateActions.createTemplate({ request }));
    } catch (error) {
      console.error('Template submission error:', error);
      this.stateService.setLoading(false);
      this.submissionErrorSubject.next(error);
    }
  }

  private needsMediaUpload(broadcastTitle: string): boolean {
    return (
      ['Image', 'Video', 'Document'].includes(broadcastTitle) &&
      this.mediaService.hasSelectedMedia(broadcastTitle)
    );
  }

  private async uploadMedia(mediaType: string): Promise<any> {
    const file = this.mediaService.getSelectedFile(mediaType);
    if (!file) throw new Error('No file selected');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType.toLowerCase());

    this.store.dispatch(
      TemplateActions.uploadMedia({
        file: formData,
        mediaType: mediaType.toLowerCase(),
      })
    );

    return new Promise((resolve, reject) => {
      this.actions$
        .pipe(
          ofType(
            TemplateActions.uploadMediaSuccess,
            TemplateActions.uploadMediaFailure
          ),
          take(1)
        )
        .subscribe((action) => {
          if (action.type === TemplateActions.uploadMediaSuccess.type) {
            // For TEMPLATES: read 'handle' from session upload flow (4::...)
            const handle = action.response?.data?.handle;
            const cdn_url = action.response?.data?.cdn_url;
            if (handle) {
              console.log('Upload response - media handle (for template):', handle);
              resolve({ handle, cdn_url });
            } else {
              reject(
                new Error('Media upload succeeded but no media ID returned')
              );
            }
          } else {
            reject(new Error('Media upload failed'));
          }
        });
    });
  }

  private buildTemplateRequest(
    formData: TemplateFormData,
    mediaDict?: {}
  ): any {
    if (!formData.templateName || !formData.category || !formData.language) {
      throw new Error('Required fields are missing: templateName, category, or language');
    }

    const category = formData.category.toUpperCase();
    if (category === 'AUTHENTICATION') {
      if (!formData.body || formData.body.trim() === '') {
        formData.body = '{{code}} is your verification code.';
      }
    } else {
      if (!formData.body || formData.body.trim() === '') {
        throw new Error('Message body is required');
      }
    }

    const request: any = {
      name: formData.templateName.trim(),
      category: formData.category.toUpperCase(),
      language: formData.language,
    };

    // ---- Header ----
    if (formData.broadcastTitle && formData.broadcastTitle !== 'None') {
      request.header = {
        format: formData.broadcastTitle.toUpperCase(),
        text: formData.broadcastTitle === 'Text' ? (formData.text || '') : undefined,
        variablesMap: this.extractVariablesAsListOfMaps(formData.text || '')
      };

      if (mediaDict && formData.broadcastTitle !== 'Text') {
        request.header.media_handle = mediaDict;
      }
    }

    // ---- Body ----
    request.body = {
      text: formData.body.trim(),
      variablesMap: this.extractVariablesAsListOfMaps(formData.body)
    };

    // ---- Footer ----
    if (formData.footer && formData.footer.trim()) {
      request.footer = {
        text: formData.footer.trim(),
      };
    }

    // ---- Buttons ----
    const buttons = this.buildButtonsArray(formData);
    if (buttons.length > 0) {
      request.buttons = buttons;
    }

    return request;
  }

  private extractVariablesAsListOfMaps(text: string): VariableMap[] {
    if (!text) return [];

    const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
    const uniqueVars = [...new Set(matches)];
    const variablesList: VariableMap[] = [];

    uniqueVars.forEach((match) => {
      const cleanName = match.replace(/[{}]/g, '');
      const variable = this.variableService.variables.find(v => v.name === cleanName);
      let exampleValue = '';

      if (variable && variable.value && variable.value.trim()) {
        exampleValue = variable.value.trim();
      } else {
        const variableForm = this.variableService.variableForm;
        if (variable && variableForm.get(variable.id)) {
          const controlValue = variableForm.get(variable.id)?.value;
          if (controlValue && controlValue.trim()) {
            exampleValue = controlValue.trim();
          }
        }
        if (!exampleValue) {
          exampleValue = `sample_${cleanName}`;
          console.warn(`No value found for variable "${cleanName}", using default: ${exampleValue}`);
        }
      }

      variablesList.push({
        param_name: cleanName,
        example: exampleValue
      });
    });

    return variablesList;
  }

  private buildButtonsArray(formData: TemplateFormData): any[] {
    const buttons: any[] = [];

    this.buttonService.websiteButtons.forEach((btn) => {
      if (btn.text && btn.text.trim() && btn.url && btn.url.trim()) {
        buttons.push({
          type: 'URL',
          text: btn.text.trim(),
          url: btn.url.trim(),
        });
      }
    });

    // Add phone button
    if (
      this.buttonService.hasPhoneButton &&
      formData.callButtonText && formData.callButtonText.trim() &&
      formData.phoneNumber && formData.phoneNumber.trim()
    ) {
      buttons.push({
        type: 'PHONE_NUMBER',
        text: formData.callButtonText.trim(),
        phone_number: formData.phoneNumber.trim(),
      });
    }

    // Add copy code button
    if (this.buttonService.hasCopyButton && formData.offerCode && formData.offerCode.trim()) {
      buttons.push({
        type: 'COPY_CODE',
        example: formData.offerCode.trim(),
      });
    }

    // Add auth copy button
    if (
      this.buttonService.hasAuthCopyButton &&
      formData.authCopyButtonText && formData.authCopyButtonText.trim()
    ) {
      buttons.push({
        type: 'QUICK_REPLY',
        text: formData.authCopyButtonText.trim(),
      });
    }

    // Add quick reply buttons
    if (formData.quickReplyTexts && Array.isArray(formData.quickReplyTexts)) {
      formData.quickReplyTexts.forEach((text: string) => {
        if (text && text.trim()) {
          buttons.push({
            type: 'QUICK_REPLY',
            text: text.trim(),
          });
        }
      });
    }

    return buttons;
  }

  private listenToSubmissionResults(): void {
    this.actions$
      .pipe(ofType(TemplateActions.createTemplateSuccess))
      .subscribe((action) => {
        this.stateService.setLoading(false);
        this.submissionSuccessSubject.next();
      });

    this.actions$
      .pipe(ofType(TemplateActions.createTemplateFailure))
      .subscribe((action) => {
        console.error('Template creation failure:', action);
        this.stateService.setLoading(false);
        this.submissionErrorSubject.next(action.error);
      });
  }
}
