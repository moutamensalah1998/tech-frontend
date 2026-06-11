import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMessage, TemplateComponent, TemplateView } from '../../../../../../../../../../core/models/chat.types';

@Component({
  selector: 'app-template-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template-message.component.html',
  styleUrls: ['./template-message.component.css']
})
export class TemplateMessageComponent implements OnInit {
  @Input() message!: BaseMessage;
  @Output() openFullScreen = new EventEmitter<{url: string, type: 'image' | 'video', mimeType?: string}>();

  templateView!: TemplateView;

  ngOnInit() {
    this.templateView = this.parseTemplate();
  }

  // Add click handlers for media
  onImageClick() {
    if (this.templateView.mediaUrl && this.templateView.mediaType === 'image') {
      this.openFullScreen.emit({
        url: this.templateView.mediaUrl,
        type: 'image'
      });
    }
  }

  onVideoClick() {
    if (this.templateView.mediaUrl && this.templateView.mediaType === 'video') {
      this.openFullScreen.emit({
        url: this.templateView.mediaUrl,
        type: 'video',
        mimeType: 'video/mp4'
      });
    }
  }

  private parseTemplate(): TemplateView {
    const components: TemplateComponent[] = this.getTemplateComponents();

    const view: TemplateView = {
      bodyTexts: [],
      buttons: [],
      hasMedia: false
    };

    components.forEach(component => {
      switch (component.type.toLowerCase()) {
        case 'header':
          this.parseHeaderComponent(component, view);
          break;
        case 'body':
          this.parseBodyComponent(component, view);
          break;
        case 'footer':
          this.parseFooterComponent(component, view);
          break;
        case 'button':
        case 'buttons':
          this.parseButtonComponent(component, view);
          break;
      }
    });

    return view;
  }

  private getTemplateComponents(): TemplateComponent[] {
    // Handle both old and new data structures
    // Old structure: message.content.template.components
    if (this.message.content?.template?.components) {
      return this.message.content.template.components;
    }

    // New structure: message.content.components (direct)
    if (this.message.content?.components) {
      return this.message.content.components;
    }

    // If no components array, return empty array
    return [];
  }

  private parseHeaderComponent(component: TemplateComponent, view: TemplateView) {
    // Handle old structure: header text from parameters or direct text
    if (component.parameters?.length) {
      view.headerText = component.parameters[0].text;
    } else if (component.text) {
      view.headerText = component.text;
    }

    // Handle header media - check both old and new structures
    const headerMedia = this.message.content?.header;
    if (headerMedia?.cdn_url) {
      // Old structure: media in message.content.header
      view.hasMedia = true;
      view.mediaUrl = headerMedia.cdn_url;
      view.mediaType = this.determineMediaType(headerMedia.mime_type || headerMedia.content_type);
    } else if (component.format) {
      // New structure: media format in component with example
      if (component.format === 'IMAGE') {
        view.hasMedia = true;
        view.mediaType = 'image';

        if (component.example?.header_handle?.[0]) {
          view.mediaUrl = component.example.header_handle[0];
        }
      } else if (component.format === 'VIDEO') {
        view.hasMedia = true;
        view.mediaType = 'video';

        if (component.example?.header_handle?.[0]) {
          view.mediaUrl = component.example.header_handle[0];
        }
      } else if (component.format === 'DOCUMENT') {
        view.hasMedia = true;
        view.mediaType = 'document';

        if (component.example?.header_handle?.[0]) {
          view.mediaUrl = component.example.header_handle[0];
        }
      }
    }
  }

  private parseBodyComponent(component: TemplateComponent, view: TemplateView) {
    // Handle old structure: body text from parameters
    if (component.parameters?.length) {
      view.bodyTexts = component.parameters.map(p => p.text);
    } else if (component.text) {
      // Handle both old and new structure: direct text
      view.bodyTexts = component.text.split('\n').filter(line => line.trim());
    }
  }

  private parseFooterComponent(component: TemplateComponent, view: TemplateView) {
    // Handle old structure: footer text from parameters
    if (component.parameters?.length) {
      view.footerText = component.parameters[0].text;
    } else if (component.text) {
      // Handle both old and new structure: direct text
      view.footerText = component.text;
    }
  }

  private parseButtonComponent(component: TemplateComponent, view: TemplateView) {
    // Handle old structure: single button with sub_type
    if (component.sub_type) {
      const buttonText = component.parameters?.[0]?.text ||
                        component.text ||
                        `Button ${view.buttons.length + 1}`;

      if (component.sub_type === 'quick_reply') {
        view.buttons.push({
          text: buttonText,
          type: 'quick_reply'
        });
      } else if (component.sub_type === 'url') {
        const url = component.parameters?.[1]?.text || '#';
        view.buttons.push({
          text: buttonText,
          type: 'url',
          url
        });
      } else if (component.sub_type === 'phone_number') {
        const phoneNumber = component.parameters?.[1]?.text || '';
        view.buttons.push({
          text: buttonText,
          type: 'phone_number',
          phoneNumber
        });
      }
    }

    // Handle new structure: buttons array
    if (component.buttons && Array.isArray(component.buttons)) {
      component.buttons.forEach((button: any) => {
        view.buttons.push({
          text: button.text || 'Button',
          type: this.mapButtonType(button.type)
        });
      });
    }
  }

  private mapButtonType(buttonType: string): 'quick_reply' | 'url' | 'phone_number' {
    switch (buttonType?.toUpperCase()) {
      case 'QUICK_REPLY':
        return 'quick_reply';
      case 'URL':
        return 'url';
      case 'PHONE_NUMBER':
        return 'phone_number';
      default:
        return 'quick_reply';
    }
  }

  private determineMediaType(mimeType: string): 'image' | 'video' | 'document' {
    if (mimeType?.startsWith('image/')) return 'image';
    if (mimeType?.startsWith('video/')) return 'video';
    return 'document';
  }

  getMessageClasses(): string {
    return this.message.is_from_contact
      ? 'bg-white text-gray-900 border-gray-200'
      : 'bg-green-50 text-gray-900 border-green-200';
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  getVideoPoster(): string {
    return '';
  }
}
