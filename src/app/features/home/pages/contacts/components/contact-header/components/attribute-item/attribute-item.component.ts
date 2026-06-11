import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
  OnDestroy,
  Renderer2,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Attribute } from '../../../../../../../../core/models/attribute.model';
import { FormValidationUtils } from '../../../../../../../../utils/form-validation.utils';

@Component({
  selector: 'app-attribute-item',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Removed FormsModule
  templateUrl: './attribute-item.component.html',
})
export class AttributeItemComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() group!: AbstractControl;
  @Input() index = 0;
  @Input() attributes$!: Observable<Attribute[]>;
  @Input() loading$!: Observable<boolean>;

  @Input() showDropdownInput?: boolean | null = null;
  @Input() addNewModeInput?: boolean | null = null;
  @Input() newAttributeNameInput?: string | null = null;

  @Output() toggle = new EventEmitter<void>();
  @Output() enterAddNew = new EventEmitter<void>();
  @Output() exitAddNew = new EventEmitter<void>();
  @Output() newNameChange = new EventEmitter<string>();
  @Output() keyDown = new EventEmitter<KeyboardEvent>();
  @Output() saveNew = new EventEmitter<void>();
  @Output() selectAttr = new EventEmitter<Attribute>();
  @Output() remove = new EventEmitter<void>();

  public formUtils = FormValidationUtils;

  public internalShowDropdown = false;
  public internalAddNewMode = false;
  private internalNewAttributeName = '';

  @ViewChild('newAttributeInput') newAttributeInput?: ElementRef<HTMLInputElement>;

  private unlistenDocClick?: () => void;
  private hasInitiallyFocused = false;
  private isInputFocused = false;

  constructor(
    private host: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef
  ) {}

  get showDropdown(): boolean {
    return this.showDropdownInput ?? this.internalShowDropdown;
  }
  set showDropdown(v: boolean) {
    if (this.showDropdownInput === null || this.showDropdownInput === undefined) {
      this.internalShowDropdown = v;
    } else {
      this.toggle.emit();
    }
  }

  get addNewMode(): boolean {
    return this.addNewModeInput ?? this.internalAddNewMode;
  }
  set addNewMode(v: boolean) {
    if (this.addNewModeInput === null || this.addNewModeInput === undefined) {
      this.internalAddNewMode = v;
    } else {
      if (v) this.enterAddNew.emit();
      else this.exitAddNew.emit();
    }
  }

  get newAttributeName(): string {
    return this.newAttributeNameInput ?? this.internalNewAttributeName;
  }
  set newAttributeName(value: string) {
    this.internalNewAttributeName = value;
  }

  ngOnInit(): void {
    this.unlistenDocClick = this.renderer.listen('document', 'mousedown', (ev: Event) => {
      this.handleDocumentClick(ev);
    });
  }

  ngAfterViewInit(): void {
    // Focus management moved here from ngAfterViewChecked
  }

  ngOnDestroy(): void {
    this.unlistenDocClick?.();
  }

  get attributeNameValue(): string {
    const g = this.group as FormGroup;
    return (g?.get('attributeName')?.value as string) || '';
  }

  onToggle() {
    if (this.addNewMode) return; // Don't toggle if in add new mode

    if (this.showDropdownInput === null || this.showDropdownInput === undefined) {
      this.internalShowDropdown = !this.internalShowDropdown;
    } else {
      this.toggle.emit();
    }
  }

  onEnterAddNew() {
    if (this.addNewModeInput === null || this.addNewModeInput === undefined) {
      this.internalAddNewMode = true;
      this.internalShowDropdown = false; // Close dropdown when entering add new mode
    } else {
      this.enterAddNew.emit();
    }
    this.newAttributeName = '';
    this.newNameChange.emit(this.newAttributeName);
    this.hasInitiallyFocused = false; // Reset focus flag

    // Focus the input after the view updates
    setTimeout(() => {
      if (this.newAttributeInput && !this.hasInitiallyFocused) {
        try {
          this.newAttributeInput.nativeElement.focus();
          this.hasInitiallyFocused = true;
        } catch (e) {
          // ignore focus exceptions
        }
      }
    }, 0);
  }

  onExitAddNew() {
    if (this.addNewModeInput === null || this.addNewModeInput === undefined) {
      this.internalAddNewMode = false;
    } else {
      this.exitAddNew.emit();
    }
    this.newAttributeName = '';
    this.newNameChange.emit(this.newAttributeName);
    this.hasInitiallyFocused = false; // Reset focus flag
    this.isInputFocused = false;
  }

  // Handle input changes without ngModel
  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.newAttributeName = target.value ?? '';
    this.newNameChange.emit(this.newAttributeName);
  }

  onInputFocus() {
    this.isInputFocused = true;
  }

  onInputBlur() {
    // Add a small delay to allow for other interactions
    setTimeout(() => {
      this.isInputFocused = false;
    }, 150);
  }

  onNewAttributeKeyDown(ev: KeyboardEvent) {
    this.keyDown.emit(ev);
    if (ev.key === 'Enter') {
      ev.preventDefault();
      if ((this.newAttributeName || '').trim()) {
        this.onSaveNew();
      }
    } else if (ev.key === 'Escape') {
      this.onExitAddNew();
    }
  }

  onSaveNew() {
    this.saveNew.emit();
    if (this.addNewModeInput === null || this.addNewModeInput === undefined) {
      this.internalAddNewMode = false;
    }
    this.newAttributeName = '';
    this.newNameChange.emit(this.newAttributeName);
    this.hasInitiallyFocused = false; // Reset focus flag
    this.isInputFocused = false;
  }

  onSelect(attr: Attribute) {
    this.selectAttr.emit(attr);
    if (this.showDropdownInput === null || this.showDropdownInput === undefined) {
      this.internalShowDropdown = false;
    }
  }

  onRemove() {
    this.remove.emit();
  }

  private handleDocumentClick(ev: Event) {
    if (!this.showDropdown && !this.addNewMode) return;

    const target = ev.target as HTMLElement;

    // Don't close if clicking on the input field or if input is focused
    if (this.addNewMode && (
      target === this.newAttributeInput?.nativeElement ||
      this.isInputFocused ||
      this.host.nativeElement.contains(target)
    )) {
      return;
    }

    if (!this.host.nativeElement.contains(target)) {
      // Handle dropdown closing
      if (this.showDropdown) {
        if (this.showDropdownInput === null || this.showDropdownInput === undefined) {
          this.internalShowDropdown = false;
        } else {
          this.toggle.emit();
        }
      }

      // Handle add new mode closing with delay to prevent interference
      if (this.addNewMode && !this.isInputFocused) {
        setTimeout(() => {
          if (!this.isInputFocused) { // Double check after timeout
            if (this.addNewModeInput === null || this.addNewModeInput === undefined) {
              this.internalAddNewMode = false;
            } else {
              this.exitAddNew.emit();
            }
            this.hasInitiallyFocused = false;
            this.cdr.detectChanges();
          }
        }, 100);
      }
    }
  }
}
