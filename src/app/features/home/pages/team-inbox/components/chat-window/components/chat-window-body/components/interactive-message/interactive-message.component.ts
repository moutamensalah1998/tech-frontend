import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMessage, InteractiveHeader, InteractiveView } from '../../../../../../../../../../core/models/chat.types';


@Component({
  selector: 'app-interactive-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interactive-message.component.html',
})
export class InteractiveMessageComponent implements OnInit {
  @Input() message!: BaseMessage;
  @Output() openFullScreen = new EventEmitter<{url: string, type: 'image' | 'video', mimeType?: string}>();

  interactiveView: InteractiveView | null = null;

  ngOnInit() {
    this.interactiveView = this.parseInteractiveMessage();
  }


  onImageClick() {
    if (this.interactiveView?.header?.imageUrl) {
      this.openFullScreen.emit({
        url: this.interactiveView.header.imageUrl,
        type: 'image'
      });
    } else {
    }
  }

  onVideoClick() {
    if (this.interactiveView?.header?.videoUrl) {
      this.openFullScreen.emit({
        url: this.interactiveView.header.videoUrl,
        type: 'video',
        mimeType: this.message.content?.header?.mime_type || 'video/mp4'
      });
    } else {
    }
  }

  private parseInteractiveMessage(): InteractiveView | null {
    const interactive = this.message?.content?.interactive;
    if (!interactive) {
      return null;
    }

    const view: InteractiveView = {
      type: interactive.type || 'button',
      buttons: [],
      listItems: []
    };

    if (interactive.header) {
      view.header = this.parseHeader(interactive.header);
    }

    if (interactive.body?.text) {
      view.body = interactive.body.text
        .split('\n')
        .filter((line: string) => line.trim());
    }

    if (interactive.footer?.text) {
      view.footer = interactive.footer.text;
    }

    switch (view.type) {
      case 'button':
        this.parseButtonAction(interactive, view);
        break;
      case 'list':
        this.parseListAction(interactive, view);
        break;
    }

    return view;
  }

  private parseHeader(header: any): InteractiveHeader {
    const parsedHeader: InteractiveHeader = {
      type: header.type
    };

    switch (header.type) {
      case 'text':
        parsedHeader.text = header.text;
        break;
      case 'image':
        const mediaHeader = this.message.content?.header;
        if (mediaHeader?.cdn_url) {
          parsedHeader.imageUrl = mediaHeader.cdn_url;
        }
        break;
      case 'video':
        const videoHeader = this.message.content?.header;
        if (videoHeader?.cdn_url) {
          parsedHeader.videoUrl = videoHeader.cdn_url;
        }
        break;
      case 'document':
        const docHeader = this.message.content?.header;
        if (docHeader?.file_name) {
          parsedHeader.documentName = docHeader.file_name;
        }
        break;
    }

    return parsedHeader;
  }

  private parseButtonAction(interactive: any, view: InteractiveView) {
    if (interactive.action?.buttons) {
      view.buttons = interactive.action.buttons.map((btn: any, index: number) => ({
        id: btn.reply?.id || `btn_${index}`,
        title: btn.reply?.title || btn.title || `Button ${index + 1}`
      }));
    }
  }

  private parseListAction(interactive: any, view: InteractiveView) {
    if (interactive.action?.sections) {
      view.listItems = [];
      interactive.action.sections.forEach((section: any) => {
        if (section.rows) {
          section.rows.forEach((row: any, index: number) => {
            view.listItems!.push({
              id: row.id || `item_${index}`,
              title: row.title,
              description: row.description
            });
          });
        }
      });
    }
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
}
