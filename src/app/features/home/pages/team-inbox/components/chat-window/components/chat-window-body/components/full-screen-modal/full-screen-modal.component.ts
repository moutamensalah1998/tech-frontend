import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FullScreenMedia {
  isOpen: boolean;
  url: string;
  type: 'image' | 'video';
  mimeType?: string;
}

@Component({
  selector: 'app-full-screen-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './full-screen-modal.component.html',
})
export class FullScreenModalComponent {
  @Input() media!: FullScreenMedia;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
