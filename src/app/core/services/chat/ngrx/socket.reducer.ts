import { createReducer, on } from '@ngrx/store';
import * as SocketActions from './socket.actions';
import { initialSocketState } from './socket.state';

export const socketReducer = createReducer(
  initialSocketState,

  // Connection
  on(SocketActions.connectSocket,        state => ({ ...state, connectError: null })),
  on(SocketActions.connectSocketSuccess, state => ({ ...state, connected: true })),
  on(SocketActions.connectSocketFailure, (state, { error }) => ({ ...state, connected: false, connectError: error })),

  // Join Business Group
  on(SocketActions.joinBusinessGroup,        state => ({ ...state, joinError: null })),
  on(SocketActions.joinBusinessGroupSuccess, state => ({
    ...state,
    joinedGroupId: state.joinedGroupId,
    joinError: null
  })),
  on(SocketActions.joinBusinessGroupFailure, (state, { error }) => ({
    ...state,
    joinedGroupId: null,
    joinError: error
  }))
);
