import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIConfigService } from '../../services/ai-config.service';
import { AITestResponse } from '../../models/ai-config.model';

@Component({
  selector: 'app-test-playground',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-playground.component.html',
  styleUrls: ['./test-playground.component.css']
})
export class TestPlaygroundComponent {
  @Input() clientId: string = '';
  
  testMessage: string = '';
  testResult: AITestResponse | null = null;
  isTesting = false;
  testError: string | null = null;

  constructor(private aiService: AIConfigService) {}

  async runTest() {
    if (!this.testMessage.trim()) return;
    
    this.isTesting = true;
    this.testError = null;
    this.testResult = null;

    try {
      this.aiService.testAI(this.clientId, this.testMessage).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.testResult = response;
          } else {
            this.testError = 'Failed to get AI response';
          }
          this.isTesting = false;
        },
        error: (error) => {
          console.error('Test failed:', error);
          this.testError = error instanceof Error ? error.message : 'Unknown error occurred';
          this.isTesting = false;
        }
      });
    } catch (error) {
      console.error('Test failed:', error);
      this.testError = error instanceof Error ? error.message : 'Unknown error occurred';
      this.isTesting = false;
    }
  }

  clearResult() {
    this.testResult = null;
    this.testError = null;
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'reply': return 'fa-reply';
      case 'template': return 'fa-file-alt';
      case 'assign': return 'fa-user-plus';
      case 'escalate': return 'fa-exclamation-triangle';
      default: return 'fa-question-circle';
    }
  }

  getActionColor(action: string): string {
    switch (action) {
      case 'reply': return '#28a745';
      case 'template': return '#007bff';
      case 'assign': return '#ffc107';
      case 'escalate': return '#dc3545';
      default: return '#6c757d';
    }
  }
}