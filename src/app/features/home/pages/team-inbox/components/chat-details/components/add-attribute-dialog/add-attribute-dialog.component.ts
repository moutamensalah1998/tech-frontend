import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AttributesService } from '../../../../../../../../core/services/attributes/attributtes.service';
import { getContactAttributes } from '../../../../../../../../core/services/contact/ngrx/contact.actions';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-add-attribute-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, TranslatePipe],
  templateUrl: './add-attribute-dialog.component.html',
  styleUrls: ['./add-attribute-dialog.component.css']
})
export class AddAttributeDialogComponent {
  attributeForm: FormGroup;
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<AddAttributeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { contactId: string; contactName: string },
    private fb: FormBuilder,
    private attributesService: AttributesService,
    private store: Store
  ) {
    this.attributeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      value: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]]
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.attributeForm.valid && !this.loading) {
      this.loading = true;
      const attributeName = this.attributeForm.get('name')?.value;
      const attributeValue = this.attributeForm.get('value')?.value;

      this.attributesService.addContactAttribute(
        this.data.contactId,
        attributeName,
        attributeValue
      ).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response: any) => {
          this.loading = false;
          // Refresh the attributes list
          this.store.dispatch(getContactAttributes({ contactId: this.data.contactId }));
          this.dialogRef.close({ success: true, data: response });
        },
        error: (error: any) => {
          this.loading = false;
          console.error('Error creating attribute:', error);
          this.dialogRef.close({ success: false, error });
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 