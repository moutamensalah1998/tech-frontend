import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TemplateFormData } from './template-form.service';
import { ButtonService } from './button.service';
import { MediaService } from './media.service';
import { VariableService } from './variable.service';

export interface PreviewData {
  header: string;
  body: string;
  footer: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'document' | '';
  buttons: any[];
  time: string;
}

@Injectable({
  providedIn: 'root'
})
export class TemplateStateService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private showSuccessSubject = new BehaviorSubject<boolean>(false);
  private previewDataSubject = new BehaviorSubject<PreviewData>({
    header: '',
    body: '',
    footer: '',
    mediaUrl: '',
    mediaType: '',
    buttons: [],
    time: '18:27'
  });

  public isLoading$ = this.isLoadingSubject.asObservable();
  public showSuccess$ = this.showSuccessSubject.asObservable();
  public previewData$ = this.previewDataSubject.asObservable();

  constructor(
    private buttonService: ButtonService,
    private mediaService: MediaService,
    private variableService: VariableService
  ) {}

  setLoading(loading: boolean): void {
    this.isLoadingSubject.next(loading);
  }

  showSuccessMessage(): void {
    this.showSuccessSubject.next(true);
  }

  hideSuccessMessage(): void {
    this.showSuccessSubject.next(false);
  }

  updatePreview(formData: TemplateFormData): void {
    const previewData: PreviewData = {
      header: this.getHeaderText(formData),
      body: this.replaceVariablesInPreview(formData.body || 'Your message preview will appear here.'),
      footer: this.replaceVariablesInPreview(formData.footer || ''),
      mediaUrl: this.getMediaUrl(formData.broadcastTitle),
      mediaType: this.getMediaType(formData.broadcastTitle),
      buttons: this.buttonService.getPreviewButtons(formData),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Always emit the new preview data
    this.previewDataSubject.next({ ...previewData }); // Create new object reference
  }

  resetState(): void {
    this.setLoading(false);
    this.hideSuccessMessage();
    this.mediaService.clearMedia();
    this.previewDataSubject.next({
      header: '',
      body: 'Your message preview will appear here.',
      footer: '',
      mediaUrl: '',
      mediaType: '',
      buttons: [],
      time: '18:27'
    });
  }

  forceUpdatePreview(formData: TemplateFormData): void {
    this.updatePreview(formData);
  }

  private getHeaderText(formData: TemplateFormData): string {
    if (formData.broadcastTitle === 'Text') {
      return this.replaceVariablesInPreview(formData.text || '');
    }
    return '';
  }

  private getMediaUrl(broadcastTitle: string): string {
    if (broadcastTitle === 'Image' || broadcastTitle === 'Video') {
      const url = this.mediaService.getPreviewUrl(broadcastTitle);
      return url || '';
    }
    if (broadcastTitle === 'Document') {
      const fileName = this.mediaService.getSelectedFileName(broadcastTitle);
      return fileName ? `document://${fileName}` : '';
    }
    return '';
  }

  private getMediaType(broadcastTitle: string): 'image' | 'video' | 'document' | '' {
    const type = broadcastTitle?.toLowerCase();
    if (type === 'image' || type === 'video' || type === 'document') {
      return type as 'image' | 'video' | 'document';
    }
    return '';
  }

  private replaceVariablesInPreview(text: string): string {
    if (!text) return text;

    const variables = this.variableService.variables;
    let processedText = text;

    variables.forEach(variable => {
      if (variable.value) {
        const regex = new RegExp(this.escapeRegExp(variable.placeholder), 'g');
        processedText = processedText.replace(regex, variable.value);
      } else {
        // Show placeholder with variable name if no value is set
        const regex = new RegExp(this.escapeRegExp(variable.placeholder), 'g');
        processedText = processedText.replace(regex, `[${variable.name}]`);
      }
    });

    return processedText;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
