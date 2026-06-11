import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Store } from '@ngrx/store';
import { WhatsAppButton, WhatsAppPreviewComponent } from '../../../../../../../broadcast/components/whatsapp-preview/whatsapp-preview.component';
import { TemplateButton } from '../../../../../../../../../../core/models/whatsapp-yourtemplate.model';
import { selectUploadMediaData, selectUploadMediaLoading, selectUploadMediaError } from '../../../../../../../../../../core/services/upload-media/ngrx/media.selectors';
import { UploadMedia } from '../../../../../../../../../../core/services/upload-media/ngrx/meida.actions';

export interface TemplateItem {
  template: {
    id: string;
    name: string;
    language: string;
    status: string;
    category: string;
    components: any[];
    [key: string]: any;
  };
  variables: string[];
}

@Component({
  selector: 'app-template-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, WhatsAppPreviewComponent],
  templateUrl: './template-picker.component.html',
})
export class TemplatePickerComponent {
  @Input() templates$!: Observable<TemplateItem[]>;
  @Input() loading$!: Observable<boolean>;

  @Output() templateSelected = new EventEmitter<TemplateItem>();
  @Output() templateSent = new EventEmitter<{template: TemplateItem, parameters: {[key: string]: string}, mediaUrl?: string}>();
  @Output() cancelled = new EventEmitter<void>();

  selectedTemplateItem: TemplateItem | null = null;
  variableValues: {[key: string]: string} = {};

  uploadedMediaUrl: string | null = null;
  isUploadingMedia = false;
  selectedFile: File | null = null;
  uploadProgress = 0;

  private destroy$ = new Subject<void>();

  constructor(private store: Store) {
    this.store.select(selectUploadMediaData)
      .pipe(takeUntil(this.destroy$))
      .subscribe((response) => {
        console.log('Upload media response received:', response);
        if (response && response.data && response.data.cdn_url) {
          this.uploadedMediaUrl = response.data.cdn_url;
          this.isUploadingMedia = false;
          this.selectedFile = null;
          this.uploadProgress = 100;
          console.log('Media uploaded successfully:', this.uploadedMediaUrl);

          setTimeout(() => {
            this.uploadProgress = 0;
          }, 2000);
        }
      });

    this.store.select(selectUploadMediaLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        console.log('Upload loading state:', loading);
        this.isUploadingMedia = loading;
        if (loading && this.uploadProgress === 0) {
          this.uploadProgress = 25;
        }
      });

