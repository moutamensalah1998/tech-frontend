import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeyboardShortcutsService, KeyboardShortcut } from '../../services/keyboard-shortcuts.service';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-shortcuts-help',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './shortcuts-help.component.html',
  styleUrls: ['./shortcuts-help.component.css']
})
export class ShortcutsHelpComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  shortcuts: KeyboardShortcut[] = [];

  constructor(private shortcutsService: KeyboardShortcutsService) {
    this.shortcuts = this.shortcutsService.getAllShortcuts();
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('backdrop')) {
      this.onClose();
    }
  }

  formatShortcut(shortcut: KeyboardShortcut): string {
    return this.shortcutsService.formatShortcut(shortcut);
  }

  getShortcutsByCategory(): { category: string; shortcuts: KeyboardShortcut[] }[] {
    const categories: { [key: string]: KeyboardShortcut[] } = {
      'Node Operations': [],
      'Selection': [],
      'Edit': [],
      'Navigation': [],
      'Other': []
    };

    this.shortcuts.forEach(shortcut => {
      if (['new-node', 'duplicate', 'delete'].includes(shortcut.action)) {
        categories['Node Operations'].push(shortcut);
      } else if (['select-all', 'escape'].includes(shortcut.action)) {
        categories['Selection'].push(shortcut);
      } else if (['copy', 'paste', 'cut', 'undo', 'redo', 'save'].includes(shortcut.action)) {
        categories['Edit'].push(shortcut);
      } else if (['move-up', 'move-down', 'move-left', 'move-right', 'find'].includes(shortcut.action)) {
        categories['Navigation'].push(shortcut);
      } else {
        categories['Other'].push(shortcut);
      }
    });

    return Object.entries(categories)
      .filter(([_, shortcuts]) => shortcuts.length > 0)
      .map(([category, shortcuts]) => ({ category, shortcuts }));
  }
}

