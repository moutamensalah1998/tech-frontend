import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, filter } from 'rxjs';
import { UserService } from '../../../core/services/auth/user.service';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-info">
      <div *ngIf="userData; else loading">
        <h3>User Information</h3>
        <p><strong>Name:</strong> {{ userData.data?.first_name }} {{ userData.data?.last_name }}</p>
        <p><strong>Email:</strong> {{ userData.data?.email }}</p>
        <p><strong>Phone:</strong> {{ userData.data?.phone_number || 'Not provided' }}</p>
        <p><strong>Roles:</strong> {{ getRoles() }}</p>
        <p><strong>Teams:</strong> {{ getTeams() }}</p>
      </div>
      <ng-template #loading>
        <p>{{ loadingMessage }}</p>
      </ng-template>
    </div>
  `,
  styles: [`
    .user-info {
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin: 1rem 0;
    }
    .user-info h3 {
      margin-top: 0;
      color: #333;
    }
    .user-info p {
      margin: 0.5rem 0;
    }
  `]
})
export class UserInfoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  userData: any = null;
  loadingMessage = 'Loading user information...';

  constructor(private userService: UserService) {}

  ngOnInit() {
    // Single subscription to user data from store
    this.userService.getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(userData => {   
        if (userData && userData.data) {
          // User data exists, display it
          this.userData = userData;
          this.loadingMessage = 'Loading user information...';
        } else {
          // No user data in store, check if it's being loaded
          if (this.userService.isUserLoading()) {
            this.loadingMessage = 'User data is being loaded...';
          } else {
            this.loadingMessage = 'Loading user information...';
            this.userService.loadAndSetUser();
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getRoles(): string {
    if (!this.userData?.data?.roles) return 'No roles assigned';
    return this.userData.data.roles.map((role: any) => role.role_name).join(', ');
  }

  getTeams(): string {
    if (!this.userData?.data?.teams) return 'No teams assigned';
    return this.userData.data.teams.map((team: any) => team.name).join(', ');
  }
} 