import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  imports: [CommonModule],
  templateUrl: './skeleton-loader.component.html',
  styleUrl: './skeleton-loader.component.css'
})
export class SkeletonLoaderComponent {
  @Input() type: 'image' | 'cardWithText' | 'imageWithText' | 'paragraph' | 'card' = 'paragraph';
  @Input() width: string = 'w-full';
  @Input() height: string = 'h-full';
}
