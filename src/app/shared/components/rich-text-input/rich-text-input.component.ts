import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rich-text-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rich-text-input.component.html',
  styleUrl: './rich-text-input.component.css'
})
export class RichTextInputComponent implements AfterViewInit, OnChanges {
  @Input() placeholder: string = 'Type your message here...';
  @Input() value: string = '';
  @Input() disabled: boolean = false;
  @Input() maxLength: number = 1000;
  
  @Output() valueChange = new EventEmitter<string>();
  @Output() onSend = new EventEmitter<string>();
  @Output() onVariablesClick = new EventEmitter<void>();
  
  @ViewChild('contentEditable') contentEditable!: ElementRef<HTMLDivElement>;
  
  isFocused: boolean = false;
  private lastValue: string = '';
  
  ngAfterViewInit() {
    this.updateContent();
    this.initializeContentEditable();
  }
  
  private initializeContentEditable() {
    if (this.contentEditable) {
      const div = this.contentEditable.nativeElement;
      
      // Ensure the div is properly set up for contenteditable
      div.setAttribute('contenteditable', 'true');
      div.setAttribute('spellcheck', 'true');
      
      // Add a click handler to ensure focus
      div.addEventListener('click', () => {
        if (!this.disabled) {
          div.focus();
        }
      });
    }
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['value'] && !changes['value'].firstChange) {
      this.updateContent();
    }
  }
  
  updateContent() {
    if (this.contentEditable) {
      const div = this.contentEditable.nativeElement;
      if (this.value !== div.innerHTML) {
        div.innerHTML = this.value || '';
      }
    }
  }
  
  onInput() {
    if (!this.contentEditable) return;
    
    const div = this.contentEditable.nativeElement;
    const newValue = div.innerHTML;
    
    // Only update if the value has actually changed
    if (newValue !== this.lastValue) {
      this.value = newValue;
      this.lastValue = newValue;
      this.valueChange.emit(this.value);
    }
  }
  
  onKeyUp() {
    // Handle key up events to ensure typing works properly
    this.onInput();
  }
  
  onPaste(event: ClipboardEvent) {
    // Handle paste events to ensure proper content handling
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
    this.onInput();
  }
  
  onFocus() {
    this.isFocused = true;
  }
  
  onBlur() {
    this.isFocused = false;
  }
  
  onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b':
          event.preventDefault();
          this.applyFormat('bold');
          break;
        case 'i':
          event.preventDefault();
          this.applyFormat('italic');
          break;
        case 's':
          event.preventDefault();
          this.applyFormat('strikethrough');
          break;
      }
    }
  }
  
  applyFormat(format: 'bold' | 'italic' | 'strikethrough' | 'code' | 'emoji') {
    if (!this.contentEditable) return;
    
    const div = this.contentEditable.nativeElement;
    
    // Ensure the div has focus
    div.focus();
    
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0) {
      // If no selection, create a range at the end of the content
      const range = document.createRange();
      range.selectNodeContents(div);
      range.collapse(false);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    if (!selection) return;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (!selectedText) {
      // If no text is selected, don't apply formatting
      return;
    }
    
    // Use document.execCommand for better compatibility
    switch (format) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'strikethrough':
        document.execCommand('strikethrough', false);
        break;
      case 'code':
        // For code, we need to create a custom element
        const codeElement = document.createElement('code');
        codeElement.textContent = selectedText;
        range.deleteContents();
        range.insertNode(codeElement);
        break;
      case 'emoji':
        // For emoji, append to the selected text
        range.deleteContents();
        const textNode = document.createTextNode(selectedText + ' 😊');
        range.insertNode(textNode);
        break;
    }
    
    // Update the value and restore focus
    this.onInput();
    div.focus();
    
    // Clear the selection to show the formatting
    if (selection) {
      selection.removeAllRanges();
    }
  }
  
  onVariablesButtonClick() {
    this.onVariablesClick.emit();
  }
  
  onSendClick() {
    if (this.value.trim()) {
      this.onSend.emit(this.value);
    }
  }
  
  // Get plain text content (without HTML tags)
  getPlainText(): string {
    if (!this.contentEditable) return '';
    return this.contentEditable.nativeElement.textContent || '';
  }
} 