// questions-and-answers.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

interface Question {
  id: string;
  questionKey: string;
  answerKey: string;
}

@Component({
  standalone: true,
  selector: 'app-questions-and-answers',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './questions_and_answers.component.html',
  styleUrls: ['./questions_and_answers.component.css']
})
export class QuestionsAndAnswersComponent {
  questions: Question[] = [
    {
      id: 'change-plans',
      questionKey: 'landing.faq.questions.changePlans.question',
      answerKey: 'landing.faq.questions.changePlans.answer'
    },
    {
      id: 'free-trial',
      questionKey: 'landing.faq.questions.freeTrial.question',
      answerKey: 'landing.faq.questions.freeTrial.answer'
    },
    {
      id: 'payment-methods',
      questionKey: 'landing.faq.questions.paymentMethods.question',
      answerKey: 'landing.faq.questions.paymentMethods.answer'
    },
    {
      id: 'support',
      questionKey: 'landing.faq.questions.support.question',
      answerKey: 'landing.faq.questions.support.answer'
    },
    {
      id: 'data-security',
      questionKey: 'landing.faq.questions.dataSecurity.question',
      answerKey: 'landing.faq.questions.dataSecurity.answer'
    },
    {
      id: 'integrations',
      questionKey: 'landing.faq.questions.integrations.question',
      answerKey: 'landing.faq.questions.integrations.answer'
    }
  ];

  trackByQuestionId(index: number, question: Question): string {
    return question.id;
  }
}