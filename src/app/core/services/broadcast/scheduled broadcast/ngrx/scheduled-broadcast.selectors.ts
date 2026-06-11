import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ScheduledBroadcastState } from './scheduled-broadcast.reducer';

export const selectScheduledBroadcastState = createFeatureSelector<ScheduledBroadcastState>('scheduledBroadcast');

export const selectBroadcasts = createSelector(
  selectScheduledBroadcastState,
  (state) => state.broadcasts
);

export const selectBroadcastsData = createSelector(
  selectScheduledBroadcastState,
  (state) => state.broadcasts?.data?.broadcasts || []
);

export const selectBroadcastsPagination = createSelector(
  selectScheduledBroadcastState,
  (state) => {
    if (!state.broadcasts?.data) {
      return {
        total_count: 0,
        total_pages: 1,
        limit: 10,
        page: 1
      };
    }

    return {
      total_count: state.broadcasts.data.total_count,
      total_pages: state.broadcasts.data.total_pages,
      limit: state.broadcasts.data.limit,
      page: state.broadcasts.data.page
    };
  }
);

export const selectBroadcastsLoading = createSelector(
  selectScheduledBroadcastState,
  (state) => state.loading
);

export const selectBroadcastsError = createSelector(
  selectScheduledBroadcastState,
  (state) => state.error
);

export const selectPublishLoading = createSelector(
  selectScheduledBroadcastState,
  (state) => state.publishLoading
);

export const selectPublishError = createSelector(
  selectScheduledBroadcastState,
  (state) => state.publishError
);

export const selectDeleteLoading = createSelector(
  selectScheduledBroadcastState,
  (state) => state.deleteLoading
);

export const selectDeleteError = createSelector(
  selectScheduledBroadcastState,
  (state) => state.deleteError
);

export const selectDeleteSuccess = createSelector(
  selectScheduledBroadcastState,
  (state) => state.deleteSuccess
);
