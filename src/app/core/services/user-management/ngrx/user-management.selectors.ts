import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserManagementState } from './user-management.reducer';

export const selectUserManagementState =
  createFeatureSelector<UserManagementState>('userManagement');

export const selectAllUsers = createSelector(
  selectUserManagementState,
  (state) => state.users.data
);

export const selectUserById = (userId: string) =>
  createSelector(selectAllUsers, (users) =>
    users.find((user) => user.id === userId)
  );

export const selectAllRoles = createSelector(
  selectUserManagementState,
  (state) => state.roles
);

export const selectAllTeams = createSelector(
  selectUserManagementState,
  (state) => state.teams
);

export const selectPagination = createSelector(
  selectUserManagementState,
  (state) => state.pagination
);

export const selectLoadingState = createSelector(
  selectUserManagementState,
  (state) => state.loading
);

export const selectErrorMessage = createSelector(
  selectUserManagementState,
  (state) => state.error
);

export const selectUsersPagination = createSelector(
  selectUserManagementState,
  (state) => state.users.pagination
);

export const selectTeamsPagination = createSelector(
  selectUserManagementState,
  (state) => state.teams.pagination
);

export const selectUsersData = createSelector(
  selectUserManagementState,
  (state) => state.users.data
);

export const selectTeamsData = createSelector(
  selectUserManagementState,
  (state) => state.teams.data
);

export const selectError = createSelector(
  selectUserManagementState,
  (state) => state.error
);

export const selectCreateTeamErrorMessage = createSelector(
  selectUserManagementState,
  (state) => state.error
);

export const selectUpdateTeamErrorMessage = createSelector(
  selectUserManagementState,
  (state) => state.error
);

export const selectDeleteTeamErrorMessage = createSelector(
  selectUserManagementState,
  (state) => state.error
);

export const selectForgotPasswordState = createSelector(
  selectUserManagementState,
  (state) => state.forgotPassword
);

export const selectForgotSending = createSelector(
  selectForgotPasswordState,
  (state) => state.sending,
);

export const selectForgotVerifying = createSelector(
  selectForgotPasswordState,
  (state) => state.verifying
);

export const selectForgotResetting = createSelector(
  selectForgotPasswordState,
  (state) => state.resetting
);

export const selectForgotError = createSelector(
  selectForgotPasswordState,
  (state) => state.error
);

export const selectForgotResetToken = createSelector(
  selectForgotPasswordState,
  (state) => state.resetToken
);

export const selectForgotResendTtl = createSelector(
  selectForgotPasswordState,
  (state) => state.resendTtlSeconds
);

