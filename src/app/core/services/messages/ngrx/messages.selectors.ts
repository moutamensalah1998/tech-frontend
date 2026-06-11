import { createFeatureSelector, createSelector } from "@ngrx/store";
import { MessagesState } from "./messages.reducer";



export const selectMessageState =
    createFeatureSelector<MessagesState>('messages');

export const selectMessageLoading = createSelector(
    selectMessageState,
    (state) => state.loading
);

export const selectMessageError = createSelector(
    selectMessageState,
    (state) => state.error
);

export const selectMessageData = createSelector(
    selectMessageState,
    (state) => state.data
);

export const selectMessages = createSelector(
    selectMessageState,
    (state) => state.messages
);

export const selectMessagesMeta = createSelector(
    selectMessageState,
    (state) => state.meta
);
