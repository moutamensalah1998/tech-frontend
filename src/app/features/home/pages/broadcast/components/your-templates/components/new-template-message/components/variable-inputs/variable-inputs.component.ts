// variable-inputs.component.ts - UPDATED with debugging and improved validation
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VariableService, Variable } from '../../services/variable.service';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-variable-inputs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './variable-inputs.component.html'
})
export class VariableInputsComponent implements OnInit, OnDestroy {
  variables: Variable[] = [];
  variableForm: FormGroup = new FormGroup({});
  @Input() form!: FormGroup;
  private destroy$ = new Subject<void>();
  private nameChangeTimeout: any;
  showDebugInfo = false;

  constructor(
    private variableService: VariableService,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    // Subscribe to variables first
    this.variableService.variables$
      .pipe(takeUntil(this.destroy$))
      .subscribe(variables => {
        this.variables = variables;
      });

    // Subscribe to variable form with error handling
    this.variableService.variableForm$
      .pipe(takeUntil(this.destroy$))
      .subscribe(form => {
        this.variableForm = form;

        // CRITICAL FIX: Add setTimeout to handle timing issues
        setTimeout(() => {
          this.validateFormControlsExist();
        }, 100);
      });
  }

  // CRITICAL FIX: Method to ensure form controls exist for all variables
  private validateFormControlsExist(): void {
    this.variables.forEach(variable => {
      if (!this.variableForm.contains(variable.id)) {
        console.warn(`Form control missing for variable: ${variable.id}, requesting update...`);
        // Request an update to the variable controls
        setTimeout(() => {
          this.variableService.updateVariableControls();
        }, 50);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.nameChangeTimeout) {
      clearTimeout(this.nameChangeTimeout);
    }
  }

  // Helper methods for validation display
  allVariablesHaveValues(): boolean {
    return this.variables.every(v => v.value && v.value.trim() !== '');
  }

  getEmptyVariableNames(): string[] {
    return this.variables
      .filter(v => !v.value || v.value.trim() === '')
      .map(v => v.name);
  }

  isVariableEmpty(variable: Variable): boolean {
    return !variable.value || variable.value.trim() === '';
  }

  // CRITICAL FIX: Methods to handle form control existence
  hasAnyFormControls(): boolean {
    return Object.keys(this.variableForm.controls).length > 0;
  }

  getFormControlCount(): number {
    return Object.keys(this.variableForm.controls).length;
  }

  // Method to handle direct variable value changes when form control is missing
  onDirectVariableValueChange(variable: Variable, event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;

    // Update the variable value directly
    variable.value = newValue;

    // Try to update through the service (which will handle form control creation)
    this.variableService.updateVariableValue(variable.id, newValue);
  }

  // Method to force update of form controls
  forceUpdateControls(): void {
    this.variableService.updateVariableControls();
  }

  // Method to sync form controls with variable values
  syncFormControls(): void {
    this.variableService.syncFormControlsWithVariables();
  }


  // Method to fix all variable issues
  fixAllIssues(): void {
    this.variableService.fixAllVariableIssues();
  }

  hasFormControl(variableId: string): boolean {
    try {
      return this.variableForm.contains(variableId);
    } catch (error) {
      console.warn(`Error checking form control ${variableId}:`, error);
      return false;
    }
  }

  getFormControlStatus(variableId: string): any {
    try {
      const control = this.variableForm.get(variableId);
      return control ? {
        valid: control.valid,
        value: control.value,
        errors: control.errors
      } : { valid: false, value: null, errors: null };
    } catch (error) {
      console.warn(`Error getting form control status for ${variableId}:`, error);
      return { valid: false, value: null, errors: { missing: true } };
    }
  }

  getFieldTypes(): string[] {
    const types = [...new Set(this.variables.map(v => v.fieldType))];
    // Sort in a logical order
    const order = ['text', 'body'];
    return types.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }

  getVariablesForFieldType(fieldType: string): Variable[] {
    return this.variables.filter(v => v.fieldType === fieldType);
  }

  onVariableValueChange(variable: Variable, event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;


    // CRITICAL FIX: Check if form control exists before updating
    if (!this.variableForm.contains(variable.id)) {
      console.warn(`Form control ${variable.id} not found, creating it...`);
      // Force update of variable controls
      this.variableService.updateVariableControls();

      // Try again after a short delay
      setTimeout(() => {
        this.variableService.updateVariableValue(variable.id, newValue);
      }, 100);
    } else {
      // Update the variable value which will update all instances globally
      this.variableService.updateVariableValue(variable.id, newValue);
    }
  }

  onVariableNameChange(variable: Variable, event: Event): void {
    const target = event.target as HTMLInputElement;
    const newName = target.value;

    // Clear any existing timeout
    if (this.nameChangeTimeout) {
      clearTimeout(this.nameChangeTimeout);
    }

    // Debounce the name change to avoid too many updates
    this.nameChangeTimeout = setTimeout(() => {
      if (this.isValidName(newName) && newName !== variable.name) {
        // This will now update all variables with the same name globally
        this.variableService.updateVariableName(variable.id, newName);
      }
    }, 500);
  }

  validateVariableName(variable: Variable, event: Event): void {
    const target = event.target as HTMLInputElement;
    const newName = target.value;

    if (!this.isValidName(newName)) {
      // Revert to the original name
      target.value = variable.name;
    }
  }

  removeVariable(variable: Variable): void {
    // Show confirmation dialog if variable is used in multiple places
    const variablesWithSameName = this.variableService.getVariablesByName(variable.name);

    if (variablesWithSameName.length > 1) {
      const fieldTypes = variablesWithSameName.map(v => this.getFieldTypeLabel(v.fieldType)).join(', ');
      const message = this.translationService.translate('broadcast.createTemplate.variables.removeVariableConfirm', {
        name: variable.name,
        fields: fieldTypes
      });
      const confirmed = confirm(message);

      if (!confirmed) {
        return;
      }
    }

    // Use global removal to remove from all text fields and variable list
    this.variableService.removeVariableGlobally(variable);
  }

  getFieldTypeLabel(fieldType: string): string {
    const translationKey = `broadcast.createTemplate.variables.fieldTypeLabel.${fieldType}`;
    const translated = this.translationService.translate(translationKey);
    // Fallback to fieldType if translation not found
    return translated !== translationKey ? translated : fieldType;
  }

  isValidName(name: string): boolean {
    return this.variableService.isValidVariableName(name);
  }

  trackByVariable(index: number, variable: Variable): string {
    return variable.id;
  }

  // Helper method to get variable display info
  getVariableDisplayInfo(variable: Variable): string {
    const sameNameVariables = this.variableService.getVariablesByName(variable.name);
    if (sameNameVariables.length > 1) {
      const otherFields = sameNameVariables
        .filter(v => v.fieldType !== variable.fieldType)
        .map(v => this.getFieldTypeLabel(v.fieldType))
        .join(', ');
      const alsoUsedIn = this.translationService.translate('broadcast.createTemplate.variables.alsoUsedIn');
      return `${alsoUsedIn} ${otherFields}`;
    }
    return '';
  }

  // Helper method to check if variable is used in multiple fields
  isVariableUsedInMultipleFields(variable: Variable): boolean {
    return this.variableService.getVariablesByName(variable.name).length > 1;
  }

  get isAuthenticationTemplate(): boolean {
    return this.form.get('category')?.value?.toUpperCase() === 'AUTHENTICATION';
  }
}
