import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ContactService } from '../../../../../../../../core/services/contact/contact.service';
import { getContactTags } from '../../../../../../../../core/services/contact/ngrx/contact.actions';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-add-tag-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, TranslatePipe],
  templateUrl: './add-tag-dialog.component.html',
  styleUrls: ['./add-tag-dialog.component.css']
})
export class AddTagDialogComponent {
  tagForm: FormGroup;
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<AddTagDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { contactId: string; contactName: string },
    private fb: FormBuilder,
    private contactService: ContactService,
    private store: Store
  ) {
    this.tagForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.tagForm.valid && !this.loading) {
      this.loading = true;
      const tagData = {
        name: this.tagForm.get('name')?.value,
        contact_id: this.data.contactId
      };

      this.contactService.createContactTag(tagData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.loading = false;
          // Refresh the tags list
          this.store.dispatch(getContactTags({ contact_id: this.data.contactId }));
          this.dialogRef.close({ success: true, data: response });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error creating tag:', error);
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