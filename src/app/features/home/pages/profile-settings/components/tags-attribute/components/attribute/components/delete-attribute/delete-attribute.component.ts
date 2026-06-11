import { CommonModule } from '@angular/common';
import { Component, Inject, NgModule,  } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { deleteAttribute } from '../../../../../../../../../../core/services/attributes/ngrx/attributes.actions';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-delete-attribute',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './delete-attribute.component.html',
  styleUrl: './delete-attribute.component.css'
})
export class DeleteAttributeComponent {
  constructor(private store : Store,   @Inject(MAT_DIALOG_DATA) public data: string,
      private dialogRef: MatDialogRef<DeleteAttributeComponent>) {

  }

  deleteAttribute() {
    this.store.dispatch(deleteAttribute({ name: this.data }));
    this.dialogRef.close();
  }


}
