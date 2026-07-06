import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIConfigService } from '../../services/ai-config.service';
import { AIDecisionResult } from '../../models/ai-config.model';

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
  testResult: AIDecisionResult | null = null;
  isTesting = false;
  testError: string | null = null;

  constructor(private aiService: AIConfigService) {}

  async runTest() {
    if (!this.testMessage.trim()) return;
    
    this.isTesting = true;
    this.testError = null;
    this.testResult = null;

    try {
      const response = await this.aiService.testDecision(this.clientId, this.testMessage).toPromise();
      if (response && response.success && response.data) {
        this.testResult = response.data;
      } else {
        this.testError = 'Failed to get decision';
      }
    } catch (error) {
      console.error('Test failed:', error);
      this.testError = error instanceof Error ? error.message : 'Unknown error occurred';
    } finally {
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