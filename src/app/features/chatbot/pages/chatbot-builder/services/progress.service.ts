import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ProgressState {
  visible: boolean;
  title: string;
  text: string;
  steps: string[];
  currentStep: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private progressSubject = new BehaviorSubject<ProgressState>({
    visible: false,
    title: 'Saving Flow',
    text: 'Preparing nodes for submission...',
    steps: [
      'Validating flow structure',
      'Checking node connections',
      'Preparing data for server',
      'Submitting to server',
      'Processing response'
    ],
    currentStep: 0
  });

  progress$: Observable<ProgressState> = this.progressSubject.asObservable();

  private progressInterval?: ReturnType<typeof setInterval>;

  /**
   * Start progress simulation
   */
  startProgress(title: string = 'Saving Flow', steps: string[] = this.progressSubject.value.steps): void {
    const initialState: ProgressState = {
      visible: true,
      title,
      text: steps[0] || 'Starting...',
      steps,
      currentStep: 0
    };

    this.progressSubject.next(initialState);

    this.progressInterval = setInterval(() => {
      const current = this.progressSubject.value;
      if (!current.visible) {
        this.clearInterval();
        return;
      }

      if (current.currentStep < current.steps.length - 1) {
        const nextStep = current.currentStep + 1;
        this.progressSubject.next({
          ...current,
          currentStep: nextStep,
          text: current.steps[nextStep]
        });
      }
    }, 800); // Advance every 800ms
  }

  /**
   * Update progress step manually
   */
  updateStep(step: number, text?: string): void {
    const current = this.progressSubject.value;
    if (step >= 0 && step < current.steps.length) {
      this.progressSubject.next({
        ...current,
        currentStep: step,
        text: text || current.steps[step]
      });
    }
  }

  /**
   * Reset progress
   */
  reset(): void {
    this.clearInterval();
    const current = this.progressSubject.value;
    this.progressSubject.next({
      ...current,
      visible: false,
      currentStep: 0,
      text: current.steps[0] || 'Preparing...'
    });
  }

  /**
   * Get current progress state
   */
  getProgressState(): ProgressState {
    return this.progressSubject.value;
  }

  private clearInterval(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }
  }
}

