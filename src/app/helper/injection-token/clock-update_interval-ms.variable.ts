import {InjectionToken} from '@angular/core';


/** Frequency at which the visible clock is synchronized with the current instant. */
export const CLOCK_UPDATE_INTERVAL_MS = new InjectionToken(
  'CLOCK_UPDATE_INTERVAL_MS',
  {
    providedIn: 'root',
    factory: () => 1_000
  }
)
