import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'sb-search-and-sort',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './sb-search_sort.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SbSearchAndSortComponent {
  @Output() searchChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();

  searchTerm = '';
  sortedBy: 'NONE' | 'ASCENDING' | 'DESCENDING' = 'NONE';

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchChange.emit(value ?? '');
    });
  }

  onInputChange(value: string) {
    this.searchSubject.next(value?.trim() ?? '');
  }

  onSortChange(value: any) {
    this.sortedBy = value;
    const sortValue = (value === 'NONE' ? '' : (value ?? '').toString().trim());
    this.sortChange.emit(sortValue);
  }
}
