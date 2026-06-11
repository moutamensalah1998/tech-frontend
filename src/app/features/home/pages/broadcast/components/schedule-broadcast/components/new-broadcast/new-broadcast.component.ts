import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';

import { BroadcastDetailsComponent } from './components/broadcast-details/broadcast-details.component';
import { RecipientSelectionComponent } from './components/recipient-selection/recipient-selection.component';
import { ScheduleConfigComponent } from './components/schedule-config/schedule-config.component';
import { WhatsAppPreviewComponent } from '../../../whatsapp-preview/whatsapp-preview.component';
import { BroadcastSummaryComponent } from './components/broadcast-summary/broadcast-summary.component';
import { ProgressHeaderComponent } from './components/progress-header/progress-header.component';

import { ContactModel } from '../../../../../../../../core/models/contact.model';
import { WhatsAppTemplate } from '../../../../../../../../core/models/whatsapp-template.model';
import { BroadcastRequest } from '../../../../../../../../core/models/broadcast.model';
import { PhoneService } from './services/phone.service';
import { ToastService } from '../../../../../../../../core/services/toast-message.service';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../core/services/translation/translation.service';

import * as ScheduledBroadcastActions from '../../../../../../../../core/services/broadcast/scheduled broadcast/ngrx/scheduled-broadcast.actions';
import { selectPublishError, selectPublishLoading } from '../../../../../../../../core/services/broadcast/scheduled broadcast/ngrx/scheduled-broadcast.selectors';
import { ContactSelectionDialogComponent, ContactSelectionResult } from './components/contact-selection-dialog/contact-selection-dialog.component';

import * as TemplateActions from '../../../../../../../../core/services/broadcast/template/ngrx/your-template.actions';
import { selectTemplates } from '../../../../../../../../core/services/broadcast/template/ngrx/your-template.selectors';

@Component({
  selector: 'app-new-broadcast',
  standalone: true,
  imports: [
    CommonModule,
    BroadcastSummaryComponent,
    WhatsAppPreviewComponent,
    BroadcastDetailsComponent,
    RecipientSelectionComponent,
    ProgressHeaderComponent,
    ScheduleConfigComponent,
    TranslatePipe
  ],
  templateUrl: './new-broadcast.component.html',
  styleUrls: ['./new-broadcast.component.css']
})
export class NewBroadcastComponent implements OnInit, OnDestroy {
  broadcastForm: FormGroup;
  selectedContacts: ContactModel[] = [];
  selectedTemplate: WhatsAppTemplate | null = null;

  waHeader = '';
  waBody = '';
  waFooter = '';
  waButtons: any[] = [];
  headerMediaUrl: string | null = null;
  headerMediaType: 'image' | 'video' | 'document' | '' = '';

