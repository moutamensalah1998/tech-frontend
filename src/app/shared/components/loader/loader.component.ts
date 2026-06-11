import { NgIf, NgClass } from '@angular/common';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';

export type LoaderSize = 'small' | 'medium' | 'large';
export type LoaderTheme = 'dark' | 'light' | 'primary';
export type LoaderType = 'spinner' | 'dots' | 'pulse' | 'gif';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [NgIf, NgClass],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent implements OnInit, OnDestroy {
  @Input() isLoading: boolean | null = false;
  @Input() message: string = 'Loading...';
  @Input() size: LoaderSize = 'medium';
  @Input() theme: LoaderTheme = 'dark';
  @Input() type: LoaderType = 'gif';   // 👈 Added this line
  @Input() gifSrc: string = 'assets/features/loader.gif';
  @Input() overlay: boolean = true;
  @Input() showMessage: boolean = true;
  @Input() customClass: string = '';
  @Input() timeout: number = 0;

  constructor() {}

  private timeoutId?: number;

  ngOnInit() {
    if (this.timeout > 0 && this.isLoading) {
      this.timeoutId = window.setTimeout(() => {
        this.isLoading = false;
      }, this.timeout);
    }
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }
  }

  get containerClasses() {
  const baseClasses = this.overlay 
    ? 'fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in-0 duration-200'
    : 'flex items-center justify-center p-8';

  // Always black background
  return `${baseClasses} bg-black text-white ${this.customClass}`;
}


  get contentClasses() {
    if (this.size === 'large') {
      // For large size, remove padding and borders to fill screen
      return 'flex flex-col items-center justify-center w-full h-full';
    }
    
    const baseClasses = 'flex flex-col items-center gap-4 p-6 rounded-xl backdrop-blur-md';
    
    const themeClasses = {
      'dark': 'bg-black/40 border border-white/10',
      'light': 'bg-white/70 border border-black/10 shadow-xl',
      'primary': 'bg-blue-600/10 border border-blue-600/20'
    };

    return `${baseClasses} ${themeClasses[this.theme]}`;
  }


  get gifClasses() {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-20 h-20',
    large: 'w-full h-full max-w-[400px] max-h-[400px]'
  };

  // Remove rounded corners for full-size
  const borderRadius = this.size === 'large' ? '' : 'rounded-lg shadow-lg';

  return `object-contain ${borderRadius} ${sizeClasses[this.size]}`;
}

  get spinnerClasses() {
    const sizeClasses = {
      'small': 'w-8 h-8 border-2',
      'medium': 'w-12 h-12 border-3',
      'large': 'w-32 h-32 border-8'
    };

    return `rounded-full border-transparent border-t-current animate-spin-custom ${sizeClasses[this.size]}`;
  }

  get dotClasses() {
    const sizeClasses = {
      'small': 'w-2 h-2',
      'medium': 'w-3 h-3',
      'large': 'w-8 h-8'
    };

    return `rounded-full bg-current animate-bounce-custom ${sizeClasses[this.size]}`;
  }

  get pulseClasses() {
    const sizeClasses = {
      'small': 'w-10 h-10',
      'medium': 'w-15 h-15',
      'large': 'w-40 h-40'
    };

    return `absolute rounded-full bg-current opacity-60 animate-pulse-custom ${sizeClasses[this.size]}`;
  }

  get messageClasses() {
    const sizeClasses = {
      'small': 'text-sm',
      'medium': 'text-base',
      'large': 'text-2xl'
    };

    return `text-center font-medium ${sizeClasses[this.size]}`;
  }
}