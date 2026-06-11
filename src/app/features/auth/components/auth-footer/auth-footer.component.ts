import { Component } from '@angular/core';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-auth-footer',
  imports: [TranslatePipe],
  templateUrl: './auth-footer.component.html',
  styleUrl: './auth-footer.component.css'
})
export class AuthFooterComponent {
  currentYear = new Date().getFullYear();
}
