import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  addTag,
  addTagError,
  addTagSuccess,
  getTags,
} from '../../../../../../../../../../core/services/tags/ngrx/tags.actions';
import { Subscription } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { selectTagState } from '../../../../../../../../../../core/services/tags/ngrx/tags.selectors';
import { TagState } from '../../../../../../../../../../core/services/tags/ngrx/tags.reducer';
import { Actions, ofType } from '@ngrx/effects';
import { ToastService } from '../../../../../../../../../../core/services/toast-message.service';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../../../../../core/services/translation/translation.service';

@Component({
  selector: 'app-add-tag',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './add-tag.component.html',
  styleUrl: './add-tag.component.css',
})

export class AddTagComponent {
  private subscription: Subscription = new Subscription();
  tagName: string = '';
  status?: TagState;

  constructor(
    private store: Store,
    public dialogRef: MatDialogRef<AddTagComponent>,
    private actions$: Actions,
    private toastService: ToastService,
    private translationService: TranslationService
  ) {
    if (this.dialogRef) {
      this.subscription.add(
        this.dialogRef.beforeClosed().subscribe(() => {
          this.store.dispatch(getTags({ page: 1, limit: 3 }));
        })
      );

      if (this.status?.success) {
        this.dialogRef.close();
      }

    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  addTag() {
    this.store.dispatch(
      addTag({
        name: this.tagName,
      })
    );
    this.actions$.pipe(ofType(addTagSuccess)).subscribe((action) => {
      this.store.dispatch(getTags({ page: 1, limit: 5 }));
      this.dialogRef.close();
    });
    this.actions$.pipe(ofType(addTagError)).subscribe((action) => {
      if (action.error.error.status_code === 409) {
        this.toastService.showToast(this.translationService.translate('profile.tags.addTagDialog.tagExists'), 'error');
      }
    });
  }
}
