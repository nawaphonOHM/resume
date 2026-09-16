import { InjectionToken } from '@angular/core';

/** Root marker that enables the stylesheet's animated token transition. */
export const THEME_TRANSITION_CLASS = new InjectionToken<string>('THEME_TRANSITION_CLASS', {
  providedIn: 'root',
  factory: () => 'resume-theme-transitioning',
});
