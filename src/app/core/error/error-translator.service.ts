import { Injectable, inject } from '@angular/core';
import { TranslationService } from '../services/translation/translation.service';
import { ErrorEnum } from './error-enum';

@Injectable({
  providedIn: 'root'
})
export class ErrorTranslatorService {
  private translationService = inject(TranslationService);

  /**
   * Translates an error code to a user-friendly message in the current language
   * Uses the existing translation service pattern with dot notation keys
   */
  translateError(errorCode: string | ErrorEnum): string {
    if (!errorCode) {
      return this.translationService.translate('errors.BAD_REQUEST');
    }

    // Convert enum to string if needed
    const codeString = typeof errorCode === 'string' ? errorCode : String(errorCode);

    // Build translation key using dot notation (same pattern as existing app)
    const translationKey = `errors.${codeString}`;
    
    // Use existing translation service (same method used throughout app)
    const translated = this.translationService.translate(translationKey);

    // If translation exists (different from key), return it
    // Otherwise translation service returns the key, so we return the code as fallback
    if (translated !== translationKey) {
      return translated;
    }

    // Fallback: return the error code if no translation found
    return codeString;
  }

  /**
   * Translates error from HTTP error response
   * Priority: validation_error_code > error_code > message
   * Follows the exact same translation pattern as the rest of the app
   */
  translateHttpError(error: any): string {
    // Priority 1: Use validation_error_code if present
    if (error?.error?.validation_error_code) {
      const validationKey = `errors.${error.error.validation_error_code}`;
      const translated = this.translationService.translate(validationKey);
      if (translated !== validationKey) {
        return translated;
      }
    }

    // Priority 2: Fall back to error_code
    if (error?.error?.error_code) {
      const errorKey = `errors.${error.error.error_code}`;
      const translated = this.translationService.translate(errorKey);
      if (translated !== errorKey) {
        return translated;
      }
    }

    // Priority 3: Use message if available
    if (error?.error?.message) {
      const message = error.error.message;
      // Try to translate if it looks like an error code
      if (message && typeof message === 'string' && message.match(/^[A-Z_]+$/)) {
        const messageKey = `errors.${message}`;
        const translated = this.translationService.translate(messageKey);
        if (translated !== messageKey) {
          return translated;
        }
      }
      return message;
    }

    // Final fallback: use status code or generic error
    if (error?.status) {
      switch (error.status) {
        case 400:
          return this.translationService.translate('errors.BAD_REQUEST');
        case 401:
          return this.translationService.translate('errors.UNAUTHORIZED');
        case 403:
          return this.translationService.translate('errors.FORBIDDEN');
        case 404:
          return this.translationService.translate('errors.NOT_FOUND');
        case 500:
          return this.translationService.translate('errors.INTERNAL_ERROR');
        default:
          return this.translationService.translate('errors.INTERNAL_ERROR');
      }
    }

    // Ultimate fallback
    return this.translationService.translate('errors.INTERNAL_ERROR');
  }
}

