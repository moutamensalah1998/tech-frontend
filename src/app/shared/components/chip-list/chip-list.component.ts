import {
  Component,
  computed,
  Input,
  signal,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-chip-list',
  standalone: true,
  imports: [FormsModule, NgForOf, NgIf],
  templateUrl: './chip-list.component.html',
  styleUrls: ['./chip-list.component.css'],
})
export class ChipListComponent {
  @Input() set selectedChips(value: any[]) {
    this.chips.set(value || []);
    this.selectedChipsChange.emit(this.chips());
  }
  private _availableChips: any[] = [];

  @Input()
  set availableChips(value: any[]) {
    this._availableChips = value || [];
  }
  @Input() label: string = 'Role';
  @Input() input_placeholder: string = 'Select a role';
  @Output() selectedChipsChange = new EventEmitter<any[]>();

  get availableChips(): any[] {
    return this._availableChips;
  }

  readonly chips = signal<any[]>([]);
  isDropdownOpen = signal<boolean>(false);

  readonly filteredChips = computed(() => {
    const chipsList = Array.isArray(this.availableChips) ? this.availableChips : [];
    return chipsList.filter(
      (chip) => !this.chips().some((selectedChip) => selectedChip.id === chip.id)
    );
  });


  toggleDropdown(): void {
    this.isDropdownOpen.set(!this.isDropdownOpen());
  }

  selectChip(chip: any): void {
    this.chips.update((chips) => [...chips, chip]);
    this.selectedChipsChange.emit(this.chips());

    this.isDropdownOpen.set(false);
  }

  remove(chip: any): void {
    this.chips.update((chipList) => {
      this.selectedChipsChange.emit(chipList.filter((c) => c.id !== chip.id));
      return chipList.filter((c) => c.id !== chip.id);
    });
  }


}
