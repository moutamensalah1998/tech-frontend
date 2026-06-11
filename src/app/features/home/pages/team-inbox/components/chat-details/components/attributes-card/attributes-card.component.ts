// components/attributes-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, take } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ContactAttribute } from '../../../../../../../../core/models/contact-attributes.model';

import { SkeletonLoaderComponent } from "../../../../../../../../shared/components/skeleton-loader/skeleton-loader.component";
import { AttributesDialogComponent } from '../attributes-dialog/attributes-dialog.component';
import { TranslatePipe } from '../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-attributes-card',
  standalone: true,
  imports: [CommonModule, MatDialogModule, SkeletonLoaderComponent, TranslatePipe],
  templateUrl: './attributes-card.component.html',
})
export class AttributesCardComponent {
  @Input() attributes$!: Observable<ContactAttribute[]>;
  @Input() loading$!: Observable<boolean>;
  @Input() conversation!: { contact_id?: string; contact_name?: string };

  constructor(private dialog: MatDialog) {}

  openAttributesDialog() {
    // open using current cached attributes (one-time read)
    this.attributes$.pipe(take(1)).subscribe(attributes => {
      const dialogRef = this.dialog.open(AttributesDialogComponent, {
        width: '600px',
        data: {
          attributes,
          contactName: this.conversation?.contact_name,
          contactId: this.conversation?.contact_id
        }
      });

      dialogRef.afterClosed().pipe(take(1)).subscribe((result: any) => {
        // parent يقوم بإعادة التحميل عند الحاجة، أو تقدر تضيف Output لإبلاغ الأب بالـ refresh.
      });
    });
  }
}
