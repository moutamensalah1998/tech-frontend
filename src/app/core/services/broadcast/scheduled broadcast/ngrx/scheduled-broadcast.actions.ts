import { createAction, props } from '@ngrx/store';
import { BroadcastRequest, BroadcastResponse } from '../../../../models/broadcast.model';

// Load Broadcasts
export const loadBroadcasts = createAction(
  '[Scheduled Broadcast] Load Broadcasts',
  props<{ limit?: number; page?: number; search_name?: string; sort_by?: string }>()
);

export const loadBroadcastsSuccess = createAction(
  '[Scheduled Broadcast] Load Broadcasts Success',
  props<{ data: BroadcastResponse }>()
);

export const loadBroadcastsFailure = createAction(
  '[Scheduled Broadcast] Load Broadcasts Failure',
  props<{ error: any }>()
);

// Publish Broadcast
export const publishBroadcast = createAction(
  '[Scheduled Broadcast] Publish Broadcast',
  props<{ broadcastData: BroadcastRequest }>()
);

export const publishBroadcastSuccess = createAction(
  '[Scheduled Broadcast] Publish Broadcast Success',
  props<{ data: any }>()
);

export const publishBroadcastFailure = createAction(
  '[Scheduled Broadcast] Publish Broadcast Failure',
  props<{ error: any }>()
);

// Delete Broadcast
export const deleteBroadcast = createAction(
  '[Scheduled Broadcast] Delete Broadcast',
  props<{ broadcast_id: string }>()
);

export const deleteBroadcastSuccess = createAction(
  '[Scheduled Broadcast] Delete Broadcast Success',
  props<{ broadcast_id: string }>()
);

export const deleteBroadcastFailure = createAction(
  '[Scheduled Broadcast] Delete Broadcast Failure',
  props<{ error: any }>()
);
