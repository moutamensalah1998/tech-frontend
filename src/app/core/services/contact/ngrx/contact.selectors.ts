import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ContactState } from './contact.reducer';

export const selectContactState = createFeatureSelector<ContactState>('contacts');

export const selectContacts = createSelector(
    selectContactState,
    (state) => state.contacts
);

export const selectLoading = createSelector(
    selectContactState,
    (state) => state.loading
);

export const selectError = createSelector(
    selectContactState,
    (state) => state.error
);

export const selectPagination = createSelector(
    selectContactState,
    (state) => state.pagination
);

// Contact Attributes Selectors
export const selectContactAttributes = createSelector(
    selectContactState,
    (state) => state.contactAttributes
);

export const selectContactAttributesLoading = createSelector(
    selectContactState,
    (state) => state.contactAttributesLoading
);

// Contact Tags Selectors
export const selectContactTags = createSelector(
    selectContactState,
    (state) => state.contactTags
);

export const selectContactTagsLoading = createSelector(
    selectContactState,
    (state) => state.contactTagsLoading
);

export const selectContactNotes = createSelector(
    selectContactState,
    (state) => state.contactNotes
);

export const selectContactNotesLoading = createSelector(
    selectContactState,
    (state) => state.contactNotesLoading
);