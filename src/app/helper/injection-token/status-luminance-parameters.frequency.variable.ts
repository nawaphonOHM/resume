import { InjectionToken } from '@angular/core';

/** Frequency parameter (f in Hz) for status dot luminance oscillation. */
export const STATUS_LUMINANCE_F = new InjectionToken<number>('STATUS_LUMINANCE_F', {
  providedIn: 'root',
  factory: () => 3,
});
