import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIConfigService } from '../../services/ai-config.service';
import { 
  KnowledgeSource, 
  KnowledgeSourceCreate, 
  SourceType, 
  SOURCE_TYPE_LABELS, 
  FILE_SOURCE_TYPES,
  AIConversationLog
} from '../../models/ai-config.model';

@Component({
  selector: 'app-training-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './training-panel.component.html',
  styleUrls: ['./training-panel.component.css']
})
export class TrainingPanelComponent implements OnInit {
  @Input() clientId: string = '';
  
  sources: KnowledgeSource[] = [];
  logs: AIConversationLog[] = [];
  isLoading = false;
  activeTab: 'sources' | 'logs' = 'sources';
  
  // Add Source Form
  showAddSourceForm = false;
  newSourceName = '';
  newSourceType: SourceType = 'url';
  newSourceUrl = '';
  newSourceContent = '';
  selectedFile: File | null = null;
  isSubmitting = false;
  
  sourceTypeLabels = SOURCE_TYPE_LABELS;
  sourceTypes: SourceType[] = ['url', 'text', 'pdf', 'image', 'excel', 'word'];
  fileSourceTypes = FILE_SOURCE_TYPES;

  // Toast notification
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;
  toastTimeout: any = null;

  constructor(private aiService: AIConfigService) {}

  ngOnInit(): void {
    this.loadSources();
  }

  showToastMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    
    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
      this.toastTimeout = null;
    }, 3000);
  }

  loadSources(): void {
    this.isLoading = true;
    this.aiService.getSources(this.clientId).subscribe({
      next: (response) => {
        this.sources = response.sources || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load sources:', err);
        this.showToastMessage('Failed to load sources', 'error');
        this.isLoading = false;
      }
    });
  }

  loadLogs(): void {
    this.isLoading = true;
    this.aiService.getLogs(this.clientId).subscribe({
      next: (response) => {
        this.logs = response.logs || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load logs:', err);
        this.isLoading = false;
      }
    });
  }

  onTabChange(tab: 'sources' | 'logs'): void {
    this.activeTab = tab;
    if (tab === 'sources') {
      this.loadSources();
    } else {
      this.loadLogs();
    }
  }

  // --- Add Source ---
  openAddSourceForm(): void {
    this.showAddSourceForm = true;
    this.newSourceName = '';
    this.newSourceType = 'url';
    this.newSourceUrl = '';
    this.newSourceContent = '';
    this.selectedFile = null;
  }

  cancelAddSource(): void {
    this.showAddSourceForm = false;
    this.selectedFile = null;
  }

  onSourceTypeChange(): void {
    this.newSourceUrl = '';
    this.newSourceContent = '';
    this.selectedFile = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  isFileSourceType(): boolean {
    return this.fileSourceTypes.includes(this.newSourceType);
  }

  submitSource(): void {
    if (!this.newSourceName.trim()) return;
    
    this.isSubmitting = true;
    
    if (this.isFileSourceType()) {
      // File upload
      if (!this.selectedFile) {
        this.isSubmitting = false;
        return;
      }
      this.aiService.uploadSource(this.clientId, this.newSourceName, this.newSourceType, this.selectedFile)
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.showAddSourceForm = false;
            this.loadSources();
            this.showToastMessage('Source added successfully');
          },
          error: (err) => {
            console.error('Failed to upload source:', err);
            this.isSubmitting = false;
            this.showToastMessage('Failed to add source: ' + (err.error?.detail || err.message || 'Unknown error'), 'error');
          }
        });
    } else {
      // URL or Text
      const sourceData: KnowledgeSourceCreate = {
        name: this.newSourceName,
        source_type: this.newSourceType,
      };
      
      if (this.newSourceType === 'url') {
        if (!this.newSourceUrl.trim()) return;
        sourceData.url = this.newSourceUrl;
      } else if (this.newSourceType === 'text') {
        if (!this.newSourceContent.trim()) return;
        sourceData.content = this.newSourceContent;
      }
      
      this.aiService.createSource(this.clientId, sourceData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showAddSourceForm = false;
          this.loadSources();
          this.showToastMessage('Source added successfully');
        },
        error: (err) => {
          console.error('Failed to create source:', err);
          this.isSubmitting = false;
          this.showToastMessage('Failed to add source: ' + (err.error?.detail || err.message || 'Unknown error'), 'error');
        }
      });
    }
  }

  // --- Source Actions ---
  deleteSource(sourceId: string): void {
    if (confirm('Are you sure you want to delete this source?')) {
      this.aiService.deleteSource(this.clientId, sourceId).subscribe({
        next: () => {
          this.sources = this.sources.filter(s => s.id !== sourceId);
          this.showToastMessage('Source deleted successfully');
        },
        error: (err) => {
          console.error('Failed to delete source:', err);
          this.showToastMessage('Failed to delete source', 'error');
        }
      });
    }
  }

  rescrapeSource(sourceId: string): void {
    this.aiService.rescrapeSource(this.clientId, sourceId).subscribe({
      next: () => {
        this.loadSources();
        this.showToastMessage('Source re-processed successfully');
      },
      error: (err) => {
        console.error('Failed to re-process source:', err);
        this.showToastMessage('Failed to re-process source', 'error');
      }
    });
  }

  // --- Log Actions ---
  updateLogFeedback(logId: string, wasHelpful: boolean): void {
    this.aiService.updateLogFeedback(this.clientId, logId, wasHelpful).subscribe({
      next: () => {
        const log = this.logs.find(l => l.id === logId);
        if (log) log.was_helpful = wasHelpful;
      },
      error: (err) => {
        console.error('Failed to update feedback:', err);
      }
    });
  }

  // --- Helpers ---
  getStatusClass(status: string): string {
    switch (status) {
      case 'ready': return 'status-ready';
      case 'scraping': return 'status-scraping';
      case 'pending': return 'status-pending';
      case 'error': return 'status-error';
      default: return '';
    }
  }

  getSourceTypeIcon(sourceType: string): string {
    switch (sourceType) {
      case 'url': return '🔗';
      case 'text': return '📝';
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'excel': return '📊';
      case 'word': return '📃';
      default: return '📁';
    }
  }

  getAcceptFileTypes(): string {
    switch (this.newSourceType) {
      case 'pdf': return '.pdf';
      case 'image': return '.png,.jpg,.jpeg,.gif,.bmp,.webp';
      case 'excel': return '.xlsx,.xls';
      case 'word': return '.docx,.doc';
      default: return '*';
    }
  }
}