import { createReducer, on } from '@ngrx/store';
import { BroadcastResponse } from '../../../../models/broadcast.model';
import * as ScheduledBroadcastActions from './scheduled-broadcast.actions';

export interface ScheduledBroadcastState {
  broadcasts: BroadcastResponse | null;
  loading: boolean;
  error: any;
  publishLoading: boolean;
  publishError: any;
  deleteLoading: boolean;
  deleteError: any;
  deleteSuccess: boolean;
}

export const initialState: ScheduledBroadcastState = {
  broadcasts: null,
  loading: false,
  error: null,
  publishLoading: false,
  publishError: null,
  deleteLoading: false,
  deleteError: null,
  deleteSuccess: false,
};

export const scheduledBroadcastReducer = createReducer(
  initialState,

  on(ScheduledBroadcastActions.loadBroadcasts, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ScheduledBroadcastActions.loadBroadcastsSuccess, (state, { data }) => ({
    ...state,
    broadcasts: data,
    loading: false,
    error: null,
  })),

  on(ScheduledBroadcastActions.loadBroadcastsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(ScheduledBroadcastActions.publishBroadcast, (state) => ({
    ...state,
    publishLoading: true,
    publishError: null,
  })),

  on(ScheduledBroadcastActions.publishBroadcastSuccess, (state, { data }) => ({
    ...state,
    publishLoading: false,
    publishError: null,
  })),

  on(ScheduledBroadcastActions.publishBroadcastFailure, (state, { error }) => ({
    ...state,
    publishLoading: false,
    publishError: error,
  })),

  on(ScheduledBroadcastActions.deleteBroadcast, (state) => ({
    ...state,
    deleteLoading: true,
    deleteError: null,
    deleteSuccess: false,
  })),

  on(ScheduledBroadcastActions.deleteBroadcastSuccess, (state, { broadcast_id }) => ({
    ...state,
    deleteLoading: false,
    deleteError: null,
    deleteSuccess: true,
    broadcasts: state.broadcasts ? {
      ...state.broadcasts,
      data: {
        ...state.broadcasts.data,
        broadcasts: state.broadcasts.data.broadcasts.filter(broadcast => broadcast.id !== broadcast_id),
        total_count: state.broadcasts.data.total_count - 1
      }
    } : null,
  })),

  on(ScheduledBroadcastActions.deleteBroadcastFailure, (state, { error }) => ({
    ...state,
    deleteLoading: false,
    deleteError: error,
    deleteSuccess: false,
  }))
);
