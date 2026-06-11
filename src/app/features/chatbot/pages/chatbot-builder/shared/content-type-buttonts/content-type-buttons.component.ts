import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentType } from '../../../../pages/chatbot-builder/types/events.types';

@Component({
  selector: 'app-content-type-buttons',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content-type-buttons.component.html',
})
export class ContentTypeButtonsComponent {
  @Output() addContent = new EventEmitter<ContentType>();

  contentTypes = [
    { value: ContentType.TEXT, label: 'Text', icon: 'chat', color: 'green' },
    { value: ContentType.IMAGE, label: 'Image', icon: 'image', color: 'blue' },
    { value: ContentType.VIDEO, label: 'Video', icon: 'videocam', color: 'purple' },
    { value: ContentType.AUDIO, label: 'Audio', icon: 'mic', color: 'orange' },
    { value: ContentType.DOCUMENT, label: 'Document', icon: 'description', color: 'gray' }
  ];

  onAddContent(contentType: ContentType): void {
    this.addContent.emit(contentType);
  }

  getButtonClasses(color: string): string {
    const baseClasses = 'flex items-center gap-1 px-3 py-1 rounded-full text-xs hover:opacity-80 transition-colors';
    const colorMap: { [key: string]: string } = {
      green: 'bg-green-100 text-green-700',
      blue: 'bg-blue-100 text-blue-700',
      purple: 'bg-purple-100 text-purple-700',
      orange: 'bg-orange-100 text-orange-700',
      gray: 'bg-gray-100 text-gray-700'
    };
    return `${baseClasses} ${colorMap[color] || colorMap['gray']}`;
  }
}
