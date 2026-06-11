import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { VariableService } from '../../services/variable.service';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-template-content',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './template-content.component.html',
})
export class TemplateContentComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @ViewChild('bodyTextarea', { static: false })
  bodyTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('footerTextarea', { static: false })
  footerTextarea!: ElementRef<HTMLTextAreaElement>;

  private destroy$ = new Subject<void>();
  private cursorPositions: { [key: string]: number } = {};

  constructor(
    protected variableService: VariableService,
    private translationService: TranslationService
  ) {}

ngOnInit(): void {
  setTimeout(() => {
    this.variableService.registerFormControl('body', this.form.get('body'));
    this.variableService.registerFormControl('footer', this.form.get('footer'));
  }, 100);

  this.form.get('body')?.valueChanges
    .pipe(takeUntil(this.destroy$), debounceTime(500))
    .subscribe(value => {
      if (value) {
        this.variableService.extractVariablesFromText(value, 'body');
      }
    });

  this.form.get('category')?.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(category => {
      if (category?.toUpperCase() === 'AUTHENTICATION') {
        this.form.get('body')?.reset('{{code}} is your verification code. For your security, do not share this code.');
        this.form.get('body')?.disable({ emitEvent: false });
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

  get isBodyReadOnly(): boolean {
    return this.isAuthenticationTemplate;
  }

  hasMultiSectionVariables(): boolean {
    return this.getVariablesForCurrentFields().some(
      (v) => this.variableService.getVariablesByName(v.name).length > 1
    );
  }

  updateCursorPosition(fieldType: 'body' | 'footer', event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.cursorPositions[fieldType] = target.selectionStart || 0;
  }

  insertVariableAtCursor(fieldType: 'body'): void {
    // Get the textarea element
    const textarea =
      fieldType === 'body'
        ? this.bodyTextarea?.nativeElement
        : this.footerTextarea?.nativeElement;
    if (!textarea) return;

    // Get current cursor position (use stored position or current selection)
    const cursorPos =
      textarea.selectionStart !== undefined
        ? textarea.selectionStart
        : this.cursorPositions[fieldType] || 0;

    // Show a simple prompt to get variable name
    const variableName = this.promptForVariableName(fieldType);
    if (!variableName) {
      // Return focus to textarea if user cancels
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPos, cursorPos);
      }, 10);
      return;
    }

    // Create the variable
    const placeholder = this.variableService.addVariable(
      fieldType,
      variableName
    );
    const control = this.form.get(fieldType);
    const currentText = control?.value || '';

    // Insert variable at cursor position
    const beforeCursor = currentText.substring(0, cursorPos);
    const afterCursor = currentText.substring(cursorPos);
    const newText = beforeCursor + placeholder + afterCursor;

    // Update form control
    control?.setValue(newText);

    // Calculate new cursor position (after the inserted variable)
    const newCursorPos = cursorPos + placeholder.length;
    this.cursorPositions[fieldType] = newCursorPos;

    // Focus back to textarea and set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  }

  private promptForVariableName(fieldType: 'body' ): string | null {
    const suggestedName =
      this.variableService.generateUniqueVariableName(fieldType);

    const variableName = window.prompt(
      `Enter variable name (letters, numbers, and underscores only):`,
      suggestedName
    );

    if (!variableName) return null;

    const cleanName = variableName.trim().replace(/[^a-zA-Z0-9_]/g, '');

    if (!this.variableService.isValidVariableName(cleanName)) {
      alert(
        'Invalid variable name. Use only letters, numbers, and underscores.'
      );
      return this.promptForVariableName(fieldType); // Recursive call for retry
    }

    return cleanName;
  }

  onBodyTextChange(event: Event): void {
    this.updateCursorPosition('body', event);
  }

  onFooterTextChange(event: Event): void {
    this.updateCursorPosition('footer', event);
  }

  // Track cursor position on focus
  onTextareaFocus(fieldType: 'body' | 'footer', event: Event): void {
    this.updateCursorPosition(fieldType, event);
  }

  // Track cursor position on click
  onTextareaClick(fieldType: 'body' | 'footer', event: Event): void {
    this.updateCursorPosition(fieldType, event);
  }

  // Track cursor position on key navigation
  onTextareaKeyUp(fieldType: 'body' | 'footer', event: Event): void {
    this.updateCursorPosition(fieldType, event);
  }

  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (field?.invalid && field?.touched) {
      if (field.errors?.['required']) {
        return this.translationService.translate('broadcast.createTemplate.content.bodyRequiredError');
      }
      return this.translationService.translate('broadcast.createTemplate.basicInfo.fieldInvalid');
    }
    return null;
  }

  getVariablesForCurrentFields() {
    return this.variableService.variables.filter(
      (v) => v.fieldType === 'body'
    );
  }

  // UPDATED: Use global variable removal
  removeVariableFromText(variable: any): void {
    // Show confirmation if variable is used in multiple places
    const variablesWithSameName = this.variableService.getVariablesByName(
      variable.name
    );

    if (variablesWithSameName.length > 1) {
      const fieldTypes = variablesWithSameName
        .map((v) => {
          const translationKey = `broadcast.createTemplate.variables.fieldTypeLabel.${v.fieldType}`;
          return this.translationService.translate(translationKey) !== translationKey 
            ? this.translationService.translate(translationKey) 
            : v.fieldType;
        })
        .join(', ');

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
}
