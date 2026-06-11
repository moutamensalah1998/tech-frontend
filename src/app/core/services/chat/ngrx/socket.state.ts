// src/app/store/socket/socket.state.ts
export interface SocketState {
  connected: boolean;
  connectError: any | null;
  joinedGroupId: string | null;
  joinError: any | null;
}

export const initialSocketState: SocketState = {
  connected: false,
  connectError: null,
  joinedGroupId: null,
  joinError: null
};
