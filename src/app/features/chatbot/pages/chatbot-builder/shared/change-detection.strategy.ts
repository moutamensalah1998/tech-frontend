import { ChangeDetectionStrategy, Component } from '@angular/core';

export const OPTIMIZED_CHANGE_DETECTION = ChangeDetectionStrategy.OnPush;

import { Connection } from '../services/connection.service';
import { ContentItem, InteractiveButton, Node } from '../../../../../core/models/chatbot.model';

export class TrackByFunctions {
  static trackByNodeId(index: number, node: Node): string {
    return node.id;
  }

  static trackByConnection(index: number, connection: Connection): string {
    return `${connection.from.id}-${connection.to.id}`;
  }

  static trackByContentItemOrder(index: number, item: ContentItem): number {
    return item.order;
  }

  static trackByButtonIndex(index: number, button: InteractiveButton): string {
    return button.reply?.id || index.toString();
  }

  static trackByIndex(index: number): number {
    return index;
  }
}
