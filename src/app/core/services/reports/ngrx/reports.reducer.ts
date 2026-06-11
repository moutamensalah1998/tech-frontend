import { createReducer, on } from '@ngrx/store';
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
import {
  OverviewReport,
  MessagesByType,
  MessagesGraphDataPoint,
  TicketsStatusOverTimeDataPoint,
  TicketsTotalByStatus,
  OperatorPerformance,
  TagAnalytics,
  ReportPeriodParams,
} from '../../../models/reports.model';

export interface ReportsState {
  // Overview
  overview: OverviewReport | null;
  overviewLoading: boolean;
  overviewError: any;

  // Messages by Type
  messagesByType: MessagesByType | null;
  messagesByTypeLoading: boolean;
  messagesByTypeError: any;

  // Messages Graph
  messagesGraph: MessagesGraphDataPoint[] | null;
  messagesGraphLoading: boolean;
  messagesGraphError: any;

  // Tickets Status Over Time
  ticketsStatusOverTime: TicketsStatusOverTimeDataPoint[] | null;
  ticketsStatusOverTimeLoading: boolean;
  ticketsStatusOverTimeError: any;

  // Tickets Total by Status
  ticketsTotalByStatus: TicketsTotalByStatus | null;
  ticketsTotalByStatusLoading: boolean;
  ticketsTotalByStatusError: any;

  // Operators Performance
  operatorsPerformance: OperatorPerformance[] | null;
  operatorsPerformanceLoading: boolean;
  operatorsPerformanceError: any;

  // Tags Analytics
  tagsAnalytics: TagAnalytics[] | null;
  tagsAnalyticsLoading: boolean;
  tagsAnalyticsError: any;

  // Current period filter
  currentPeriod: ReportPeriodParams;
}

export const initialState: ReportsState = {
  overview: null,
  overviewLoading: false,
  overviewError: null,
  messagesByType: null,
  messagesByTypeLoading: false,
  messagesByTypeError: null,
  messagesGraph: null,
  messagesGraphLoading: false,
  messagesGraphError: null,
  ticketsStatusOverTime: null,
  ticketsStatusOverTimeLoading: false,
  ticketsStatusOverTimeError: null,
  ticketsTotalByStatus: null,
  ticketsTotalByStatusLoading: false,
  ticketsTotalByStatusError: null,
  operatorsPerformance: null,
  operatorsPerformanceLoading: false,
  operatorsPerformanceError: null,
  tagsAnalytics: null,
  tagsAnalyticsLoading: false,
  tagsAnalyticsError: null,
  currentPeriod: { period_type: 'last_7_days' },
};

export const reportsReducer = createReducer(
  initialState,
  // Overview Report
  on(loadOverviewReport, (state, { params }) => ({
    ...state,
    overviewLoading: true,
    overviewError: null,
    currentPeriod: params,
  })),
  on(loadOverviewReportSuccess, (state, { data }) => ({
    ...state,
    overview: data,
    overviewLoading: false,
    overviewError: null,
  })),
  on(loadOverviewReportFailure, (state, { error }) => ({
    ...state,
    overviewLoading: false,
    overviewError: error,
  })),

  // Messages By Type
  on(loadMessagesByType, (state, { params }) => ({
    ...state,
    messagesByTypeLoading: true,
    messagesByTypeError: null,
    currentPeriod: params,
  })),
  on(loadMessagesByTypeSuccess, (state, { data }) => ({
    ...state,
    messagesByType: data,
    messagesByTypeLoading: false,
    messagesByTypeError: null,
  })),
  on(loadMessagesByTypeFailure, (state, { error }) => ({
    ...state,
    messagesByTypeLoading: false,
    messagesByTypeError: error,
  })),

  // Messages Graph
  on(loadMessagesGraph, (state, { params }) => ({
    ...state,
    messagesGraphLoading: true,
    messagesGraphError: null,
    currentPeriod: params,
  })),
  on(loadMessagesGraphSuccess, (state, { data }) => ({
    ...state,
    messagesGraph: data,
    messagesGraphLoading: false,
    messagesGraphError: null,
  })),
  on(loadMessagesGraphFailure, (state, { error }) => ({
    ...state,
    messagesGraphLoading: false,
    messagesGraphError: error,
  })),

  // Tickets Status Over Time
  on(loadTicketsStatusOverTime, (state, { params }) => ({
    ...state,
    ticketsStatusOverTimeLoading: true,
    ticketsStatusOverTimeError: null,
    currentPeriod: params,
  })),
  on(loadTicketsStatusOverTimeSuccess, (state, { data }) => ({
    ...state,
    ticketsStatusOverTime: data,
    ticketsStatusOverTimeLoading: false,
    ticketsStatusOverTimeError: null,
  })),
  on(loadTicketsStatusOverTimeFailure, (state, { error }) => ({
    ...state,
    ticketsStatusOverTimeLoading: false,
    ticketsStatusOverTimeError: error,
  })),

  // Tickets Total By Status
  on(loadTicketsTotalByStatus, (state, { params }) => ({
    ...state,
    ticketsTotalByStatusLoading: true,
    ticketsTotalByStatusError: null,
    currentPeriod: params,
  })),
  on(loadTicketsTotalByStatusSuccess, (state, { data }) => ({
    ...state,
    ticketsTotalByStatus: data,
    ticketsTotalByStatusLoading: false,
    ticketsTotalByStatusError: null,
  })),
  on(loadTicketsTotalByStatusFailure, (state, { error }) => ({
    ...state,
    ticketsTotalByStatusLoading: false,
    ticketsTotalByStatusError: error,
  })),

  // Operators Performance
  on(loadOperatorsPerformance, (state, { params }) => ({
    ...state,
    operatorsPerformanceLoading: true,
    operatorsPerformanceError: null,
    currentPeriod: params,
  })),
  on(loadOperatorsPerformanceSuccess, (state, { data }) => ({
    ...state,
    operatorsPerformance: data,
    operatorsPerformanceLoading: false,
    operatorsPerformanceError: null,
  })),
  on(loadOperatorsPerformanceFailure, (state, { error }) => ({
    ...state,
    operatorsPerformanceLoading: false,
    operatorsPerformanceError: error,
  })),

  // Tags Analytics
  on(loadTagsAnalytics, (state, { params }) => ({
    ...state,
    tagsAnalyticsLoading: true,
    tagsAnalyticsError: null,
    currentPeriod: params,
  })),
  on(loadTagsAnalyticsSuccess, (state, { data }) => ({
    ...state,
    tagsAnalytics: data,
    tagsAnalyticsLoading: false,
    tagsAnalyticsError: null,
  })),
  on(loadTagsAnalyticsFailure, (state, { error }) => ({
    ...state,
    tagsAnalyticsLoading: false,
    tagsAnalyticsError: error,
  }))
);

