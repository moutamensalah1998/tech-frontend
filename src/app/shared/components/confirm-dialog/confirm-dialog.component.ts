// confirm-dialog.component.ts
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DialogStyle = 'primary' | 'danger' | 'warning' | 'success';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent {
  @Input() header = 'Confirmation Required';
  @Input() message = 'Are you sure you want to perform this action?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() dialogStyle: DialogStyle = 'primary';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  get buttonColorClasses() {
    return {
      'primary': 'bg-blue-600 hover:bg-blue-700',
      'danger': 'bg-red-600 hover:bg-red-700',
      'warning': 'bg-yellow-600 hover:bg-yellow-700 text-black',
      'success': 'bg-green-600 hover:bg-green-700'
    }[this.dialogStyle];
  }

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }

  // Close on Escape key
  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    this.onCancel();
  }
}
