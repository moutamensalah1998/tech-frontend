import { Injectable, OnDestroy } from '@angular/core';
import { ToastService } from '../core/services/toast-message.service';
import { TranslationService } from '../core/services/translation/translation.service';
import { Actions, ofType } from '@ngrx/effects';
import * as UserManagementActions from '../core/services/user-management/ngrx/user-management.actions';
import * as TagActions from '../core/services/tags/ngrx/tags.actions';
import * as ProfileSettingsActions from '../core/services/profile-settings/ngrx/profile-settings.actions';
import * as MessageActions from '../core/services/messages/ngrx/messages.actions';
import * as ContactActions from '../core/services/contact/ngrx/contact.actions';
import * as TemplateActions from '../core/services/broadcast/template/ngrx/your-template.actions';
import * as ScheduledBroadcastActions from '../core/services/broadcast/scheduled broadcast/ngrx/scheduled-broadcast.actions';
import * as AuthActions from '../core/services/auth/ngrx/auth.action';
import * as AttributeActions from '../core/services/attributes/ngrx/attributes.actions';
import { Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToastServicePool implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private toastService: ToastService, private actions$: Actions, private translationService: TranslationService) {
    this.userManagementToast();
    this.tagManagementToast();
    this.businessProfileToast();
    this.messageNotifications();
    this.contactNotifications();
    this.templateNotifications();
    this.scheduledBroadcastNotifications();
    this.authNotifications();
    this.attributeNotifications();

  }

  private userManagementToast() {
    this.actions$.pipe(takeUntil(this.destroy$)).subscribe((action) => {
      if ( action.type === UserManagementActions.loadUsersFailure.type || action.type === UserManagementActions.loadRolesFailure.type || action.type === UserManagementActions.loadTeamsFailure.type) {
        this.toastService.showToast(this.translationService.translate('toast.somethingWentWrong'), 'error');
      } else if (action.type === UserManagementActions.forceResetPasswordFailure.type) {
        this.toastService.showToast(this.translationService.translate('toast.errorForcingPasswordReset'), 'error');
      } else if (action.type === UserManagementActions.forceLogoutFailure.type) {
        this.toastService.showToast(this.translationService.translate('toast.errorForcingLogout'), 'error');
      }  else if (action.type === UserManagementActions.createUserFailure.type) {
        this.toastService.showToast(this.translationService.translate('toast.errorCreatingUser'), 'error');
      } else if (action.type === UserManagementActions.updateUserFailure.type) {
        this.toastService.showToast(this.translationService.translate('toast.errorUpdatingUser'), 'error');
      } else if (action.type === UserManagementActions.deleteUserFailure.type) {
        this.toastService.showToast(this.translationService.translate('toast.errorDeletingUser'), 'error');
      } else if (action.type === UserManagementActions.deleteUserSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.userDeletedSuccessfully'), 'success');
      } else if (action.type === UserManagementActions.forceLogoutSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.userSessionsLoggedOutSuccessfully'), 'success');
      }else if (action.type === UserManagementActions.createUserSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.userCreatedSuccessfully'), 'success');
      }else if (action.type === UserManagementActions.updateUserSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.userUpdatedSuccessfully'), 'success');
      }else if (action.type === UserManagementActions.forceResetPasswordSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.passwordResetSuccessfully'), 'success');
      }
    });
  }

  private tagManagementToast() {
    this.actions$.pipe(takeUntil(this.destroy$)).subscribe((action) => {
      if (action.type === TagActions.getTagsError.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToLoadTags'), 'error');
      } else if (action.type === TagActions.addTagError.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToAddTag'), 'error');
      } else if (action.type === TagActions.deleteTagError.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToDeleteTag'), 'error');
      } else if (action.type === TagActions.updateTagError.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToUpdateTag'), 'error');
      } else if (action.type === TagActions.addTagSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.tagAddedSuccessfully'), 'success');
      } else if (action.type === TagActions.deleteTagSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.tagDeletedSuccessfully'), 'success');
      } else if (action.type === TagActions.updateTagSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.tagUpdatedSuccessfully'), 'success');
      }
    });
  }

  private businessProfileToast() {
    // this.actions$.pipe(takeUntil(this.destroy$)).subscribe((action) => {
    //   if (action.type === ProfileSettingsActions.businessProfileError.type) {
    //     alert('Failed to load business profile');
    //   } else if (action.type === ProfileSettingsActions.businessProfileSuccess.type) {
    //     alert('Business profile loaded successfully');
    //   }
    // });
  }

  private messageNotifications() {
    this.actions$.pipe(takeUntil(this.destroy$)).subscribe((action) => {
      // Text Messages
      if (action.type === MessageActions.sendTextMessageError.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToSendTextMessage'), 'error');
      } else if (action.type === MessageActions.sendTextMessageSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.textMessageSentSuccessfully'), 'success');
      }

      // Media Messages
      else if (action.type === MessageActions.sendMediaMessageError.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToSendMediaMessage'), 'error');
      } else if (action.type === MessageActions.sendMediaMessageSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.mediaMessageSentSuccessfully'), 'success');
      }

      // Reaction Messages
      else if (action.type === MessageActions.sendReplyWithReactionMessageError.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToSendReaction'), 'error');
      } else if (action.type === MessageActions.sendReplyWithReactionMessageSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.reactionSentSuccessfully'), 'success');
      }

      // Location Messages
      else if (action.type === MessageActions.sendLocationMessageError.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToSendLocation'), 'error');
      } else if (action.type === MessageActions.sendLocationMessageSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.locationSentSuccessfully'), 'success');
      }

      // Interactive Button Messages
      else if (action.type === MessageActions.sendInteractiveReplyButtonMessageError.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToSendInteractiveButtons'), 'error');
      } else if (action.type === MessageActions.sendInteractiveReplyButtonMessageSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.interactiveButtonsSentSuccessfully'), 'success');
      }
    });
  }

  private contactNotifications() {
    this.actions$.pipe(takeUntil(this.destroy$)).subscribe((action) => {
      if (action.type === ContactActions.deleteContactError.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToDeleteContact'), 'error');
      } else if (action.type === ContactActions.deleteContactSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.contactDeletedSuccessfully'), 'success');
      }
    });
  }

  private templateNotifications() {
    this.actions$.pipe(takeUntil(this.destroy$)).subscribe((action) => {
      if (action.type === TemplateActions.loadTemplatesFailure.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToLoadTemplates'), 'error');
      } else if (action.type === TemplateActions.createTemplateFailure.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToCreateTemplate'), 'error');
      } else if (action.type === TemplateActions.createTemplateSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.templateCreatedSuccessfully'), 'success');
      } else if (action.type === TemplateActions.deleteTemplateFailure.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToDeleteTemplate'), 'error');
      } else if (action.type === TemplateActions.deleteTemplateSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.templateDeletedSuccessfully'), 'success');
      } else if (action.type === TemplateActions.uploadMediaFailure.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToUploadMedia'), 'error');
      } else if (action.type === TemplateActions.uploadMediaSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.mediaUploadedSuccessfully'), 'success');
      }
    });
  }

  private authNotifications() {
    this.actions$.pipe(takeUntil(this.destroy$)).subscribe((action) => {
      if (action.type === AuthActions.loginFailure.type) {
        this.toastService.showToast(this.translationService.translate('toast.loginFailed'), 'error');
      } else if (action.type === AuthActions.loginSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.loginSuccessful'), 'success');
      } else if (action.type === AuthActions.refreshTokenFailure.type) {
        this.toastService.showToast(this.translationService.translate('toast.sessionExpired'), 'error');
      } else if (action.type === AuthActions.logoutSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.loggedOutSuccessfully'), 'success');
      }
    });
  }

  private scheduledBroadcastNotifications() {
    this.actions$.pipe(takeUntil(this.destroy$)).subscribe((action) => {
      if (action.type === ScheduledBroadcastActions.loadBroadcastsFailure.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToLoadBroadcasts'), 'error');
      } else if (action.type === ScheduledBroadcastActions.publishBroadcastFailure.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToPublishBroadcast'), 'error');
      } else if (action.type === ScheduledBroadcastActions.publishBroadcastSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.broadcastPublishedSuccessfully'), 'success');
      }
    });
  }

  private attributeNotifications() {
    this.actions$.pipe(takeUntil(this.destroy$)).subscribe((action) => {
      if (action.type === AttributeActions.getAttributesError.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToLoadAttributes'), 'error');
      } else if (action.type === AttributeActions.addAttributeError.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToAddAttribute'), 'error');
      } else if (action.type === AttributeActions.addAttributeSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.attributeAddedSuccessfully'), 'success');
      } else if (action.type === AttributeActions.deleteAttributeError.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToDeleteAttribute'), 'error');
      } else if (action.type === AttributeActions.deleteAttributeSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.attributeDeletedSuccessfully'), 'success');
      } else if (action.type === AttributeActions.updateAttributeError.type) {
        this.toastService.showToast(this.translationService.translate('toast.failedToUpdateAttribute'), 'error');
      } else if (action.type === AttributeActions.updateAttributeSuccess.type) {
        this.toastService.showToast(this.translationService.translate('toast.attributeUpdatedSuccessfully'), 'success');
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
