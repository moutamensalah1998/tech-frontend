import { createAction, props } from '@ngrx/store';
import { AdminLoginCredentials } from '../../../../core/models/auth.types';

export const adminLogin = createAction(
    '[Admin Auth] Login Request',
    props<AdminLoginCredentials>()
);

export const adminLoginSuccess = createAction(
    '[Admin Auth] Login Success',
    props<{ accessToken: string; refreshToken: string }>()
);

export const adminLoginFailure = createAction(
    '[Admin Auth] Login Failure',
    props<{ error: any }>()
);

export const adminRefreshToken = createAction('[Admin Auth] Refresh Token');

export const adminRefreshTokenSuccess = createAction(
    '[Admin Auth] Refresh Token Success',
    props<{ accessToken: string; refreshToken: string }>()
);

export const adminRefreshTokenFailure = createAction(
    '[Admin Auth] Refresh Token Failure',
    props<{ error: any }>()
);

export const adminLogout = createAction('[Admin Auth] Logout');

export const adminLogoutSuccess = createAction('[Admin Auth] Logout Success');

