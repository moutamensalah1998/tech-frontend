import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { ToastService } from '../../../../../../../../../core/services/toast-message.service';

export interface Variable {
  id: string;
  placeholder: string;
  name: string;
  value: string;
  fieldType: 'body' | 'footer' | 'text';
}

@Injectable({
  providedIn: 'root'
})
export class VariableService {
  private variablesSubject = new BehaviorSubject<Variable[]>([]);
  private variableFormSubject = new BehaviorSubject<FormGroup>(this.fb.group({}));
  private formControls: { [fieldType: string]: any } = {};

  public variables$ = this.variablesSubject.asObservable();
  public variableForm$ = this.variableFormSubject.asObservable();

  constructor(private fb: FormBuilder, private toast: ToastService) { }

  get variables(): Variable[] {
    return this.variablesSubject.value;
  }

  get variableForm(): FormGroup {
    return this.variableFormSubject.value;
  }

  registerFormControl(fieldType: 'body' | 'footer' | 'text', control: any): void {
    this.formControls[fieldType] = control;
  }

  addVariable(fieldType: 'body' | 'text', customName?: string): string {
    const currentVariables = this.variables;
    const fieldVariables = currentVariables.filter(v => v.fieldType === fieldType);
    const defaultName = customName || this.generateUniqueVariableName(fieldType);
    const placeholder = `{{${defaultName}}}`;
    const existingVariable = fieldVariables.find(v => v.name === defaultName);
    if (existingVariable) {
      this.toast.showToast('Variable already exists for this field', 'error');
      return existingVariable.placeholder; // Return existing placeholder
    }
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const cleanId = `${fieldType}_${defaultName}_${timestamp}_${randomSuffix}`;
    const newVariable: Variable = {
      id: cleanId,
      placeholder,
      name: defaultName,
      value: '',
      fieldType
    };
    const updatedVariables = [...currentVariables, newVariable];
    this.variablesSubject.next(updatedVariables);
    setTimeout(() => {
      this.updateVariableControlsInternal();
    }, 0);

    return placeholder;
  }

  removeVariableGlobally(variableToRemove: Variable): void {
    const currentVariables = this.variables;
    const updatedVariables = currentVariables.filter(v => v.id !== variableToRemove.id);
    this.variablesSubject.next(updatedVariables);
    this.removeVariableControl(variableToRemove.id);
    this.removeVariableFromAllTexts(variableToRemove.placeholder);
    // Positional variables must stay sequential: {{1}}, {{2}}, ...
    this.renumberPositionalVariables();
  }

