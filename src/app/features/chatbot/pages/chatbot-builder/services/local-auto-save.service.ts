import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NodeManagementService } from './node-management.service';
import { Node } from '../../../../../core/models/chatbot.model';

export interface AutoSaveState {
  isAutoSaving: boolean;
  lastAutoSaved: Date | null;
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LocalAutoSaveService {
  private readonly STORAGE_KEY_PREFIX = 'chatbot_flow_autosave_';
  private readonly AUTO_SAVE_INTERVAL = 30000; // 30 seconds
  private autoSaveStateSubject = new BehaviorSubject<AutoSaveState>({
    isAutoSaving: false,
    lastAutoSaved: null,
    hasUnsavedChanges: false,
    autoSaveEnabled: true
  });
  private autoSaveInterval?: number;
  private chatbotId: string | null = null;

  autoSaveState$: Observable<AutoSaveState> = this.autoSaveStateSubject.asObservable();

  constructor(private nodeService: NodeManagementService) {
    this.setupAutoSave();
  }

  private setupAutoSave(): void {
    // Watch for changes in nodes
    this.nodeService.isModified$
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      )
      .subscribe(hasChanges => {
        const currentState = this.autoSaveStateSubject.value;
        this.autoSaveStateSubject.next({
          ...currentState,
          hasUnsavedChanges: hasChanges
        });

        if (hasChanges && this.autoSaveStateSubject.value.autoSaveEnabled) {
          this.scheduleAutoSave();
        }
      });
  }

  enableAutoSave(chatbotId: string): void {
    this.chatbotId = chatbotId;
    const currentState = this.autoSaveStateSubject.value;
    this.autoSaveStateSubject.next({
      ...currentState,
      autoSaveEnabled: true
    });
    this.scheduleAutoSave();
  }

  disableAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = undefined;
    }
    const currentState = this.autoSaveStateSubject.value;
    this.autoSaveStateSubject.next({
      ...currentState,
      autoSaveEnabled: false
    });
  }

  private scheduleAutoSave(): void {
    if (this.autoSaveInterval) {
      return; // Already scheduled
    }

    this.autoSaveInterval = window.setTimeout(() => {
      this.performAutoSave();
      this.autoSaveInterval = undefined;
    }, this.AUTO_SAVE_INTERVAL);
  }

  private performAutoSave(): void {
    if (!this.chatbotId || !this.nodeService.isModified) {
      return;
    }

    const nodes = this.nodeService.nodes;
    if (nodes.length === 0) {
      return;
    }

    try {
      this.autoSaveStateSubject.next({
        ...this.autoSaveStateSubject.value,
        isAutoSaving: true
      });

      const autoSaveData = {
        chatbotId: this.chatbotId,
        nodes: nodes.map(node => this.serializeNode(node)),
        timestamp: new Date().toISOString(),
        version: 1
      };

      const storageKey = `${this.STORAGE_KEY_PREFIX}${this.chatbotId}`;
      localStorage.setItem(storageKey, JSON.stringify(autoSaveData));

      this.autoSaveStateSubject.next({
        isAutoSaving: false,
        lastAutoSaved: new Date(),
        hasUnsavedChanges: true,
        autoSaveEnabled: true
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      this.autoSaveStateSubject.next({
        ...this.autoSaveStateSubject.value,
        isAutoSaving: false
      });
    }
  }

  getAutoSavedData(chatbotId: string): any | null {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${chatbotId}`;
      const data = localStorage.getItem(storageKey);
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);
      // Check if data is not too old (e.g., older than 7 days)
      const savedDate = new Date(parsed.timestamp);
      const daysSinceSave = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceSave > 7) {
        // Auto-save data is too old, remove it
        this.clearAutoSave(chatbotId);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to retrieve auto-saved data:', error);
      return null;
    }
  }

  clearAutoSave(chatbotId: string): void {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${chatbotId}`;
      localStorage.removeItem(storageKey);
      
      this.autoSaveStateSubject.next({
        isAutoSaving: false,
        lastAutoSaved: null,
        hasUnsavedChanges: false,
        autoSaveEnabled: this.autoSaveStateSubject.value.autoSaveEnabled
      });
    } catch (error) {
      console.error('Failed to clear auto-save:', error);
    }
  }

  hasAutoSavedData(chatbotId: string): boolean {
    const storageKey = `${this.STORAGE_KEY_PREFIX}${chatbotId}`;
    return localStorage.getItem(storageKey) !== null;
  }

  private serializeNode(node: Node): any {
    // Serialize node for storage (simplified version)
    return {
      id: node.id,
      type: node.type,
      title: node.title,
      body: node.body,
      position: node.position,
      is_first: node.is_first,
      is_final: node.is_final,
      next_nodes: node.next_nodes,
      buttonConnections: node.buttonConnections
    };
  }

  getCurrentState(): AutoSaveState {
    return this.autoSaveStateSubject.value;
  }
}

