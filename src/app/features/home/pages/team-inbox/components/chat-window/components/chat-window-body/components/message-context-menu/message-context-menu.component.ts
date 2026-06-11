import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-context-menu.component.html',
  styleUrls: ['./message-context-menu.component.css']
})
export class MessageContextMenuComponent {
  @Input() isVisible = false;
  @Input() position = { x: 0, y: 0 };
  @Input() message: any = null;

  @Output() reaction = new EventEmitter<any>();
  @Output() reply = new EventEmitter<any>();
  @Output() copy = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape', ['$event'])
  onEscape() {
    this.close();
  }

  onReaction() {
    this.reaction.emit(this.message);
    this.close();
  }

  onReply() {
    this.reply.emit(this.message);
    this.close();
  }

  onCopy() {
    this.copyMessageText();
    this.copy.emit(this.message);
    this.close();
  }

  onDelete() {
    if (confirm('Are you sure you want to delete this message?')) {
      this.delete.emit(this.message);
    }
    this.close();
  }

  close() {
    this.closed.emit();
  }

  private copyMessageText() {
    let textToCopy = '';

    if (this.message?.content?.text) {
      textToCopy = this.message.content.text;
    } else if (this.message?.content?.text_body) {
      textToCopy = this.message.content.text_body;
    } else if (this.message?.content?.question_text) {
      textToCopy = this.message.content.question_text;
    } else if (this.message?.content?.caption) {
      textToCopy = this.message.content.caption;
    } else {
      textToCopy = 'Message content';
    }

    navigator.clipboard.writeText(textToCopy).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  }
}
