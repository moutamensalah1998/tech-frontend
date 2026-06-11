import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ScheduledBroadcastService } from '../scheduled-broadcast.service';
import * as ScheduledBroadcastActions from './scheduled-broadcast.actions';

@Injectable()
export class ScheduledBroadcastEffects {
  loadBroadcasts$ = createEffect(() =>
  this.actions$.pipe(
    ofType(ScheduledBroadcastActions.loadBroadcasts),
    mergeMap((action) =>
      this.scheduledBroadcastService.getBroadcasts(action).pipe(
        map((data) => ScheduledBroadcastActions.loadBroadcastsSuccess({ data })),
        catchError((error) => {
          console.error('Load broadcasts effect error:', error);
          return of(ScheduledBroadcastActions.loadBroadcastsFailure({ error }));
        })
      )
    )
  )
);


  publishBroadcast$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScheduledBroadcastActions.publishBroadcast),
      switchMap(({ broadcastData }) =>
        this.scheduledBroadcastService.publishBroadcast(broadcastData).pipe(
          map((data) => ScheduledBroadcastActions.publishBroadcastSuccess({ data })),
          catchError((error) => of(ScheduledBroadcastActions.publishBroadcastFailure({ error })))
        )
      )
    )
  );

  publishBroadcastSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScheduledBroadcastActions.publishBroadcastSuccess),
      tap(() => {
        this.router.navigate(['/dashboard/broadcast/scheduled-broadcasts']);
      })
    ),
    { dispatch: false }
  );

  deleteBroadcast$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScheduledBroadcastActions.deleteBroadcast),
      switchMap(({ broadcast_id }) =>
        this.scheduledBroadcastService.deleteBroadcast(broadcast_id).pipe(
          map(() => {
            return ScheduledBroadcastActions.deleteBroadcastSuccess({ broadcast_id });
          }),
          catchError((error) => {
            console.error('Delete broadcast effect error:', error);
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              status: error.status,
              statusText: error.statusText
            });

            // Log the full error response if available
            if (error.error) {
              console.error('Server error response:', JSON.stringify(error.error, null, 2));
            }

            return of(ScheduledBroadcastActions.deleteBroadcastFailure({ error }));
          })
        )
      )
    )
  );

  // Refresh broadcasts after successful deletion
  deleteBroadcastSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ScheduledBroadcastActions.deleteBroadcastSuccess),
      map(() => ScheduledBroadcastActions.loadBroadcasts(
        { limit: 10, page: 1 }
      ))
    )
  );

  constructor(
    private actions$: Actions,
    private scheduledBroadcastService: ScheduledBroadcastService,
    private router: Router
  ) {}
}
