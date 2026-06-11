import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { UserService } from '../../../../../../core/services/auth/user.service';
import { ProfileSettingsService } from '../../../../../../core/services/profile-settings/profile-settings.service';
import { ToastService } from '../../../../../../core/services/toast-message.service';
import { Subject, takeUntil } from 'rxjs';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';
import { AuthService } from '../../../../../../core/services/auth/auth.service';
@Component({
  selector: 'app-personal-profile',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './personal-profile.component.html',
  styleUrls: ['./personal-profile.component.css']
})
export class PersonalProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private currentUser: any = null;
  private translationService = inject(TranslationService);
  isSaving = false;
  showPasswordFields = false;
  showCurrentPassword = false;
  showNewPassword = false;

  profileForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    email: new FormControl(''),
    phoneNumber: new FormControl(''),
    roles: new FormControl({ value: '', disabled: true }),
    teams: new FormControl({ value: '', disabled: true }),
    currentPassword: new FormControl(''),
    newPassword: new FormControl(''),

  });

  constructor(

    private userService: UserService,
    private profileSettingsService: ProfileSettingsService,
    private authService: AuthService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.loadUserData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


  loadUserData() {
    this.userService.getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(userData => {
        const payload = userData?.data ?? userData;
        if (payload && (payload.id || payload.email)) {
          this.currentUser = userData;
          this.populateForm(payload);
        } else {
          if (!this.userService.isUserLoading()) {
            this.userService.loadAndSetUser();
          }
        }
      });
  }

  populateForm(payload: any) {
    if (!payload) { return; }

    this.profileForm.patchValue({
      firstName: payload.first_name || '',
      lastName: payload.last_name || '',
      email: payload.email || '',
      phoneNumber: payload.phone_number || '',
      roles: payload.roles ? payload.roles.map((role: any) => role.role_name).join(', ') : '',
      teams: payload.teams ? payload.teams.map((team: any) => team.name).join(', ') : '',
    });
  }

  onSave() {
    const user = this.currentUser?.data ?? this.currentUser;
    const userId = user?.id;

    if (!userId) {
      this.toastService.showToast(this.translationService.translate('profile.personal.noUserIdAvailable'), 'error');
      return;
    }

    const formValue = this.profileForm.value;
    this.isSaving = true;
    this.profileForm.disable();

    const profileRequestBody: any = {
      first_name: formValue.firstName || '',
      last_name: formValue.lastName || '',
      email: formValue.email || '',
      phone_number: formValue.phoneNumber || '',
      roles: user?.roles ? user.roles.map((r: any) => r.id) : [],
      teams: user?.teams ? user.teams.map((t: any) => t.id) : []
    };

    const profileUpdateObservable = this.profileSettingsService.updateUserProfile(userId, profileRequestBody);

    if (formValue.newPassword || formValue.currentPassword) {
      if (!formValue.currentPassword) {
        this.toastService.showToast('Current password is required to set a new password', 'error');
        this.isSaving = false;
        this.profileForm.enable();
        return;
      }
      if (!formValue.newPassword) {
        this.toastService.showToast('New password is required', 'error');
        this.isSaving = false;
        this.profileForm.enable();
        return;
      }


      const passwordPayload = {
        current_password: formValue.currentPassword,
        new_password: formValue.newPassword
      };

      this.authService.changePassword(passwordPayload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.showToast('Password changed successfully', 'success');
            this.profileForm.patchValue({
              currentPassword: '',
              newPassword: '',

            });
            this.executeProfileUpdate(profileUpdateObservable);
          },
          error: (error) => {
            console.error('Error changing password:', error);
            this.toastService.showToast(error.error?.message || 'Failed to change password', 'error');
            this.isSaving = false;
            this.profileForm.enable();
          }
        });
    } else {
      this.executeProfileUpdate(profileUpdateObservable);
    }
  }

  executeProfileUpdate(observable: any) {
    observable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.toastService.showToast('Profile updated successfully', 'success');
          if (!this.userService.isUserLoading()) {
            this.userService.loadAndSetUser();
          }
          this.isSaving = false;
          this.profileForm.enable();
        },
        error: (error: any) => {
          console.error('Error updating profile:', error);
          this.toastService.showToast('Failed to update profile', 'error');
          this.isSaving = false;
          this.profileForm.enable();
        }
      });
  }

  toggleCurrentPassword() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  togglePasswordSettings() {
    this.showPasswordFields = !this.showPasswordFields;
  }
  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }


}
