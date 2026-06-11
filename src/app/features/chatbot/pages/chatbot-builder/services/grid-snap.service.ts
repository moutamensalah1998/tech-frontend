import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GridConfig {
  enabled: boolean;
  size: number;
  showGrid: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GridSnapService {
  private readonly STORAGE_KEY = 'chatbot_grid_config';
  private configSubject = new BehaviorSubject<GridConfig>({
    enabled: false,
    size: 20,
    showGrid: false
  });

  config$: Observable<GridConfig> = this.configSubject.asObservable();

  constructor() {
    this.loadConfig();
  }

  get config(): GridConfig {
    return this.configSubject.value;
  }

  enable(): void {
    this.updateConfig({ enabled: true, showGrid: true });
  }

  disable(): void {
    this.updateConfig({ enabled: false, showGrid: false });
  }

  toggle(): void {
    if (this.config.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  setSize(size: number): void {
    this.updateConfig({ size });
  }

  setShowGrid(show: boolean): void {
    this.updateConfig({ showGrid: show });
  }

  snapPosition(position: { x: number; y: number }): { x: number; y: number } {
    if (!this.config.enabled) {
      return position;
    }

    return {
      x: Math.round(position.x / this.config.size) * this.config.size,
      y: Math.round(position.y / this.config.size) * this.config.size
    };
  }

  getGridStyle(): string {
    if (!this.config.showGrid) {
      return '';
    }

    const size = this.config.size;
    return `
      background-image: 
        linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
      background-size: ${size}px ${size}px;
    `;
  }

  private updateConfig(updates: Partial<GridConfig>): void {
    const newConfig = { ...this.configSubject.value, ...updates };
    this.configSubject.next(newConfig);
    this.saveConfig();
  }

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        this.configSubject.next({ ...this.configSubject.value, ...config });
      }
    } catch (error) {
      console.error('Failed to load grid config:', error);
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save grid config:', error);
    }
  }
}

