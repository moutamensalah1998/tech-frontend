import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation/translation.service';

@Component({
    selector: 'app-language-switcher',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './language-switcher.component.html',
    styleUrls: ['./language-switcher.component.css']
})
export class LanguageSwitcherComponent {
    currentLang: string = 'en';

    constructor(private translationService: TranslationService) {
        // Subscribe to language changes
        this.translationService.getCurrentLang().subscribe(lang => {
            this.currentLang = lang;
        });
    }

    switchLanguage(lang: string) {
        if (lang !== this.currentLang) {
            this.translationService.setLanguage(lang);
        }
    }
}
