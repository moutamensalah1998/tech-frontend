import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Role, Team, User } from '../../../../../../core/models/user-management.model';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectAllRoles, selectTeamsData, selectTeamsPagination } from '../../../../../../core/services/user-management/ngrx/user-management.selectors';
import { loadRoles, loadTeams, updateUser, updateUserSuccess, loadUsers } from '../../../../../../core/services/user-management/ngrx/user-management.actions';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CreateUserFormService } from '../create-user-dialog/create-user-form.service';
import { FormValidationUtils } from '../../../../../../utils/form-validation.utils';
import { PaginationData } from '../../../../../../core/models/pagination.model';
import { countries } from '../../../../../../utils/countries';
import { Actions, ofType } from '@ngrx/effects';
import parsePhoneNumberFromString from 'libphonenumber-js';
import { selectAuthUser } from '../../../../../../core/services/auth/ngrx/auth.selector';
import { take } from 'rxjs/operators';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './edit-user-dialog.component.html',
  styleUrl: './edit-user-dialog.component.css'
})
export class EditUserDialogComponent implements OnInit {

  @Input() user!: User;
  @Output() close = new EventEmitter<void>();

  selectedRoles: Role[] = [];
  selectedTeams: Team[] = [];
  showRolesDropdown = false;
  showTeamsDropdown = false;
  countries = countries;
  roles$!: Observable<Role[]>;
  teams$!: Observable<Team[]>;
  teamsPagination$!: Observable<PaginationData>;
  currentUser$ = this.store.select(selectAuthUser);

  editUserForm!: FormGroup;
  formValidationUtils = FormValidationUtils;

  // Track original values for change detection
  private originalValues: any = {};

  constructor(private store: Store, private createUserFormService: CreateUserFormService, private actions$: Actions) {
    this.roles$ = this.store.select(selectAllRoles);
    this.teams$ = this.store.select(selectTeamsData);
    this.teamsPagination$ = this.store.select(selectTeamsPagination);
  }

  ngOnInit(): void {
    this.editUserForm = this.createUserFormService.createForm();
    this.loadData();
    this.initializeFormWithUserData();
    // Disable email field for editing
    this.editUserForm.get('email')?.disable();
  }

  private loadData(): void {
    this.store.dispatch(loadRoles());
    this.store.dispatch(loadTeams({ query: '', page: 1, limit: 5 }));
  }

  private initializeFormWithUserData(): void {
    // Parse phone number to get country code and phone number
    const phoneData = this.parsePhoneNumber(this.user.phone_number);

    this.editUserForm.patchValue({
      firstName: this.user.first_name,
      lastName: this.user.last_name,
      email: this.user.email,
      countryCode: phoneData.countryCode,
      phoneNumber: phoneData.phoneNumber
    });

    // Initialize selected roles and teams
    this.selectedRoles = [...this.user.roles];
    this.selectedTeams = [...this.user.teams];

    // Store original values for change detection
    this.originalValues = {
      firstName: this.user.first_name,
      lastName: this.user.last_name,
      email: this.user.email,
      countryCode: phoneData.countryCode,
      phoneNumber: phoneData.phoneNumber,
      roles: this.user.roles.map(r => r.id),
      teams: this.user.teams.map(t => t.id)
    };
  }

  // Check if target user has administrator role
  targetUserHasAdminRole(): boolean {
    return this.user?.roles?.some((role: any) => role.role_name === 'ADMINISTRATOR') || false;
  }

  // Check if current user is base admin
  isBaseAdmin(currentUser: any): boolean {
    return currentUser?.is_base_admin === true;
  }

  // Check if role editing should be disabled
  isRoleEditingDisabled(currentUser: any): boolean {
    return this.targetUserHasAdminRole() && !this.isBaseAdmin(currentUser);
  }

  private parsePhoneNumber(phoneNumberString: string): { countryCode: string; phoneNumber: string } {
    try {
      const phoneNumber = parsePhoneNumberFromString(phoneNumberString);
      if (phoneNumber) {
        return {
          countryCode: phoneNumber.country || 'US',
          phoneNumber: phoneNumber.nationalNumber || phoneNumberString
        };
      }
    } catch (e) {
      // If parsing fails, return default values
    }

    // Default fallback
    return {
      countryCode: 'US',
      phoneNumber: phoneNumberString
    };
  }

