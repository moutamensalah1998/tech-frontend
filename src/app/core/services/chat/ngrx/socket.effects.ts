import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { SocketService } from '../socketio/socket.service';
import * as SocketActions from './socket.actions';
import { catchError, exhaustMap, filter, map, mergeMap, of, tap, delayWhen, timer, withLatestFrom } from 'rxjs';
import { ClientToServerEventsEnum } from '../../../models/socket-event.enum';
import { ServerToClientEventsEnum } from '../../../models/socket-event.enum';
import { Store } from '@ngrx/store';

@Injectable()
export class SocketEffects {
  constructor(
    private actions$: Actions,
    private socketService: SocketService,
    private store: Store
  ) {}

  connect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SocketActions.connectSocket),
      exhaustMap(() =>
        this.socketService.connect$().pipe(
          map(() => SocketActions.connectSocketSuccess()),
          catchError(err => of(SocketActions.connectSocketFailure({ error: err })))
        )
      )
    )
  );

  join$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SocketActions.joinBusinessGroup),
      tap(() => {
        this.socketService.emit(ClientToServerEventsEnum.JoinBusinessGroup);
      }),
      mergeMap(() => {
        return this.socketService.on(ServerToClientEventsEnum.BusinessGroupJoined).pipe(
          map(() => SocketActions.joinBusinessGroupSuccess()),
          catchError(err => of(SocketActions.joinBusinessGroupFailure({ error: err })))
        );
      })
    )
  );

  retryJoin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SocketActions.joinBusinessGroupFailure),
      delayWhen(() => timer(5000)),
      map(({ error }) => {
        return SocketActions.joinBusinessGroup();
      })
    )
  );

  joinBusinessGroupAfterConnect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SocketActions.connectSocketSuccess),
      map(() => {
        return SocketActions.joinBusinessGroup();
      })
    )
  );

  // Disconnect effect
  disconnect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SocketActions.disconnectSocket),
      tap(() => {
        this.socketService.disconnect();
      }),
      map(() => SocketActions.disconnectSocketSuccess()),
      catchError(err => of(SocketActions.disconnectSocketFailure({ error: err })))
    )
  );
}
