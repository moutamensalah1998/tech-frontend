import { Component, OnInit, OnDestroy, ViewChild, ViewContainerRef, ComponentRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIConfigService } from '../../services/ai-config.service';
import { ApiService } from '../../../../core/api/api.service';
import { AISettings, KnowledgeSource, KnowledgeSourceCreate, AITestResponse } from '../../models/ai-config.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ai-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-page.component.html',
  styleUrls: ['./ai-page.component.css']
})
export class AiPageComponent implements OnInit, OnDestroy {
  clientId = localStorage.getItem('business_profile_id') || '';
  
  // Settings
  settings: AISettings = {
    enabled: false,
    auto_reply_enabled: true,
    auto_actions_enabled: true,
    confidence_threshold: 0.5,
    fallback_message: '',
    model: 'ollama/llama3'
  };
  
  // Stats (from status endpoint)
  stats: any = {
    total_sources: 0,
    ready_sources: 0,
    total_chunks: 0
  };
  
  // Tabs
  activeTab = 'sources';
  tabs = [
    { id: 'sources', label: 'Knowledge Sources', icon: '📚' },
    { id: 'test', label: 'Test AI', icon: '🧪' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];
  
  // Knowledge Sources
  sources: any[] = [];
  showAddSource = false;
  showUrlForm = false;
  showUploadForm = false;
  newSource: any = {
    name: '',
    source_type: 'url',
    url: '',
    content: ''
  };
  selectedFile: File | null = null;
  isSubmitting = false;
  uploadProgress = 0;
  uploadError = '';
  sourceTypeLabels: any = {
    url: 'Website URL',
    text: 'Text Content',
    pdf: 'PDF Document',
    docx: 'Word Document',
    xlsx: 'Excel Spreadsheet',
    txt: 'Text File',
    csv: 'CSV File',
    png: 'PNG Image',
    jpg: 'JPEG Image',
    jpeg: 'JPEG Image',
    image: 'Image',
    word: 'Word Document',
    excel: 'Excel Spreadsheet'
  };
  
  allowedExtensions = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg';
  maxFileSize = 20 * 1024 * 1024; // 20MB
  
  // Test AI
  testMessage = '';
  testResponse: AITestResponse | null = null;
  testLoading = false;
  showPrompt = false;
  
  // Fallback assignment state
  userSearchQuery: string = '';
  filteredUsers: any[] = [];
  showUserDropdown: boolean = false;
  isLoadingUsers: boolean = false;
  selectedUserId: string | null = null;
  selectedUserName: string | null = null;
  
  // Toast notification
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;
  toastTimeout: any = null;

  // Loading states
  loading = false;
  saving = false;
  
  // Delete dialog - use ViewContainerRef to create component dynamically
  @ViewChild('deleteDialogContainer', { read: ViewContainerRef, static: false })
  deleteDialogContainer!: ViewContainerRef;
  deleteDialogRef: ComponentRef<ConfirmDialogComponent> | null = null;
  
  private subs: Subscription[] = [];
  
  constructor(
    private aiService: AIConfigService,
    private apiService: ApiService,
    private viewContainerRef: ViewContainerRef
  ) {}
  
  ngOnInit() {
    this.loadSettings();
  }
  
  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
    this.destroyDeleteDialog();
  }
  
