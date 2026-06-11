import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { User } from '../../../../../../core/models/user-management.model';
import {
  deleteUser,
  deleteUserSuccess,
  forceLogout,
  forceLogoutSuccess,
  forceResetPassword,
  loadUsers,
} from '../../../../../../core/services/user-management/ngrx/user-management.actions';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from '../../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ResetPasswordDialogComponent } from '../reset-password-dialog/reset-password-dialog.component';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs/operators';
import { ToastService } from '../../../../../../core/services/toast-message.service';
import { selectAuthUser } from '../../../../../../core/services/auth/ngrx/auth.selector';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';

@Component({
  standalone: true,
  selector: 'app-user-actions-dropdown',
  templateUrl: './user-actions-dropdown.component.html',
  styleUrls: ['./user-actions-dropdown.component.css'],
  imports: [CommonModule, ConfirmDialogComponent, ResetPasswordDialogComponent, TranslatePipe],
})
export class UserActionsDropdownComponent {
  @Input() user!: User;
  @Output() edit = new EventEmitter<User>();

  isDropDownOpen = false;
  removeUserDialog = false;
  showConfirmDialog = false;
  showResetPasswordDialog = false;
  showEditUserDialog = false;
  private translationService = inject(TranslationService);

  currentUser$ = this.store.select(selectAuthUser);

  constructor(private store: Store, private elementRef: ElementRef, private actions$: Actions, private toastService: ToastService) {
  }

  // Check if current user has administrator role
  hasAdminRole(currentUser: any): boolean {
    return currentUser?.roles?.some((role: any) => role.role_name === 'ADMINISTRATOR') || false;
  }

  // Check if the target user is the same as current user
  isCurrentUser(currentUser: any): boolean {
    return currentUser?.id === this.user.id;
  }

  // Check if target user has administrator role
  targetUserHasAdminRole(): boolean {
    return this.user?.roles?.some((role: any) => role.role_name === 'ADMINISTRATOR') || false;
  }

  // Check if current user can manage target user
  canManageUser(currentUser: any): boolean {
    // Base admins can manage everyone
    if (this.isBaseAdmin(currentUser)) {
      return true;
    }
    // Regular admins can manage everyone except administrators
    if (this.hasAdminRole(currentUser)) {
      return !this.targetUserHasAdminRole();
    }
    // Regular users cannot manage anyone
    return false;
  }

  // Check if current user is base admin
  isBaseAdmin(currentUser: any): boolean {
    return currentUser?.is_base_admin === true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isDropDownOpen = false;
    }
  }
  toggleDropdown(): void {
    this.isDropDownOpen = !this.isDropDownOpen;
  }

  handleEdit(): void {
    this.edit.emit(this.user);
    this.isDropDownOpen = false;
  }

  openResetPasswordDialog(): void {
    this.showResetPasswordDialog = true;
    this.isDropDownOpen = false;
  }

  onPasswordConfirmed(newPassword: string): void {
    this.store.dispatch(
      forceResetPassword({
        userId: this.user.id,
        newPassword: newPassword,
      })
    );
    this.showResetPasswordDialog = false;
  }

  onPasswordCancelled(): void {
    this.showResetPasswordDialog = false;
  }

  openLogoutConfirmation(): void {
    this.showConfirmDialog = true;
    this.isDropDownOpen = false;
  }

  openRemoveUserDialog(): void {
    this.removeUserDialog = true;
  }

  onLogoutConfirmed(): void {
    // Double-check permissions before proceeding
    this.currentUser$.pipe(take(1)).subscribe(currentUser => {
      // Base admins can logout anyone
      if (this.isBaseAdmin(currentUser)) {
        this.store.dispatch(forceLogout({ userId: this.user.id }));
        this.actions$.pipe(
          ofType(forceLogoutSuccess),
          take(1)
        ).subscribe(() => {
          this.store.dispatch(
            loadUsers({ query: '', page: 1, limit: 10 })
          );
        });
        this.showConfirmDialog = false;
        return;
      }

      // Regular admins need additional checks
      if (!this.hasAdminRole(currentUser)) {
        this.toastService.showToast(this.translationService.translate('userManagement.noPermissionToLogout'), 'error');
        this.showConfirmDialog = false;
        return;
      }

      if (this.isCurrentUser(currentUser)) {
        this.toastService.showToast(this.translationService.translate('userManagement.cannotLogoutOwnSession'), 'error');
        this.showConfirmDialog = false;
        return;
      }

      this.store.dispatch(forceLogout({ userId: this.user.id }));
      this.actions$.pipe(
        ofType(forceLogoutSuccess),
        take(1)
      ).subscribe(() => {
        this.store.dispatch(
          loadUsers({ query: '', page: 1, limit: 10 })
        );
      });
      this.showConfirmDialog = false;
    });
  }

  onLogoutCancelled(): void {
    this.showConfirmDialog = false;
  }

  onCloseRemoveUserDialog(): void {
    this.removeUserDialog = false;
  }

  handleRemove(): void {
    this.store.dispatch(deleteUser({ user_id: this.user.id }));
    this.actions$.pipe(
      ofType(deleteUserSuccess),
      take(1)
    ).subscribe(() => {
      this.store.dispatch(
        loadUsers({ query: '', page: 1, limit: 10 })
      );
    });
    this.removeUserDialog = false;
  }
}
