// components/tags-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, take } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ContactTag } from '../../../../../../../../core/models/contact-tags.model';
import { TagsDialogComponent } from '../tags-dialog/tags-dialog.component';
import { SkeletonLoaderComponent } from "../../../../../../../../shared/components/skeleton-loader/skeleton-loader.component";
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';


@Component({
  selector: 'app-tags-card',
  standalone: true,
  imports: [CommonModule, MatDialogModule, SkeletonLoaderComponent, TranslatePipe],
  templateUrl: './tags-card.component.html',
})
export class TagsCardComponent {
  @Input() tags$!: Observable<ContactTag[]>;
  @Input() loading$!: Observable<boolean>;
  @Input() conversation!: { contact_id?: string; contact_name?: string };

  constructor(private dialog: MatDialog) {}

  openTagsDialog() {
    this.tags$.pipe(take(1)).subscribe(tags => {
      const dialogRef = this.dialog.open(TagsDialogComponent, {
        width: '500px',
        data: {
          tags,
          contactName: this.conversation?.contact_name,
          contactId: this.conversation?.contact_id
        }
      });

      dialogRef.afterClosed().pipe(take(1)).subscribe((result: any) => {
        // parent يمكنه إعادة التحميل حسب الحاجة.
      });
    });
  }
}
