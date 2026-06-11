import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-question-preview',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-preview.component.html',
})
export class QuestionPreviewComponent {
  @Input() questionText?: string;
  @Input() answerType?: string;
  @Input() variableName?: string;
}
