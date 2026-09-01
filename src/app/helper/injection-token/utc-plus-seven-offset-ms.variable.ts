import {InjectionToken} from '@angular/core';



/** Milliseconds between UTC and the fixed Bangkok UTC+7 timezone. */
export const UTC_PLUS_SEVEN_OFFSET_MS = new InjectionToken(
  'UTC_PLUS_SEVEN_OFFSET_MS',
  {
    providedIn: 'root',
    factory: () => 7 * 60 * 60 * 1_000
  }
)
