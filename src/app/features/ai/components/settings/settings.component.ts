import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIConfigService } from '../../services/ai-config.service';
import { AISettings, UserSearchResult } from '../../models/ai-config.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  @Input() clientId: string = '';
  @Input() settings: AISettings | null = null;
  @Input() onSettingsUpdated: (settings: Partial<AISettings>) => void = () => {};
  
  localSettings: AISettings = {
    enabled: true,
    auto_reply_enabled: true,
    auto_actions_enabled: true,
    confidence_threshold: 0.7,
    fallback_message: "I don't have enough information. A human agent will assist you shortly.",
    model: 'qwen2.5:0.5b'
  };
  isSaving = false;

  // Toast notification
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;
  toastTimeout: any = null;

  // Fallback assignment state
  userSearchQuery: string = '';
  allUsers: UserSearchResult[] = [];
  filteredUsers: UserSearchResult[] = [];
  showUserDropdown: boolean = false;
  isLoadingUsers: boolean = false;
  selectedUserId: string | null = null;
  selectedUserName: string | null = null;

  constructor(private aiService: AIConfigService) {}

  ngOnInit() {
    if (this.settings) {
      this.localSettings = { ...this.settings };
    }
    this.loadFallbackAssignment();
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

  async onUserSearchInput() {
    const query = this.userSearchQuery.trim();
    if (query.length < 1) {
      this.filteredUsers = [];
      this.showUserDropdown = false;
      return;
    }

    this.isLoadingUsers = true;
    this.showUserDropdown = true;

    try {
      // Search users via the user management API
      const result: any = await this.aiService['http']
        .get(`/api/v1/user/client?query=${encodeURIComponent(query)}&page=1&limit=10`)
        .toPromise();
      
      // Response is wrapped in ApiResponse: { success, data: { users: [...], total_count, ... } }
      const usersData = result?.data?.users || result?.users || [];
      if (usersData.length > 0) {
        this.filteredUsers = usersData.map((u: any) => ({
          id: u.id,
          first_name: u.first_name,
          last_name: u.last_name || '',
          email: u.email
        }));
      } else {
        this.filteredUsers = [];
      }
    } catch (error) {
      console.error('Failed to search users:', error);
      this.filteredUsers = [];
    } finally {
      this.isLoadingUsers = false;
    }
  }

  selectUser(user: UserSearchResult) {
    this.selectedUserId = user.id;
    this.selectedUserName = `${user.first_name} ${user.last_name}`.trim();
    this.userSearchQuery = '';
    this.showUserDropdown = false;
    this.filteredUsers = [];
  }

  clearSelectedUser() {
    this.selectedUserId = null;
    this.selectedUserName = null;
    this.userSearchQuery = '';
  }

  async saveSettings() {
    this.isSaving = true;
    try {
      // Save AI settings (including fallback_message)
      await this.aiService.updateSettings(this.clientId, this.localSettings).toPromise();
      
      // Save fallback assignment
      await this.aiService.updateFallbackAssignment(this.clientId, this.selectedUserId).toPromise();
      
      this.onSettingsUpdated(this.localSettings);
      this.showToastMessage('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showToastMessage('Failed to save settings', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  resetSettings() {
    if (this.settings) {
      this.localSettings = { ...this.settings };
    }
    this.loadFallbackAssignment();
  }
}
