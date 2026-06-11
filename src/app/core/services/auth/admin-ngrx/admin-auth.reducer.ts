import { createReducer, on } from '@ngrx/store';
import * as AdminAuthActions from './admin-auth.actions';

export interface AdminAuthState {
    loading: boolean;
    error: string;
    accessToken: string | null;
    refreshToken: string | null;
}

const initialState: AdminAuthState = {
    loading: false,
    error: '',
    accessToken: null,
    refreshToken: null,
};

export const adminAuthReducer = createReducer(
    initialState,
    on(AdminAuthActions.adminLogin, (state) => ({
        ...state,
        loading: true,
        error: ''
    })),
    on(AdminAuthActions.adminLoginSuccess, (state, { accessToken, refreshToken }) => ({
        ...state,
        loading: false,
        accessToken,
        refreshToken,
        error: ''
    })),
    on(AdminAuthActions.adminLoginFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error: error ?? '',
    })),
    on(AdminAuthActions.adminRefreshToken, (state) => ({
        ...state,
        loading: true,
    })),
    on(AdminAuthActions.adminRefreshTokenSuccess, (state, { accessToken, refreshToken }) => ({
        ...state,
        loading: false,
        accessToken,
        refreshToken,
        error: ''
    })),
    on(AdminAuthActions.adminRefreshTokenFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error: error ?? '',
    })),
    on(AdminAuthActions.adminLogout, () => {
        return initialState;
    }),
    on(AdminAuthActions.adminLogoutSuccess, () => {
        return initialState;
    })
);