  publishLoading$: Observable<boolean>;
  publishError$: Observable<any>;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private phoneService: PhoneService,
    private toastService: ToastService,
    private translationService: TranslationService
  ) {
    this.broadcastForm = this.createForm();
    this.publishLoading$ = this.store.select(selectPublishLoading);
    this.publishError$ = this.store.select(selectPublishError);
  }

  ngOnInit() {
    this.setupBroadcastListeners();
    this.store.dispatch(TemplateActions.loadTemplates({ limit: 50 }));
    this.checkForTemplateFromQueryParams();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      broadcast_name: ['', Validators.required],
      template_id: ['', Validators.required],
      parameters: [''],
      scheduled_time: [''],
      is_now: [true]
    });
  }

  private setupBroadcastListeners() {
    this.publishError$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      if (error) {
        this.toastService.showToast(this.translationService.translate('broadcast.create.messages.publishFailed'), 'error');
      }
    });
  }

  private checkForTemplateFromQueryParams() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const templateId = params['templateId'];
      const templateName = params['templateName'];

      if (templateId) {
        this.broadcastForm.patchValue({
          template_id: templateId,
          broadcast_name: templateName ? `${templateName}_broadcast` : 'New Broadcast'
        });

        this.loadTemplateForPreview(templateId);
      }
    });
  }

  private loadTemplateForPreview(templateId: string) {
    this.store.select(selectTemplates).pipe(
      takeUntil(this.destroy$)
    ).subscribe(response => {
      if (response?.data) {
        const approvedTemplates = response.data.filter(item => item.template.status === 'APPROVED');
        const templateItem = approvedTemplates.find(item => item.template.id === templateId);

        if (templateItem) {
          this.selectedTemplate = templateItem.template;
          this.extractTemplateComponents(templateItem.template);

          if (templateItem.variables && templateItem.variables.length > 0) {
            setTimeout(() => {
              this.onTemplateSelected(templateItem.template);
            }, 100);
          }
        }
      }
    });
  }

  onTemplateSelected(template: WhatsAppTemplate | null) {
    this.selectedTemplate = template;
    this.headerMediaUrl = null;
    this.headerMediaType = '';
    if (template) {
      this.extractTemplateComponents(template);
      this.detectHeaderMediaType(template);
    } else {
      this.clearTemplateData();
    }
  }

  onHeaderMediaUploaded(mediaUrl: string | null) {
    this.headerMediaUrl = mediaUrl;
  }

  onContactsChanged(contacts: ContactModel[]) {
    this.selectedContacts = contacts;
  }

  onScheduleChanged(scheduleData: { isNow: boolean; scheduledTime?: string }) {
    this.broadcastForm.patchValue({
      is_now: scheduleData.isNow,
      scheduled_time: scheduleData.scheduledTime || ''
    });
  }

  openContactSelectionDialog() {
    const dialogRef = this.dialog.open(ContactSelectionDialogComponent, {
      width: '90vw',
      height: '90vh',
      maxWidth: '1200px',
      data: {
        selectedContacts: this.selectedContacts.map(c => c.id)
      },
      panelClass: 'contact-selection-dialog'
    });

    dialogRef.afterClosed().subscribe((result: ContactSelectionResult) => {
      if (result && result.selectedContacts.length > 0) {
        this.selectedContacts = result.selectedContactObjects || [];
        if (result.selectedContactObjects.length !== result.selectedContacts.length) {
          console.warn('Some selected contacts were not cached. You may need to fetch them from the API.');
        }
        this.toastService.showToast(
          this.translationService.translate('broadcast.create.recipients.messages.addedNew', { count: result.selectedContacts.length }),
          'success'
        );
      } else if (result && result.selectedContacts.length === 0) {
        this.selectedContacts = [];
        this.toastService.showToast(this.translationService.translate('broadcast.create.recipients.messages.allExistingExists'), 'info');
      }
    });
  }

  onAddNewTemplate() {
    this.router.navigate(['/dashboard/broadcast/your-templates/new-template']);
  }

  onSubmit() {
    if (!this.canSubmit()) {
      this.toastService.showToast(
        this.translationService.translate('broadcast.create.messages.fillRequired'),
        'error'
      );
      return;
    }

    const formValue = this.broadcastForm.value;
    const apiPhoneNumbers = this.getSelectedPhoneNumbersForAPI();
    const isScheduled = !!formValue.scheduled_time && !formValue.is_now;
    const scheduledTime = isScheduled ? new Date(formValue.scheduled_time).toISOString() : null;

    let parameters: string[] = [];

    if (formValue.template_variables) {
      const variableValues = Object.values(formValue.template_variables) as string[];
      parameters = variableValues.filter(value => value && value.trim());
    } else if (formValue.parameters) {
      parameters = formValue.parameters.split(',').map((p: string) => p.trim()).filter((p: string) => p);
    }

    const broadcastData: BroadcastRequest = {
      broadcast_name: formValue.broadcast_name,
      list_of_numbers: apiPhoneNumbers,
      template_id: formValue.template_id,
      parameters: parameters,
      scheduled_time: scheduledTime ?? '',
      is_now: !isScheduled,
      header_media_url: this.headerMediaUrl || null
    };

    console.log('Broadcasting with parameters:', parameters);
    this.store.dispatch(ScheduledBroadcastActions.publishBroadcast({ broadcastData }));
  }

  onCancel() {
    this.router.navigate(['/dashboard/broadcast/scheduled-broadcasts']);
  }

  getProgress(): number {
    let progress = 0;

    if (this.broadcastForm.get('broadcast_name')?.valid &&
      this.broadcastForm.get('template_id')?.valid) {

      const templateVariables = this.broadcastForm.get('template_variables');
      if (templateVariables && templateVariables.invalid) {
        progress += 20;
      } else {
        progress += 40;
      }
    }

    if (this.selectedContacts.length > 0) {
      progress += 40;
    }

    if (this.broadcastForm.get('is_now')?.value ||
      (!this.broadcastForm.get('is_now')?.value &&
        this.broadcastForm.get('scheduled_time')?.valid)) {
      progress += 20;
    }

    return progress;
  }

  canSubmit(): boolean {
    const baseValidation = this.broadcastForm.valid && this.selectedContacts.length > 0;

    if (!baseValidation) return false;

    const templateVariables = this.broadcastForm.get('template_variables');
    if (templateVariables) {
      return templateVariables.valid;
    }

    return true;
  }

  private getSelectedPhoneNumbersForAPI(): string[] {
    return this.selectedContacts
      .map(contact => this.phoneService.formatPhoneNumberWithCountryCode(contact))
      .filter(Boolean);
  }

  private extractTemplateComponents(template: WhatsAppTemplate) {
    const comps = template.components || [];
    const headerComp = comps.find((c: any) => c.type === 'HEADER');
    const bodyComp = comps.find((c: any) => c.type === 'BODY');
    const footerComp = comps.find((c: any) => c.type === 'FOOTER');
    const buttonsComp = comps.find((c: any) => c.type === 'BUTTONS');

    this.waHeader = headerComp?.text || '';
    this.waBody = bodyComp?.text || '';
    this.waFooter = footerComp?.text || '';
    this.waButtons = buttonsComp?.buttons?.map((btn: any) => ({
      type: btn.type === 'PHONE' ? 'PHONE_NUMBER' : btn.type,
      text: btn.text || ''
    })) || [];
  }

  private detectHeaderMediaType(template: WhatsAppTemplate) {
    const headerComp = template.components?.find((c: any) => c.type === 'HEADER');
    if (headerComp && headerComp.format && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComp.format)) {
      switch (headerComp.format) {
        case 'IMAGE': this.headerMediaType = 'image'; break;
        case 'VIDEO': this.headerMediaType = 'video'; break;
        case 'DOCUMENT': this.headerMediaType = 'document'; break;
      }
    } else {
      this.headerMediaType = '';
    }
  }

  getPreviewMediaUrl(): string {
    if (this.headerMediaUrl) {
      return this.headerMediaUrl;
    }

    if (!this.selectedTemplate) return '';

    const headerComp = this.selectedTemplate.components?.find((c: any) => c.type === 'HEADER');
    if (headerComp && headerComp.format && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComp.format)) {
      return headerComp.example?.header_handle?.[0] || '';
    }

    return '';
  }

  private clearTemplateData() {
    this.selectedTemplate = null;
    this.waHeader = this.waBody = this.waFooter = '';
    this.waButtons = [];
    this.headerMediaUrl = null;
    this.headerMediaType = '';
  }
}
