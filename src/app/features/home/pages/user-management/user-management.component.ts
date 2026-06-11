import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { User, Team } from '../../../../core/models/user-management.model';
import { UserManagementTableComponent } from "./components/user-management-table/user-management-table.component";
import { CreateUserDialogComponent } from "./components/create-user-dialog/create-user-dialog.component";
import { EditUserDialogComponent } from "./components/edit-user-dialog/edit-user-dialog.component";
import { AddTeamComponent } from "./components/add-team/add-team.component";
import { EditTeamComponent } from "./components/edit-team/edit-team.component";
import { ConfirmDialogComponent } from "../../../../shared/components/confirm-dialog/confirm-dialog.component";
import { SharedSidebarComponent, NavigationItem } from "../../../../shared/components/shared-sidebar/shared-sidebar.component";
import { deleteTeam, loadTeams, loadUsers } from '../../../../core/services/user-management/ngrx/user-management.actions';
import {
  selectUsersData,
  selectTeamsData
} from '../../../../core/services/user-management/ngrx/user-management.selectors';
import { UserManagementHeaderComponent } from "./components/user-management-header/user-management-header.component";
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-user-dashboard-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UserManagementTableComponent,
    CreateUserDialogComponent,
    EditUserDialogComponent,
    AddTeamComponent,
    EditTeamComponent,
    ConfirmDialogComponent,
    SharedSidebarComponent,
    UserManagementHeaderComponent,
    TranslatePipe
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
})
export class UserDashboardTableComponent implements OnInit, OnDestroy {
  activeTab: 'users' | 'teams' = 'users';
  user?: User;
  team?: Team;
  createUserDialog = false;
  editUserDialog = false;
  addTeamDialog = false;
  editTeamDialog = false;
  searchQuery = '';
  deleteTeamDialog = false;
  teamName = '';
  sidebarOpen = true;
  sortQuery: string | null = null;

  users$: Observable<User[]>;
  teams$: Observable<Team[]>;

  navigationItems: NavigationItem[] = [
    {
      label: 'userManagement.navigation.users',
      translateLabel: true,
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                     d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
             </svg>`,
      routerLink: '/user-management',
      exact: true
    },
    {
      label: 'userManagement.navigation.teams',
      translateLabel: true,
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                     d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
             </svg>`,
      routerLink: '/user-management',
      exact: true
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.users$ = this.store.select(selectUsersData);
    this.teams$ = this.store.select(selectTeamsData);
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const tab = params['tab'];
        if (tab === 'teams') {
          this.activeTab = 'teams';
          this.loadTeams();
        } else {
          this.activeTab = 'users';
          this.loadUsers();
        }
      });

    // Load initial data
    this.loadInitialData();
  }

  private loadInitialData(): void {
    if (this.activeTab === 'teams') {
      this.loadTeams();
    } else {
      this.loadUsers();
    }
  }

  onSidebarToggled(isOpen: boolean): void {
    this.sidebarOpen = isOpen;
  }

  onTabChanged(newTab: 'users' | 'teams') {
    this.activeTab = newTab;
    this.searchQuery = '';
    this.sortQuery = null;

    const queryParams = newTab === 'teams' ? { tab: 'teams' } : {};
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });

    if (this.activeTab === 'teams') {
      this.loadTeams();
    } else {
      this.loadUsers();
    }
  }

  onNavigationItemClicked(event: {item: NavigationItem, index: number}): void {
    if (event.index === 0) {
      this.onTabChanged('users');
    } else if (event.index === 1) {
      this.onTabChanged('teams');
    }
  }

  createUserDialogHandler() {
    this.createUserDialog = !this.createUserDialog;
  }

  editUserDialogHandler() {
    this.editUserDialog = !this.editUserDialog;
  }

  addTeamDialogHandler() {
    this.addTeamDialog = !this.addTeamDialog;
  }

  editTeamDialogHandler() {
    this.editTeamDialog = !this.editTeamDialog;
  }

  editUserClick(user: User) {
    this.user = user;
    this.editUserDialog = true;
  }

  editTeamClick(team: Team) {
    this.team = team;
    this.editTeamDialog = true;
  }


  onSearchChange(event: string | { value?: string } | null | undefined) {
    let query = '';

    if (!event) {
      query = '';
    } else if (typeof event === 'string') {
      query = event.trim();
    } else if ((event as any).value !== undefined) {
      query = ((event as any).value ?? '').toString().trim();
    } else {
      query = String(event).trim();
    }

    this.searchQuery = query;

    if (this.activeTab === 'teams') {
      this.loadTeams();
    } else {
      this.loadUsers();
    }
  }


  onSortChanged(event: string | null | { value?: string } | undefined) {
    let sortVal: string | null = null;

    if (!event) {
      sortVal = null;
    } else if (typeof event === 'string') {
      sortVal = event.trim() === '' ? null : event.trim();
    } else if ((event as any).value !== undefined) {
      const v = (event as any).value;
      sortVal = v ? (v.toString().trim() || null) : null;
    } else {
      const s = String(event).trim();
      sortVal = s === '' ? null : s;
    }

    this.sortQuery = sortVal;

    if (this.activeTab === 'teams') {
      this.loadTeams();
    } else {
      this.loadUsers();
    }
  }

  loadUsers() {
    this.store.dispatch(loadUsers({
      query: this.searchQuery === '' ? '' : this.searchQuery,
      page: 1,
      limit: 10,
      sort: this.sortQuery ?? null
    }));
  }

  loadTeams() {
    this.store.dispatch(loadTeams({
      query: this.searchQuery === '' ? '' : this.searchQuery,
      page: 1,
      limit: 10,
      sort: this.sortQuery ?? null
    }));
  }

  deleteTeamDialogHandler(teamName: string) {
    this.deleteTeamDialog = !this.deleteTeamDialog;
    this.teamName = teamName;
  }

  confirmDeleteTeam(): void {
    this.store.dispatch(deleteTeam({ teamName: this.teamName }));
    this.deleteTeamDialog = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
