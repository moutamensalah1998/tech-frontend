import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { NodeSearchService, SearchState } from '../../services/node-search.service';
import { NodeManagementService } from '../../services/node-management.service';

@Component({
  selector: 'app-node-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './node-search.component.html',
  styleUrls: ['./node-search.component.css']
})
export class NodeSearchComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput', { static: false }) searchInput?: ElementRef<HTMLInputElement>;

  searchState: SearchState = {
    query: '',
    results: [],
    currentIndex: -1,
    isOpen: false,
    filterByType: null,
    filterByValidation: 'all'
  };

  private destroy$ = new Subject<void>();
  private querySubject = new Subject<string>();

  constructor(
    private searchService: NodeSearchService,
    private nodeService: NodeManagementService,
    private cdr: ChangeDetectorRef
  ) {
    // Debounce search queries
    this.querySubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  ngOnInit(): void {
    this.searchService.searchState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.searchState = state;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onQueryChange(query: string): void {
    this.querySubject.next(query);
  }

  private performSearch(query: string): void {
    const nodes = this.nodeService.nodes;
    this.searchService.setQuery(query, nodes);
  }

  onFilterTypeChange(type: string | null): void {
    const nodes = this.nodeService.nodes;
    this.searchService.setFilters({ type }, nodes);
  }

  onFilterValidationChange(validation: 'all' | 'valid' | 'invalid' | 'warning'): void {
    const nodes = this.nodeService.nodes;
    this.searchService.setFilters({ validation }, nodes);
  }

  onNext(): void {
    this.searchService.nextResult();
  }

  onPrevious(): void {
    this.searchService.previousResult();
  }

  onClose(): void {
    this.searchService.close();
  }

  onResultClick(resultIndex: number): void {
    if (resultIndex >= 0 && resultIndex < this.searchState.results.length) {
      const result = this.searchState.results[resultIndex];
      // Update current index in search service
      // The search service will update the state
      // Dispatch custom event that parent can listen to
      const nodeId = result.node.id;
      window.dispatchEvent(new CustomEvent('search-node-select', { detail: { nodeId } }));
    }
  }
}

