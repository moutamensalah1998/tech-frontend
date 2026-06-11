import { Injectable } from '@angular/core';
import { Subject, fromEvent, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: string;
  description: string;
  preventDefault?: boolean;
}

export interface ShortcutEvent {
  action: string;
  event: KeyboardEvent;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutsService {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private shortcutSubject = new Subject<ShortcutEvent>();
  private subscription?: Subscription;
  private isEnabled = true;

  shortcut$ = this.shortcutSubject.asObservable();

  constructor() {
    this.registerDefaultShortcuts();
  }

  private registerDefaultShortcuts(): void {
    // New node
    this.register({
      key: 'n',
      ctrlKey: true,
      action: 'new-node',
      description: 'Create new node',
      preventDefault: true
    });

    // Duplicate
    this.register({
      key: 'd',
      ctrlKey: true,
      action: 'duplicate',
      description: 'Duplicate selected node(s)',
      preventDefault: true
    });

    // Copy
    this.register({
      key: 'c',
      ctrlKey: true,
      action: 'copy',
      description: 'Copy selected node(s)',
      preventDefault: true
    });

    // Paste
    this.register({
      key: 'v',
      ctrlKey: true,
      action: 'paste',
      description: 'Paste node(s)',
      preventDefault: true
    });

    // Cut
    this.register({
      key: 'x',
      ctrlKey: true,
      action: 'cut',
      description: 'Cut selected node(s)',
      preventDefault: true
    });

    // Save
    this.register({
      key: 's',
      ctrlKey: true,
      action: 'save',
      description: 'Save flow',
      preventDefault: true
    });

    // Find/Search
    this.register({
      key: 'f',
      ctrlKey: true,
      action: 'find',
      description: 'Open search',
      preventDefault: true
    });

    // Select all
    this.register({
      key: 'a',
      ctrlKey: true,
      action: 'select-all',
      description: 'Select all nodes',
      preventDefault: true
    });

    // Undo
    this.register({
      key: 'z',
      ctrlKey: true,
      shiftKey: false,
      action: 'undo',
      description: 'Undo last action',
      preventDefault: true
    });

    // Redo
    this.register({
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      action: 'redo',
      description: 'Redo last action',
      preventDefault: true
    });

    // Redo (alternative)
    this.register({
      key: 'y',
      ctrlKey: true,
      action: 'redo',
      description: 'Redo last action',
      preventDefault: true
    });

    // Delete
    this.register({
      key: 'Delete',
      action: 'delete',
      description: 'Delete selected node(s)',
      preventDefault: true
    });

    // Escape
    this.register({
      key: 'Escape',
      action: 'escape',
      description: 'Deselect all / Close dialogs',
      preventDefault: true
    });

    // Help
    this.register({
      key: '?',
      action: 'help',
      description: 'Show keyboard shortcuts help',
      preventDefault: true
    });

    // Arrow keys for moving nodes
    this.register({
      key: 'ArrowUp',
      action: 'move-up',
      description: 'Move selected node up',
      preventDefault: true
    });

    this.register({
      key: 'ArrowDown',
      action: 'move-down',
      description: 'Move selected node down',
      preventDefault: true
    });

    this.register({
      key: 'ArrowLeft',
      action: 'move-left',
      description: 'Move selected node left',
      preventDefault: true
    });

    this.register({
      key: 'ArrowRight',
      action: 'move-right',
      description: 'Move selected node right',
      preventDefault: true
    });
  }

  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  unregister(action: string): void {
    const entries = Array.from(this.shortcuts.entries());
    for (const [key, shortcut] of entries) {
      if (shortcut.action === action) {
        this.shortcuts.delete(key);
        break;
      }
    }
  }

  enable(): void {
    this.isEnabled = true;
    this.setupListeners();
  }

  disable(): void {
    this.isEnabled = false;
    this.cleanup();
  }

  setupListeners(): void {
    if (this.subscription) {
      return;
    }

    this.subscription = fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(() => this.isEnabled),
        filter(event => !this.isInputElement(event.target as HTMLElement))
      )
      .subscribe(event => {
        const shortcut = this.matchShortcut(event);
        if (shortcut) {
          if (shortcut.preventDefault) {
            event.preventDefault();
            event.stopPropagation();
          }
          this.shortcutSubject.next({
            action: shortcut.action,
            event
          });
        }
      });
  }

  cleanup(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  }

  private matchShortcut(event: KeyboardEvent): KeyboardShortcut | null {
    const key = event.key;
    const ctrlKey = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd
    const shiftKey = event.shiftKey;
    const altKey = event.altKey;

    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.key !== key) continue;
      if (shortcut.ctrlKey !== undefined && shortcut.ctrlKey !== ctrlKey) continue;
      if (shortcut.shiftKey !== undefined && shortcut.shiftKey !== shiftKey) continue;
      if (shortcut.altKey !== undefined && shortcut.altKey !== altKey) continue;
      if (shortcut.metaKey !== undefined && shortcut.metaKey !== event.metaKey) continue;

      return shortcut;
    }

    return null;
  }

  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrlKey) parts.push('ctrl');
    if (shortcut.shiftKey) parts.push('shift');
    if (shortcut.altKey) parts.push('alt');
    if (shortcut.metaKey) parts.push('meta');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  private isInputElement(element: HTMLElement): boolean {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
    const isContentEditable = element.contentEditable === 'true';
    const isInForm = element.closest('form') !== null && 
                     (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA');
    
    return isInput || isContentEditable || isInForm;
  }

  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutByAction(action: string): KeyboardShortcut | null {
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.action === action) {
        return shortcut;
      }
    }
    return null;
  }

  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.metaKey) parts.push('Cmd');
    parts.push(shortcut.key);
    return parts.join(' + ');
  }
}

