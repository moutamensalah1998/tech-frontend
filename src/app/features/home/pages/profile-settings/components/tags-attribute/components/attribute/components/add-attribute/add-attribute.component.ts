import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MatDialogRef } from '@angular/material/dialog';
import { addAttribute } from '../../../../../../../../../../core/services/attributes/ngrx/attributes.actions';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-add-attribute',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './add-attribute.component.html',
  styleUrl: './add-attribute.component.css'
})
export class AddAttributeComponent {
  constructor(
    private store: Store,
    public dialogRef: MatDialogRef<AddAttributeComponent>
  ) { }

  tagName: string = '';

  addAttribute() {
    this.store.dispatch(
      addAttribute({
        name: this.tagName,
      })
    );
    this.dialogRef.close();
  }
}
