import { selectAuthResponse } from './../../auth/ngrx/auth.selector';
import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../env/environment';
import { filter, map, Observable, take } from 'rxjs';
import {
  ClientToServerEventsEnum,
  ServerToClientEventsEnum,
} from '../../../models/socket-event.enum';
import { Store } from '@ngrx/store';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket;

  constructor(private store: Store) {
    const { url, options } = environment.socketIo;
    this.socket = io(url, options);
    this.store
    .select(selectAuthResponse)
    .pipe(
      map(auth => typeof auth === 'string' ? auth : auth?.token),
      filter((token): token is string => !!token),
      take(1)
    )
    .subscribe(token => {
      this.socket = io(url, {
        ...options,
        auth: { token }
      });
    });
  }

  connect$(): Observable<Socket> {
    return new Observable((observer) => {
      this.socket.once('connect', () => {
        observer.next(this.socket);
        observer.complete();
      });
      this.socket.once('connect_error', (err) => {
        observer.error(err);
      });
      this.socket.connect();
      return () => this.socket.off('connect').off('connect_error');
    });
  }

  emit<E extends ClientToServerEventsEnum>(
    event: E,
    payload?: E extends ClientToServerEventsEnum.SendMessage
      ? { text: string }
      : E extends ClientToServerEventsEnum.JoinBusinessGroup
      ? unknown
      : unknown,
  ): void {
    this.socket.emit(event, payload);
  }

  on<E extends ServerToClientEventsEnum>(
    event: E
  ): Observable<
    E extends ServerToClientEventsEnum.BusinessGroupMessageReceived
      ? { conversation_id: string; from: string; text: string; timestamp: number }
      : E extends ServerToClientEventsEnum.BusinessGroupJoined
      ? { businessGroupId: string }
      : unknown
  > {
    return new Observable((observer) => {
      const handler = (data: any) => observer.next(data);
      this.socket.on(event, handler as any);
      return () => this.socket.off(event, handler as any);
    });
  }

  off<E extends ServerToClientEventsEnum>(event: E): void {
    this.socket.off(event);
  }

  onAll(): Observable<{ event: string; data: any }> {
    return new Observable((observer) => {
      const handler = (event: string, data: any) => observer.next({ event, data });
      this.socket.onAny(handler);
      return () => this.socket.offAny(handler);
    });
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
