import { createAction, props } from '@ngrx/store';
import { CreateUserModel, EditUserModel, Role, Team, User, TeamUpdateModel } from '../../../models/user-management.model';
import { PaginationData } from '../../../models/pagination.model';

export const forceResetPassword = createAction(
  '[User Management] Force Reset Password',
  props<{ userId: string; newPassword: string }>()
);
export const forceResetPasswordSuccess = createAction('[User Management] Force Reset Password Success');
export const forceResetPasswordFailure = createAction(
  '[User Management] Force Reset Password Failure',
  props<{ error: any }>()
);

// Session Operations
export const forceLogout = createAction(
  '[User Management] Force Logout',
  props<{ userId: string }>()
);
export const forceLogoutSuccess = createAction('[User Management] Force Logout Success');
export const forceLogoutFailure = createAction(
  '[User Management] Force Logout Failure',
  props<{ error: any }>()
);

// User Operations
export const deleteUser = createAction(
  '[User Management] Delete User',
  props<{ user_id: string }>()
);
export const deleteUserSuccess = createAction('[User Management] Delete User Success');
export const deleteUserFailure = createAction(
  '[User Management] Delete User Failure',
  props<{ error: any; }>()
);

export const loadUsers = createAction(
  '[User Management] Load Users',
  props<{ query: string | ''; page: number; limit: number, sort?: string | null }>()
);
export const loadUsersSuccess = createAction(
  '[User Management] Load Users Success',
  props<{ users: User[] } & PaginationData>()
);
export const loadUsersFailure = createAction(
  '[User Management] Load Users Failure',
  props<{ error: any }>()
);

export const createUser = createAction(
  '[User Management] Create User',
  props<{ user: CreateUserModel }>()
);
export const createUserSuccess = createAction('[User Management] Create User Success');
export const createUserFailure = createAction(
  '[User Management] Create User Failure',
  props<{ error: any }>()
);

export const updateUser = createAction(
  '[User Management] Update User',
  props<{ userId: string; user: EditUserModel }>()
);
export const updateUserSuccess = createAction('[User Management] Update User Success');
export const updateUserFailure = createAction(
  '[User Management] Update User Failure',
  props<{ error: any }>()
);

export const loadRoles = createAction('[User Management] Load Roles');
export const loadRolesSuccess = createAction(
  '[User Management] Load Roles Success',
  props<{ roles: Role[] }>()
);
export const loadRolesFailure = createAction(
  '[User Management] Load Roles Failure',
  props<{ error: any }>()
);

// Team Operations
export const createTeam = createAction(
  '[User Management] Create Team',
  props<{ teamName: string }>()
);
export const createTeamSuccess = createAction('[User Management] Create Team Success');
export const createTeamFailure = createAction(
  '[User Management] Create Team Failure',
  props<{ error: any }>()
);
export const loadTeams = createAction(
  '[User Management] Load Teams',
  props<{ query: string | ''; page: number; limit: number; sort?: string | null }>()
);

export const loadTeamsSuccess = createAction(
  '[User Management] Load Teams Success',
  props<{ teams: Team[] } & PaginationData>()
);
export const loadTeamsFailure = createAction(
  '[User Management] Load Teams Failure',
  props<{ error: any }>()
);

export const updateTeam = createAction(
  '[User Management] Update Team',
  props<{ teamId: string; team: TeamUpdateModel }>()
);
export const updateTeamSuccess = createAction('[User Management] Update Team Success');
export const updateTeamFailure = createAction(
  '[User Management] Update Team Failure',
  props<{ error: any }>()
);

export const deleteTeam = createAction(
  '[User Management] Delete Team',
  props<{ teamName: string }>()
);
export const deleteTeamSuccess = createAction('[User Management] Delete Team Success');
export const deleteTeamFailure = createAction(
  '[User Management] Delete Team Failure',
  props<{ error: any }>()
);

export const resetState = createAction('[User Management] Reset State');


export const forgotSendEmail = createAction(
  '[User Management] Forgot Send Email',
  props<{ email: string }>()
);
export const forgotSendEmailSuccess = createAction(
  '[User Management] Forgot Send Email Success',
  props<{ success?: number }>()
);
export const forgotSendEmailFailure = createAction(
  '[User Management] Forgot Send Email Failure',
  props<{ error: any }>()
);

// Step 2: verify code
export const forgotVerifyCode = createAction(
  '[User Management] Forgot Verify Code',
  props<{ email: string; otp_code: string }>()
);
export const forgotVerifyCodeSuccess = createAction(
  '[User Management] Forgot Verify Code Success',
  props<{ resetToken: string }>()
);
export const forgotVerifyCodeFailure = createAction(
  '[User Management] Forgot Verify Code Failure',
  props<{ error: any }>()
);

// Step 3: reset password
export const forgotResetPassword = createAction(
  '[User Management] Forgot Reset Password',
  props<{ email: string; newPassword: string; otpCode: string }>()
);
export const forgotResetPasswordSuccess = createAction(
  '[User Management] Forgot Reset Password Success'
);
export const forgotResetPasswordFailure = createAction(
  '[User Management] Forgot Reset Password Failure',
  props<{ error: any }>()
);
