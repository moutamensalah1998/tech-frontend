import { FormGroup, FormControl, FormArray, AbstractControl } from '@angular/forms';

export class FormValidationUtils {
    static isFieldFilled(form: FormGroup, fieldName: string): boolean {
        const control = form.get(fieldName);
        const value = control?.value;

        if (typeof value === 'string') {
            return value.trim() !== '';
        }
        return !!value;
    }

    static isFieldInvalid(control: AbstractControl, fieldName?: string): boolean {
        const targetControl = fieldName ? control.get(fieldName) : control;
        return !!targetControl && targetControl.invalid && (targetControl.touched || targetControl.dirty);
    }

    static shouldDisplayError(form: FormGroup, fieldName: string, submitted: boolean = false): boolean {
        const control = form.get(fieldName);
        return !!control && control.invalid && (control.touched || control.dirty || submitted);
    }

    static isFieldValid(form: FormGroup, fieldName: string): boolean {
        const control = form.get(fieldName);
        return !!control && control.valid && (control.touched || control.dirty);
    }

    static getValidationErrors(form: FormGroup, fieldName: string): { [key: string]: any } | null {
        const control = form.get(fieldName);
        return control?.errors || null;
    }

    static hasError(form: FormGroup, fieldName: string, errorName: string): boolean {
        const control = form.get(fieldName);
        return !!control?.errors?.[errorName];
    }

    static getFirstValidationError(form: FormGroup, fieldName: string): string | null {
        const control = form.get(fieldName);
        if (control?.errors) {
            return Object.keys(control.errors)[0] || null;
        }
        return null;
    }

    static validateAllFormFields(form: FormGroup | FormArray): void {
        Object.keys(form.controls).forEach(field => {
            const control = form.get(field);
            if (control instanceof FormGroup || control instanceof FormArray) {
                this.validateAllFormFields(control);
            } else if (control instanceof FormControl) {
                control.markAsTouched({ onlySelf: true });
            }
        });
    }

    static isEmailValid(form: FormGroup, fieldName: string): boolean {
        const control = form.get(fieldName);
        return !!control && !control.errors?.['email'];
    }

    static isMinLengthValid(form: FormGroup, fieldName: string): boolean {
        const control = form.get(fieldName);
        return !!control && !control.errors?.['minlength'];
    }

    static isMaxLengthValid(form: FormGroup, fieldName: string): boolean {
        const control = form.get(fieldName);
        return !!control && !control.errors?.['maxlength'];
    }

    static isPatternValid(form: FormGroup, fieldName: string): boolean {
        const control = form.get(fieldName);
        return !!control && !control.errors?.['pattern'];
    }

    static isPhoneNumberValid(form: FormGroup, fieldName: string): boolean {
        const control = form.get(fieldName);
        return !!control && !control.errors?.['invalidPhoneNumber'];
    }
}