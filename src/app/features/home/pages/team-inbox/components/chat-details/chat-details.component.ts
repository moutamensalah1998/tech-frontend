import { Component, Input, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { Conversation } from '../../../../../../core/models/conversation.model';
import { ContactAttribute } from '../../../../../../core/models/contact-attributes.model';
import { ContactTag } from '../../../../../../core/models/contact-tags.model';
import { Note } from '../../../../../../core/models/note.model';
import {
  getContactAttributes,
  getContactTags,
  getContactNotes
} from '../../../../../../core/services/contact/ngrx/contact.actions';
import {
  selectContactAttributes,
  selectContactAttributesLoading,
  selectContactTags,
  selectContactTagsLoading,
  selectContactNotes,
  selectContactNotesLoading
} from '../../../../../../core/services/contact/ngrx/contact.selectors';
import { selectAuthUser } from '../../../../../../core/services/auth/ngrx/auth.selector';

import { SkeletonLoaderComponent } from '../../../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ContactHeaderComponent } from './components/contact-header/contact-header.component';
import { ContactInfoComponent } from './components/contact-info/contact-info.component';
import { AttributesCardComponent } from './components/attributes-card/attributes-card.component';
import { TagsCardComponent } from './components/tags-card/tags-card.component';
import { NotesCardComponent } from './components/notes-card/notes-card.component';

@Component({
  selector: 'app-chat-details',
  standalone: true,
  imports: [
    CommonModule,
    ContactHeaderComponent,
    ContactInfoComponent,
    AttributesCardComponent,
    TagsCardComponent,
    NotesCardComponent,
  ],
  templateUrl: './chat-details.component.html',
  styleUrls: ['./chat-details.component.css']
})
export class ChatDetailsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() conversation!: Conversation;
  @Input() i: number = 0;

  contactAttributes$: Observable<ContactAttribute[]>;
  contactAttributesLoading$: Observable<boolean>;
  contactTags$: Observable<ContactTag[]>;
  contactTagsLoading$: Observable<boolean>;
  contactNotes$: Observable<Note[]>;
  contactNotesLoading$: Observable<boolean>;
  currentUser$: Observable<any>;

  // pagination default
  currentPage = 1;
  pageSize = 10;

  private currentContactId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private store: Store) {
    this.contactAttributes$ = this.store.select(selectContactAttributes);
    this.contactAttributesLoading$ = this.store.select(selectContactAttributesLoading);
    this.contactTags$ = this.store.select(selectContactTags);
    this.contactTagsLoading$ = this.store.select(selectContactTagsLoading);
    this.contactNotes$ = this.store.select(selectContactNotes);
    this.contactNotesLoading$ = this.store.select(selectContactNotesLoading);
    this.currentUser$ = this.store.select(selectAuthUser);
  }

  ngOnInit() {
    if (this.conversation?.contact_id) {
      this.loadContactData();
    }
  }

  ngOnChanges() {
    if (this.conversation?.contact_id && this.conversation.contact_id !== this.currentContactId) {
      this.loadContactData();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // يمكن أن يُستدعى بدون أطراف لتغيير الصفحة (page) أو لإعادة تحميل
  loadContactData(page = 1) {
    if (!this.conversation?.contact_id) return;

    if (this.conversation.contact_id !== this.currentContactId) {
      this.currentContactId = this.conversation.contact_id;
      this.currentPage = 1;
    } else {
      this.currentPage = page;
    }

    this.store.dispatch(getContactAttributes({ contactId: this.conversation.contact_id }));
    this.store.dispatch(getContactTags({ contact_id: this.conversation.contact_id }));
    this.store.dispatch(getContactNotes({
      contactId: this.conversation.contact_id,
      page: this.currentPage,
      limit: this.pageSize
    }));
  }
}
