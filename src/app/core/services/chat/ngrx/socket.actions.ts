import { createAction, props } from '@ngrx/store';

export const connectSocket       = createAction('[Socket] Connect');
export const connectSocketSuccess= createAction('[Socket] Connect Success');
export const connectSocketFailure= createAction('[Socket] Connect Failure', props<{ error: any }>());

export const joinBusinessGroup       = createAction('[Socket] Join Business Group');
export const joinBusinessGroupSuccess= createAction('[Socket] Join Business Group Success');
export const joinBusinessGroupFailure= createAction('[Socket] Join Business Group Failure', props<{ error: any }>());

export const disconnectSocket        = createAction('[Socket] Disconnect');
export const disconnectSocketSuccess = createAction('[Socket] Disconnect Success');
export const disconnectSocketFailure = createAction('[Socket] Disconnect Failure', props<{ error: any }>());
