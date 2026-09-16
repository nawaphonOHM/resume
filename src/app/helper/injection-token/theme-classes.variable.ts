import { InjectionToken } from '@angular/core';

/** Mutually exclusive root classes managed by the service. */
export const THEME_CLASSES = new InjectionToken<string[]>('THEME_CLASSES', {
  providedIn: 'root',
  factory: () => ['resume-theme-light', 'resume-theme-dark'],
});
