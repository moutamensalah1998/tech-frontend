import { createChatbotMetaDataSuccess, getChatbotsMetaData } from './../../../../core/services/chatbot/ngrx/chatbot.actions';
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Output } from "@angular/core";
import { Store } from "@ngrx/store";
import { createChatbotMetaData } from "../../../../core/services/chatbot/ngrx/chatbot.actions";
import { FormsModule } from "@angular/forms";
import { Actions, ofType } from "@ngrx/effects";
import { take } from "rxjs";
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';


@Component({
  selector: 'app-add-chatbot-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './add-chatbot-dialog.component.html',
  styleUrl: './add-chatbot-dialog.component.css'
})
export class AddChatbotDialogComponent {
  chatbotName: string = '';
  chatbotLanguage: string = '';
  chatBotVersion: number = 1;
  @Output() close = new EventEmitter<void>();

  constructor(private store: Store, private actions$: Actions) { }

  saveChatBot(): void {
    this.store.dispatch(createChatbotMetaData({
      chatbot: {
        name: this.chatbotName,
        version: this.chatBotVersion,
        language: this.chatbotLanguage
      }
    }));
    this.actions$.pipe(
      ofType(createChatbotMetaDataSuccess),
      take(1)
    ).subscribe(() => {
      this.store.dispatch(getChatbotsMetaData({
        page: 1,
        limit: 10,
        search: ''
      }));
      this.closeDialog();
    });
  }

  closeDialog(): void {
    this.close.emit();
  }
}
