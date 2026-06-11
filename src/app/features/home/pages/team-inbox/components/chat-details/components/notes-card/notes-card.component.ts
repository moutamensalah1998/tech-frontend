// components/notes-card.component.ts
import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, takeUntil, take, from, Cons } from 'rxjs';
import { Store } from '@ngrx/store';
import { Note } from '../../../../../../../../core/models/note.model';

import {
  createContactNote,
  updateContactNote,
  deleteContactNote,
  getContactNotes
} from '../../../../../../../../core/services/contact/ngrx/contact.actions';
import { Conversation } from '../../../../../../../../core/models/conversation.model';
import { Actions } from '@ngrx/effects';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-notes-card',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './notes-card.component.html',

})
export class NotesCardComponent implements OnDestroy {
  @Input() notes$!: Observable<Note[]>;
  @Input() loading$!: Observable<boolean>;
  @Input() conversation!: Conversation;
  @Input() currentUser$!: Observable<any>;

  showNoteInput = false;
  noteContent = '';

  editingNoteId: string | null = null;
  editingContent = '';

  currentPage = 1;
  pageSize = 10;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private action$: Actions,
    private translationService: TranslationService
  ) {}

  toggleNoteInput() {
    this.showNoteInput = !this.showNoteInput;
    if (!this.showNoteInput) this.noteContent = '';
  }

  addNote() {
    if (!this.noteContent.trim() || !this.conversation?.contact_id) return;
    this.currentUser$.pipe(take(1), takeUntil(this.destroy$)).subscribe(currentUser => {
      const noteData = {
        content: this.noteContent.trim(),
        contact_id: this.conversation.contact_id
      };
      this.store.dispatch(createContactNote({
        noteData,
        user: currentUser?.data || currentUser
      }));
      this.noteContent = '';
      this.showNoteInput = false;
    });
  }

  cancelNote() {
    this.noteContent = '';
    this.showNoteInput = false;
  }

  startEditNote(note: Note) {
    this.editingNoteId = note.id;
    this.editingContent = note.content;
  }

  saveEditNote() {
    if (!this.editingNoteId || !this.editingContent.trim()) return;
    this.store.dispatch(updateContactNote({
      noteId: this.editingNoteId,
      content: this.editingContent.trim()
    }));
    this.cancelEditNote();
  }

  cancelEditNote() {
    this.editingNoteId = null;
    this.editingContent = '';
  }

  deleteNote(noteId: string) {
    const message = this.translationService.translate('chatDetails.notesCard.deleteNoteConfirm');
    if (confirm(message)) {
      this.store.dispatch(deleteContactNote({ noteId }));
    }
    this.action$.pipe(takeUntil(this.destroy$)).subscribe(action => {
      if (action.type === '[Contact] Delete Contact Note Success') {
        this.store.dispatch(getContactNotes({
          contactId: this.conversation.contact_id,
          page: this.currentPage,
          limit: this.pageSize
        }));
      }
    })
  }

  loadMoreNotes() {
    if (!this.conversation?.contact_id) return;
    this.currentPage++;
    this.store.dispatch(getContactNotes({
      contactId: this.conversation.contact_id,
      page: this.currentPage,
      limit: this.pageSize
    }));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}