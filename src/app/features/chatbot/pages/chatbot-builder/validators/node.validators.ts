import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class NodeValidators {
  static maxLength(max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      return control.value.length > max ? { maxLength: { max, actual: control.value.length } } : null;
    };
  }

  static requiredText(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value?.trim();
      return !value ? { requiredText: true } : null;
    };
  }

  static variableName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const validPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
      return validPattern.test(control.value) ? null : { invalidVariableName: true };
    };
  }
}
