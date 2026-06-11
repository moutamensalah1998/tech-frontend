import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ContactTag } from '../../../../../../../../core/models/contact-tags.model';
import { AddTagDialogComponent } from '../add-tag-dialog/add-tag-dialog.component';
import { TagsService } from '../../../../../../../../core/services/tags/tags.service';
import { getContactTags } from '../../../../../../../../core/services/contact/ngrx/contact.actions';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-tags-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, TranslatePipe],
  templateUrl: './tags-dialog.component.html',
  styleUrls: ['./tags-dialog.component.css']
})
export class TagsDialogComponent {
  editingTagId: string | null = null;
  editForm: FormGroup;
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<TagsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tags: ContactTag[], contactName: string, contactId: string },
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tagsService: TagsService,
    private store: Store,
    private translationService: TranslationService
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onAddNewTag(): void {
    const addTagDialogRef = this.dialog.open(AddTagDialogComponent, {
      width: '400px',
      data: {
        contactId: this.data.contactId,
        contactName: this.data.contactName
      }
    });

    addTagDialogRef.afterClosed().subscribe((result: any) => {
      if (result?.success) {
        // Close with refresh and dataChanged flags to indicate new data was added
        this.dialogRef.close({ refresh: true, dataChanged: true });
      }
    });
  }

  startEditTag(tag: ContactTag): void {
    this.editingTagId = tag.id;
    this.editForm.patchValue({
      name: tag.name
    });
  }

  saveEditTag(tag: ContactTag): void {
    if (this.editForm.valid && !this.loading) {
      this.loading = true;
      const newName = this.editForm.get('name')?.value;

      this.tagsService.editTag(tag.name, newName).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.cancelEditTag();
          // Refresh the tags list
          this.store.dispatch(getContactTags({ contact_id: this.data.contactId }));
          this.dialogRef.close({ refresh: true, dataChanged: true });
        },
        error: (error: any) => {
          this.loading = false;
          console.error('Error updating tag:', error);
        }
      });
    }
  }

  cancelEditTag(): void {
    this.editingTagId = null;
    this.editForm.reset();
  }

  deleteTag(tag: ContactTag): void {
    const message = this.translationService.translate('chatDetails.tagsDialog.deleteTagConfirm', { name: tag.name });
    if (confirm(message)) {
      this.loading = true;
      
      this.tagsService.deleteTag(tag.name).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response: any) => {
          this.loading = false;
          // Refresh the tags list
          this.store.dispatch(getContactTags({ contact_id: this.data.contactId }));
          this.dialogRef.close({ refresh: true, dataChanged: true });
        },
        error: (error: any) => {
          this.loading = false;
          console.error('Error deleting tag:', error);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 