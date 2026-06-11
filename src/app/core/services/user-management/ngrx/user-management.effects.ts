// store/effects/user-management.effects.ts

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, switchMap } from 'rxjs';
import { UserManagementService } from '../user-management.service';
import {
  createTeam, createTeamFailure, createTeamSuccess,
  createUser, createUserFailure, createUserSuccess,
  deleteUser, deleteUserFailure, deleteUserSuccess,
  forceLogout, forceLogoutFailure, forceLogoutSuccess,
  forceResetPassword, forceResetPasswordFailure, forceResetPasswordSuccess,
  loadRoles, loadRolesFailure, loadRolesSuccess,
  loadTeams, loadTeamsFailure, loadTeamsSuccess,
  loadUsers, loadUsersFailure, loadUsersSuccess,
  updateTeam, updateTeamSuccess, updateTeamFailure,
  updateUser, updateUserFailure, updateUserSuccess,
  deleteTeamSuccess, deleteTeam, deleteTeamFailure
} from './user-management.actions';
import {
  // ... existing imports ...
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

@Injectable()
export class UserManagementEffects {
  constructor(
    private actions$: Actions,
    private userService: UserManagementService
  ) { }

  // User Effects
  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUsers),
      switchMap(({ query, page, limit, sort }) => {
        // coerce query and sort to either trimmed string or null (so service will omit param)
        const safeQuery = (query && query.trim() !== '') ? query.trim() : null;
        const safeSort = (sort && sort.trim() !== '') ? sort.trim() : null;

        return this.userService.getUsers(safeQuery, page, limit, safeSort).pipe(
          map((response) =>
            loadUsersSuccess({
              ...response.data
            })
          ),
          catchError((error) =>
            of(loadUsersFailure({ error: error }))
          )
        );
      })
    )
  );

  createUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createUser),
      mergeMap(({ user }) =>
        this.userService.createUser(user).pipe(
          map(() => createUserSuccess()),
          catchError((error) =>
            of(createUserFailure({ error: error }))
          )
        )
      )
    )
  );

  updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateUser),
      mergeMap(({ userId, user }) =>
        this.userService.updateUser(userId, user).pipe(
          map(() => updateUserSuccess()),
          catchError((error) =>
            of(updateUserFailure({ error: error }))
          )
        )
      )
    )
  );

  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteUser),
      mergeMap(({ user_id }) =>
        this.userService.deleteUser(user_id).pipe(
          map(() => deleteUserSuccess()),
          catchError((error) =>
            of(deleteUserFailure({ error: error }))
          )
        )
      )
    )
  );

  loadRoles$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadRoles),
      switchMap(() =>
        this.userService.getRoles().pipe(
          map((response) =>
            loadRolesSuccess({
              roles: response.data.roles
            })
          ),
          catchError((error) =>
            of(loadRolesFailure({ error: error }))
          )
        )
      )
    )
  );

  loadTeams$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTeams),
      switchMap(({ query, page, limit, sort }) => {
        const safeQuery = (query && query.trim() !== '') ? query.trim() : null;
        const safeSort = (sort && sort.trim() !== '') ? sort.trim() : null;

        return this.userService.getTeams(safeQuery, page, limit, safeSort).pipe(
          map((response) =>
            loadTeamsSuccess({
              ...response.data
            })
          ),
          catchError((error) =>
            of(loadTeamsFailure({ error: error }))
          )
        );
      })
    )
  );

  createTeam$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createTeam),
      mergeMap(({ teamName }) =>
        this.userService.createTeam(teamName).pipe(
          map(() => createTeamSuccess()),
          catchError((error) =>
            of(createTeamFailure({ error: error }))
          )
        )
      )
    )
  );

  updateTeam$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateTeam),
      mergeMap(({ teamId, team }) =>
        this.userService.updateTeam(teamId, team).pipe(
          map(() => updateTeamSuccess()),
          catchError((error) =>
            of(updateTeamFailure({ error: error }))
          )
        )
      )
    )
  );

  deleteTeam$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteTeam),
      mergeMap(({ teamName }) =>
        this.userService.deleteTeam(teamName).pipe(
          map(() => deleteTeamSuccess()),
          catchError((error) =>
            of(deleteTeamFailure({ error: error?.error?.message ?? error }))
          )
        )
      )
    )
  );

  forceResetPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(forceResetPassword),
      mergeMap(({ userId, newPassword }) =>
        this.userService.forceResetPassword(userId, newPassword).pipe(
          map(() => forceResetPasswordSuccess()),
          catchError((error) =>
            of(forceResetPasswordFailure({ error: error }))
          )
        )
      )
    )
  );

  forceLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(forceLogout),
      mergeMap(({ userId }) =>
        this.userService.forceLogout(userId).pipe(
          map(() => forceLogoutSuccess()),
          catchError((error) =>
            of(forceLogoutFailure({ error: error }))
          )
        )
      )
    )
  );

  // --- Forgot Password: send reset email ---
  forgotSendEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(forgotSendEmail),
      mergeMap(({ email }) =>
        this.userService.sendResetEmail(email).pipe(
          map((res: any) => forgotSendEmailSuccess({ success: res?.data?.success ?? res?.success })),
          catchError((error) => of(forgotSendEmailFailure({ error })))
        )
      )
    )
  );

  // --- Forgot Password: verify 6-digit code and receive confirmation ---
  forgotVerifyCode$ = createEffect(() =>
    this.actions$.pipe(
      ofType(forgotVerifyCode),
      mergeMap(({ email, otp_code }) =>
        this.userService.verifyResetCode(email, otp_code).pipe(
          map((res: any) => {
            // Check if verification was successful
            const isValid = res?.data?.valid ?? res?.valid;
            if (isValid) {
              // Use a placeholder token since API doesn't return one
              // The actual password reset will use email+password
              return forgotVerifyCodeSuccess({ resetToken: 'VERIFIED' });
            }
            return forgotVerifyCodeFailure({ error: res?.message ?? 'Verification failed' });
          }),
          catchError((error) => of(forgotVerifyCodeFailure({ error })))
        )
      )
    )
  );

  // --- Forgot Password: reset password using OTP code ---
  forgotResetPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(forgotResetPassword),
      mergeMap(({ email, newPassword, otpCode }) =>
        this.userService.resetPassword(email, newPassword, otpCode).pipe(
          map(() => forgotResetPasswordSuccess()),
          catchError((error) => of(forgotResetPasswordFailure({ error })))
        )
      )
    )
  );

}

