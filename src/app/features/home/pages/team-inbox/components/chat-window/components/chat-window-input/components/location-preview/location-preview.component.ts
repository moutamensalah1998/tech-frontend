import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface LocationPreviewData {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

@Component({
  selector: 'app-location-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location-preview.component.html',
})
export class LocationPreviewComponent {
  @Input() locationData!: LocationPreviewData;
  @Output() locationDataChange = new EventEmitter<LocationPreviewData>();
  @Output() locationSent = new EventEmitter<LocationPreviewData>();
  @Output() cancelled = new EventEmitter<void>();

  onLocationDataChange(): void {
    this.locationDataChange.emit(this.locationData);
  }

  sendLocation(): void {
    this.locationSent.emit(this.locationData);
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
