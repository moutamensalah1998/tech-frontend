import { Component, EventEmitter, Output, OnDestroy, Input, OnInit } from '@angular/core';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactHeaderAddContactDialogComponent } from "./components/contact-header-add-contact-dialog/contact-header-add-contact-dialog.component";

@Component({
  selector: 'app-contact-header',
  standalone: true,
  imports: [CommonModule, FormsModule, ContactHeaderAddContactDialogComponent],
  templateUrl: './contact-header.component.html',
  styleUrls: ['./contact-header.component.css']
})
export class ContactHeaderComponent implements OnInit, OnDestroy {
  addContactDialog = false;

  @Input() initialSort: string | null = null;

  @Output() searchChanged = new EventEmitter<string>();
  @Output() sortChanged = new EventEmitter<string | null>();

  private searchSubject$ = new Subject<string>();
  private sortSubject$ = new Subject<string | null>();
  private destroy$ = new Subject<void>();

  selectedSort = '';
  searchTerm = '';

  constructor() {
    this.searchSubject$.pipe(
      debounceTime(1000),
      takeUntil(this.destroy$)
    ).subscribe(value => this.searchChanged.emit(value));

    this.sortSubject$.pipe(
      debounceTime(250),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.sortChanged.emit(value && value.trim() !== '' ? value : null);
    });
  }

  ngOnInit(): void {
    this.selectedSort = this.initialSort ?? '';
  }

  onSearchChange(value: string) {
    this.searchSubject$.next(value);
  }

  addContactDialogHandler() {
    this.addContactDialog = !this.addContactDialog;
  }

  onSortedByChange(value: string) {
    const v = value === '' ? null : value;
    this.selectedSort = value;
    this.sortSubject$.next(v);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject$.complete();
    this.sortSubject$.complete();
  }
}
