import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs';
import { BaseMessage } from '../../../../../../../../../../core/models/chat.types';

@Component({
  selector: 'app-audio-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-message.component.html',
})
export class AudioMessageComponent implements OnDestroy {
  @Input() message!: BaseMessage;

  audioUrl: SafeUrl | null = null;
  loading = false;
  error = false;
  isPlaying = false;
  progress = 0;
  currentTime = 0;
  duration = 0;
  private audioElement?: HTMLAudioElement;
  private http: HttpClient;

  constructor(
    private sanitizer: DomSanitizer,
    httpBackend: HttpBackend
  ) {
    this.http = new HttpClient(httpBackend);
  }

  ngOnInit() {
    if (this.message.content?.cdn_url) {
      this.fetchAudio();
    }
  }

  ngOnDestroy() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
  }

  private fetchAudio() {
    this.loading = true;
    this.error = false;

    this.http
      .get(this.message.content.cdn_url, { responseType: 'blob' })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (rawBlob) => {
          const mimeType = this.message.content.mime_type || 'audio/mpeg';
          const typedBlob = new Blob([rawBlob], { type: mimeType });
          const objectUrl = URL.createObjectURL(typedBlob);
          this.audioUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        },
        error: () => {
          this.error = true;
        },
      });
  }

  toggleAudio() {
    if (!this.audioUrl) return;

    const url = (this.audioUrl as any).changingThisBreaksApplicationSecurity;

    if (!this.audioElement) {
      const audio = new Audio(url);
      this.audioElement = audio;

      audio.addEventListener('timeupdate', () => {
        this.currentTime = audio.currentTime;
        this.duration = audio.duration || 0;
        this.progress = audio.duration
          ? (audio.currentTime / audio.duration) * 100
          : 0;
      });

      audio.addEventListener('ended', () => {
        this.isPlaying = false;
      });
    }

    if (this.isPlaying) {
      this.audioElement.pause();
      this.isPlaying = false;
    } else {
      this.audioElement.play();
      this.isPlaying = true;
    }
  }

  formatTime(sec: number = 0): string {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  }

  downloadAudio() {
    if (!this.audioUrl) return;

    const url = (this.audioUrl as any).changingThisBreaksApplicationSecurity;
    const link = document.createElement('a');
    link.href = url;
    link.download = `audio-${this.message._id}.mp3`;
    link.click();
  }
}
