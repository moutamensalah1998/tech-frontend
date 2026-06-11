import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ReportsState } from './reports.reducer';

export const selectReportsState = createFeatureSelector<ReportsState>('reports');

// Overview Selectors
export const selectOverview = createSelector(
  selectReportsState,
  (state) => state.overview
);

export const selectOverviewLoading = createSelector(
  selectReportsState,
  (state) => state.overviewLoading
);

export const selectOverviewError = createSelector(
  selectReportsState,
  (state) => state.overviewError
);

// Messages By Type Selectors
export const selectMessagesByType = createSelector(
  selectReportsState,
  (state) => state.messagesByType
);

export const selectMessagesByTypeLoading = createSelector(
  selectReportsState,
  (state) => state.messagesByTypeLoading
);

export const selectMessagesByTypeError = createSelector(
  selectReportsState,
  (state) => state.messagesByTypeError
);

// Messages Graph Selectors
export const selectMessagesGraph = createSelector(
  selectReportsState,
  (state) => state.messagesGraph
);

export const selectMessagesGraphLoading = createSelector(
  selectReportsState,
  (state) => state.messagesGraphLoading
);

export const selectMessagesGraphError = createSelector(
  selectReportsState,
  (state) => state.messagesGraphError
);

// Tickets Status Over Time Selectors
export const selectTicketsStatusOverTime = createSelector(
  selectReportsState,
  (state) => state.ticketsStatusOverTime
);

export const selectTicketsStatusOverTimeLoading = createSelector(
  selectReportsState,
  (state) => state.ticketsStatusOverTimeLoading
);

export const selectTicketsStatusOverTimeError = createSelector(
  selectReportsState,
  (state) => state.ticketsStatusOverTimeError
);

// Tickets Total By Status Selectors
export const selectTicketsTotalByStatus = createSelector(
  selectReportsState,
  (state) => state.ticketsTotalByStatus
);

export const selectTicketsTotalByStatusLoading = createSelector(
  selectReportsState,
  (state) => state.ticketsTotalByStatusLoading
);

export const selectTicketsTotalByStatusError = createSelector(
  selectReportsState,
  (state) => state.ticketsTotalByStatusError
);

// Operators Performance Selectors
export const selectOperatorsPerformance = createSelector(
  selectReportsState,
  (state) => state.operatorsPerformance
);

export const selectOperatorsPerformanceLoading = createSelector(
  selectReportsState,
  (state) => state.operatorsPerformanceLoading
);

export const selectOperatorsPerformanceError = createSelector(
  selectReportsState,
  (state) => state.operatorsPerformanceError
);

// Tags Analytics Selectors
export const selectTagsAnalytics = createSelector(
  selectReportsState,
  (state) => state.tagsAnalytics
);

export const selectTagsAnalyticsLoading = createSelector(
  selectReportsState,
  (state) => state.tagsAnalyticsLoading
);

export const selectTagsAnalyticsError = createSelector(
  selectReportsState,
  (state) => state.tagsAnalyticsError
);

// Current Period Selector
export const selectCurrentPeriod = createSelector(
  selectReportsState,
  (state) => state.currentPeriod
);

