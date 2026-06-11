import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { ReportsService } from '../reports.service';
import {
  loadOverviewReport,
  loadOverviewReportSuccess,
  loadOverviewReportFailure,
  loadMessagesByType,
  loadMessagesByTypeSuccess,
  loadMessagesByTypeFailure,
  loadMessagesGraph,
  loadMessagesGraphSuccess,
  loadMessagesGraphFailure,
  loadTicketsStatusOverTime,
  loadTicketsStatusOverTimeSuccess,
  loadTicketsStatusOverTimeFailure,
  loadTicketsTotalByStatus,
  loadTicketsTotalByStatusSuccess,
  loadTicketsTotalByStatusFailure,
  loadOperatorsPerformance,
  loadOperatorsPerformanceSuccess,
  loadOperatorsPerformanceFailure,
  loadTagsAnalytics,
  loadTagsAnalyticsSuccess,
  loadTagsAnalyticsFailure,
} from './reports.actions';

@Injectable()
export class ReportsEffects {
  constructor(
    private actions$: Actions,
    private reportsService: ReportsService
  ) {}

  loadOverviewReport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadOverviewReport),
      mergeMap(({ params }) =>
        this.reportsService.getOverviewReport(params).pipe(
          map((response) => loadOverviewReportSuccess({ data: response.data })),
          catchError((error) => {
            console.error('[ReportsEffects] loadOverviewReport error', error);
            return of(loadOverviewReportFailure({ error }));
          })
        )
      )
    )
  );

  loadMessagesByType$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadMessagesByType),
      mergeMap(({ params }) =>
        this.reportsService.getMessagesByType(params).pipe(
          map((response) => loadMessagesByTypeSuccess({ data: response.data })),
          catchError((error) => {
            console.error('[ReportsEffects] loadMessagesByType error', error);
            return of(loadMessagesByTypeFailure({ error }));
          })
        )
      )
    )
  );

  loadMessagesGraph$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadMessagesGraph),
      mergeMap(({ params }) =>
        this.reportsService.getMessagesGraph(params).pipe(
          map((response) => loadMessagesGraphSuccess({ data: response.data.data })),
          catchError((error) => {
            console.error('[ReportsEffects] loadMessagesGraph error', error);
            return of(loadMessagesGraphFailure({ error }));
          })
        )
      )
    )
  );

  loadTicketsStatusOverTime$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTicketsStatusOverTime),
      mergeMap(({ params }) =>
        this.reportsService.getTicketsStatusOverTime(params).pipe(
          map((response) => loadTicketsStatusOverTimeSuccess({ data: response.data.data })),
          catchError((error) => {
            console.error('[ReportsEffects] loadTicketsStatusOverTime error', error);
            return of(loadTicketsStatusOverTimeFailure({ error }));
          })
        )
      )
    )
  );

  loadTicketsTotalByStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTicketsTotalByStatus),
      mergeMap(({ params }) =>
        this.reportsService.getTicketsTotalByStatus(params).pipe(
          map((response) => loadTicketsTotalByStatusSuccess({ data: response.data })),
          catchError((error) => {
            console.error('[ReportsEffects] loadTicketsTotalByStatus error', error);
            return of(loadTicketsTotalByStatusFailure({ error }));
          })
        )
      )
    )
  );

  loadOperatorsPerformance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadOperatorsPerformance),
      mergeMap(({ params }) =>
        this.reportsService.getOperatorsPerformance(params).pipe(
          map((response) => loadOperatorsPerformanceSuccess({ data: response.data.operators })),
          catchError((error) => {
            console.error('[ReportsEffects] loadOperatorsPerformance error', error);
            return of(loadOperatorsPerformanceFailure({ error }));
          })
        )
      )
    )
  );

  loadTagsAnalytics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTagsAnalytics),
      mergeMap(({ params }) =>
        this.reportsService.getTagsAnalytics(params).pipe(
          map((response) => loadTagsAnalyticsSuccess({ data: response.data.tags })),
          catchError((error) => {
            console.error('[ReportsEffects] loadTagsAnalytics error', error);
            return of(loadTagsAnalyticsFailure({ error }));
          })
        )
      )
    )
  );
}

