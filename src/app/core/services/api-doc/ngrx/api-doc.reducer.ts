import { createReducer, on } from '@ngrx/store';
import {
  loadOpenApiSpec,
  loadOpenApiSpecSuccess,
  loadOpenApiSpecFailure,
  generateToken,
  generateTokenSuccess,
  generateTokenFailure,
} from './api-doc.actions';

export interface ApiDocState {
  spec: any | null;
  loading: boolean;
  error: any;
  accessToken: string | null;
  generatingToken: boolean;
  tokenError: any;
}

export const initialState: ApiDocState = {
  spec: null,
  loading: false,
  error: null,
  accessToken: null,
  generatingToken: false,
  tokenError: null,
};

export const apiDocReducer = createReducer(
  initialState,
  on(loadOpenApiSpec, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(loadOpenApiSpecSuccess, (state, { spec }) => ({
    ...state,
    spec,
    loading: false,
    error: null,
  })),
  on(loadOpenApiSpecFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(generateToken, (state) => ({
    ...state,
    generatingToken: true,
    tokenError: null,
  })),
  on(generateTokenSuccess, (state, { accessToken }) => ({
    ...state,
    accessToken,
    generatingToken: false,
    tokenError: null,
  })),
  on(generateTokenFailure, (state, { error }) => ({
    ...state,
    generatingToken: false,
    tokenError: error,
  }))
);

