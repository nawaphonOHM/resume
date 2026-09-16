import { InjectionToken } from '@angular/core';

/** Time after which the transient theme-transition marker is removed. */
export const THEME_TRANSITION_DURATION_MS = new InjectionToken<number>(
  'THEME_TRANSITION_DURATION_MS',
  {
    providedIn: 'root',
    factory: () => 250,
  },
);
