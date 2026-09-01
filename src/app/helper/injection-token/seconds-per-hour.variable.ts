import { InjectionToken } from '@angular/core';

/** Seconds in one hour, used to express availability boundaries from midnight. */
export const SECONDS_PER_HOUR = new InjectionToken('SECONDS_PER_HOUR', {
  providedIn: 'root',
  factory: () => 60 * 60,
});
