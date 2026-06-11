import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'info' | 'error';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private _toastMessages = new BehaviorSubject<ToastMessage[]>([]);
  toastMessages$ = this._toastMessages.asObservable();
  private counter = 0;
  private pendingRemovals = new Set<number>();
  private removalTimeouts = new Map<number, number>();
  private isReady = false;

  constructor() {
    // Set ready after a short delay to ensure component is initialized
    setTimeout(() => {
      this.isReady = true;
    }, 100);
  }

  showToast(message: string, type: ToastType) {
    try {
      // Check if service is ready
      if (!this.isReady) {
        console.warn('Toast service not ready, skipping toast:', message);
        return;
      }

      // Validate inputs
      if (!message || typeof message !== 'string') {
        console.warn('Invalid toast message:', message);
        return;
      }

      const newToast: ToastMessage = {
        id: this.counter++,
        message,
        type,
      };

      const currentToasts = this._toastMessages.value;
      this._toastMessages.next([...currentToasts, newToast]);
      
      // Clear any existing timeout for this toast
      const existingTimeout = this.removalTimeouts.get(newToast.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.removalTimeouts.delete(newToast.id);
      }
      
      // Auto-remove toast after 3 seconds
      const timeoutId = window.setTimeout(() => {
        this.removeToast(newToast.id);
      }, 3000);
      
      this.removalTimeouts.set(newToast.id, timeoutId);
    } catch (error) {
      console.error('Error showing toast:', error);
    }
  }

  removeToast(id: number) {
    try {
      // Prevent duplicate removal attempts
      if (this.pendingRemovals.has(id)) {
        return;
      }
      
      this.pendingRemovals.add(id);
      
      // Clear the timeout if it exists
      const timeoutId = this.removalTimeouts.get(id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.removalTimeouts.delete(id);
      }
      
      const currentToasts = this._toastMessages.value;
      const toastIndex = currentToasts.findIndex(toast => toast.id === id);
      
      // Only remove if the toast exists and index is valid
      if (toastIndex >= 0 && toastIndex < currentToasts.length) {
        const updatedToasts = currentToasts.filter(
          (toast) => toast.id !== id
        );
        this._toastMessages.next(updatedToasts);
      }
      
      // Remove from pending removals after a short delay
      setTimeout(() => {
        this.pendingRemovals.delete(id);
      }, 100);
    } catch (error) {
      console.error('Error removing toast:', error);
      this.pendingRemovals.delete(id);
    }
  }

  clearAllToasts() {
    try {
      // Clear all timeouts
      this.removalTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      this.removalTimeouts.clear();
      this.pendingRemovals.clear();
      this._toastMessages.next([]);
    } catch (error) {
      console.error('Error clearing toasts:', error);
    }
  }

  // Method to check if service is ready
  isServiceReady(): boolean {
    return this.isReady;
  }
}