    this.store.select(selectUploadMediaError)
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        if (error) {
          console.error('Upload error:', error);
          this.isUploadingMedia = false;
          this.uploadProgress = 0;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectTemplate(templateItem: TemplateItem): void {
    this.selectedTemplateItem = templateItem;
    this.variableValues = {};
    // Don't reset uploaded media when switching templates
    // this.uploadedMediaUrl = null;
    // this.selectedFile = null;

    templateItem.variables.forEach(variable => {
      this.variableValues[variable] = '';
    });

    this.templateSelected.emit(templateItem);
  }

  sendTemplate(): void {
    if (this.selectedTemplateItem) {
      const hasEmptyVariables = this.selectedTemplateItem.variables.some(
        variable => !this.variableValues[variable]?.trim()
      );

      if (hasEmptyVariables) {
        return;
      }

      this.templateSent.emit({
        template: this.selectedTemplateItem,
        parameters: this.variableValues,
        mediaUrl: this.uploadedMediaUrl || undefined
      });
    }
  }

  cancel(): void {
    this.selectedTemplateItem = null;
    this.variableValues = {};
    this.uploadedMediaUrl = null;
    this.selectedFile = null;
    this.uploadProgress = 0;
    this.cancelled.emit();
  }

  isFormValid(): boolean {
    if (!this.selectedTemplateItem) return false;

    const variablesValid = this.selectedTemplateItem.variables.length === 0 ||
      this.selectedTemplateItem.variables.every(variable => this.variableValues[variable]?.trim());

    return variablesValid && !this.isUploadingMedia;
  }

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
    console.log('Starting file upload:', file.name, file.type, file.size);

    const formData = new FormData();
    formData.append('file', file);

    const mediaType = this.getMediaType();
    console.log('Media type detected:', mediaType);

    this.uploadProgress = 25;
    this.store.dispatch(UploadMedia({ file: formData, mediaType }));

    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90 && this.isUploadingMedia) {
        this.uploadProgress += 10;
      } else {
        clearInterval(progressInterval);
      }
    }, 200);

    console.log('Upload action dispatched');
  }

  removeUploadedMedia(): void {
    this.uploadedMediaUrl = null;
    this.selectedFile = null;
    this.uploadProgress = 0;
  }

  hasMediaHeader(): boolean {
    if (!this.selectedTemplateItem) return false;

    const headerComponent = this.getHeaderComponent();
    return headerComponent &&
           (headerComponent.format === 'IMAGE' ||
            headerComponent.format === 'VIDEO' ||
            headerComponent.format === 'DOCUMENT');
  }

  getMediaType(): 'image' | 'video' | 'document' {
    const headerComponent = this.getHeaderComponent();
    if (!headerComponent) return 'document';

    switch (headerComponent.format) {
      case 'IMAGE': return 'image';
      case 'VIDEO': return 'video';
      case 'DOCUMENT': return 'document';
      default: return 'document';
    }
  }

  getAcceptedFileTypes(): string {
    const mediaType = this.getMediaType();
    switch (mediaType) {
      case 'image': return 'image/*';
      case 'video': return 'video/*';
      case 'document': return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
      default: return '*/*';
    }
  }

  private getHeaderComponent(): any {
    if (!this.selectedTemplateItem) return null;
    return this.selectedTemplateItem.template.components?.find(comp => comp.type === 'HEADER');
  }

  getPreviewHeader(): string {
    if (!this.selectedTemplateItem) return '';

    const headerComponent = this.getHeaderComponent();
    if (!headerComponent || !headerComponent.text) return '';

    return this.replaceVariables(headerComponent.text, this.variableValues);
  }

  getPreviewBody(): string {
    if (!this.selectedTemplateItem) return '';

    const bodyComponent = this.selectedTemplateItem.template.components?.find(
      comp => comp.type === 'BODY'
    );

    if (!bodyComponent || !bodyComponent.text) return '';

    return this.replaceVariables(bodyComponent.text, this.variableValues);
  }

  getPreviewFooter(): string {
    if (!this.selectedTemplateItem) return '';

    const footerComponent = this.selectedTemplateItem.template.components?.find(
      comp => comp.type === 'FOOTER'
    );

    return footerComponent?.text || '';
  }

  getPreviewButtons(): WhatsAppButton[] {
    if (!this.selectedTemplateItem) return [];

    const buttonComponent = this.selectedTemplateItem.template.components?.find(
      comp => comp.type === 'BUTTONS'
    );

    if (!buttonComponent || !buttonComponent.buttons) return [];

    return buttonComponent.buttons.map((button: TemplateButton) => ({
      type: button.type as 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER',
      text: button.text || '',
      url: button.type === 'URL' ? button.example : undefined,
      phoneNumber: button.type === 'PHONE_NUMBER' ? button.example : undefined
    }));
  }

  getPreviewMediaUrl(): string {
    if (this.uploadedMediaUrl) {
      return this.uploadedMediaUrl;
    }

    if (!this.selectedTemplateItem) return '';

    const headerComponent = this.getHeaderComponent();
    if (headerComponent?.format === 'IMAGE' || headerComponent?.format === 'VIDEO' || headerComponent?.format === 'DOCUMENT') {
      return headerComponent.example?.header_handle?.[0] || '';
    }

    return '';
  }

  getPreviewMediaType(): 'image' | 'video' | 'document' | '' {
    if (!this.selectedTemplateItem) return '';

    const headerComponent = this.getHeaderComponent();
    if (headerComponent?.format === 'IMAGE') return 'image';
    if (headerComponent?.format === 'VIDEO') return 'video';
    if (headerComponent?.format === 'DOCUMENT') return 'document';

    return '';
  }

  private replaceVariables(text: string, variables: {[key: string]: string}): string {
    let result = text;

    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(regex, variables[key] || `{{${key}}}`);
    });

    return result;
  }
}
