import { clearContactBulkUploadState, contactBulkUpload } from './contact.actions';
// contact.reducer.ts
import { createReducer, on } from '@ngrx/store';
import {
  getContacts, getContactsSuccess, getContactsError,
  deleteContact, deleteContactSuccess, deleteContactError,
  createContact, createContactError, createContactSuccess,
  getContactAttributes, getContactAttributesSuccess, getContactAttributesError,
  getContactTags, getContactTagsSuccess, getContactTagsError,
  getContactNotes, getContactNotesSuccess, getContactNotesError,
  createContactNote, createContactNoteSuccess, createContactNoteError,
  updateContactNote, updateContactNoteSuccess, updateContactNoteError,
  deleteContactNote, deleteContactNoteSuccess, deleteContactNoteError,
  contactBulkUploadError,
  contactBulkUploadSuccess
} from './contact.actions';
import { ContactModel } from '../../../models/contact.model';
import { ContactAttribute } from '../../../models/contact-attributes.model';
import { ContactTag } from '../../../models/contact-tags.model';
import { Note } from '../../../models/note.model';

export interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface ContactState {
  contacts: ContactModel[];
  pagination: Pagination;
  loading: boolean;
  error: any;
  contactAttributes: ContactAttribute[];
  contactTags: ContactTag[];
  contactNotes: Note[];
  contactAttributesLoading: boolean;
  contactTagsLoading: boolean;
  contactNotesLoading: boolean;
  contactBulkUploadLoading: boolean
  contactBulkUploadError: any
  contactBulkUploadData: any
}

export const initialState: ContactState = {
  contacts: [],
  pagination: {
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10
  },
  loading: false,
  error: null,
  contactAttributes: [],
  contactTags: [],
  contactNotes: [],
  contactAttributesLoading: false,
  contactTagsLoading: false,
  contactNotesLoading: false,
  contactBulkUploadLoading: false,
  contactBulkUploadError: null,
  contactBulkUploadData: null
};

export const contactReducer = createReducer(
  initialState,
  on(getContacts, (state, { page, limit }) => ({
    ...state,
    loading: true,
    error: null,
    pagination: {
      ...state.pagination,
      currentPage: page,
      limit: limit
    }
  })),
  on(getContactsSuccess, (state, { data }) => ({
    ...state,
    loading: false,
    contacts: data.contacts,
    pagination: {
      ...state.pagination,
      totalCount: data.total_count,
      totalPages: data.total_pages
    }
  })),
  on(getContactsError, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(createContact, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(createContactSuccess, (state) => ({
    ...state,
    loading: false
  })),
  on(createContactError, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(deleteContact, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(deleteContactSuccess, (state) => ({
    ...state,
    loading: false
  })),
  on(deleteContactError, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(getContactAttributes, (state) => ({
    ...state,
    contactAttributesLoading: true,
    error: null
  })),
  on(getContactAttributesSuccess, (state, { data }) => ({
    ...state,
    contactAttributesLoading: false,
    contactAttributes: data.data?.attributes || []
  })),
  on(getContactAttributesError, (state, { error }) => ({
    ...state,
    contactAttributesLoading: false,
    error
  })),
  on(getContactTags, (state) => ({
    ...state,
    contactTagsLoading: true,
    error: null
  })),
  on(getContactTagsSuccess, (state, { data }) => ({
    ...state,
    contactTagsLoading: false,
    contactTags: data.data?.tags?.tags || []
  })),
  on(getContactTagsError, (state, { error }) => ({
    ...state,
    contactTagsLoading: false,
    error
  })),
  on(getContactNotes, (state) => ({
    ...state,
    contactNotesLoading: true,
    error: null
  })),
  on(getContactNotesSuccess, (state, { data }) => ({
    ...state,
    contactNotesLoading: false,
    contactNotes: data.data?.page === 1
      ? data.data?.notes || []
      : [...state.contactNotes, ...(data.data?.notes || [])]
  })),
  on(getContactNotesError, (state, { error }) => ({
    ...state,
    contactNotesLoading: false,
    error
  })),
  on(createContactNote, (state, { noteData, user }) => ({
    ...state,
    contactNotesLoading: true,
    error: null,
    contactNotes: [...state.contactNotes, {
      id: Date.now().toString(),
      content: noteData.content,
      updated_at: new Date().toISOString(),
      user: {
        id: user?.id || 'current-user-id',
        username: user?.username || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Current User',
        email: user?.email || 'current@example.com'
      }
    }]
  })),
  on(createContactNoteSuccess, (state, { data }) => ({
    ...state,
    contactNotesLoading: false
  })),
  on(createContactNoteError, (state, { error }) => ({
    ...state,
    contactNotesLoading: false,
    error,
    contactNotes: state.contactNotes.slice(0, -1)
  })),
  on(updateContactNote, (state, { noteId, content }) => ({
    ...state,
    contactNotesLoading: true,
    error: null,
    contactNotes: state.contactNotes.map(note =>
      note.id === noteId
        ? { ...note, content, updated_at: new Date().toISOString() }
        : note
    )
  })),
  on(updateContactNoteSuccess, (state, { data }) => ({
    ...state,
    contactNotesLoading: false
  })),
  on(updateContactNoteError, (state, { error }) => ({
    ...state,
    contactNotesLoading: false,
    error
  })),
  on(deleteContactNote, (state, { noteId }) => ({
    ...state,
    contactNotesLoading: true,
    error: null,
    contactNotes: state.contactNotes.filter(note => note.id !== noteId)
  })),
  on(deleteContactNoteSuccess, (state, { data }) => ({
    ...state,
    contactNotesLoading: false
  })),
  on(deleteContactNoteError, (state, { error }) => ({
    ...state,
    contactNotesLoading: false,
    error
  })),

  on(contactBulkUpload, (state) => ({
    ...state,
    contactBulkUploadLoading: true,
    error: null,
    contactBulkUploadError: null
  })),
  on(contactBulkUploadSuccess, (state, { data }) => ({
    ...state,
    contactBulkUploadLoading: false,
    contactBulkUploadError: null,
    contactBulkUploadData: data
  })),
  on(contactBulkUploadError, (state, { error }) => ({
    ...state,
    contactBulkUploadLoading: false,
    contactBulkUploadError: error
  })),
  on(clearContactBulkUploadState, (state) => ({
    ...state,
    contactBulkUploadLoading: false,
    contactBulkUploadError: null,
    contactBulkUploadData: null
  }))
);

