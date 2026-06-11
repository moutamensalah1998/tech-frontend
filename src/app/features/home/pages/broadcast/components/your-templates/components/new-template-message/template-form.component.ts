// template-form.component.ts - ENHANCED VERSION with better error handling
import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { takeUntil, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { TemplateStateService } from './services/template-state.service';
import { TemplateSubmissionService } from './services/template-submission.service';
import { ButtonService } from './services/button.service';
import { VariableService } from './services/variable.service';
import { TemplateBasicInfoComponent } from './components/template-basic-info/template-basic-info.component';
import { TemplateMediaComponent } from './components/template-media/template-media.component';
import { TemplateContentComponent } from './components/template-content/template-content.component';
import { VariableInputsComponent } from './components/variable-inputs/variable-inputs.component';
import { LoadingOverlayComponent } from './components/loading-overlay/loading-overlay.component';
import { SuccessOverlayComponent } from './components/success-overlay/success-overlay.component';
import { ToastService } from '../../../../../../../../core/services/toast-message.service';
import { TemplateButtonsComponent } from './components/template-buttons/template-buttons.component';
import { WhatsAppPreviewComponent } from "../../../whatsapp-preview/whatsapp-preview.component";
import { TemplateFormService } from './services/template-form.service';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';
import { ErrorTranslatorService } from '../../../../../../../../core/error/error-translator.service';
import { TranslationService } from '../../../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TemplateBasicInfoComponent,
    TemplateMediaComponent,
    TemplateContentComponent,
    VariableInputsComponent,
    TemplateButtonsComponent,
    LoadingOverlayComponent,
    SuccessOverlayComponent,
    WhatsAppPreviewComponent,
    TranslatePipe
  ],
  templateUrl: './template-form.component.html',
  styleUrls: ['./template-form.component.css']
})
export class TemplateFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  previewHeader = '';
  previewBody = '';
  previewFooter = '';
  previewMediaUrl = '';
  previewMediaType: 'image' | 'video' | 'document' | '' = '';
  previewTime = '';
  previewButtons: any[] = [];

  private translationService = inject(TranslationService);

  constructor(
    public formService: TemplateFormService,
    public stateService: TemplateStateService,
    private submissionService: TemplateSubmissionService,
    private buttonService: ButtonService,
    private variableService: VariableService,
    private toastService: ToastService,
    private errorTranslator: ErrorTranslatorService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.formService.initializeForm();
    this.handlePrefillData();
    this.subscribeToFormChanges();
    this.subscribeToSubmissionResults();
    this.subscribeToVariableChanges();
    this.subscribeToButtonChanges();
    this.subscribeToPreviewData();

    setTimeout(() => {
      this.updatePreview();

      if (this.variableService.variables.length > 0) {
        this.variableService.updateVariableControls();
      }
    }, 100);

    this.updatePreview();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private validateFormBeforeSubmission(): boolean {

    const formData = this.formService.getFormData();

    if (!formData.templateName || formData.templateName.trim() === '') {
      this.toastService.showToast(this.translationService.translate('broadcast.createTemplate.basicInfo.templateNameRequiredError'), 'error');
      return false;
    }

    if (!formData.category || formData.category.trim() === '') {
      this.toastService.showToast(this.translationService.translate('broadcast.createTemplate.basicInfo.categoryRequiredError'), 'error');
      return false;
    }

    if (!formData.language || formData.language.trim() === '') {
      this.toastService.showToast(this.translationService.translate('broadcast.createTemplate.basicInfo.languageRequiredError'), 'error');
      return false;
    }

    const category = formData.category?.toUpperCase();
    if (category !== 'AUTHENTICATION') {
      if (!formData.body || formData.body.trim() === '') {
        this.toastService.showToast(this.translationService.translate('broadcast.createTemplate.content.bodyRequiredError'), 'error');
        return false;
      }
    } else {
      if (!formData.body || formData.body.trim() === '') {
        this.formService.form.patchValue({
          body: '{{code}} is your verification code.'
        });
        formData.body = '{{code}} is your verification code.';
      }
    }

    if (this.formService.form.invalid) {
      const invalidControls = Object.keys(this.formService.form.controls).filter(
        key => this.formService.form.get(key)?.invalid
      );


      if (category === 'AUTHENTICATION' && invalidControls.length === 1 && invalidControls[0] === 'body') {
        const bodyControl = this.formService.form.get('body');
        if (bodyControl) {
          bodyControl.clearValidators();
          bodyControl.setValue('{{code}} is your verification code.');
          bodyControl.updateValueAndValidity();
        }
      } else {
        this.formService.markAllFieldsAsTouched();
        this.toastService.showToast('Please fill in all required fields correctly', 'error');
        return false;
      }
    }

    const validationResult = this.formService.validateSubmission();
    if (!validationResult.isValid) {
      this.toastService.showToast(validationResult.errors.join(' '), 'error');
      return false;
    }
    return true;
  }

  private validateVariablesBeforeSubmission(): boolean {

    const variables = this.variableService.variables;
    const variableForm = this.variableService.variableForm;

    if (variables.length === 0) {
      return true;
    }

    const formControlCount = Object.keys(variableForm.controls).length;

    if (formControlCount === 0) {
      this.variableService.updateVariableControls();

      const newFormControlCount = Object.keys(this.variableService.variableForm.controls).length;
      if (newFormControlCount === 0) {
        this.toastService.showToast('Variable form controls could not be created. Please refresh the page.', 'error');
        return false;
      }
    }

    const uniqueVariableNames = [...new Set(variables.map(v => v.name))];
    for (const variableName of uniqueVariableNames) {
      const variable = variables.find(v => v.name === variableName);
      if (!variable) continue;

      const control = variableForm.get(variable.id);
      if (!control) {
        this.toastService.showToast(`Variable "${variableName}" is not properly configured.`, 'error');
        return false;
      }

      const hasVariableValue = variable.value && variable.value.trim() !== '';
      const hasControlValue = control.value && control.value.trim() !== '';

      if (!hasVariableValue && !hasControlValue) {
        this.toastService.showToast(`Please provide a value for variable "${variableName}"`, 'error');
        return false;
      }

      if (control.invalid) {
        control.setValue(variable.value || '');
        control.markAsTouched();
        control.updateValueAndValidity();

        if (control.invalid) {
          this.toastService.showToast(`Variable "${variableName}" validation failed.`, 'error');
          return false;
        }
      }
    }

    return true;
  }

  onSubmit(): void {

    try {
      this.formService.ensureAuthenticationTemplateBody();

      if (!this.validateFormBeforeSubmission()) {
        return;
      }

      if (this.variableService.variables.length > 0) {

        const variables = this.variableService.variables;
        const variableForm = this.variableService.variableForm;
        const brokenControls = variables.filter(v => !variableForm.get(v.id));

        if (brokenControls.length > 0) {
          this.variableService.fixAllVariableIssues();

          setTimeout(() => {
            if (this.validateVariablesBeforeSubmission()) {
              this.submissionService.submitTemplate();
            }
          }, 300);
          return;
        }

        if (!this.validateVariablesBeforeSubmission()) {
          return;
        }
      }

      const formData = this.formService.getFormData();
      const category = formData.category?.toUpperCase();

      if (category === 'MARKETING' && !this.buttonService.hasAnyButtons(this.formService.form)) {
        this.toastService.showToast('Marketing templates require at least one interactive button', 'error');
        return;
      }

      this.submissionService.submitTemplate();

    } catch (error) {
      this.toastService.showToast(`Submission error: ${error}`, 'error');
    }
  }

  onReset(): void {
    this.formService.resetForm();
    this.stateService.resetState();
    this.buttonService.clearAllButtons(this.formService.form);
    this.variableService.clearAllVariables();
    this.toastService.showToast('Form has been reset', 'info');
  }

  private handlePrefillData(): void {
    const prefill = history.state?.prefill;
    if (prefill) {
      this.formService.prefillForm(prefill);
      this.cdr.detectChanges();
    }
  }

  private subscribeToFormChanges(): void {
    this.formService.form.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(50),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      )
      .subscribe(() => {
        this.updatePreview();
      });

    try {
      const quickReplyArray = this.formService.getQuickReplyArray();
      if (quickReplyArray) {
        quickReplyArray.valueChanges
          .pipe(takeUntil(this.destroy$), debounceTime(50))
          .subscribe((values) => {
            this.updatePreview();
          });
      }
    } catch (error) {
      this.toastService.showToast('Error subscribing to quick reply changes please refresh and try again', 'error');
    }
  }

  private subscribeToVariableChanges(): void {
    this.variableService.variables$
      .pipe(takeUntil(this.destroy$))
      .subscribe((variables) => {

        if (variables.length > 0) {
          const formControlCount = Object.keys(this.variableService.variableForm.controls).length;
          if (formControlCount === 0) {
            setTimeout(() => {
              this.variableService.updateVariableControls();
            }, 100);
          }
        }

        this.updatePreview();
      });

    this.variableService.variableForm$
      .pipe(takeUntil(this.destroy$))
      .subscribe((form) => {
        setTimeout(() => this.updatePreview(), 50);
      });
  }

  private subscribeToButtonChanges(): void {
    combineLatest([
      this.buttonService.websiteButtons$,
      this.buttonService.hasPhoneButton$,
      this.buttonService.hasCopyButton$,
      this.buttonService.hasAuthCopyButton$,
      this.buttonService.updates$
    ]).pipe(
      takeUntil(this.destroy$),
      debounceTime(50)
    ).subscribe(() => {
      this.updatePreview();
    });
  }

  private subscribeToPreviewData(): void {
    this.stateService.previewData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(previewData => {
        this.previewHeader = previewData.header;
        this.previewBody = previewData.body;
        this.previewFooter = previewData.footer;
        this.previewMediaUrl = previewData.mediaUrl;
        this.previewMediaType = previewData.mediaType;
        this.previewTime = previewData.time;
        this.previewButtons = [...previewData.buttons];
        this.cdr.detectChanges();
      });
  }

  private subscribeToSubmissionResults(): void {
    this.submissionService.submissionSuccess$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.stateService.showSuccessMessage();
        setTimeout(() => {
          this.onReset();
          this.stateService.hideSuccessMessage();
        }, 3000);
      });

    this.submissionService.submissionError$
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        if (error) {
          const errorMessage = this.errorTranslator.translateHttpError(error);
          this.toastService.showToast(errorMessage, 'error');
        }
      });
  }

  private updatePreview(): void {
    try {
      const formData = this.formService.getFormData();
      this.stateService.forceUpdatePreview(formData);
    } catch (error) {
      this.toastService.showToast('Error updating preview please refresh and try again', 'error');
    }
  }
}
