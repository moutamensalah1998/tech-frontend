import { Component, NgModule, OnInit } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Store } from '@ngrx/store';
import * as TagsActions from '../../../../../../../../core/services/tags/ngrx/tags.actions';
import { CommonModule } from '@angular/common';
import { TagsModel } from '../../../../../../../../core/models/tags.model';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AddTagComponent } from './components/add-tag/add-tag.component';
import { DeleteTagComponent } from './components/delete-tag/delete-tag.component';
import { selectTagData } from '../../../../../../../../core/services/tags/ngrx/tags.selectors';
import { Actions, ofType } from '@ngrx/effects';
import { EditTagComponent } from './components/edit-tag/edit-tag.component';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [MatPaginatorModule, CommonModule, FormsModule, TranslatePipe],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.css',
})
export class TagsAttributesComponent implements OnInit {
  constructor(private store: Store, private dialog: MatDialog, private actions$: Actions) {
    this.store.subscribe((state) => {
      if (state) {
      }
    })
  }


  tags$?: TagsModel | null;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  searchTerm: string = '';

  ngOnInit() {
    this.store.dispatch(TagsActions.getTags({ page: 1, limit: 5 }));
    this.store.select(selectTagData).subscribe((data) => {
      this.tags$ = data;
    });
    this.searchSubject
      .pipe(debounceTime(1000), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        if (searchTerm.trim() !== '') {
          this.onSearchForTagss(searchTerm);
        }
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.searchSubject.next(this.searchTerm);
  }

  onSearchForTagss(searchTerm: string) {
    this.store.dispatch(
      TagsActions.getTags({
        page: 1,
        limit: this.tags$?.limit || 5,
        searchTerm: searchTerm,
      })
    );
  }

  onPageChange(event: PageEvent) {
    this.store.dispatch(
      TagsActions.getTags({
        page: event.pageIndex + 1,
        limit: event.pageSize,
        searchTerm: this.searchTerm,
      })
    );
  }

  openAddTagDialog() {
    this.dialog.open(AddTagComponent,
      {
        width: '500px',
        maxWidth: '90vw',
        panelClass: 'custom-dialog-container',
        backdropClass: 'custom-dialog-backdrop',
        autoFocus: true,
      }
    );

  }

  openDeleteTagDialog(name: string) {
    this.dialog.open(DeleteTagComponent,
      {
        width: '500px',
        maxWidth: '90vw',
        panelClass: 'custom-dialog-container',
        backdropClass: 'custom-dialog-backdrop',
        data: name
      }
    );
    this.actions$.pipe(ofType(TagsActions.deleteTagSuccess)).subscribe((action) => {
      this.store.dispatch(TagsActions.getTags({ page: this.tags$?.page || 1, limit: this.tags$?.limit || 5 }));
    });

  }

  openEditTagDialog(name: string) {
    this.dialog.open(EditTagComponent, {
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-dialog-backdrop',
      data: name
    });
  }
}
