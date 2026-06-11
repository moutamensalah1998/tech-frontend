import { Store } from '@ngrx/store';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HomeBaseNavComponent } from '../../shared/components/home-base-nav/home-base-nav.component';
import * as ProfileSettings from '../../core/services/profile-settings/ngrx/profile-settings.actions';
import { ServerToClientEventsEnum } from '../../core/models/socket-event.enum';
import { filter, Subject, takeUntil } from 'rxjs';
import { SocketService } from '../../core/services/chat/socketio/socket.service';
import { ConversationStateService } from './pages/team-inbox/components/conversation.state.service';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-dashboard-base',
  standalone: true,
  imports: [HomeBaseNavComponent, RouterOutlet, CommonModule, TranslatePipe],
  templateUrl: './home-base.component.html',
  styleUrl: './home-base.component.css'
})
export class HomeBaseComponent implements OnDestroy, OnInit {
  private notificationSound = new Audio('/assets/tech-gate-noti.mp3');
  private destroy$ = new Subject<void>();
  showWelcomeMessage = true;

  constructor(private router: Router, private store: Store, private socketService: SocketService, private conversationState: ConversationStateService
  ) {
    this.socketService
      .onAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ event, data }) => {
        console.log('Event:', event, 'Data:', data);
      });
    this.socketService
      .on(ServerToClientEventsEnum.NewConversationReceived)
      .pipe(takeUntil(this.destroy$))
      .subscribe((conversation: any) => {
        this.notificationSound.play().catch(() => { });
      });

    this.socketService
      .on(ServerToClientEventsEnum.BusinessGroupMessageReceived)
      .pipe(takeUntil(this.destroy$))
      .subscribe((msg: any) => {
        const activeConversation = this.conversationState.getActiveConversation();
        if (!activeConversation || activeConversation.id !== msg.conversation_id) {
          msg.is_chat_bot ? this.notificationSound.play().catch(() => { }) : null;
        }
      });

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.showWelcomeMessage = event.urlAfterRedirects === '/' || event.urlAfterRedirects === '/dashboard';
      });
  }


  ngOnInit() {
    this.store.dispatch(ProfileSettings.getBusinessProfile());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
