import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Store } from '@ngrx/store';
import { selectAttributesData } from '../../../../../../../../core/services/attributes/ngrx/attributes.selectors';
import { Subject } from 'rxjs/internal/Subject';
import { debounceTime, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DeleteAttributeComponent } from './components/delete-attribute/delete-attribute.component';
import { AddAttributeComponent } from './components/add-attribute/add-attribute.component';
import { AttributeModel } from '../../../../../../../../core/models/attribute.model';
import { getAttributes, updateAttribute } from '../../../../../../../../core/services/attributes/ngrx/attributes.actions';
import { EditAttributeComponent } from './components/edit-attribute/edit-attribute.component';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-attributes',
  standalone: true,
  imports: [MatPaginatorModule, CommonModule, FormsModule, TranslatePipe],
  templateUrl: './attribute.component.html',
  styleUrls: ['./attribute.component.css'],
})
export class AttributeComponent {
  constructor(private store: Store, private dialog: MatDialog) {
    this.store.subscribe((state) => {
      if (state) {

      }
    });
  }
  attributes$!: AttributeModel | null;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  searchTerm: string = '';

  ngOnInit() {
    this.store.dispatch(
      getAttributes({ page: 1, limit: 5 })
    );
    this.store.select(selectAttributesData).subscribe((data) => {
      this.attributes$ = data;
    });
    this.searchSubject
      .pipe(debounceTime(1000), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        if (searchTerm.trim() !== '') {
          this.onSearchForAttributes(searchTerm);
        }
      });
  }

  onPageChange(event: PageEvent) {
    this.store.dispatch(
      getAttributes({
        page: event.pageIndex + 1,
        limit: event.pageSize,
        searchTerm: this.searchTerm,
      })
    );
  }

  onSearchForAttributes(searchTerm: string) {
    this.store.dispatch(
      getAttributes({
        page: 1,
        limit: this.attributes$?.limit || 5,
        searchTerm: searchTerm,
      })
    );
  }

  handleInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.searchSubject.next(this.searchTerm);
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  openAddTagDialog() {
    this.dialog.open(AddAttributeComponent, {
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-dialog-backdrop',
      autoFocus: true,
    });
  }

  openDeleteTagDialog(name: string) {
    this.dialog.open(DeleteAttributeComponent, {
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-dialog-backdrop',
      data: name,
    });
  }

  openEditTagDialog(name: string) {
    this.dialog.open(EditAttributeComponent, {
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-dialog-backdrop',
      data: name
    });
  }
}
