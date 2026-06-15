import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ContactAttribute } from '../../../../../../../../core/models/contact-attributes.model';
import { AddAttributeDialogComponent } from '../add-attribute-dialog/add-attribute-dialog.component';
import { AttributesService } from '../../../../../../../../core/services/attributes/attributtes.service';
import { getContactAttributes } from '../../../../../../../../core/services/contact/ngrx/contact.actions';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../core/services/translation/translation.service';
import { ConfirmDialogComponent } from '../../../../../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-attributes-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, TranslatePipe, ConfirmDialogComponent],
  templateUrl: './attributes-dialog.component.html',
  styleUrls: ['./attributes-dialog.component.css'],
})
export class AttributesDialogComponent {
  editingAttributeId: string | null = null;
  editForm: FormGroup;
  loading = false;
  deleteConfirmDialogOpen = false;
  selectedAttributeForDeletion: ContactAttribute | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<AttributesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { attributes: ContactAttribute[]; contactName: string; contactId: string },
    private dialog: MatDialog,
    private fb: FormBuilder,
    private attributesService: AttributesService,
    private store: Store,
    private translationService: TranslationService
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      value: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]]
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onAddNewAttribute(): void {
    const addAttributeDialogRef = this.dialog.open(AddAttributeDialogComponent, {
      width: '400px',
      data: {
        contactId: this.data.contactId,
        contactName: this.data.contactName
      }
    });

    addAttributeDialogRef.afterClosed().subscribe((result: any) => {
      if (result?.success) {
        // Close with refresh and dataChanged flags to indicate new data was added
        this.dialogRef.close({ refresh: true, dataChanged: true });
      }
    });
  }

  startEditAttribute(attribute: ContactAttribute): void {
    this.editingAttributeId = attribute.id;
    this.editForm.patchValue({
      name: attribute.name,
      value: attribute.value
    });
  }

  saveEditAttribute(attribute: ContactAttribute): void {
    if (this.editForm.valid && !this.loading) {
      this.loading = true;
      const newName = this.editForm.get('name')?.value;
      const newValue = this.editForm.get('value')?.value;

      this.attributesService.updateContactAttribute(
        this.data.contactId,
        newName,
        newValue
      ).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.cancelEditAttribute();
          // Refresh the attributes list
          this.store.dispatch(getContactAttributes({ contactId: this.data.contactId }));
          this.dialogRef.close({ refresh: true, dataChanged: true });
        },
        error: (error: any) => {
          this.loading = false;
          console.error('Error updating attribute:', error);
        }
      });
    }
  }

  cancelEditAttribute(): void {
    this.editingAttributeId = null;
    this.editForm.reset();
  }

  deleteAttribute(attribute: ContactAttribute): void {
    this.selectedAttributeForDeletion = attribute;
    this.deleteConfirmDialogOpen = true;
  }

  onConfirmDeleteAttribute(): void {
    if (!this.selectedAttributeForDeletion) return;
    const attribute = this.selectedAttributeForDeletion;
    this.deleteConfirmDialogOpen = false;
    this.selectedAttributeForDeletion = null;

    this.loading = true;
    
    this.attributesService.deleteContactAttribute(
      this.data.contactId,
      attribute.name
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        this.loading = false;
        // Refresh the attributes list
        this.store.dispatch(getContactAttributes({ contactId: this.data.contactId }));
        this.dialogRef.close({ refresh: true, dataChanged: true });
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error deleting attribute:', error);
      }
    });
  }

  onCancelDeleteAttribute(): void {
    this.deleteConfirmDialogOpen = false;
    this.selectedAttributeForDeletion = null;
  }

  getDeleteAttributeMessage(): string {
    if (!this.selectedAttributeForDeletion) return '';
    return this.translationService.translate('chatDetails.attributesDialog.deleteAttributeConfirm', { name: this.selectedAttributeForDeletion.name });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 