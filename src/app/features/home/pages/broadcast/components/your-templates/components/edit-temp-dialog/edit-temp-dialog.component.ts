import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { WhatsAppTemplate } from '../../../../../../../../core/models/whatsapp-template.model';
import { CommonModule } from '@angular/common';
import { WhatsAppPreviewComponent, WhatsAppButton } from '../../../whatsapp-preview/whatsapp-preview.component';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';

export interface TemplateDialogData {
  template: WhatsAppTemplate;
  broadcastTitle?: string;
}

@Component({
  standalone: true,
  selector: 'app-template-details',
  templateUrl: './edit-temp-dialog.component.html',
  imports: [MatDialogModule, CommonModule, WhatsAppPreviewComponent, TranslatePipe],
})
export class TemplateDetailsComponent {
  togglePreview() {
    throw new Error('Method not implemented.');
  }
  templateName: string = '';
  category: string = '';
  language: string = '';
  broadcastTitle: string = 'None';
  text: string = '';
  body: string = '';
  footer: string = '';
  mediaUrl: string = '';
  mediaType: 'image' | 'video' | 'document' | '' = '';

  showButton: boolean = false;
  visitWebsiteButton: boolean = false;
  callPhoneButton: boolean = false;
  copyOfferButton: boolean = false;
  quickReplyButton: number = 0;
  quickReplyTexts: string[] = [];

  websiteButtonText: string = '';
  websiteUrl: string = '';
  callButtonText: string = '';
  phoneNumber: string = '';
  offerCode: string = '';
  showMobilePreview: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TemplateDialogData,
    private dialogRef: MatDialogRef<TemplateDetailsComponent>
  ) {
    this.initializeTemplateData();
  }

  private initializeTemplateData(): void {
    this.templateName = this.data.template.name;
    this.category = this.data.template.category;
    this.language = this.data.template.language;

    this.extractComponents();

    this.extractButtons();
  }

  private extractComponents(): void {
    if (!this.data.template.components) return;

    const headerComp = this.data.template.components.find(c => c.type === 'HEADER');
    this.text = '';
    this.mediaUrl = '';
    this.mediaType = '';
    this.broadcastTitle = '';

    if (headerComp) {
      if (headerComp.format === 'TEXT' && headerComp.text) {
        this.broadcastTitle = 'Text';
        this.text = headerComp.text;

      } else if (headerComp.format === 'IMAGE') {
        this.broadcastTitle = 'Image';
        this.mediaType = 'image';
        this.text = '';

        this.mediaUrl = headerComp.example?.header_handle?.[0]
          ? headerComp.example.header_handle[0]
          : this.getMediaUrl(this.data.template.cdnUrl);

      } else if (headerComp.format === 'VIDEO') {
        this.broadcastTitle = 'Video';
        this.mediaType = 'video';
        this.text = '';

        this.mediaUrl = headerComp.example?.header_handle?.[0]
          ? headerComp.example.header_handle[0]
          : this.getMediaUrl(this.data.template.cdnUrl);

      } else if (headerComp.format === 'DOCUMENT') {
        this.broadcastTitle = 'Document';
        this.mediaType = 'document';
        this.text = '';

        this.mediaUrl = headerComp.example?.header_handle?.[0]
          ? headerComp.example.header_handle[0]
          : this.getMediaUrl(this.data.template.cdnUrl);
      }
    }

    const bodyComp = this.data.template.components.find(c => c.type === 'BODY');
    this.body = bodyComp?.text || '';

    const footerComp = this.data.template.components.find(c => c.type === 'FOOTER');
    this.footer = footerComp?.text || '';
  }


  private extractButtons(): void {
    if (!this.data.template.components) return;

    const buttonsComp = this.data.template.components.find(c => c.type === 'BUTTONS');
    if (!buttonsComp || !buttonsComp.buttons) return;

    this.showButton = true;
    this.quickReplyButton = 0;

    buttonsComp.buttons.forEach(btn => {
      switch (btn.type) {
        case 'QUICK_REPLY':
          this.quickReplyButton++;
          this.quickReplyTexts.push(btn.text || '');
          break;
        case 'URL':
          this.visitWebsiteButton = true;
          this.websiteButtonText = btn.text || '';
          this.websiteUrl = (btn as any).url || '';
          break;
        case 'PHONE':
          this.callPhoneButton = true;
          this.callButtonText = btn.text || '';
          this.phoneNumber = (btn as any).phone_number || '';
          break;
      }
    });
  }

  get previewButtons(): WhatsAppButton[] {
    const buttons: WhatsAppButton[] = [];

    if (this.visitWebsiteButton && this.websiteButtonText && this.websiteUrl) {
      buttons.push({
        type: 'URL',
        text: this.websiteButtonText,
        url: this.websiteUrl
      });
    }

    if (this.callPhoneButton && this.callButtonText && this.phoneNumber) {
      buttons.push({
        type: 'PHONE_NUMBER',
        text: this.callButtonText,
        phoneNumber: this.phoneNumber
      });
    }

    if (this.copyOfferButton && this.offerCode) {
      buttons.push({
        type: 'QUICK_REPLY',
        text: 'Copy Offer Code'
      });
    }

    if (this.quickReplyButton > 0 && this.quickReplyTexts.length > 0) {
      this.quickReplyTexts.forEach(text => {
        if (text && text.trim()) {
          buttons.push({
            type: 'QUICK_REPLY',
            text: text.trim()
          });
        }
      });
    }

    return buttons;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  private getMediaUrl(cdnUrl?: string): string {
    if (cdnUrl && cdnUrl.trim() !== '') {
      return cdnUrl;
    }
    return 'assets/features/image_notFound.png';
  }
}
