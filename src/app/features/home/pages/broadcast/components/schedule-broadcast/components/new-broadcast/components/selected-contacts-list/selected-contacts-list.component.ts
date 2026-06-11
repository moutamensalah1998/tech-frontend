import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactModel } from '../../../../../../../../../../core/models/contact.model';

@Component({
  selector: 'app-selected-contacts-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selected-contacts-list.component.html',
  styleUrls: ['./selected-contacts-list.component.css']
})
export class SelectedContactsListComponent {
  @Input() contacts: ContactModel[] = [];
  @Output() removeContact = new EventEmitter<number>();

  getContactInitials(name: string): string {
    if (!name) return '?';

    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }
}
