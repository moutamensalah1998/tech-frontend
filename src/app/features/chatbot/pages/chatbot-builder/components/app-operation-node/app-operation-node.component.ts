import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BaseNodeComponent } from '../base/base-node.component';
import { DragDropService } from './../../services/drag-drop.service';
import { NodeManagementService } from './../../services/node-management.service';
import { SelectionService } from './../../services/selection.service';
import { ConnectionButtonComponent } from './../../shared/connection-button.component';
import { NodeHeaderComponent } from './../../shared/node-header/node-header.component';
import { UserManagementService } from '../../../../../../core/services/user-management/user-management.service';

export type OperationType = 'assign_user' | 'assign_team';

interface UserOption {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface TeamOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-operation-node',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ConnectionButtonComponent,
    NodeHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-operation-node.component.html',
  styleUrls: ['./app-operation-node.component.css'],
})
export class OperationNodeComponent extends BaseNodeComponent implements OnInit, OnDestroy {
  private localDestroy$ = new Subject<void>();

  users: UserOption[] = [];
  teams: TeamOption[] = [];
  isLoadingUsers = false;
  isLoadingTeams = false;

  operationForm = new FormGroup({
    operationType: new FormControl<OperationType>('assign_user', { nonNullable: true }),
    userId: new FormControl<string>('', { nonNullable: true }),
    teamId: new FormControl<string>('', { nonNullable: true }),
  });

  // Track editing state for Save/Cancel
  isEditing = false;
  private originalFormValues: {
    operationType: OperationType;
    userId: string;
    teamId: string;
  } | null = null;

  constructor(
    dragDropService: DragDropService,
    nodeManagementService: NodeManagementService,
    override cdr: ChangeDetectorRef,
    selectionService: SelectionService,
    private userManagementService: UserManagementService,
  ) {
    super(dragDropService, nodeManagementService, cdr, selectionService);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadUsers();
    this.loadTeams();
  }

  override ngOnDestroy(): void {
    this.localDestroy$.next();
    this.localDestroy$.complete();
    super.ngOnDestroy();
  }

  protected initializeNode(): void {
    const body = this.node.body as any;
    if (body?.service_hook) {
      const hook = body.service_hook;
      const opType = (hook.service_type === 'assign_team' ? 'assign_team' : 'assign_user') as OperationType;
      this.operationForm.setValue(
        {
          operationType: opType,
          userId: hook.user_id || '',
          teamId: hook.team_id || '',
        },
        { emitEvent: false },
      );
    } else {
      // Initialize default service hook in the body
      (this.node.body as any).service_hook = {
        service_type: 'assign_user',
        service_action: 'assign_user',
      };
    }
  }

  protected validateContent(): boolean {
    const formValue = this.operationForm.value;
    const operationType = formValue.operationType || 'assign_user';

    if (operationType === 'assign_user') {
      return !!(formValue.userId && formValue.userId.length > 0);
    } else if (operationType === 'assign_team') {
      return !!(formValue.teamId && formValue.teamId.length > 0);
    }
    return false;
  }

  protected getNodeDisplayName(): string {
    const formValue = this.operationForm.value;
    if (formValue.operationType === 'assign_user' && formValue.userId) {
      const user = this.users.find(u => u.id === formValue.userId);
      return user ? `Assign to ${user.first_name || user.email}` : `Assign User (${formValue.userId.substring(0, 8)})`;
    }
    if (formValue.operationType === 'assign_team' && formValue.teamId) {
      const team = this.teams.find(t => t.id === formValue.teamId);
      return team ? `Assign to ${team.name}` : `Assign Team (${formValue.teamId.substring(0, 8)})`;
    }
    return 'Operation Node';
  }

  // ---- Data Loading ----

  private loadUsers(): void {
    this.isLoadingUsers = true;
    this.userManagementService
      .getUsers(null, 1, 100)
      .pipe(takeUntil(this.localDestroy$))
      .subscribe({
        next: (response) => {
          // Handle different response shapes safely
          const data = response?.data || response;
          if (data?.users && Array.isArray(data.users)) {
            this.users = data.users.map((u: any) => ({
              id: u.id || '',
              email: u.email || '',
              first_name: u.first_name || '',
              last_name: u.last_name || '',
            }));
          } else if (Array.isArray(data)) {
            this.users = data.map((u: any) => ({
              id: u.id || '',
              email: u.email || '',
              first_name: u.first_name || '',
              last_name: u.last_name || '',
            }));
          } else {
            this.users = [];
          }
          this.isLoadingUsers = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.users = [];
          this.isLoadingUsers = false;
          this.cdr.markForCheck();
        },
      });
  }

  private loadTeams(): void {
    this.isLoadingTeams = true;
    this.userManagementService
      .getTeams(null, 1, 100)
      .pipe(takeUntil(this.localDestroy$))
      .subscribe({
        next: (response) => {
          // Handle different response shapes safely
          const data = response?.data || response;
          if (data?.teams && Array.isArray(data.teams)) {
            this.teams = data.teams.map((t: any) => ({
              id: t.id || '',
              name: t.name || '',
            }));
          } else if (Array.isArray(data)) {
            this.teams = data.map((t: any) => ({
              id: t.id || '',
              name: t.name || '',
            }));
          } else {
            this.teams = [];
          }
          this.isLoadingTeams = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.teams = [];
          this.isLoadingTeams = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ---- Event Handlers ----

  onOperationTypeChange(): void {
    // Reset the other field when switching types
    const currentType = this.operationForm.controls.operationType.value;
    if (currentType === 'assign_user') {
      this.operationForm.controls.teamId.setValue('', { emitEvent: false });
    } else {
      this.operationForm.controls.userId.setValue('', { emitEvent: false });
    }
    this.emitServiceHook();
  }

  onUserIdChange(): void {
    this.emitServiceHook();
  }

  onTeamIdChange(): void {
    this.emitServiceHook();
  }

  // ---- Edit Mode (Save/Cancel) ----

  startEditing(): void {
    this.isEditing = true;
    this.originalFormValues = {
      operationType: this.operationForm.controls.operationType.value,
      userId: this.operationForm.controls.userId.value,
      teamId: this.operationForm.controls.teamId.value,
    };
    this.cdr.markForCheck();
  }

  save(): void {
    this.emitServiceHook();
    this.isEditing = false;
    this.originalFormValues = null;
    this.emitContentChange();
    this.cdr.markForCheck();
  }

  cancel(): void {
    if (this.originalFormValues) {
      this.operationForm.setValue(this.originalFormValues, { emitEvent: false });
    }
    this.isEditing = false;
    this.originalFormValues = null;
    this.cdr.markForCheck();
  }

  // ---- Service Hook Emitter ----

  private emitServiceHook(): void {
    const formValue = this.operationForm.value;
    const operationType = formValue.operationType || 'assign_user';

    const serviceHook: any = {
      service_type: operationType,
      service_action: operationType,
    };

    if (operationType === 'assign_user') {
      serviceHook.user_id = formValue.userId || '';
    } else if (operationType === 'assign_team') {
      serviceHook.team_id = formValue.teamId || '';
    }

    // Update the node body with the service hook
    (this.node.body as any).service_hook = serviceHook;
    this.emitContentChange();
  }
}