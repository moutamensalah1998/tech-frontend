import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TemplateConstants } from '../../../../../../../../../../core/utils/template-constants';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-template-basic-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './template-basic-info.component.html'
})
export class TemplateBasicInfoComponent {
  @Input() form!: FormGroup;
  private translationService = inject(TranslationService);

  categories = TemplateConstants.CATEGORIES;
  languages = TemplateConstants.LANGUAGES;

  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (field?.invalid && field?.touched) {
      const errors = field.errors;
      if (errors?.['required']) {
        const label = this.getFieldLabel(fieldName);
        const requiredText = this.translationService.translate('broadcast.createTemplate.basicInfo.fieldRequired');
        return `${label} ${requiredText}`;
      }
      if (errors?.['pattern']) {
        const label = this.getFieldLabel(fieldName);
        const formatText = this.translationService.translate('broadcast.createTemplate.basicInfo.fieldInvalidFormat');
        return `${label} ${formatText}`;
      }
      return this.translationService.translate('broadcast.createTemplate.basicInfo.fieldInvalid');
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      templateName: this.translationService.translate('broadcast.createTemplate.basicInfo.templateName'),
      category: this.translationService.translate('broadcast.createTemplate.basicInfo.category'),
      language: this.translationService.translate('broadcast.createTemplate.basicInfo.language')
    };
    return labels[fieldName] || fieldName;
  }
}
