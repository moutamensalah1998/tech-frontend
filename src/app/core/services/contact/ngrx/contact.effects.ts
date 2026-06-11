import { Injectable } from "@angular/core";
import { ContactService } from "../contact.service";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { catchError, map, mergeMap, of, switchMap, tap } from "rxjs";
import {
  createContact, createContactError, createContactSuccess,
  deleteContact, deleteContactSuccess, deleteContactError,
  getContacts, getContactsError, getContactsSuccess,
  getContactAttributes, getContactAttributesSuccess, getContactAttributesError,
  getContactTags, getContactTagsSuccess, getContactTagsError,
  getContactNotes, getContactNotesSuccess, getContactNotesError,
  createContactNote, createContactNoteSuccess, createContactNoteError,
  updateContactNote, updateContactNoteSuccess, updateContactNoteError,
  deleteContactNote, deleteContactNoteSuccess, deleteContactNoteError,
  contactBulkUpload,
  contactBulkUploadError,
  contactBulkUploadSuccess,
} from "./contact.actions";

@Injectable({
  providedIn: "root"
})
export class ContactEffects {
  constructor(
    private actions$: Actions,
    private contactService: ContactService
  ) { }

  // load contacts — use switchMap to cancel previous requests when a new one arrives (helpful for search)
  loadContacts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getContacts),
      switchMap(({ page, limit, searchTerm, sort }) =>
        this.contactService
          .getContact(page, limit, searchTerm ?? undefined, sort ?? undefined)
          .pipe(
            // normalize response: some APIs return { data: ... } and some return the data directly
            map((response: any) => getContactsSuccess({ data: response?.data ?? response })),
            catchError((error) => {
              console.error('[ContactEffects] getContacts error', error);
              return of(getContactsError({ error }));
            })
          )
      )
    )
  );

 // simple fix: pass undefined when attributes is empty
createContact$ = createEffect(() =>
  this.actions$.pipe(
    ofType(createContact),
    mergeMap(({ name, phone_number, attributes }) => {
      const attrs = Array.isArray(attributes) && attributes.length > 0 ? attributes : undefined;
      return this.contactService.createContact(name, phone_number, attrs).pipe(
        map((response: any) => {
          const normalized = response?.data ?? response;
          return createContactSuccess({ data: normalized });
        }),
        catchError((error) => {
          console.error('[ContactEffects] createContact error', error);
          return of(createContactError({ error }));
        })
      );
    })
  )
);


  // delete contact
  deleteContact$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteContact),
      mergeMap(({ id }) =>
        this.contactService.deleteContact(id).pipe(
          map((response: any) => deleteContactSuccess({ data: response?.data ?? response })),
          catchError((error) => {
            console.error('[ContactEffects] deleteContact error', error);
            return of(deleteContactError({ error }));
          })
        )
      )
    )
  );

  // Contact Attributes Effects
  loadContactAttributes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getContactAttributes),
      mergeMap(({ contactId }) =>
        this.contactService.getContactAttributes(contactId).pipe(
          map((data: any) => getContactAttributesSuccess({ data })),
          catchError((error) => {
            console.error('[ContactEffects] getContactAttributes error', error);
            return of(getContactAttributesError({ error }));
          })
        )
      )
    )
  );

  // Contact Tags
  loadContactTags$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getContactTags),
      mergeMap(({ contact_id }) =>
        this.contactService.getContactTags(contact_id).pipe(
          map((data: any) => getContactTagsSuccess({ data })),
          catchError((error) => {
            console.error('[ContactEffects] getContactTags error', error);
            return of(getContactTagsError({ error }));
          })
        )
      )
    )
  );

  // Contact Notes
  loadContactNotes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getContactNotes),
      mergeMap(({ contactId, page = 1, limit = 10 }) =>
        this.contactService.getContactNotes(contactId, page, limit).pipe(
          map((data: any) => getContactNotesSuccess({ data })),
          catchError((error) => {
            console.error('[ContactEffects] getContactNotes error', error);
            return of(getContactNotesError({ error }));
          })
        )
      )
    )
  );

  // create note
  createContactNote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createContactNote),
      mergeMap(({ noteData }) =>
        this.contactService.createContactNote(noteData).pipe(
          // emit success action AND request to reload notes for the contact
          mergeMap((data: any) => [
            createContactNoteSuccess({ data }),
            // try to use returned contact_id, otherwise fall back to noteData.contact_id if available
            getContactNotes({
              contactId: data?.contact_id ?? noteData?.contact_id,
              page: 1,
              limit: 10
            })
          ]),
          catchError((error) => {
            console.error('[ContactEffects] createContactNote error', error);
            return of(createContactNoteError({ error }));
          })
        )
      )
    )
  );

  // update note
  updateContactNote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateContactNote),
      mergeMap(({ noteId, content }) =>
        this.contactService.updateContactNote(noteId, content).pipe(
          mergeMap((data: any) => [
            updateContactNoteSuccess({ data }),
            // expect the response to include contact_id
            getContactNotes({
              contactId: data?.contact_id,
              page: 1,
              limit: 10
            })
          ]),
          catchError((error) => {
            console.error('[ContactEffects] updateContactNote error', error);
            return of(updateContactNoteError({ error }));
          })
        )
      )
    )
  );

  // delete note
  deleteContactNote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteContactNote),
      mergeMap(({ noteId }) =>
        this.contactService.deleteContactNote(noteId).pipe(
          map((data: any) => deleteContactNoteSuccess({ data })),
          catchError((error) => {
            console.error('[ContactEffects] deleteContactNote error', error);
            return of(deleteContactNoteError({ error }));
          })
        )
      )
    )
  );

  contactBulkUpload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(contactBulkUpload),
      mergeMap(({ file }) =>
        this.contactService.contactBulkUpload(file).pipe(
          map((data: any) => contactBulkUploadSuccess({ data })),
          catchError((error) => {
            console.error('[ContactEffects] contactBulkUpload error', error);
            return of(contactBulkUploadError({ error }));
          })
        )
      )
    )
  );
}
