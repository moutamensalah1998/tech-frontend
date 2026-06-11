import { createAction, props } from "@ngrx/store";



export const getContacts = createAction('[Contact] Reset State',
    props<{ page: number, limit: number, searchTerm?: string, sort?: string | null }>());

export const getContactsSuccess = createAction(
    '[Contact] Get Contacts Success',
    props<{ data: any }>()
);

export const getContactsError = createAction(
    '[Contact] Get Contacts Error',
    props<{ error: any }>()
);

export const createContact = createAction(
    '[Contact] Create Contact',
    props<{ name: string, phone_number: string, attributes?: { name: string, value: string }[] }>()
)

export const createContactSuccess = createAction(
    '[Contact] Create Contact Success',
    props<{ data: any }>()
)

export const createContactError = createAction(
    '[Contact] Create Contact Error',
    props<{ error: any }>()
)

export const deleteContact = createAction(
    '[Contact] Delete Contact',
    props<{ id: string }>()
);

export const deleteContactSuccess = createAction(
    '[Contact] Delete Contact Success',
    props<{ data: any }>()
);

export const deleteContactError = createAction(
    '[Contact] Delete Contact Error',
    props<{ error: any }>()
);

// Contact Attributes Actions
export const getContactAttributes = createAction(
    '[Contact] Get Contact Attributes',
    props<{ contactId: string }>()
);

export const getContactAttributesSuccess = createAction(
    '[Contact] Get Contact Attributes Success',
    props<{ data: any }>()
);

export const getContactAttributesError = createAction(
    '[Contact] Get Contact Attributes Error',
    props<{ error: any }>()
);

// Contact Tags Actions
export const getContactTags = createAction(
    '[Contact] Get Contact Tags',
    props<{ contact_id: string }>()
);

export const getContactTagsSuccess = createAction(
    '[Contact] Get Contact Tags Success',
    props<{ data: any }>()
);

export const getContactTagsError = createAction(
    '[Contact] Get Contact Tags Error',
    props<{ error: any }>()
);

// Contact Notes Actions
export const getContactNotes = createAction(
    '[Contact] Get Contact Notes',
    props<{ contactId: string; page?: number; limit?: number }>()
);

export const getContactNotesSuccess = createAction(
    '[Contact] Get Contact Notes Success',
    props<{ data: any }>()
);

export const getContactNotesError = createAction(
    '[Contact] Get Contact Notes Error',
    props<{ error: any }>()
);

export const createContactNote = createAction(
    '[Contact] Create Contact Note',
    props<{ noteData: any; user?: any }>()
);

export const createContactNoteSuccess = createAction(
    '[Contact] Create Contact Note Success',
    props<{ data: any }>()
);

export const createContactNoteError = createAction(
    '[Contact] Create Contact Note Error',
    props<{ error: any }>()
);

export const updateContactNote = createAction(
    '[Contact] Update Contact Note',
    props<{ noteId: string; content: string }>()
);

export const updateContactNoteSuccess = createAction(
    '[Contact] Update Contact Note Success',
    props<{ data: any }>()
);

export const updateContactNoteError = createAction(
    '[Contact] Update Contact Note Error',
    props<{ error: any }>()
);

export const deleteContactNote = createAction(
  '[Contact] Delete Contact Note',
  props<{ noteId: string; contactId?: string }>()
);


export const deleteContactNoteSuccess = createAction(
    '[Contact] Delete Contact Note Success',
    props<{ data: any }>()
);

export const deleteContactNoteError = createAction(
    '[Contact] Delete Contact Note Error',
    props<{ error: any }>()
);


export const contactBulkUpload = createAction(
    '[Contact] Contact Bulk Upload',
    props<{ file: File }>()
);

export const contactBulkUploadSuccess = createAction(
    '[Contact] Contact Bulk Upload Success',
    props<{ data: any }>()
);

export const contactBulkUploadError = createAction(
    '[Contact] Contact Bulk Upload Error',
    props<{ error: any }>()
);

export const clearContactBulkUploadState = createAction(
    '[Contact] Clear Contact Bulk Upload State'
);
