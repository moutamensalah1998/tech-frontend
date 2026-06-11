import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-drag-drop-overlay',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './drag-drop-overlay.component.html',

  styleUrls: ['./drag-drop-overlay.component.css']
})
export class DragDropOverlayComponent {
  @Input() isValidDrop = false;
}
