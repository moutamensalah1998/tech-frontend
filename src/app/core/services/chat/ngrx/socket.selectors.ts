// src/app/store/socket/socket.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SocketState } from './socket.state';

export const selectSocket = createFeatureSelector<SocketState>('socket');

export const selectConnected     = createSelector(selectSocket, s => s.connected);
export const selectConnectError  = createSelector(selectSocket, s => s.connectError);

export const selectJoinedGroupId = createSelector(selectSocket, s => s.joinedGroupId);
export const selectJoinError     = createSelector(selectSocket, s => s.joinError);
