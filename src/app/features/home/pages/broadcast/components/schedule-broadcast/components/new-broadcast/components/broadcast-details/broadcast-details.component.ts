import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, take, map } from 'rxjs/operators';
import { selectTemplates } from '../../../../../../../../../../core/services/broadcast/template/ngrx/your-template.selectors';
import { loadTemplates } from '../../../../../../../../../../core/services/broadcast/template/ngrx/your-template.actions';
import { TemplateApiResponse, TemplateItem, WhatsAppTemplate } from '../../../../../../../../../../core/models/whatsapp-template.model';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';
import { selectUploadMediaData, selectUploadMediaLoading, selectUploadMediaError } from '../../../../../../../../../../core/services/upload-media/ngrx/media.selectors';
import { UploadMedia } from '../../../../../../../../../../core/services/upload-media/ngrx/meida.actions';

@Component({
  selector: 'app-broadcast-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './broadcast-details.component.html',
})
export class BroadcastDetailsComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @Output() templateSelected = new EventEmitter<WhatsAppTemplate | null>();
  @Output() addNewTemplate = new EventEmitter<void>();
  @Output() headerMediaUploaded = new EventEmitter<string | null>();

  templates$: Observable<TemplateItem[]>; // only approved templates
  selectedTemplateItem: TemplateItem | null = null;
  templateVariables: string[] = [];

  // Header media upload state
  uploadedMediaUrl: string | null = null;
  isUploadingMedia = false;
  selectedFile: File | null = null;
  uploadProgress = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private fb: FormBuilder
  ) {
    // Filter templates to only approved
    this.templates$ = this.store.select(selectTemplates).pipe(
      map(response => response?.data?.filter(item => item.template.status === 'APPROVED') || [])
    );

    // Subscribe to upload media state
    this.store.select(selectUploadMediaData)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        if (response && response.data && response.data.cdn_url) {
          this.uploadedMediaUrl = response.data.cdn_url;
          this.isUploadingMedia = false;
          this.selectedFile = null;
          this.uploadProgress = 100;
          this.headerMediaUploaded.emit(this.uploadedMediaUrl);
          setTimeout(() => {
            this.uploadProgress = 0;
          }, 2000);
        }
      });

    this.store.select(selectUploadMediaLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        this.isUploadingMedia = loading;
        if (loading && this.uploadProgress === 0) {
          this.uploadProgress = 25;
        }
      });

    this.store.select(selectUploadMediaError)
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        if (error) {
          this.isUploadingMedia = false;
          this.uploadProgress = 0;
        }
      });
  }

  ngOnInit() {
    this.store.dispatch(loadTemplates({ limit: 50 }));

    this.form.get('template_id')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(templateId => {
        if (!templateId) {
          this.clearTemplateData();
          return;
        }

        this.loadSelectedTemplate(templateId);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSelectedTemplate(templateId: string) {
    this.templates$.pipe(take(1)).subscribe((approvedTemplates: TemplateItem[]) => {
      const templateItem = approvedTemplates.find(item => item.template.id === templateId) || null;

      if (templateItem) {
        this.selectedTemplateItem = templateItem;
        this.templateVariables = templateItem.variables || [];
        this.setupVariableControls();
        this.resetHeaderMedia();
        this.templateSelected.emit(templateItem.template);
      } else {
        this.clearTemplateData();
      }
    });
  }

  private setupVariableControls() {
    this.clearVariableControls();

    if (this.templateVariables.length > 0) {
      const variableGroup: { [key: string]: any } = {};

      this.templateVariables.forEach(variable => {
        variableGroup[variable] = ['', Validators.required];
      });

      this.form.addControl('template_variables', this.fb.group(variableGroup));
    }
  }

  private clearVariableControls() {
    if (this.form.get('template_variables')) {
      this.form.removeControl('template_variables');
    }
  }

  private clearTemplateData() {
    this.selectedTemplateItem = null;
    this.templateVariables = [];
    this.clearVariableControls();
    this.resetHeaderMedia();
    this.templateSelected.emit(null);
  }

  private resetHeaderMedia() {
    this.uploadedMediaUrl = null;
    this.selectedFile = null;
    this.uploadProgress = 0;
    this.headerMediaUploaded.emit(null);
  }

  getVariableControl(variableName: string): AbstractControl | null {
    return this.form.get('template_variables')?.get(variableName) || null;
  }

  hasTemplateVariables(): boolean {
    return this.templateVariables.length > 0;
  }

  getTemplateVariables(): string[] {
    return this.templateVariables;
  }

  getVariableExample(variableName: string): string {
    if (!this.selectedTemplateItem?.template) return '';

    const bodyComponent = this.selectedTemplateItem.template.components?.find(
      comp => comp.type === 'BODY'
    );

    if (bodyComponent?.example?.body_text_named_params) {
      const paramExample = bodyComponent.example.body_text_named_params.find(
        param => param.param_name === variableName
      );
      return paramExample?.example || '';
    }

    return '';
  }

  // --- Header Type Detection Methods ---

  getHeaderComponent(): any {
    if (!this.selectedTemplateItem) return null;
    return this.selectedTemplateItem.template.components?.find(comp => comp.type === 'HEADER');
  }

  hasMediaHeader(): boolean {
    const headerComp = this.getHeaderComponent();
    return headerComp &&
           ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'].includes(headerComp.format);
  }

  getMediaType(): 'image' | 'video' | 'document' | 'audio' {
    const headerComp = this.getHeaderComponent();
    if (!headerComp) return 'document';

    switch (headerComp.format) {
      case 'IMAGE': return 'image';
      case 'VIDEO': return 'video';
      case 'DOCUMENT': return 'document';
      case 'AUDIO': return 'audio';
      default: return 'document';
    }
  }

  getAcceptedFileTypes(): string {
    const mediaType = this.getMediaType();
    switch (mediaType) {
      case 'image': return 'image/*';
      case 'video': return 'video/*';
      case 'document': return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
      case 'audio': return 'audio/*';
      default: return '*/*';
    }
  }

  // --- Media Upload Methods ---

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.selectedFile = file;
      this.uploadFile(file);
    }

    input.value = '';
  }

  private uploadFile(file: File): void {
    const formData = new FormData();
    formData.append('file', file);

    const mediaType = this.getMediaType();
    this.uploadProgress = 25;
    this.store.dispatch(UploadMedia({ file: formData, mediaType }));

    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90 && this.isUploadingMedia) {
        this.uploadProgress += 10;
      } else {
        clearInterval(progressInterval);
      }
    }, 200);
  }

  removeUploadedMedia(): void {
    this.uploadedMediaUrl = null;
    this.selectedFile = null;
    this.uploadProgress = 0;
    this.headerMediaUploaded.emit(null);
  }

  getSelectedTemplateName(): string {
    return this.selectedTemplateItem?.template?.name || '';
  }
}
