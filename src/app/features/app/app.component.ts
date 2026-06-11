import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ToastComponent } from '../../shared/components/toast-message/toast-message.component';
import { ToastServicePool } from '../../utils/toast.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { LoaderComponent } from "../../shared/components/loader/loader.component";
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectAuthLoading } from '../../core/services/auth/ngrx/auth.selector';
import { TranslationService } from '../../core/services/translation/translation.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { ThemeService } from '../../core/services/theme/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ToastComponent,
    LoaderComponent,
    TranslatePipe
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnDestroy, OnInit {
  initialLoading = true;
  private sub: Subscription;

  title = 'ProgGate';

  constructor(
    private errore: ToastServicePool,
    private authService: AuthService,
    private router: Router,
    private store: Store,
    private translationService: TranslationService,
    private themeService: ThemeService
  ) {
    // Protect dashboard routes if not authenticated
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (!isAuth && this.router.url.startsWith('/dashboard')) {
        this.router.navigate([''], { replaceUrl: true });
      }
    });

    // Loader appears immediately and stays until store loading = false
    this.sub = this.store.select(selectAuthLoading).subscribe(loading => {
      this.initialLoading = loading;
    });
  }

  ngOnInit() {
    // Initialize translation service and wait for translations to load
    this.translationService.initialize().catch(err => {
      console.error('Failed to initialize translations:', err);
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
