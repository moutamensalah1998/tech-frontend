// sidebar.component.ts - Updated with loading state
import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { createChatbotMetaData } from '../../../../../../core/services/chatbot/ngrx/chatbot.actions';
import { FormsModule } from '@angular/forms';
import { NodeManagementService } from '../../services/node-management.service';
import { LocalAutoSaveService } from '../../services/local-auto-save.service';
import { selectChatbotLoading, selectChatbotError } from '../../../../../../core/services/chatbot/ngrx/chatbot.selectors';
import { Subject, takeUntil } from 'rxjs';
import { Actions, ofType } from '@ngrx/effects';
import { updateChatbotFlowNodesSuccess, updateChatbotFlowNodesError } from '../../../../../../core/services/chatbot/ngrx/chatbot.actions';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() chatBotName!: string;
  @Input() chatBotVersion: number = 1;
  @Input() chatBotLanguage: string = 'en';
  @Input() chatbotId!: string;

  private destroy$ = new Subject<void>();

  isSubmitting = false;
  submitError: string | null = null;
  autoSaveState = {
    isAutoSaving: false,
    lastAutoSaved: null as Date | null,
    hasUnsavedChanges: false,
    autoSaveEnabled: true
  };

  constructor(
    private store: Store,
    private nodesService: NodeManagementService,
    private autoSaveService: LocalAutoSaveService,
    private actions$: Actions,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService
  ) { }

  ngOnInit(): void {
    // Subscribe to loading state
    this.store.select(selectChatbotLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isSubmitting = loading;
        this.cdr.markForCheck();
      });

    // Subscribe to success/error actions to handle loading completion
    this.actions$.pipe(
      ofType(updateChatbotFlowNodesSuccess, updateChatbotFlowNodesError),
      takeUntil(this.destroy$)
    ).subscribe((action) => {
      this.isSubmitting = false;

      if (action.type === updateChatbotFlowNodesError.type) {
        const errorMessage = action.error?.message || 'Unable to save flow';
        // Format error message to be more user-friendly
        this.submitError = this.formatErrorMessage(errorMessage);
        // Clear error after 5 seconds
        setTimeout(() => {
          this.submitError = null;
          this.cdr.markForCheck();
        }, 5000);
      } else {
        this.submitError = null;
        // Clear auto-save on successful save
        this.autoSaveService.clearAutoSave(this.chatbotId);
      }

      this.cdr.markForCheck();
    });

    // Subscribe to auto-save state
    this.autoSaveService.autoSaveState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.autoSaveState = state;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async saveFlow(): Promise<void> {
    if (this.isSubmitting) {
      return; // Prevent multiple submissions
    }

    try {
      this.submitError = null;
      this.isSubmitting = true;
      this.cdr.markForCheck();

      await this.nodesService.submitFlowNodes(this.chatbotId, {
        validateFirst: true,
        showProgress: false, // We're handling our own loading state
        dryRun: false
      });

    } catch (error) {
      this.isSubmitting = false;
      const errorMessage = error instanceof Error ? error.message : 'Unable to save flow';
      this.submitError = this.formatErrorMessage(errorMessage);
      this.cdr.markForCheck();

      // Clear error after 5 seconds
      setTimeout(() => {
        this.submitError = null;
        this.cdr.markForCheck();
      }, 5000);
    }
  }

  get saveButtonText(): string {
    if (this.isSubmitting) {
      return this.translationService.translate('chatbot.builder.sidebar.savingFlow');
    }
    return this.translationService.translate('chatbot.builder.sidebar.saveFlow');
  }

  get saveButtonDisabled(): boolean {
    return this.isSubmitting;
  }

  get autoSaveStatusText(): string {
    if (this.autoSaveState.isAutoSaving) {
      return 'Auto-saving...';
    }
    if (this.autoSaveState.lastAutoSaved) {
      const minutesAgo = Math.floor((Date.now() - this.autoSaveState.lastAutoSaved.getTime()) / 60000);
      if (minutesAgo < 1) {
        return 'Auto-saved just now';
      }
      return `Auto-saved ${minutesAgo} min ago`;
    }
    if (this.autoSaveState.hasUnsavedChanges) {
      return 'Unsaved changes';
    }
    return 'All changes saved';
  }

  get autoSaveStatusClass(): string {
    return 'text-white';
  }

  private formatErrorMessage(error: string): string {
    // Format common error messages to be more user-friendly
    const errorMap: Record<string, string> = {
      'First node validation failed': 'Please fix errors in your starting node',
      'Validation failed': 'Please fix the errors in your flow',
      'Failed to save flow': 'Unable to save. Please check your connection and try again',
      'No nodes to submit': 'Please add at least one node to save'
    };

    // Check for partial matches
    if (error.includes('validation')) {
      return 'Please fix the errors in your flow before saving';
    }
    if (error.includes('network') || error.includes('fetch')) {
      return 'Connection error. Please check your internet and try again';
    }
    if (error.includes('timeout')) {
      return 'Request timed out. Please try again';
    }

    return errorMap[error] || error;
  }
}
