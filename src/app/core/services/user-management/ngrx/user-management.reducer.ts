import { createReducer, on } from '@ngrx/store';
import {  Role, Team, User } from '../../../models/user-management.model';
import { createTeam, createTeamFailure, createTeamSuccess, createUser, createUserFailure, createUserSuccess, deleteTeam, deleteTeamFailure, deleteTeamSuccess, deleteUser, deleteUserFailure, deleteUserSuccess, forceLogout, forceLogoutFailure, forceLogoutSuccess, forceResetPassword, forceResetPasswordFailure, forceResetPasswordSuccess, loadRoles, loadRolesFailure, loadRolesSuccess, loadTeams, loadTeamsFailure, loadTeamsSuccess, loadUsers, loadUsersFailure, loadUsersSuccess, resetState, updateTeam, updateTeamFailure, updateTeamSuccess, updateUser, updateUserFailure, updateUserSuccess } from './user-management.actions';
import { PaginationData } from '../../../models/pagination.model';
import {
  forgotSendEmail,
  forgotSendEmailSuccess,
  forgotSendEmailFailure,
  forgotVerifyCode,
  forgotVerifyCodeSuccess,
  forgotVerifyCodeFailure,
  forgotResetPassword,
  forgotResetPasswordSuccess,
  forgotResetPasswordFailure
} from './user-management.actions';


export interface UserManagementState {
  users: {
    data: User[];
    pagination: PaginationData;
  };
  teams: {
    data: Team[];
    pagination: PaginationData;
  };
  roles: Role[];
  pagination: PaginationData;
  loading: boolean;
  error: string | null;

  forgotPassword: {
    sending: boolean;
    verifying: boolean;
    resetting: boolean;
    error: any | null;
    resetToken: string | null;
    resendTtlSeconds?: number | null;
  };
}

export const initialState: UserManagementState = {
  users: {
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total_count: 0,
      total_pages: 0
    }
  },
  roles: [],
  teams: {
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total_count: 0,
      total_pages: 0
    }
  },
  pagination: {
    page: 1,
    limit: 10,
    total_count: 0,
    total_pages: 0
  },
  loading: false,
  error: null,
  forgotPassword: {
    sending: false,
    verifying: false,
    resetting: false,
    error: null,
    resetToken: null,
    resendTtlSeconds: null
  }
};

export const userManagementReducer = createReducer(
  initialState,

  // Loading States
  on(
    forceResetPassword,
    forceLogout,
    deleteUser,
    loadRoles,
    loadTeams,
    updateUser,
    createUser,
    loadUsers,
    createTeam,
    updateTeam,
    deleteTeam,
    (state) => ({ ...state, loading: true, error: null })
  ),

  // Success Handlers
  on(
    loadUsersSuccess,
    (state, { users, ...pagination }) => ({
      ...state,
      loading: false,
      users: {
        data: users,
        pagination
      },
      pagination
    })
  ),
  on(
    loadTeamsSuccess,
    (state, { teams, ...pagination }) => ({
      ...state,
      loading: false,
      teams: {
        data: teams,
        pagination
      },
      pagination
    })
  ),
  on(
    loadRolesSuccess,
    (state, { roles }) => ({
      ...state,
      loading: false,
      roles
    })
  ),
  on(
    forceResetPasswordSuccess,
    forceLogoutSuccess,
    deleteUserSuccess,
    updateUserSuccess,
    createUserSuccess,
    createTeamSuccess,
    updateTeamSuccess,
    deleteTeamSuccess,
    (state) => ({ ...state, loading: false })
  ),

  // Failure Handlers
  on(
    forceResetPasswordFailure,
    forceLogoutFailure,
    deleteUserFailure,
    loadRolesFailure,
    loadTeamsFailure,
    updateUserFailure,
    createUserFailure,
    loadUsersFailure,
    createTeamFailure,
    updateTeamFailure,
    deleteTeamFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error
    })
  ),
 on(forgotSendEmail, (state) => ({
    ...state,
    forgotPassword: { ...state.forgotPassword, sending: true, error: null}
  })),

  on(forgotSendEmailSuccess, (state,) => ({
    ...state,
    forgotPassword: { ...state.forgotPassword, sending: false, error: null}
  })),

  on(forgotSendEmailFailure, (state, { error }) => ({
    ...state,
    forgotPassword: { ...state.forgotPassword, sending: false, error }
  })),

  on(forgotVerifyCode, (state) => ({
    ...state,
    forgotPassword: { ...state.forgotPassword, verifying: true, error: null, resetToken: null }
  })),

  on(forgotVerifyCodeSuccess, (state, { resetToken }) => ({
    ...state,
    forgotPassword: { ...state.forgotPassword, verifying: false, error: null, resetToken }
  })),

  on(forgotVerifyCodeFailure, (state, { error }) => ({
    ...state,
    forgotPassword: { ...state.forgotPassword, verifying: false, error }
  })),

  on(forgotResetPassword, (state) => ({
    ...state,
    forgotPassword: { ...state.forgotPassword, resetting: true, error: null }
  })),

  on(forgotResetPasswordSuccess, (state) => ({
    ...state,
    forgotPassword: { ...state.forgotPassword, resetting: false, error: null, resetToken: null, resendTtlSeconds: null }
  })),

  on(forgotResetPasswordFailure, (state, { error }) => ({
    ...state,
    forgotPassword: { ...state.forgotPassword, resetting: false, error }
  })),

  on(
    resetState,
    () => initialState
  )
);
