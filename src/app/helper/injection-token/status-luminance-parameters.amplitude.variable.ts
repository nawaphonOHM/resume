import { InjectionToken } from '@angular/core';

/** Amplitude parameter (A) for status dot luminance oscillation. */
export const STATUS_LUMINANCE_A = new InjectionToken<number>('STATUS_LUMINANCE_A', {
  providedIn: 'root',
  factory: () => 0.5,
});
