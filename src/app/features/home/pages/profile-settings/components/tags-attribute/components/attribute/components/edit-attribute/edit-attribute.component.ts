import { CommonModule } from '@angular/common';
import { Component, Inject, NgModule,  } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { updateAttribute } from '../../../../../../../../../../core/services/attributes/ngrx/attributes.actions';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-edit-attribute',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './edit-attribute.component.html',
  styleUrl: './edit-attribute.component.css'
})
export class EditAttributeComponent {
  newName: string = '';
  constructor(private store : Store,   @Inject(MAT_DIALOG_DATA) public data: string,
      private dialogRef: MatDialogRef<EditAttributeComponent>) {
    this.newName = data;
  }

  editeAttribute() {
    if (this.newName && this.newName.trim() && this.newName !== this.data) {
      this.store.dispatch(updateAttribute({ name: this.data, newName: this.newName.trim() }));
      this.dialogRef.close();
    }
  }
}
