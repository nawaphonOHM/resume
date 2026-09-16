import { InjectionToken } from '@angular/core';

/** Browser storage key containing the reader's explicit theme preference. */
export const RESUME_THEME_STORAGE_KEY = new InjectionToken<string>('RESUME_THEME_STORAGE_KEY', {
  providedIn: 'root',
  factory: () => 'resume-profile-theme',
});