  /**
   * Re-number positional variables ({{1}}, {{2}}, ...) so they remain
   * sequential after a deletion. Meta requires positional variables to start
   * at 1 with no gaps.
   */
  private renumberPositionalVariables(): void {
    (['body', 'text'] as const).forEach((fieldType) => {
      const fieldVars = this.variables
        .filter(v => v.fieldType === fieldType && /^\d+$/.test(v.name))
        .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10));

      if (!fieldVars.length) return;

      const renames = fieldVars
        .map((v, idx) => ({ variable: v, newName: String(idx + 1) }))
        .filter(r => r.variable.name !== r.newName);

      if (!renames.length) return;

      const renameMap = new Map(renames.map(r => [r.variable.name, r.newName]));

      const updated = this.variables.map(v => {
        if (v.fieldType === fieldType && renameMap.has(v.name)) {
          const newName = renameMap.get(v.name)!;
          return { ...v, name: newName, placeholder: `{{${newName}}}` };
        }
        return v;
      });
      this.variablesSubject.next(updated);

      renames.forEach(r => {
        this.replacePlaceholderInText(r.variable.placeholder, `{{${r.newName}}}`);
      });

      setTimeout(() => this.updateVariableControlsInternal(), 0);
    });
  }

  private replacePlaceholderInText(oldPlaceholder: string, newPlaceholder: string): void {
    Object.keys(this.formControls).forEach(fieldType => {
      const control = this.formControls[fieldType];
      if (control && control.value) {
        const updatedText = control.value.replace(
          new RegExp(this.escapeRegExp(oldPlaceholder), 'g'),
          newPlaceholder
        );
        if (updatedText !== control.value) {
          control.setValue(updatedText, { emitEvent: false });
        }
      }
    });
  }

  private removeVariableFromAllTexts(placeholder: string): void {
    Object.keys(this.formControls).forEach(fieldType => {
      const formControl = this.formControls[fieldType];
      if (formControl && formControl.value) {
        const currentText = formControl.value;
        const updatedText = currentText.replace(
          new RegExp(`\\s*${this.escapeRegExp(placeholder)}\\s*`, 'g'),
          ' '
        ).replace(/\s+/g, ' ').trim(); // Clean up extra spaces

        formControl.setValue(updatedText, { emitEvent: false });
      }
    });
  }

  removeVariable(fieldType: 'body' | 'text', placeholder: string): void {
    const variableToRemove = this.variables.find(v => v.placeholder === placeholder);
    if (variableToRemove) {
      this.removeVariableGlobally(variableToRemove);
    }
  }

  extractVariablesFromText(text: string, fieldType: 'body' | 'text'): void {
    const currentVariables = this.variables.filter(v => v.fieldType !== fieldType);
    const variableMatches = text.match(/\{\{[^}]+\}\}/g) || [];
    const newVariables: Variable[] = [];
    variableMatches.forEach((match) => {
      const name = match.replace(/[{}]/g, '');

      if (newVariables.find(v => v.name === name)) {
        this.toast.showToast('Variable already exists for this field', 'error');
        return;
      }

      if (!name.trim()) {
        return;
      }

      const existingVariable = this.variables.find(v => v.name === name);
      if (existingVariable) {
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000);
        const cleanId = `${fieldType}_${name}_${timestamp}_${randomSuffix}`;
        const newVariable: Variable = {
          id: cleanId,
          placeholder: match,
          name: name,
          value: existingVariable.value, // Use existing value
          fieldType
        };
        newVariables.push(newVariable);
      } else {
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000);
        const cleanId = `${fieldType}_${name}_${timestamp}_${randomSuffix}`;
        const newVariable: Variable = {
          id: cleanId,
          placeholder: match,
          name: name,
          value: '',
          fieldType
        };
        newVariables.push(newVariable);
      }
    });
    const updatedVariables = [...currentVariables, ...newVariables];
    this.variablesSubject.next(updatedVariables);
    setTimeout(() => {
      this.updateVariableControlsInternal();
    }, 0);
  }

  updateVariableName(variableId: string, newName: string): void {
    const currentVariables = this.variables;
    const variable = currentVariables.find(v => v.id === variableId);
    if (!variable) return;
    const cleanName = newName.replace(/[^a-zA-Z0-9_]/g, '');
    if (cleanName === variable.name || !cleanName) return;
    const existingVariable = currentVariables.find(
      v => v.name === cleanName && v.id !== variableId
    );
    if (existingVariable) {
      this.toast.showToast('Variable name already exists', 'error');
      return;
    }
    const oldPlaceholder = variable.placeholder;
    const newPlaceholder = `{{${cleanName}}}`;
    const updatedVariables = currentVariables.map(v =>
      v.name === variable.name
        ? { ...v, name: cleanName, placeholder: newPlaceholder }
        : v
    );
    this.variablesSubject.next(updatedVariables);
    Object.keys(this.formControls).forEach(fieldType => {
      const formControl = this.formControls[fieldType];
      if (formControl && formControl.value) {
        const currentText = formControl.value;
        const updatedText = currentText.replace(
          new RegExp(this.escapeRegExp(oldPlaceholder), 'g'),
          newPlaceholder
        );
        if (updatedText !== currentText) {
          formControl.setValue(updatedText);
        }
      }
    });
    setTimeout(() => {
      this.updateVariableControlsInternal();
    }, 0);
  }

  getVariablesForField(fieldType: 'body' | 'text'): Variable[] {
    return this.variables.filter(v => v.fieldType === fieldType);
  }

  updateVariableValue(variableId: string, value: string): void {
    const currentVariables = this.variables;
    const variable = currentVariables.find(v => v.id === variableId);

    if (!variable) {
      this.toast.showToast(`Variable with ID ${variableId} not found`, 'error');
      return;
    }

    const updatedVariables = currentVariables.map(v =>
      v.name === variable.name ? { ...v, value } : v
    );

    this.variablesSubject.next(updatedVariables);

    const form = this.variableForm;
    const formControl = form.get(variableId);

    if (formControl) {
      if (formControl.value !== value) {
        formControl.setValue(value, { emitEvent: false });
        formControl.markAsTouched();
        formControl.updateValueAndValidity();

      }
    } else {
      this.toast.showToast(`Form control ${variableId} not found, will be created on next update`, 'info');
      setTimeout(() => {
        this.updateVariableControlsInternal();
      }, 100);
    }
  }

  getVariableValues(): { [placeholder: string]: string } {
    const values: { [placeholder: string]: string } = {};
    this.variables.forEach(variable => {
      values[variable.placeholder] = variable.value;
    });
    return values;
  }

  clearAllVariables(): void {
    this.variablesSubject.next([]);
    this.variableFormSubject.next(this.fb.group({}));
    this.formControls = {};
  }

  prefillVariables(variables: Variable[]): void {
    this.variablesSubject.next(variables);
    setTimeout(() => {
      this.updateVariableControlsInternal();
    }, 0);
  }

  private addVariableControl(variable: Variable): void {
    const currentForm = this.variableForm;

    if (!currentForm.contains(variable.id)) {
      currentForm.addControl(
        variable.id,
        this.fb.control(variable.value, [Validators.required])
      );
      this.variableFormSubject.next(currentForm);
    }
  }

  private removeVariableControl(variableId: string): void {
    const currentForm = this.variableForm;
    if (currentForm.contains(variableId)) {
      currentForm.removeControl(variableId);
    }
    this.variableFormSubject.next(currentForm);
  }

  private getUniqueVariablesByName(): Variable[] {
    const uniqueMap = new Map<string, Variable>();
    this.variables.forEach(variable => {
      if (!uniqueMap.has(variable.name) || variable.fieldType === 'body') {
        uniqueMap.set(variable.name, variable);
      }
    });
    return Array.from(uniqueMap.values());
  }

  replaceVariablesInText(text: string): string {
    let replacedText = text;
    this.variables.forEach(variable => {
      if (variable.value) {
        replacedText = replacedText.replace(
          new RegExp(this.escapeRegExp(variable.placeholder), 'g'),
          variable.value
        );
      }
    });
    return replacedText;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Method to validate variable names
  isValidVariableName(name: string): boolean {
    return /^[a-zA-Z0-9_]+$/.test(name) && name.length > 0;
  }

  generateUniqueVariableName(fieldType: 'body' | 'text', baseName: string = 'var'): string {
    // Positional variables: {{1}}, {{2}}, ... — return the next sequential number.
    const numbers = this.variables
      .filter(v => v.fieldType === fieldType && /^\d+$/.test(v.name))
      .map(v => parseInt(v.name, 10))
      .filter(n => !Number.isNaN(n));
    const next = numbers.length ? Math.max(...numbers) + 1 : 1;
    return String(next);
  }

  removeVariableFromText(fieldType: 'body' | 'text', placeholder: string): void {
    const variableToRemove = this.variables.find(v => v.placeholder === placeholder);
    if (variableToRemove) {
      this.removeVariableGlobally(variableToRemove);
    }
  }

  getVariablesByName(name: string): Variable[] {
    return this.variables.filter(v => v.name === name);
  }

  variableNameExists(name: string): boolean {
    return this.variables.some(v => v.name === name);
  }

  areAllVariablesValid(): boolean {
    const form = this.variableForm;
    const variables = this.variables;
    const uniqueVariableNames = [...new Set(variables.map(v => v.name))];
    for (const variableName of uniqueVariableNames) {
      const variable = variables.find(v => v.name === variableName);
      if (!variable || !variable.value || variable.value.trim() === '') {
        return false;
      }
    }

    if (!form.valid) {
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
      });

      this.fixInvalidControls();

      if (!form.valid) {
        return false;
      }
    }

    return true;
  }

  private fixInvalidControls(): void {
    const form = this.variableForm;
    const variables = this.variables;

    Object.keys(form.controls).forEach(controlId => {
      const control = form.controls[controlId];
      const variable = variables.find(v => v.id === controlId);

      if (control.invalid && variable && variable.value) {
        control.setValue(variable.value);
        control.markAsTouched();
        control.updateValueAndValidity();
      }
    });
  }

  fixAllVariableIssues(): void {
    this.fixVariableIds();
    this.syncFormControlsWithVariables();
    const form = this.variableForm;
    Object.keys(form.controls).forEach(controlId => {
      const control = form.get(controlId);
      if (control) {
        control.markAsTouched();
        control.updateValueAndValidity();
      }
    });
    form.updateValueAndValidity();
  }

  sanitizeControlId(controlId: string): string {
    return controlId.replace(/[^a-zA-Z0-9_]/g, '');
  }
  private fixVariableIds(): void {
    const variables = this.variables;
    let hasChanges = false;
    const fixedVariables = variables.map(variable => {
      const cleanId = this.sanitizeControlId(variable.id);
      if (cleanId !== variable.id) {
        hasChanges = true;
        return { ...variable, id: cleanId };
      }
      return variable;
    });
    if (hasChanges) {
      this.variablesSubject.next(fixedVariables);
      setTimeout(() => {
        this.updateVariableControlsInternal();
      }, 0);
    }
  }
  updateVariableControls(): void {
    this.updateVariableControlsInternal();
  }
  syncFormControlsWithVariables(): void {
    const form = this.variableForm;
    const variables = this.variables;
    Object.keys(form.controls).forEach(controlId => {
      const control = form.controls[controlId];
      const variable = variables.find(v => v.id === controlId);
      if (variable) {
        const currentControlValue = control.value || '';
        const currentVariableValue = variable.value || '';
        if (currentControlValue !== currentVariableValue) {
          control.setValue(currentVariableValue);
          control.markAsTouched();
          control.updateValueAndValidity();
        }
      }
    });

  }

  private updateVariableControlsInternal(): void {
    const newForm = this.fb.group({});
    const uniqueVariables = this.getUniqueVariablesByName();

    uniqueVariables.forEach(variable => {
      try {
        const currentValue = variable.value || '';
        const control = this.fb.control(currentValue, [Validators.required]);
        newForm.addControl(variable.id, control);
      } catch (error) {
        this.toast.showToast(`Error adding control for variable ${variable.id}:`, 'error');
      }
    });
    this.variableFormSubject.next(newForm);
  }
  markAllVariablesAsTouched(): void {
    const form = this.variableForm;
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
    });
  }
}
