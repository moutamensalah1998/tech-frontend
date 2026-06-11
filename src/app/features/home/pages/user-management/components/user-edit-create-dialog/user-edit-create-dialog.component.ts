import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EditUserModel, Role, Team, User } from '../../../../../../core/models/user-management.model';
import { selectAllRoles, selectTeamsData, selectTeamsPagination } from '../../../../../../core/services/user-management/ngrx/user-management.selectors';
import { loadRoles, loadTeams, updateUser } from '../../../../../../core/services/user-management/ngrx/user-management.actions';
import { Observable } from 'rxjs';
import { CreateUserFormService } from '../create-user-dialog/create-user-form.service';
import { FormValidationUtils } from '../../../../../../utils/form-validation.utils';
import { PaginationData } from '../../../../../../core/models/pagination.model';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-user-edit-create-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './user-edit-create-dialog.component.html',
  styleUrl: './user-edit-create-dialog.component.css',
  providers: [CreateUserFormService],
})
export class UserEditCreateDialogComponent implements OnInit, OnChanges {
  @Input() user?: User | null;
  @Input({ required: true }) actionSelected!: 'edit-user' | 'create-user';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<User>();

  roles$: Observable<Role[]>;
  teams$: Observable<Team[]>;
  teamsPagination$: Observable<PaginationData>;

  selectedRoles: Role[] = [];
  selectedTeams: Team[] = [];

  showRolesDropdown = false;
  showTeamsDropdown = false;
  
  editCreateUserForm!: FormGroup;
  internalUser!: User;
  public formUtils = FormValidationUtils;


  constructor(private store: Store) {
    this.roles$ = this.store.select(selectAllRoles);
    this.teams$ = this.store.select(selectTeamsData);
    this.teamsPagination$ = this.store.select(selectTeamsPagination);
  }

  ngOnInit(): void {
    this.initializeUser();
    this.loadData();
    this.initializeSelections();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['actionSelected'] || changes['user']) {
      this.initializeUser();
      this.initializeSelections();
    }
  }

  private initializeUser(): void {
    if (this.actionSelected === 'create-user') {
      this.internalUser = this.initializeEmptyUser();
    } else {
      this.internalUser = { ...this.user } as User;
    }
  }

  private initializeEmptyUser(): User {
    return {
      id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      online_status: false,
      is_base_admin: false,
      roles: [],
      teams: [],
      password: ''
    };
  }

  private initializeSelections(): void {
    this.selectedTeams = [...this.internalUser?.teams || []];
    this.selectedRoles = [...this.internalUser?.roles || []];
  }

  private loadData(): void {
    this.store.dispatch(loadRoles());
    this.store.dispatch(loadTeams({ query: '', page: 1, limit: 5 }));
  }

  onSubmit(): void {
    const updatedUser: User = {
      ...this.internalUser,
      roles: this.selectedRoles,
      teams: this.selectedTeams
    };
    this.save.emit(updatedUser);
  }

  closeDialog(): void {
    this.internalUser = this.initializeEmptyUser();
    this.selectedRoles = [];
    this.selectedTeams = [];
    this.close.emit();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const dialogElement = document.querySelector('.dialog-container');
    if (dialogElement && !dialogElement.contains(event.target as Node)) {
      this.closeDialog();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(): void {
    this.closeDialog();
  }

  toggleRolesDropdown(): void {
    this.showRolesDropdown = !this.showRolesDropdown;
    this.showTeamsDropdown = false;
  }

  toggleTeamsDropdown(): void {
    this.showTeamsDropdown = !this.showTeamsDropdown;
    this.showRolesDropdown = false;
  }

  selectRole(role: Role): void {
    if (!this.selectedRoles.some(r => r.id === role.id)) {
      this.selectedRoles.push(role);
    }
    this.showRolesDropdown = false;
  }

  selectTeam(team: Team): void {
    if (!this.selectedTeams.some(t => t.id === team.id)) {
      this.selectedTeams.push(team);
    }
    this.showTeamsDropdown = false;
  }

  removeRole(role: Role): void {
    this.selectedRoles = this.selectedRoles.filter(r => r.id !== role.id);
  }

  removeTeam(team: Team): void {
    this.selectedTeams = this.selectedTeams.filter(t => t.id !== team.id);
  }

  editUser() {
    let user: EditUserModel = {
      first_name: this.internalUser.first_name,
      last_name: this.internalUser.last_name,
      email: this.internalUser.email,
      phone_number: this.internalUser.phone_number,
      roles: this.selectedRoles.map(role => role.id),
      teams: this.selectedTeams.map(team => team.id)
    }

    this.store.dispatch(updateUser({ userId: this.internalUser.id, user: user }));
  }

  submitButtonAction() {
    if (this.actionSelected === 'create-user') {

    } else {
      this.editUser();
    }
  }

  getRoleTranslationKey(role: any): string {
    const value = typeof role === 'string'
      ? role
      : role?.role_name ?? role?.name ?? '';
    return value ? `rolesMap.${value}` : '';
  }
}