import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.action';

export interface AuthState {
    loading: boolean;
    error: string;
    response: any;
    user: any | null;
}

const initialState: AuthState = {
    loading: false,
    error: '',
    response: null,
    user: null,
};

export const authReducer = createReducer(
    initialState,
    on(AuthActions.login, (state) => ({
        ...state,
        loading: true,
        error: ''
    })),
    on(AuthActions.loginSuccess, (state, { token }) => ({
        ...state,
        loading: false,
        response: token,
        error: ''
    })),
    on(AuthActions.loginFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error: error ?? '',
    })),
    on(AuthActions.refreshTokenSuccess, (state, { token }) => ({
        ...state,
        response: token,
    })),
    on(AuthActions.logout, () => {
        return initialState;
    }),
    on(AuthActions.setAuthUser, (state, { user }) => ({
      ...state,
      user
    }))
);
