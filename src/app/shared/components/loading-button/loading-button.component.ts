import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-loading-button',
  imports: [NgIf],
  templateUrl: './loading-button.component.html',
  styleUrl: './loading-button.component.css'
})
export class LoadingButtonComponent {
  @Input() isLoading: boolean | null = false;
  @Input() buttonText: string = 'Submit';
  @Input() customClasses: string = '';
  @Input() disabled: boolean | null = false;
}
