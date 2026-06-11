import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';


interface Plan {
  id: string;
  nameKey: string;
  subtitleKey: string;
  price: string;
  currency?: string;
  periodKey: string;
  featuresKeys: string[];
  popular?: boolean;
  gradient?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-pricing',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.css']
})
export class PricingComponent {

  
  plans: Plan[] = [
    {
      id: 'standard',
      nameKey: 'landing.pricing.plans.standard.name',
      subtitleKey: 'landing.pricing.plans.standard.subtitle',
      price: '500',
      currency: 'SR',
      periodKey: 'landing.pricing.plans.standard.period',
      featuresKeys: [
        'landing.pricing.plans.standard.features.0',
        'landing.pricing.plans.standard.features.1',
        'landing.pricing.plans.standard.features.2',
        'landing.pricing.plans.standard.features.3',
        'landing.pricing.plans.standard.features.4',
        'landing.pricing.plans.standard.features.5',
        'landing.pricing.plans.standard.features.6'
      ],
      popular: false,
      gradient: false
    },
    {
      id: 'pro',
      nameKey: 'landing.pricing.plans.pro.name',
      subtitleKey: 'landing.pricing.plans.pro.subtitle',
      price: '1000',
      currency: 'SR',
      periodKey: 'landing.pricing.plans.pro.period',
      featuresKeys: [
        'landing.pricing.plans.pro.features.0',
        'landing.pricing.plans.pro.features.1',
        'landing.pricing.plans.pro.features.2',
        'landing.pricing.plans.pro.features.3'
      ],
      popular: true,
      gradient: true
    },
    {
      id: 'business',
      nameKey: 'landing.pricing.plans.business.name',
      subtitleKey: 'landing.pricing.plans.business.subtitle',
      price: '1500',
      currency: 'SR',
      periodKey: 'landing.pricing.plans.business.period',
      featuresKeys: [
        'landing.pricing.plans.business.features.0',
        'landing.pricing.plans.business.features.1',
        'landing.pricing.plans.business.features.2'
      ],
      popular: false,
      gradient: false
    }
  ];
}
