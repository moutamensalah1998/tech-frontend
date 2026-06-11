// app-question-node.component.ts
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { takeUntil } from 'rxjs';
import { ConnectionButtonComponent } from './../../shared/connection-button.component';
import { NodeHeaderComponent } from './../../shared/node-header/node-header.component';
import { QuestionPreviewComponent } from '../question-preview/question-preview.component';
import { BaseNodeComponent } from '../base/base-node.component';
import { DragDropService } from './../../services/drag-drop.service';
import { NodeManagementService } from './../../services/node-management.service';
import { SelectionService } from './../../services/selection.service';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-question-node',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ConnectionButtonComponent,
    NodeHeaderComponent,
    TranslatePipe,
    // QuestionPreviewComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-question-node.component.html',
})
export class QuestionNodeComponent extends BaseNodeComponent implements OnInit {
  private translationService = inject(TranslationService);
  
  questionForm = this.fb.group({
    questionText: [''],
    answerVariant: [''],
    saveToVariable: [false],
    variableName: [''],
    acceptMediaResponse: [false]
  });

  answerTypeOptions = [
    { value: '', label: 'Select answer type' },
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'date', label: 'Date' },
    { value: 'choice', label: 'Multiple Choice' }
  ];

  constructor(
    dragDropService: DragDropService,
    nodeManagementService: NodeManagementService,
    private fb: FormBuilder,
    cdr: ChangeDetectorRef,
    selectionService: SelectionService
  ) {
    super(dragDropService, nodeManagementService, cdr, selectionService);
  }

  protected initializeNode(): void {
    if (!this.node.body.body_question) {
      this.node.body.body_question = {
        question_text: '',
        answer_variant: '',
        accept_media_response: false,
        save_to_variable: false,
        variable_name: ''
      };
    }

    this.initializeForm();
    this.setupFormSubscriptions();
  }

  private initializeForm(): void {
    const question = this.node.body.body_question!;
    this.questionForm.patchValue({
      questionText: question.question_text,
      answerVariant: question.answer_variant,
      saveToVariable: question.save_to_variable,
      variableName: question.variable_name,
      acceptMediaResponse: question.accept_media_response
    });
  }

  private setupFormSubscriptions(): void {
    this.questionForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(values => {
        if (this.node.body.body_question) {
          Object.assign(this.node.body.body_question, {
            question_text: values.questionText,
            answer_variant: values.answerVariant,
            save_to_variable: values.saveToVariable,
            variable_name: values.variableName,
            accept_media_response: values.acceptMediaResponse
          });
          this.emitContentChange();
        }
      });
  }

  protected validateContent(): boolean {
    if (!this.node.body.body_question) {
      return false;
    }

    const questionText = this.node.body.body_question.question_text?.trim();
    if (!questionText) {
      return false;
    }
    if (this.node.body.body_question.save_to_variable &&
        !this.node.body.body_question.variable_name?.trim()) {
      return false;
    }

    return true;
  }

  protected getNodeDisplayName(): string {
    const questionText = this.node.body.body_question?.question_text?.trim();
    if (questionText) {
      const truncated = questionText.length > 30
        ? `${questionText.substring(0, 30)}...`
        : questionText;
      return `Question: "${truncated}"`;
    }
    return `Question Node (${this.node.id.substring(0, 8)})`;
  }

  protected override getValidationErrorMessage(): string | null {
    if (!this.node.body.body_question) {
      return this.translationService.translate('chatbot.builder.nodes.question.questionConfigurationMissing');
    }

    const questionText = this.node.body.body_question.question_text?.trim();
    if (!questionText) {
      return this.translationService.translate('chatbot.builder.nodes.question.questionTextRequired');
    }

    if (this.node.body.body_question.save_to_variable &&
        !this.node.body.body_question.variable_name?.trim()) {
      return this.translationService.translate('chatbot.builder.nodes.question.variableNameRequired');
    }

    return null;
  }
}