  loadSettings() {
    this.loading = true;
    this.subs.push(
      this.aiService.getAISettings(this.clientId).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.settings = { ...this.settings, ...res.settings };
            this.stats = res.stats || this.stats;
            this.sources = res.sources || [];
          }
          this.loading = false;
          this.loadSources();
          // Load fallback assignment user after settings are loaded
          this.loadFallbackAssignment();
        },
        error: () => {
          this.loading = false;
        }
      })
    );
  }

  async loadFallbackAssignment() {
    try {
      const result: any = await this.aiService.getFallbackAssignment(this.clientId).toPromise();
      if (result && result.user_id) {
        this.selectedUserId = result.user_id;
        this.selectedUserName = result.user_name;
      }
    } catch (error) {
      console.error('Failed to load fallback assignment:', error);
    }
  }
  
  loadSources() {
    this.subs.push(
      this.aiService.getSources(this.clientId).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.sources = res.sources || [];
            this.stats.total_sources = this.sources.length;
            this.stats.ready_sources = this.sources.filter((s: any) => s.status === 'ready').length;
          }
        }
      })
    );
  }
  
  onTabChange(tabId: string) {
    this.activeTab = tabId;
    if (tabId === 'sources') {
      this.loadSources();
    }
  }
  
  // AI Toggle
  toggleAI() {
    this.settings.enabled = !this.settings.enabled;
    this.subs.push(
      this.aiService.toggleAI(this.clientId, this.settings.enabled).subscribe()
    );
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

  // Settings
  saveSettings() {
    this.saving = true;
    this.subs.push(
      this.aiService.updateSettings(this.clientId, this.settings).subscribe({
        next: () => {
          // Also save fallback assignment user
          this.aiService.updateFallbackAssignment(this.clientId, this.selectedUserId).subscribe({
            next: () => {
              this.saving = false;
              this.showToastMessage('Settings saved successfully!');
            },
            error: () => {
              this.saving = false;
              this.showToastMessage('Settings saved (but fallback assignment failed)', 'error');
            }
          });
        },
        error: () => {
          this.saving = false;
          this.showToastMessage('Failed to save settings', 'error');
        }
      })
    );
  }
  
  // Add Source
  isFileSourceType(): boolean {
    const fileTypes = ['pdf', 'docx', 'xlsx', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'image', 'word', 'excel'];
    return fileTypes.includes(this.newSource.source_type);
  }
  
  getAcceptFileTypes(): string {
    return this.allowedExtensions;
  }
  
  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'png', 'jpg', 'jpeg'];
      
      if (!allowedExts.includes(ext)) {
        this.uploadError = `Unsupported file type: .${ext}`;
        this.selectedFile = null;
        return;
      }
      
      if (file.size === 0) {
        this.uploadError = 'File is empty';
        this.selectedFile = null;
        return;
      }
      
      if (file.size > this.maxFileSize) {
        this.uploadError = `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 20MB`;
        this.selectedFile = null;
        return;
      }
      
      this.uploadError = '';
      this.selectedFile = file;
    }
  }
  
  addSource() {
    if (!this.newSource.name) {
      return;
    }
    
    this.isSubmitting = true;
    this.uploadProgress = 0;
    this.uploadError = '';
    
    if (this.isFileSourceType() && this.selectedFile) {
      const progressInterval = setInterval(() => {
        if (this.uploadProgress < 90) {
          this.uploadProgress += 10;
        }
      }, 500);
      
      const sourceType = this.selectedFile.name.split('.').pop()?.toLowerCase() || 'pdf';
      this.subs.push(
        this.aiService.uploadSource(this.clientId, this.newSource.name, sourceType, this.selectedFile).subscribe({
          next: () => {
            clearInterval(progressInterval);
            this.uploadProgress = 100;
            setTimeout(() => {
              this.resetAddSource();
              this.loadSources();
              this.showToastMessage('Source added successfully!');
            }, 500);
          },
          error: (err: any) => {
            clearInterval(progressInterval);
            this.uploadError = err.error?.detail || 'Upload failed';
            this.isSubmitting = false;
            this.showToastMessage('Failed to add source: ' + (err.error?.detail || 'Upload failed'), 'error');
          }
        })
      );
    } else if (this.newSource.source_type === 'url' && this.newSource.url) {
      this.subs.push(
        this.aiService.createSource(this.clientId, {
          name: this.newSource.name,
          source_type: 'url',
          url: this.newSource.url
        }).subscribe({
          next: () => {
            this.resetAddSource();
            this.loadSources();
            this.showToastMessage('Source added successfully!');
          },
          error: () => {
            this.isSubmitting = false;
            this.showToastMessage('Failed to add source', 'error');
          }
        })
      );
    } else if (this.newSource.source_type === 'text' && this.newSource.content) {
      this.subs.push(
        this.aiService.createSource(this.clientId, {
          name: this.newSource.name,
          source_type: 'text',
          content: this.newSource.content
        }).subscribe({
          next: () => {
            this.resetAddSource();
            this.loadSources();
            this.showToastMessage('Source added successfully!');
          },
          error: () => {
            this.isSubmitting = false;
            this.showToastMessage('Failed to add source', 'error');
          }
        })
      );
    }
  }
  
  private resetAddSource() {
    this.isSubmitting = false;
    this.uploadProgress = 0;
    this.uploadError = '';
    this.selectedFile = null;
    this.newSource = { name: '', source_type: 'url', url: '', content: '' };
    this.showAddSource = false;
  }
  
  browseFiles(event: any) {
    const fileInput = event.target?.previousElementSibling;
    if (fileInput) {
      fileInput.click();
    }
  }
  
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.add('drag-over');
  }
  
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
  }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
    
    const files = event.dataTransfer?.files;
    if (files?.length) {
      const file = files[0];
      this.newSource.source_type = 'pdf';
      const input = { target: { files: [file] } };
      this.onFileSelected(input);
    }
  }
  
  // Delete dialog management
  private createDeleteDialog(header: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.destroyDeleteDialog();
      
      // Create the component dynamically in the root view container
      const componentRef = this.viewContainerRef.createComponent(ConfirmDialogComponent);
      this.deleteDialogRef = componentRef;
      
      // Set inputs
      componentRef.instance.header = header;
      componentRef.instance.message = message;
      componentRef.instance.confirmText = 'Delete';
      componentRef.instance.cancelText = 'Cancel';
      componentRef.instance.dialogStyle = 'danger';
      
      // Subscribe to outputs
      componentRef.instance.confirmed.subscribe(() => {
        this.destroyDeleteDialog();
        resolve(true);
      });
      
      componentRef.instance.cancelled.subscribe(() => {
        this.destroyDeleteDialog();
        resolve(false);
      });
    });
  }
  
  private destroyDeleteDialog() {
    if (this.deleteDialogRef) {
      this.deleteDialogRef.destroy();
      this.deleteDialogRef = null;
    }
  }
  
  // Delete Source with optimistic UI update
  async deleteSource(source: any) {
    console.log('[AI Page] Delete clicked for source:', source.name, 'id:', source.id);
    
    const confirmed = await this.createDeleteDialog(
      'Delete Knowledge Source',
      `Are you sure you want to delete "${source.name}"? This action cannot be undone.`
    );
    
    console.log('[AI Page] Dialog result:', confirmed);
    if (!confirmed) {
      console.log('[AI Page] User cancelled delete - closing modal only');
      return;
    }
    
    // Optimistic UI update: remove immediately
    console.log('[AI Page] Performing optimistic UI update - removing source from list');
    const index = this.sources.indexOf(source);
    if (index !== -1) {
      this.sources.splice(index, 1);
      this.stats.total_sources = this.sources.length;
      this.stats.ready_sources = this.sources.filter((s: any) => s.status === 'ready').length;
    }
    
    // Call backend API
    console.log('[AI Page] Calling delete API for source:', source.id);
    this.subs.push(
      this.aiService.deleteSource(this.clientId, source.id).subscribe({
        next: (response: any) => {
          console.log('[AI Page] Delete API success:', response);
          this.loadSources();
        },
        error: (error: any) => {
          console.error('[AI Page] Delete API error:', error);
          this.loadSources(); // Reload to restore on failure
        }
      })
    );
  }
  
  rescrapeSource(sourceId: string) {
    console.log('[AI Page] Re-scraping source:', sourceId);
    this.subs.push(
      this.aiService.rescrapeSource(this.clientId, sourceId).subscribe()
    );
  }
  
  // Test AI
  onTestKeydown(event: any) {
    if (!event.shiftKey) {
      event.preventDefault();
      this.runTest();
    }
  }
  
  runTest() {
    if (!this.testMessage.trim()) return;
    
    this.testLoading = true;
    this.testResponse = null;
    
    this.subs.push(
      this.aiService.testAI(this.clientId, this.testMessage).subscribe({
        next: (res: AITestResponse) => {
          this.testResponse = res;
          this.testLoading = false;
        },
        error: () => {
          this.testLoading = false;
        }
      })
    );
  }
  
  // Fallback Assignment
  async loadAllUsers() {
    if (this.filteredUsers.length > 0) {
      this.showUserDropdown = !this.showUserDropdown;
      return;
    }
    
    this.isLoadingUsers = true;
    this.showUserDropdown = true;

    try {
      const result: any = await this.apiService.get(`v1/user/client?page=1&limit=100`).toPromise();
      
      const usersData = result?.data?.users || result?.users || [];
      this.filteredUsers = usersData.map((u: any) => ({
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name || '',
        email: u.email
      }));
    } catch (error) {
      console.error('Failed to load users:', error);
      this.filteredUsers = [];
    } finally {
      this.isLoadingUsers = false;
    }
  }

  selectUser(user: any) {
    this.selectedUserId = user.id;
    this.selectedUserName = `${user.first_name} ${user.last_name}`.trim();
    this.userSearchQuery = '';
    this.showUserDropdown = false;
  }

  clearSelectedUser() {
    this.selectedUserId = null;
    this.selectedUserName = null;
    this.userSearchQuery = '';
  }

  closeDropdown() {
    this.showUserDropdown = false;
  }

  getSecondInitial(name: string): string {
    const parts = name.split(' ');
    return parts.length > 1 && parts[1] ? parts[1].charAt(0) : '';
  }

  getFilteredUsers(): any[] {
    if (!this.userSearchQuery || !this.userSearchQuery.trim()) {
      return this.filteredUsers;
    }
    const query = this.userSearchQuery.toLowerCase().trim();
    return this.filteredUsers.filter(u => 
      (u.first_name + ' ' + u.last_name).toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  }

  getConfidencePercent(confidence: number): number {
    return Math.round(confidence * 100);
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'ready': return 'badge-success';
      case 'error': return 'badge-error';
      case 'scraping': return 'badge-warning';
      case 'pending': return 'badge-info';
      default: return 'badge-default';
    }
  }
}