import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

type IconKey = 'broadcast' | 'ai' | 'mass' | 'automated';

export interface Feature {
  id: string;
  icon: IconKey;
  titleKey: string;
  descriptionKey: string;
}

export const FEATURES: ReadonlyArray<Feature> = [
  {
    id: 'broadcast',
    icon: 'broadcast',
    titleKey: 'landing.features.broadcastMessaging.title',
    descriptionKey: 'landing.features.broadcastMessaging.description'
  },
  {
    id: 'ai',
    icon: 'ai',
    titleKey: 'landing.features.aiAutomation.title',
    descriptionKey: 'landing.features.aiAutomation.description'
  },
  {
    id: 'mass',
    icon: 'mass',
    titleKey: 'landing.features.massMessaging.title',
    descriptionKey: 'landing.features.massMessaging.description'
  },
  {
    id: 'automated',
    icon: 'automated',
    titleKey: 'landing.features.automatedBroadcasts.title',
    descriptionKey: 'landing.features.automatedBroadcasts.description'
  }
] as const;

@Component({
  standalone: true,
  selector: 'app-features',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css']
})
export class FeaturesComponent {
  readonly features = FEATURES;
}