  toggleRolesDropdown(): void {
    // Check if role editing is disabled for the current user
    this.currentUser$.pipe(take(1)).subscribe(currentUser => {
      if (!this.isRoleEditingDisabled(currentUser)) {
        this.showRolesDropdown = !this.showRolesDropdown;
        if (this.showRolesDropdown) {
          this.showTeamsDropdown = false;
        }
      }
    });
  }

  toggleTeamsDropdown(): void {
    this.showTeamsDropdown = !this.showTeamsDropdown;
    this.showRolesDropdown = false;
  }

  selectRole(role: Role): void {
    // Check if role editing is disabled for the current user
    this.currentUser$.pipe(take(1)).subscribe(currentUser => {
      if (!this.isRoleEditingDisabled(currentUser)) {
        if (!this.selectedRoles.some(r => r.id === role.id)) {
          this.selectedRoles.push(role);
          this.editUserForm.patchValue({ role: this.selectedRoles.map(r => r.id) });
        }
        this.showRolesDropdown = false;
      }
    });
  }

  selectTeam(team: Team): void {
    if (!this.selectedTeams.some(t => t.id === team.id)) {
      this.selectedTeams.push(team);
      this.editUserForm.patchValue({ team: this.selectedTeams.map(t => t.id) });
    }
    this.showTeamsDropdown = false;
  }

  removeRole(role: Role): void {
    // Check if role editing is disabled for the current user
    this.currentUser$.pipe(take(1)).subscribe(currentUser => {
      if (!this.isRoleEditingDisabled(currentUser)) {
        this.selectedRoles = this.selectedRoles.filter(r => r.id !== role.id);
        this.editUserForm.patchValue({ role: this.selectedRoles.map(r => r.id) });
      }
    });
  }

  removeTeam(team: Team): void {
    this.selectedTeams = this.selectedTeams.filter(t => t.id !== team.id);
    this.editUserForm.patchValue({ team: this.selectedTeams.map(t => t.id) });
  }

  onSubmit() {
    // Enable email field temporarily to get its value, then disable it again
    const emailControl = this.editUserForm.get('email');
    emailControl?.enable();
    const emailValue = emailControl?.value;
    emailControl?.disable();

    if (this.canSubmit()) {
      this.store.dispatch(updateUser({
        userId: this.user.id,
        user: {
          first_name: this.editUserForm.value.firstName,
          last_name: this.editUserForm.value.lastName,
          email: emailValue,
          phone_number: this.createUserFormService.getPhoneNumber(this.editUserForm.value),
          roles: this.editUserForm.value.role,
          teams: this.editUserForm.value.team,
        }
      }));

      this.actions$.pipe(
        ofType(updateUserSuccess),
      ).subscribe(() => {
        this.store.dispatch(
          loadUsers({ query: '', page: 1, limit: 5 })
        )
      });
      this.closeDialog();
    } else {
      this.editUserForm.markAllAsTouched();
    }
  }

  closeDialog(): void {
    this.selectedRoles = [];
    this.selectedTeams = [];
    this.close.emit();
  }

  @HostListener('document:keydown.escape', [])
  onEscapeKey(): void {
    this.closeDialog();
  }

  // Check if form has changes
  hasChanges(): boolean {
    const currentValues = {
      firstName: this.editUserForm.value.firstName,
      lastName: this.editUserForm.value.lastName,
      email: this.user.email, // Email is disabled, so use original
      countryCode: this.editUserForm.value.countryCode,
      phoneNumber: this.editUserForm.value.phoneNumber,
      roles: this.selectedRoles.map(r => r.id),
      teams: this.selectedTeams.map(t => t.id)
    };

    return JSON.stringify(currentValues) !== JSON.stringify(this.originalValues);
  }

  // Check if form is valid and has changes
  canSubmit(): boolean {
    return this.selectedRoles.length > 0 &&
           this.selectedTeams.length > 0 &&
           this.hasChanges();
  }

  getRoleTranslationKey(role: any): string {
    const value = typeof role === 'string'
      ? role
      : role?.role_name ?? role?.name ?? '';
    return value ? `rolesMap.${value}` : '';
  }
}
