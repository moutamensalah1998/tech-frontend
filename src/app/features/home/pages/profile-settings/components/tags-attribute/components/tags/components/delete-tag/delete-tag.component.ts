import { CommonModule } from '@angular/common';
import { Component, Inject, NgModule,  } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { deleteTag } from '../../../../../../../../../../core/services/tags/ngrx/tags.actions';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-delete-tag',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './delete-tag.component.html',
  styleUrl: './delete-tag.component.css'
})
export class DeleteTagComponent {
  constructor(private store : Store,   @Inject(MAT_DIALOG_DATA) public data: string,
      private dialogRef: MatDialogRef<DeleteTagComponent>) {

  }

  deleteTag() {
    this.store.dispatch(deleteTag({ name: this.data }));
    this.dialogRef.close();
  }


}
