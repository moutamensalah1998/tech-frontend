// template-media.component.ts - UPDATED WITH GLOBAL VARIABLE REMOVAL
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MediaService } from '../../services/media.service';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { VariableService } from '../../services/variable.service';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-template-media',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './template-media.component.html'
})
export class TemplateMediaComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @ViewChild('headerInput', { static: false }) headerInput!: ElementRef<HTMLInputElement>;

  mediaOptions = ['None', 'Text', 'Image', 'Video', 'Document'];
  selectedMediaType = 'None';
  private destroy$ = new Subject<void>();
  private cursorPosition: number = 0;

  constructor(
    public mediaService: MediaService,
    private variableService: VariableService,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.selectedMediaType = this.form.get('broadcastTitle')?.value || 'None';

    // Register form control with variable service
    setTimeout(() => {
      this.variableService.registerFormControl('text', this.form.get('text'));
    }, 100);

    // Watch for changes in header text to detect manually typed variables
    this.form.get('text')?.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(500))
      .subscribe(value => {
        if (value && this.selectedMediaType === 'Text') {
          this.variableService.extractVariablesFromText(value, 'text');
        }
      });
    this.form.get('category')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(category => {
        if (category?.toUpperCase() === 'AUTHENTICATION') {
          this.form.get('broadcastTitle')?.reset();
          this.form.get('broadcastTitle')?.disable({ emitEvent: false });
        } else {
          this.form.get('body')?.enable({ emitEvent: false });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isAuthenticationTemplate(): boolean {
    return this.form.get('category')?.value?.toUpperCase() === 'AUTHENTICATION';
  }

  onMediaTypeChange(type: string): void {
    this.selectedMediaType = type;
    this.mediaService.clearMedia();
    this.form.patchValue({ text: '', image: '', video: '', document: '' });

    // Clear header variables when switching away from text
    if (type !== 'Text') {
      const headerVariables = this.variableService.getVariablesForField('text');
      headerVariables.forEach(variable => {
        this.variableService.removeVariableGlobally(variable);
      });
    }
  }

  updateCursorPosition(fieldType: 'text', event: Event): void {
    const target = event.target as HTMLInputElement;
    this.cursorPosition = target.selectionStart || 0;
  }

  insertVariableAtCursor(fieldType: 'text'): void {
    // Get the input element
    const input = this.headerInput?.nativeElement;
    if (!input) return;

    // Get current cursor position (use stored position or current selection)
    const cursorPos = input.selectionStart !== undefined ? input.selectionStart : this.cursorPosition;

    // Show a simple prompt to get variable name
    const variableName = this.promptForVariableName();
    if (!variableName) {
      // Return focus to input if user cancels
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(cursorPos, cursorPos);
      }, 10);
      return;
    }

    // Create the variable
    const placeholder = this.variableService.addVariable(fieldType, variableName);
    const control = this.form.get('text');
    const currentText = control?.value || '';

    // Insert variable at cursor position
    const beforeCursor = currentText.substring(0, cursorPos);
    const afterCursor = currentText.substring(cursorPos);
    const newText = beforeCursor + placeholder + afterCursor;

    // Update form control
    control?.setValue(newText);

    // Calculate new cursor position (after the inserted variable)
    const newCursorPos = cursorPos! + placeholder.length;
    this.cursorPosition = newCursorPos;

    // Focus back to input and set cursor position after the inserted variable
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  }

  private promptForVariableName(): string | null {
    const suggestedName = this.variableService.generateUniqueVariableName('text');

    const variableName = window.prompt(
      `Enter variable name for header (letters, numbers, and underscores only):`,
      suggestedName
    );

    if (!variableName) return null;

    const cleanName = variableName.trim().replace(/[^a-zA-Z0-9_]/g, '');

    if (!this.variableService.isValidVariableName(cleanName)) {
      alert('Invalid variable name. Use only letters, numbers, and underscores.');
      return this.promptForVariableName(); // Recursive call for retry
    }

    return cleanName;
  }

  onHeaderTextChange(event: Event): void {
    this.updateCursorPosition('text', event);
  }

  // Track cursor position on focus
  onInputFocus(event: Event): void {
    this.updateCursorPosition('text', event);
  }

  // Track cursor position on click
  onInputClick(event: Event): void {
    this.updateCursorPosition('text', event);
  }

  // Track cursor position on key navigation
  onInputKeyUp(event: Event): void {
    this.updateCursorPosition('text', event);
  }

  // UPDATED: Use global variable removal with confirmation
  removeVariableFromText(variable: any): void {
    // Show confirmation if variable is used in multiple places
    const variablesWithSameName = this.variableService.getVariablesByName(variable.name);

    if (variablesWithSameName.length > 1) {
      const fieldTypes = variablesWithSameName.map(v => {
        const translationKey = `broadcast.createTemplate.variables.fieldTypeLabel.${v.fieldType}`;
        return this.translationService.translate(translationKey) !== translationKey 
          ? this.translationService.translate(translationKey) 
          : v.fieldType;
      }).join(', ');

      const message = this.translationService.translate('broadcast.createTemplate.variables.removeVariableConfirm', {
        name: variable.name,
        fields: fieldTypes
      });
      const confirmed = confirm(message);

      if (!confirmed) {
        return;
      }
    }

    // Use global removal method
    this.variableService.removeVariableGlobally(variable);
  }

  getHeaderVariables() {
    return this.variableService.getVariablesForField('text');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      console.log('File selected:', { name: file.name, type: file.type, size: file.size });
      this.mediaService.selectFile(file, this.selectedMediaType);
    }
    // Reset input value so same file can be re-selected
    input.value = '';
  }

  removeFile(): void {
    this.mediaService.clearMedia();
  }

  isFileBasedMedia(type: string): boolean {
    return ['Image', 'Video', 'Document'].includes(type);
  }

  getSelectedFileName(): string {
    return this.mediaService.getSelectedFileName(this.selectedMediaType);
  }

  getFileSize(): string {
    return this.mediaService.getFileSize(this.selectedMediaType);
  }

  getAcceptedFileTypes(): string {
    const types: { [key: string]: string } = {
      'Image': 'image/*',
      'Video': 'video/*',
      'Document': '.pdf,.doc,.docx'
    };
    return types[this.selectedMediaType] || '';
  }

  getSupportedFormats(): string {
    const formats: { [key: string]: string } = {
      'Image': 'JPEG, PNG, GIF',
      'Video': 'MP4, 3GP',
      'Document': 'PDF, DOC, DOCX'
    };
    return formats[this.selectedMediaType] || '';
  }
}
