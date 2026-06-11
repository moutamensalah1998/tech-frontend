import * as TagsActions from '../../../../../../../../../../core/services/tags/ngrx/tags.actions';
import { CommonModule } from '@angular/common';
import { Component, Inject, NgModule,  } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { updateTag } from '../../../../../../../../../../core/services/tags/ngrx/tags.actions';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-edit-tag',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './edit-tag.component.html',
  styleUrl: './edit-tag.component.css'
})
export class EditTagComponent {
  newName: string = '';
  constructor(private store : Store,   @Inject(MAT_DIALOG_DATA) public data: string,
      private dialogRef: MatDialogRef<EditTagComponent>) {
    this.newName = data;
  }

  editeTag() {
    if (this.newName && this.newName.trim() && this.newName !== this.data) {
      this.store.dispatch(updateTag({ name: this.data, newName: this.newName.trim() }));
      this.dialogRef.close();
    }
  }


}
