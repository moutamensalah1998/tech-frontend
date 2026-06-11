import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMessage } from '../../../../../../../../../../core/models/chat.types';

@Component({
  selector: 'app-location-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-message.component.html',
  styleUrls: [`./location-message.component.css`],
})
export class LocationMessageComponent {
  @Input() message!: BaseMessage;

  getMessageClasses(): string {
    const baseClasses = 'location-message';
    const alignmentClasses = this.message.is_from_contact
      ? 'bg-white text-gray-900'
      : 'bg-green-100 text-gray-900';

    return `${baseClasses} ${alignmentClasses}`;
  }

  getGoogleMapsUrl(): string {
    const lat = this.message.content?.latitude;
    const lng = this.message.content?.longitude;

    if (!lat || !lng) {
      return '#';
    }

    const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
    const longitude = typeof lng === 'string' ? parseFloat(lng) : lng;

    if (isNaN(latitude) || isNaN(longitude)) {
      return '#';
    }
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    return mapsUrl;
  }

  getCoordinatesDisplay(): string {
    const lat = this.message.content?.latitude;
    const lng = this.message.content?.longitude;

    if (!lat || !lng) {
      return 'Location coordinates';
    }

    const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
    const longitude = typeof lng === 'string' ? parseFloat(lng) : lng;

    if (isNaN(latitude) || isNaN(longitude)) {
      return 'Invalid coordinates';
    }

    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  openGoogleMaps(event: Event) {
    event.preventDefault();
    const url = this.getGoogleMapsUrl();
    if (url === '#') {
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
