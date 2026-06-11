import { createAction, props } from '@ngrx/store';
import {
  ReportPeriodParams,
  OverviewReport,
  MessagesByType,
  MessagesGraphDataPoint,
  TicketsStatusOverTimeDataPoint,
  TicketsTotalByStatus,
  OperatorPerformance,
  TagAnalytics,
} from '../../../models/reports.model';

// Overview Report Actions
export const loadOverviewReport = createAction(
  '[Reports] Load Overview Report',
  props<{ params: ReportPeriodParams }>()
);

export const loadOverviewReportSuccess = createAction(
  '[Reports] Load Overview Report Success',
  props<{ data: OverviewReport }>()
);

export const loadOverviewReportFailure = createAction(
  '[Reports] Load Overview Report Failure',
  props<{ error: any }>()
);

// Messages By Type Actions
export const loadMessagesByType = createAction(
  '[Reports] Load Messages By Type',
  props<{ params: ReportPeriodParams }>()
);

export const loadMessagesByTypeSuccess = createAction(
  '[Reports] Load Messages By Type Success',
  props<{ data: MessagesByType }>()
);

export const loadMessagesByTypeFailure = createAction(
  '[Reports] Load Messages By Type Failure',
  props<{ error: any }>()
);

// Messages Graph Actions
export const loadMessagesGraph = createAction(
  '[Reports] Load Messages Graph',
  props<{ params: ReportPeriodParams }>()
);

export const loadMessagesGraphSuccess = createAction(
  '[Reports] Load Messages Graph Success',
  props<{ data: MessagesGraphDataPoint[] }>()
);

export const loadMessagesGraphFailure = createAction(
  '[Reports] Load Messages Graph Failure',
  props<{ error: any }>()
);

// Tickets Status Over Time Actions
export const loadTicketsStatusOverTime = createAction(
  '[Reports] Load Tickets Status Over Time',
  props<{ params: ReportPeriodParams }>()
);

export const loadTicketsStatusOverTimeSuccess = createAction(
  '[Reports] Load Tickets Status Over Time Success',
  props<{ data: TicketsStatusOverTimeDataPoint[] }>()
);

export const loadTicketsStatusOverTimeFailure = createAction(
  '[Reports] Load Tickets Status Over Time Failure',
  props<{ error: any }>()
);

// Tickets Total By Status Actions
export const loadTicketsTotalByStatus = createAction(
  '[Reports] Load Tickets Total By Status',
  props<{ params: ReportPeriodParams }>()
);

export const loadTicketsTotalByStatusSuccess = createAction(
  '[Reports] Load Tickets Total By Status Success',
  props<{ data: TicketsTotalByStatus }>()
);

export const loadTicketsTotalByStatusFailure = createAction(
  '[Reports] Load Tickets Total By Status Failure',
  props<{ error: any }>()
);

// Operators Performance Actions
export const loadOperatorsPerformance = createAction(
  '[Reports] Load Operators Performance',
  props<{ params: ReportPeriodParams }>()
);

export const loadOperatorsPerformanceSuccess = createAction(
  '[Reports] Load Operators Performance Success',
  props<{ data: OperatorPerformance[] }>()
);

export const loadOperatorsPerformanceFailure = createAction(
  '[Reports] Load Operators Performance Failure',
  props<{ error: any }>()
);

// Tags Analytics Actions
export const loadTagsAnalytics = createAction(
  '[Reports] Load Tags Analytics',
  props<{ params: ReportPeriodParams }>()
);

export const loadTagsAnalyticsSuccess = createAction(
  '[Reports] Load Tags Analytics Success',
  props<{ data: TagAnalytics[] }>()
);

export const loadTagsAnalyticsFailure = createAction(
  '[Reports] Load Tags Analytics Failure',
  props<{ error: any }>()
);

