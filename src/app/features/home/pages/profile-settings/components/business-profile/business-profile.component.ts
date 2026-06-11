import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as ProfileSettings from '../../../../../../core/services/profile-settings/ngrx/profile-settings.actions';
import { selectProfileData, selectLoading } from '../../../../../../core/services/profile-settings/ngrx/profile-settings.selectors';
import { businessProfileModel, BusinessProfileIndustryEnum } from '../../../../../../core/models/business-profile-model';
import { Actions, ofType } from '@ngrx/effects';
import { ToastService } from '../../../../../../core/services/toast-message.service';
import { TranslatePipe } from '../../../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../../../core/services/translation/translation.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  selector: 'app-business-profile',
  templateUrl: './business-profile.component.html',
  styleUrls: ['./business-profile.component.css']
})
export class BusinessProfileComponent implements OnInit {
  businessProfile$: businessProfileModel | null = null;
  profileForm!: FormGroup;
  imageFile: File | null = null;
  loading = false;
  imagePreviewUrl: string | null = null;
  initialFormValue: any = null;
  private translationService = inject(TranslationService);
  
  // Expose enum to template
  BusinessProfileIndustryEnum = BusinessProfileIndustryEnum;
  industryValues: BusinessProfileIndustryEnum[] = Object.values(BusinessProfileIndustryEnum) as BusinessProfileIndustryEnum[];

  constructor(
    private store: Store,
    private actions$: Actions,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.store.dispatch(ProfileSettings.getBusinessProfile());
    this.store.select(selectProfileData).subscribe(
      (data) => {
        this.businessProfile$ = data;
        if (data && data.data && data.data.business_profile && data.data.business_profile.data && data.data.business_profile.data.length > 0) {
          const item = data.data.business_profile.data[0];
          
          // Validate and normalize the vertical value to match enum
          const verticalValue = this.validateVerticalValue(item.vertical);
          
          this.profileForm = new FormGroup({
            about: new FormControl(item.about),
            address: new FormControl(item.address),
            description: new FormControl(item.description),
            email: new FormControl(item.email),
            websites1: new FormControl(item.websites?.[0] || ''),
            websites2: new FormControl(item.websites?.[1] || ''),
            vertical: new FormControl(verticalValue),
            image: new FormControl(null),
          });
          
          this.initialFormValue = this.profileForm.getRawValue();
          this.imagePreviewUrl = item.profile_picture_url || null;
          this.profileForm.valueChanges.subscribe(() => {
          });
        }
      }
    );
    this.store.select(selectLoading).subscribe(loading => {
      this.loading = loading;
    });
  }

  onFileChange(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      this.imageFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  get canSave(): boolean {
    if (!this.profileForm || !this.initialFormValue) return false;
    const current = this.profileForm.getRawValue();
    const changed = Object.keys(current).some(key => current[key] !== this.initialFormValue[key]);
    return changed || !!this.imageFile;
  }

  /**
   * Converts API response (enum key like "TRAVEL") to enum value (like "travel-transportation")
   * for use in the form
   */
  validateVerticalValue(vertical: string | null): BusinessProfileIndustryEnum | null {
    if (!vertical) {
      return null;
    }
    
    const normalizedVertical = vertical.trim();
    
    // First, check if it's already an enum value (like "travel-transportation")
    const enumValues = Object.values(BusinessProfileIndustryEnum) as string[];
    for (const enumValue of enumValues) {
      if (enumValue === normalizedVertical) {
        return enumValue as BusinessProfileIndustryEnum;
      }
    }
    
    // If not an enum value, check if it's an enum key (like "TRAVEL")
    // and convert it to the corresponding enum value
    const enumKeys = Object.keys(BusinessProfileIndustryEnum) as Array<keyof typeof BusinessProfileIndustryEnum>;
    for (const enumKey of enumKeys) {
      if (enumKey === normalizedVertical) {
        return BusinessProfileIndustryEnum[enumKey];
      }
    }
    
    // If value doesn't match enum key or value, return null
    return null;
  }

  /**
   * Converts enum value (like "travel-transportation") to enum key (like "TRAVEL")
   * for sending to the API
   */
  convertEnumValueToKey(enumValue: BusinessProfileIndustryEnum | null): string | null {
    if (!enumValue) {
      return null;
    }
    
    // Find the key that corresponds to this enum value
    const enumKeys = Object.keys(BusinessProfileIndustryEnum) as Array<keyof typeof BusinessProfileIndustryEnum>;
    for (const enumKey of enumKeys) {
      if (BusinessProfileIndustryEnum[enumKey] === enumValue) {
        return enumKey;
      }
    }
    
    return null;
  }

  getIndustryTranslationKey(industryValue: BusinessProfileIndustryEnum): string {
    const translationMap: { [key: string]: string } = {
      'others': 'otherIndustry',
      'automotive': 'automotive',
      'beauty-spa-salon': 'beautyWellness',
      'clothing-apparel': 'fashionApparel',
      'education': 'education',
      'entertainment': 'entertainment',
      'restaurant': 'restaurantFood',
      'event-planning-service': 'eventPlanning',
      'finance-banking': 'financeBanking',
      'hotel-lodging': 'hotelLodging',
      'medical-health': 'medicalHealth',
      'non-profit': 'nonProfit',
      'professional-services': 'professionalServices',
      'shopping-retail': 'shoppingRetail',
      'travel-transportation': 'travelTransportation'
    };
    return `profile.business.industries.${translationMap[industryValue] || 'otherIndustry'}`;
  }

  onSubmit() {
    if (!this.profileForm) return;
    const formValue = this.profileForm.value;
    const formData = new FormData();
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    }
    formData.append('description', formValue.description || '');
    formData.append('about', formValue.about || '');
    formData.append('email', formValue.email || '');
    formData.append('websites', [formValue.websites1, formValue.websites2].filter(Boolean).join(','));
    
    // Convert enum value to enum key for API (API expects keys like "TRAVEL", not values like "travel-transportation")
    const verticalKey = this.convertEnumValueToKey(formValue.vertical);
    formData.append('vertical', verticalKey || '');
    
    formData.append('address', formValue.address || '');
    this.store.dispatch(ProfileSettings.updateBusinessProfile({ formData }));
    this.actions$.pipe(ofType(ProfileSettings.updateBusinessProfileSuccess)).subscribe({
      next: (data) => {
        this.store.dispatch(ProfileSettings.getBusinessProfile());
      },
      error: (error) => {
        this.toast.showToast(this.translationService.translate('profile.business.updateFailedTryAgain'), 'error');
      }
    });
  }
}
