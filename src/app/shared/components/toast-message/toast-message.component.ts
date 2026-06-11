import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { CommonModule, NgFor, NgSwitch, NgSwitchCase } from '@angular/common';
import { ToastMessage, ToastService } from '../../../core/services/toast-message.service';


@Component({
  standalone: true,
  selector: 'app-toast',
  templateUrl: './toast-message.component.html',
  styleUrls: ['./toast-message.component.css'],
  imports: [CommonModule, NgFor, NgSwitch, NgSwitchCase],
})
export class ToastComponent implements OnInit, OnDestroy {
  toastMessages: ToastMessage[] = [];
  private subscription!: Subscription;

  constructor(private toastService: ToastService) { }

  ngOnInit(): void {
    this.subscription = this.toastService.toastMessages$.subscribe(
      (messages) => {
        this.toastMessages = messages;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  removeToast(toastId: number): void {
    this.toastService.removeToast(toastId);
  }
}
