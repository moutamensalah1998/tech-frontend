import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Node } from '../../../../../core/models/chatbot.model';

export interface SearchResult {
  node: Node;
  matchType: 'title' | 'content' | 'type';
  matchText: string;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  currentIndex: number;
  isOpen: boolean;
  filterByType: string | null;
  filterByValidation: 'all' | 'valid' | 'invalid' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class NodeSearchService {
  private searchSubject = new BehaviorSubject<SearchState>({
    query: '',
    results: [],
    currentIndex: -1,
    isOpen: false,
    filterByType: null,
    filterByValidation: 'all'
  });

  searchState$: Observable<SearchState> = this.searchSubject.asObservable();

  search(nodes: Node[], query: string, filters?: {
    type?: string | null;
    validation?: 'all' | 'valid' | 'invalid' | 'warning';
  }): SearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const lowerQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    nodes.forEach(node => {
      // Filter by type
      if (filters?.type && node.type !== filters.type) {
        return;
      }

      // Filter by validation (simplified - would need validation service)
      // For now, we'll skip this filter

      // Search in title
      if (node.title.toLowerCase().includes(lowerQuery)) {
        results.push({
          node,
          matchType: 'title',
          matchText: node.title
        });
        return; // Don't add duplicate results
      }

      // Search in content based on node type
      if (node.type === 'message' && node.body.body_message) {
        const contentItems = node.body.body_message.content_items || [];
        for (const item of contentItems) {
          if (item.type === 'text' && item.content?.text_body) {
            const text = item.content.text_body.toLowerCase();
            if (text.includes(lowerQuery)) {
              results.push({
                node,
                matchType: 'content',
                matchText: item.content.text_body.substring(0, 100)
              });
              return;
            }
          }
        }
      }

      if (node.type === 'question' && node.body.body_question) {
        const questionText = node.body.body_question.question_text?.toLowerCase() || '';
        if (questionText.includes(lowerQuery)) {
          results.push({
            node,
            matchType: 'content',
            matchText: node.body.body_question.question_text || ''
          });
          return;
        }
      }

      if (node.type === 'interactive_buttons' && node.body.body_button) {
        const bodyText = node.body.body_button.body?.text?.toLowerCase() || '';
        if (bodyText.includes(lowerQuery)) {
          results.push({
            node,
            matchType: 'content',
            matchText: node.body.body_button.body?.text || ''
          });
          return;
        }
      }
    });

    return results;
  }

  setQuery(query: string, nodes: Node[]): void {
    const currentState = this.searchSubject.value;
    const results = this.search(nodes, query, {
      type: currentState.filterByType,
      validation: currentState.filterByValidation
    });

    this.searchSubject.next({
      ...currentState,
      query,
      results,
      currentIndex: results.length > 0 ? 0 : -1
    });
  }

  setFilters(filters: {
    type?: string | null;
    validation?: 'all' | 'valid' | 'invalid' | 'warning';
  }, nodes: Node[]): void {
    const currentState = this.searchSubject.value;
    const results = this.search(nodes, currentState.query, filters);

    this.searchSubject.next({
      ...currentState,
      filterByType: filters.type ?? currentState.filterByType,
      filterByValidation: filters.validation ?? currentState.filterByValidation,
      results,
      currentIndex: results.length > 0 ? 0 : -1
    });
  }

  open(): void {
    this.searchSubject.next({
      ...this.searchSubject.value,
      isOpen: true
    });
  }

  close(): void {
    this.searchSubject.next({
      ...this.searchSubject.value,
      isOpen: false,
      query: '',
      results: [],
      currentIndex: -1
    });
  }

  nextResult(): void {
    const currentState = this.searchSubject.value;
    if (currentState.results.length === 0) return;

    const nextIndex = (currentState.currentIndex + 1) % currentState.results.length;
    this.searchSubject.next({
      ...currentState,
      currentIndex: nextIndex
    });
  }

  previousResult(): void {
    const currentState = this.searchSubject.value;
    if (currentState.results.length === 0) return;

    const prevIndex = currentState.currentIndex <= 0 
      ? currentState.results.length - 1 
      : currentState.currentIndex - 1;
    
    this.searchSubject.next({
      ...currentState,
      currentIndex: prevIndex
    });
  }

  getCurrentResult(): SearchResult | null {
    const state = this.searchSubject.value;
    if (state.currentIndex >= 0 && state.currentIndex < state.results.length) {
      return state.results[state.currentIndex];
    }
    return null;
  }
}

