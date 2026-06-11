import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { Role, Team } from '../../../../../../core/models/user-management.model';
import { Observable, Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectAllRoles, selectTeamsData, selectTeamsPagination } from '../../../../../../core/services/user-management/ngrx/user-management.selectors';
import { createUser, createUserSuccess, loadRoles, loadTeams, loadUsers } from '../../../../../../core/services/user-management/ngrx/user-management.actions';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CreateUserFormService } from './create-user-form.service';
import { FormValidationUtils } from '../../../../../../utils/form-validation.utils';
import { PaginationData } from '../../../../../../core/models/pagination.model';
import { countries } from '../../../../../../utils/countries';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntil } from 'rxjs/operators';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-create-user-dialog',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './create-user-dialog.component.html',
  styleUrl: './create-user-dialog.component.css'
})
export class CreateUserDialogComponent implements OnInit, OnDestroy {

  @Output() close = new EventEmitter<void>();

  selectedRoles: Role[] = [];
  selectedTeams: Team[] = [];
  showRolesDropdown = false;
  showTeamsDropdown = false;
  countries = countries;
  roles$!: Observable<Role[]>;
  teams$!: Observable<Team[]>;
  teamsPagination$!: Observable<PaginationData>;

  createUserForm!: FormGroup;
  formValidationUtils = FormValidationUtils;
  private destroy$ = new Subject<void>();
  formSubmitted = false;
  showPassword = false;

  constructor(private store: Store, private createUserFormService: CreateUserFormService, private actions$: Actions) {
    this.roles$ = this.store.select(selectAllRoles);
    this.teams$ = this.store.select(selectTeamsData);
    this.teamsPagination$ = this.store.select(selectTeamsPagination);
  }
  ngOnInit(): void {
    this.createUserForm = this.createUserFormService.createForm();
    this.loadData();
    document.addEventListener('keydown', this.handleDocumentKeydown);
  }

  private loadData(): void {
    this.store.dispatch(loadRoles());
    this.store.dispatch(loadTeams({ query: '', page: 1, limit: 5 }));
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
      this.createUserForm.patchValue({ role: this.selectedRoles.map(r => r.id) });
    }
    this.showRolesDropdown = false;
  }

  selectTeam(team: Team): void {
    if (!this.selectedTeams.some(t => t.id === team.id)) {
      this.selectedTeams.push(team);
      this.createUserForm.patchValue({ team: this.selectedTeams.map(t => t.id) });
    }
    this.showTeamsDropdown = false;
  }

  removeRole(role: Role): void {
    this.selectedRoles = this.selectedRoles.filter(r => r.id !== role.id);
    this.createUserForm.patchValue({ role: this.selectedRoles.map(r => r.id) });
    // Mark as touched to show validation errors if array becomes empty
    this.createUserForm.get('role')?.markAsTouched();
  }

  removeTeam(team: Team): void {
    this.selectedTeams = this.selectedTeams.filter(t => t.id !== team.id);
    this.createUserForm.patchValue({ team: this.selectedTeams.map(t => t.id) });
    // Mark as touched to show validation errors if array becomes empty
    this.createUserForm.get('team')?.markAsTouched();
  }

  onSubmit() {
    this.formSubmitted = true;
    // Mark all fields as touched to show validation errors
    FormValidationUtils.validateAllFormFields(this.createUserForm);

    if (this.createUserForm.valid && this.selectedRoles.length > 0 && this.selectedTeams.length > 0) {
      this.store.dispatch(createUser({
        user: {
          first_name: this.createUserForm.value.firstName,
          last_name: this.createUserForm.value.lastName,
          email: this.createUserForm.value.email,
          phone_number: this.createUserFormService.getPhoneNumber(this.createUserForm.value),
          password: this.createUserForm.value.password,
          role_id: this.createUserForm.value.role,
          team_id: this.createUserForm.value.team,
        }
      }));

      // Use takeUntil to prevent memory leaks
      this.actions$.pipe(
        ofType(createUserSuccess),
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.store.dispatch(
          loadUsers({ query: '', page: 1, limit: 5 })
        );
        this.closeDialog();
      });
    }
  }

  get isSubmitDisabled(): boolean {
    return this.createUserForm.invalid || this.selectedRoles.length === 0 || this.selectedTeams.length === 0;
  }

  get showRoleError(): boolean {
    return this.selectedRoles.length === 0 && (this.formSubmitted || this.createUserForm.get('role')?.touched || false);
  }

  get showTeamError(): boolean {
    return this.selectedTeams.length === 0 && (this.formSubmitted || this.createUserForm.get('team')?.touched || false);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  closeDialog(): void {
    this.selectedRoles = [];
    this.selectedTeams = [];
    this.formSubmitted = false;
    this.createUserForm.reset();
    this.close.emit();
  }

  private handleDocumentKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' || event.key === 'Esc') {
      this.closeDialog();
    }
  };

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleDocumentKeydown);
    this.destroy$.next();
    this.destroy$.complete();
  }

  getRoleTranslationKey(role: any): string {
    const value = typeof role === 'string'
      ? role
      : role?.role_name ?? role?.name ?? '';
    return value ? `rolesMap.${value}` : '';
  }
}
