import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseNodeComponent } from '../base/base-node.component';
import { DragDropService } from './../../services/drag-drop.service';
import { NodeManagementService } from './../../services/node-management.service';
import { SelectionService } from './../../services/selection.service';
import { ContentItem } from '../../../../../../core/models/chatbot.model';
import { ContentType } from '../../types/events.types';
import { ContentTypeButtonsComponent } from './../../shared/content-type-buttonts/content-type-buttons.component';
import { ContentItemsListComponent } from './../../shared/content-items/content-items.component';
import { NodeHeaderComponent } from './../../shared/node-header/node-header.component';
import { ConnectionButtonComponent } from './../../shared/connection-button.component';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-message-node',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ContentTypeButtonsComponent,
    ContentItemsListComponent,
    NodeHeaderComponent,
    ConnectionButtonComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-message-node.component.html',
  styleUrls: ['./app-message-node.component.css'],
})
export class MessageNodeComponent extends BaseNodeComponent implements OnInit {
  contentItems: ContentItem[] = [];

  constructor(
    dragDropService: DragDropService,
    nodeManagementService: NodeManagementService,
    override cdr: ChangeDetectorRef,
    selectionService: SelectionService
  ) {
    super(dragDropService, nodeManagementService, cdr, selectionService);
  }

  protected initializeNode(): void {
    if (!this.node.body.body_message) {
      this.node.body.body_message = { content_items: [] };
    }
    this.contentItems = [...this.node.body.body_message.content_items];
  }

  getContentItems(): ContentItem[] {
    return this.contentItems;
  }

  addContentType(type: ContentType): void {

    if (!this.node.body.body_message) {
      this.node.body.body_message = { content_items: [] };
    }

    const newItem: ContentItem = {
      type,
      order: this.contentItems.length,
      content: this.createContentByType(type),
    };

    this.contentItems = [...this.contentItems, newItem];

    this.node.body.body_message.content_items = [...this.contentItems];

    this.emitContentChange();
    this.cdr.markForCheck();
  }

  onContentItemsChange(items: ContentItem[]): void {
    this.contentItems = [...items];
    if (this.node.body.body_message) {
      this.node.body.body_message.content_items = [...items];
      this.emitContentChange();
    }

    this.cdr.markForCheck();
  }

  private createContentByType(type: ContentType): any {
    if (type === 'text') {
      return { text_body: '' };
    }
    return {
      file_name: '',
      bytes: '',
      mime_type: `${type}/*`,
    };
  }

  protected validateContent(): boolean {
    if (!this.node.body.body_message || !this.contentItems) {
      return false;
    }
    if (this.contentItems.length === 0) {
      return false;
    }
    return this.contentItems.every(item => {
      if (item.type === 'text') {
        return !!(item.content?.text_body?.trim());
      } else {
        return !!(item.content?.file_name && (item.content?.bytes || item.content?.preview_url));
      }
    });
  }

  protected getNodeDisplayName(): string {
    if (!this.contentItems || this.contentItems.length === 0) {
      return `Message Node (${this.node.id.substring(0, 8)})`;
    }

    const firstItem = this.contentItems[0];
    if (firstItem.type === 'text' && firstItem.content?.text_body) {
      const text = firstItem.content.text_body.trim();
      const truncated = text.length > 30
        ? `${text.substring(0, 30)}...`
        : text;
      return `Message: "${truncated}"`;
    }

    const itemCount = this.contentItems.length;
    const types = [...new Set(this.contentItems.map(item => item.type))];

    if (types.length === 1) {
      return `Message: ${itemCount} ${types[0]}${itemCount > 1 ? 's' : ''}`;
    } else {
      return `Message: ${itemCount} items (${types.join(', ')})`;
    }
  }

  protected override getValidationErrorMessage(): string | null {
    if (!this.contentItems || this.contentItems.length === 0) {
      return 'Message node must have at least one content item';
    }

    const invalidItems = this.contentItems.filter(item => {
      if (item.type === 'text') {
        return !item.content?.text_body?.trim();
      } else {
        return !item.content?.file_name || (!item.content?.bytes && !item.content?.preview_url);
      }
    });

    if (invalidItems.length > 0) {
      return `${invalidItems.length} content item(s) are invalid`;
    }

    return null;
  }
}
