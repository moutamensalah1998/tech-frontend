import { Component, OnInit, OnDestroy } from '@angular/core';
import { HeroComponent } from "./components/hero/hero.component";
import { NavbarComponent } from "./components/navbar/navbar.component";
import { PricingComponent } from "./components/pricing/pricing.component";
import { FeaturesComponent } from "./components/features/features.component";
import { ReviewsComponent } from "./components/reviews/reviews.component";
import { FooterComponent } from "./components/footer/footer.component";
import { CommonModule } from '@angular/common';
import { QuestionsAndAnswersComponent } from './components/questions_and_answers/questions_and_answers.component';
import { ThemeService } from '../../core/services/theme/theme.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-main',
  imports: [CommonModule, HeroComponent, QuestionsAndAnswersComponent, NavbarComponent, PricingComponent, FeaturesComponent, ReviewsComponent, FooterComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class MainComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  private destroy$ = new Subject<void>();

  constructor(private themeService: ThemeService) { }

  ngOnInit() {
    // Subscribe to theme changes from the central service
    this.themeService.resolvedTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.isDarkMode = theme === 'dark';
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleDarkMode() {
    this.themeService.toggleTheme();
  }
}

