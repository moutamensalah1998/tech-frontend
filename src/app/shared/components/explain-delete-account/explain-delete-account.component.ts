import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-explain-delete-account',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './explain-delete-account.component.html',
})
export class ExplainDeleteAccountComponent {

}
