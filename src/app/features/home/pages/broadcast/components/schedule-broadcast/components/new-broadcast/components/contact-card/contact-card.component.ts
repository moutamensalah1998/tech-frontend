import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactModel } from '../../../../../../../../../../core/models/contact.model';
import { TranslatePipe } from '../../../../../../../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-contact-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-card.component.html'
})
export class ContactCardComponent {
  @Input() contact!: ContactModel;
  @Input() isSelected = false;
  @Input() isDisabled = false;
  @Output() toggle = new EventEmitter<ContactModel>();

  onToggle() {
    if (!this.isDisabled) {
      this.toggle.emit(this.contact);
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';

    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }
}
