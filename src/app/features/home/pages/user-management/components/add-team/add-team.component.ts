import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { createTeam, createTeamSuccess, loadTeams } from '../../../../../../core/services/user-management/ngrx/user-management.actions';
import { Actions, ofType } from '@ngrx/effects';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-add-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './add-team.component.html',
  styleUrls: ['./add-team.component.css']
})
export class AddTeamComponent {
  teamForm: FormGroup;
  @Output() close = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private actions$: Actions
  ) {
    this.teamForm = this.fb.group({
      teamName: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.teamForm.valid) {
      const teamName = this.teamForm.value.teamName;

      this.store.dispatch(createTeam({ teamName }));

      this.actions$.pipe(
        ofType(createTeamSuccess),
      ).subscribe(() => {
        this.store.dispatch(
          loadTeams({ query: '', page: 1, limit: 5 })
        );

      });
    }
    this.closeDialog();
  }

  onCancel(): void {
    this.closeDialog();
  }

  closeDialog(): void {
    this.close.emit();
  }
}
