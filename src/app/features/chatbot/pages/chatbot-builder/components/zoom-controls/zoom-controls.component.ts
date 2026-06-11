import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZoomConfig } from '../../interface/node.interfaces';


@Component({
  selector: 'app-zoom-controls',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './zoom-controls.component.html',
  styleUrls: ['./zoom-controls.component.css'],
})
export class ZoomControlsComponent {
  @Input() config!: ZoomConfig;
  @Output() zoomChange = new EventEmitter<number>();

  zoomIn(): void {
    const newLevel = Math.min(this.config.max, this.config.level + this.config.step);
    this.zoomChange.emit(newLevel);
  }

  zoomOut(): void {
    const newLevel = Math.max(this.config.min, this.config.level - this.config.step);
    this.zoomChange.emit(newLevel);
  }

  resetZoom(): void {
    this.zoomChange.emit(1);
  }
}
