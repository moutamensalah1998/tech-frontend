import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { BroadcastData } from '../../../../../../../../core/models/broadcast.model';
import { WhatsAppTemplate } from '../../../../../../../../core/models/whatsapp-template.model';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';

export interface BroadcastDialogData {
  broadcast: BroadcastData;
  template?: WhatsAppTemplate;
}

@Component({
  standalone: true,
  selector: 'app-broadcast-details-dialog',
  templateUrl: './broadcast-details-dialog.component.html',
  styleUrls: ['./broadcast-details-dialog.component.css'],
  imports: [MatDialogModule, CommonModule, TranslatePipe],
})
export class BroadcastDetailsDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BroadcastDialogData,
    private dialogRef: MatDialogRef<BroadcastDetailsDialogComponent>
  ) { }

  getStatusColor(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getDeliveryRate(): number {
    // Assuming 'sent' and 'failed' counts are not available in BroadcastData, delivery rate is 100% if status is 'sent', 0% if 'failed', else 0.
    // If you have sent/failed counts, update this logic accordingly.
    const total = this.data.broadcast.total_contacts || 0;
    if (total === 0) return 0;
    // If status is 'sent', assume all delivered
    if (this.data.broadcast.status === 'sent') return 100;
    // If status is 'failed', assume none delivered
    if (this.data.broadcast.status === 'failed') return 0;
    // For 'pending' or 'scheduled', delivery rate is 0
    return 0;
  }

  getStatusLabel(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'sent':
        return 'Sent';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'scheduled':
        return 'Scheduled';
      default:
        return status;
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
