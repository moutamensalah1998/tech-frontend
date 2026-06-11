import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../../../../../core/models/chatbot.model';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-node-header',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './node-header.component.html',
})
export class NodeHeaderComponent {
  private translationService = inject(TranslationService);
  
  @Input() title!: string;
  @Input() icon!: string;
  @Input() color!: 'blue' | 'green' | 'yellow';
  @Input() node!: Node;
  @Input() isFirstNode: boolean = false;

  @Output() addNode = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() setAsFirst = new EventEmitter<boolean>();

  getIconClasses(): string {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center transition-all';
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500'
    };
    const firstNodeClass = this.isFirstNode ? 'ring-2 ring-green-300 ring-offset-1' : '';

    return `${baseClasses} ${colorClasses[this.color]} ${firstNodeClass}`;
  }

  onFirstNodeToggle(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const checkbox = event.target as HTMLInputElement;
    const newValue = checkbox.checked;
    this.setAsFirst.emit(newValue);
  }

  getFirstNodeTooltip(): string {
    if (this.isFirstNode) {
      return this.translationService.translate('chatbot.builder.shared.nodeHeader.firstNodeInfo');
    } else {
      const type = this.getNodeTypeName();
      return this.translationService.translate('chatbot.builder.shared.nodeHeader.firstNodeDescription', { type });
    }
  }

  getNodeTypeName(): string {
    const typeNames = {
      'message': 'message',
      'question': 'question',
      'interactive_buttons': 'interactive message'
    };
    return typeNames[this.node.type as keyof typeof typeNames] || 'content';
  }

  getStatusColor(): string {
    return this.isFirstNode ? 'text-green-600' : 'text-gray-500';
  }

  canBeFirstNode(): boolean {
    return ['message', 'question', 'interactive_buttons'].includes(this.node.type);
  }

  getFirstNodeHelpText(): string {
    const type = this.getNodeTypeName();
    return this.translationService.translate('chatbot.builder.shared.nodeHeader.firstNodeDescription', { type });
  }
}
