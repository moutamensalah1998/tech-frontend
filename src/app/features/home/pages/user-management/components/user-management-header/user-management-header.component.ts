import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-user-management-header',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './user-management-header.component.html',
  styleUrls: ['./user-management-header.component.css']
})
export class UserManagementHeaderComponent implements OnInit, OnDestroy {
  @Input() activeTab: 'users' | 'teams' = 'users';
  @Output() tabChanged = new EventEmitter<'users' | 'teams'>();
  @Output() createUser = new EventEmitter<void>();
  @Output() createTeam = new EventEmitter<void>();
  @Output() searchChanged = new EventEmitter<string>();
  @Output() sortChanged = new EventEmitter<string | null>();

  private searchSubject$ = new Subject<string>();
  private sortSubject$ = new Subject<string | null>();
  private destroy$ = new Subject<void>();

  selectedSort = '';

  constructor() {
    this.searchSubject$.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => this.searchChanged.emit(value));

    this.sortSubject$.pipe(
      debounceTime(150),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.sortChanged.emit(value && value.trim() !== '' ? value : null);
    });
  }

  ngOnInit(): void {
    this.selectedSort = '';
  }

  setActiveTab(isTeam: boolean) {
    const newTab = isTeam ? 'teams' : 'users';
    this.tabChanged.emit(newTab);
  }

  openCreateUserDialog() {
    this.createUser.emit();
  }

  openCreateTeamDialog() {
    this.createTeam.emit();
  }

  onSearchChange(searchTerm: string) {
  this.searchSubject$.next(searchTerm);
}


  onSortedByChange(value: string) {
    this.selectedSort = value;
    const v = value === '' ? null : value;
    this.sortSubject$.next(v);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject$.complete();
    this.sortSubject$.complete();
  }
}
