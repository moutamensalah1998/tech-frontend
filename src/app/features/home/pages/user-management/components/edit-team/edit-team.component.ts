import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Team, User } from '../../../../../../core/models/user-management.model';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { updateTeam, updateTeamSuccess, loadTeams, loadUsers } from '../../../../../../core/services/user-management/ngrx/user-management.actions';
import { selectAllUsers } from '../../../../../../core/services/user-management/ngrx/user-management.selectors';
import { Actions, ofType } from '@ngrx/effects';
import { ChipListComponent } from '../../../../../../shared/components/chip-list/chip-list.component';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-edit-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ChipListComponent, TranslatePipe],
  templateUrl: './edit-team.component.html',
  styleUrls: ['./edit-team.component.css']
})
export class EditTeamComponent {
  @Input() team!: Team;
  @Output() close = new EventEmitter<void>();

  teamForm: FormGroup;
  users$: Observable<User[]>;
  selectedUsers: User[] = [];
  allUsers: User[] = [];

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private actions$: Actions
  ) {
    this.users$ = this.store.select(selectAllUsers).pipe(
      map(response => response)
    );
    this.teamForm = this.fb.group({
      teamName: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.teamForm.patchValue({
      teamName: this.team.name
    });
    this.store.dispatch(loadUsers({ query: '', page: 1, limit: 1000 }));
    this.users$.subscribe(users => {
      this.allUsers = users;
      this.selectedUsers = this.team.users.map(teamUser =>
        users.find(u => u.id === teamUser.id) || {
          ...teamUser,
          email: '',
          phone_number: '',
          online_status: false,
          is_base_admin: false,
          roles: [],
          teams: [],
          password: null
        }
      );
    });
  }

  onSelectedUsersChange(users: User[]): void {
    this.selectedUsers = users;
  }

  onSubmit(): void {
    if (this.teamForm.valid) {
      const updateModel = {
        name: this.teamForm.value.teamName,
        user_ids: this.selectedUsers.map(u => u.id)
      };
      this.store.dispatch(updateTeam({ teamId: this.team.id, team: updateModel }));
      this.actions$.pipe(
        ofType(updateTeamSuccess),
      ).subscribe(() => {
        this.store.dispatch(
          loadTeams({ query: '', page: 1, limit: 5 })
        );
        this.closeDialog();
      });
    }
  }

  onCancel(): void {
    this.closeDialog();
  }

  closeDialog(): void {
    this.close.emit();
  }
}
