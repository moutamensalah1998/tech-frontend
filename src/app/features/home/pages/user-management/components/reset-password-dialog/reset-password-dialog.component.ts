import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-reset-password-dialog',
  imports: [FormsModule, CommonModule, TranslatePipe],
  templateUrl: './reset-password-dialog.component.html',
  styleUrl: './reset-password-dialog.component.css'
})
export class ResetPasswordDialogComponent {
  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();
  newPassword: string = '';
  confirmPassword: string = '';
  errorMessageKey: string | null = null;

  onConfirm() {
    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessageKey = 'userManagement.resetPasswordDialog.fillBothFields';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessageKey = 'userManagement.resetPasswordDialog.passwordMismatch';
      return;
    }

    this.errorMessageKey = null;
    this.confirmed.emit(this.newPassword);

    // Clear form fields after successful confirmation
    this.newPassword = '';
    this.confirmPassword = '';
  }

  onCancel() {
    // Clear form fields to prevent state leakage
    this.newPassword = '';
    this.confirmPassword = '';
    this.errorMessageKey = null;
    this.cancelled.emit();
  }
}