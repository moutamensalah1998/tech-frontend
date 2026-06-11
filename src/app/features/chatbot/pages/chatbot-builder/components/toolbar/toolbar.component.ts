import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZoomControlsComponent } from '../zoom-controls/zoom-controls.component';
import { ZoomConfig } from '../../interface/node.interfaces';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

export interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

export interface GridConfig {
  enabled: boolean;
  size: number;
  showGrid: boolean;
}

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, ZoomControlsComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {
  @Input() zoomConfig!: ZoomConfig;
  @Input() undoRedoState!: UndoRedoState;
  @Input() gridConfig!: GridConfig;
  @Input() firstNodeTitle: string | null = null;

  @Output() zoomChange = new EventEmitter<number>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() toggleGrid = new EventEmitter<void>();
  @Output() addNodeClick = new EventEmitter<Event>();

  onZoomChange(level: number): void {
    this.zoomChange.emit(level);
  }

  onUndo(): void {
    this.undo.emit();
  }

  onRedo(): void {
    this.redo.emit();
  }

  onToggleGrid(): void {
    this.toggleGrid.emit();
  }

  onAddNodeClick(event: Event): void {
    this.addNodeClick.emit(event);
  }
}

