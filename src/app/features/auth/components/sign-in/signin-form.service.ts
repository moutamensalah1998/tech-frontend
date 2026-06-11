import { Injectable } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import parsePhoneNumberFromString from "libphonenumber-js";

@Injectable({ providedIn: 'root' })
export class SignInFormService {
    constructor(private fb: FormBuilder) { }

    createForm(): FormGroup {
        const form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
            ]],
            client_id: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
            remember_me: [false] 
        });
        return form;
    }
}
