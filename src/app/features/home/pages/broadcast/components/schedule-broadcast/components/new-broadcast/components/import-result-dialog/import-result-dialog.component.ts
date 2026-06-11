import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';

export interface ImportResultData {
  total_processed: number;
  successful_uploads: number;
  failed_uploads: number;
  list_phone_numbers: string[];
  already_exist_numbers: string[];
  invalid_format_numbers: string[];
  errors: string[];
  message: string;
}

@Component({
  selector: 'app-import-result-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, TranslatePipe],
  templateUrl: './import-result-dialog.component.html',
  styleUrls: ['./import-result-dialog.component.css']
})
export class ImportResultDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ImportResultData,
    private dialogRef: MatDialogRef<ImportResultDialogComponent>
  ) {
    if (!this.data) {
      this.data = {
        total_processed: 0,
        successful_uploads: 0,
        failed_uploads: 0,
        list_phone_numbers: [],
        already_exist_numbers: [],
        invalid_format_numbers: [],
        errors: [],
        message: 'No data received'
      };
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
  addToRecipients(): void {
    this.dialogRef.close({
      addToRecipients: true,
      phoneNumbers: this.data.list_phone_numbers,
      existingNumbers: this.data.already_exist_numbers
    });
  }
}
