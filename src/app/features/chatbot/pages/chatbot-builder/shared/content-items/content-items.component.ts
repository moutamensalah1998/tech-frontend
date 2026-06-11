import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentItem } from '../../../../../../core/models/chatbot.model';
import { ContentItemComponent } from "../content-item/content-item.component";

@Component({
  selector: 'app-content-items-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content-items.component.html',
})
export class ContentItemsListComponent {
  @Input() items: ContentItem[] = [];
  @Output() itemsChange = new EventEmitter<ContentItem[]>();
  @Output() contentChange = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  trackByIndex(index: number): number {
    return index;
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
    // Reorder remaining items
    this.items.forEach((item, i) => {
      item.order = i;
    });
    this.itemsChange.emit(this.items);
    this.contentChange.emit();

    // Manually trigger change detection
    this.cdr.markForCheck();
  }

  onItemChange(): void {
    this.contentChange.emit();
    // Manually trigger change detection
    this.cdr.markForCheck();
  }
}
