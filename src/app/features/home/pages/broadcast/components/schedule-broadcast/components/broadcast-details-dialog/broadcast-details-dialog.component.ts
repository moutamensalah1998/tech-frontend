import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { BroadcastData, BroadcastStats } from '../../../../../../../../core/models/broadcast.model';
import { BroadcastStatsService } from '../../../../../../../../core/services/broadcast/broadcast-stats.service';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';

export interface BroadcastDialogData {
  broadcast: BroadcastData;
}

@Component({
  standalone: true,
  selector: 'app-broadcast-details-dialog',
  templateUrl: './broadcast-details-dialog.component.html',
  styleUrls: ['./broadcast-details-dialog.component.css'],
  imports: [MatDialogModule, CommonModule, TranslatePipe],
})
export class BroadcastDetailsDialogComponent implements OnInit {
  stats: BroadcastStats | null = null;
  loadingStats = true;
  statsError = false;
  showSuccessfulNumbers = false;
  showFailedNumbers = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BroadcastDialogData,
    private dialogRef: MatDialogRef<BroadcastDetailsDialogComponent>,
    private statsService: BroadcastStatsService
  ) { }

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.loadingStats = true;
    this.statsError = false;

    this.statsService.getBroadcastStats(this.data.broadcast.id).subscribe({
      next: (response) => {
        if (response?.success && response.data) {
          this.stats = response.data;
        } else {
          this.stats = null;
        }
        this.loadingStats = false;
      },
      error: (error) => {
        console.error('Failed to load broadcast stats:', error);
        this.statsError = true;
        this.loadingStats = false;
      }
    });
  }

  getStatusColor(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getDeliveryRate(): number {
    if (!this.stats || this.stats.total_recipients === 0) return 0;
    const successful = this.stats.successfully_sent + this.stats.delivered + this.stats.read;
    return Math.round((successful / this.stats.total_recipients) * 100);
  }

  getReadRate(): number {
    if (!this.stats || this.stats.total_recipients === 0) return 0;
    return Math.round((this.stats.read / this.stats.total_recipients) * 100);
  }

  getTotalDelivered(): number {
    if (!this.stats) return 0;
    return this.stats.delivered + this.stats.read;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}