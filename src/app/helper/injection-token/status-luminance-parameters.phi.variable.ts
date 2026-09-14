import { InjectionToken } from '@angular/core';

/** Initial phase offset parameter (PHI in radians) for status dot luminance oscillation. */
export const STATUS_LUMINANCE_PHI = new InjectionToken<number>('STATUS_LUMINANCE_PHI', {
  providedIn: 'root',
  factory: () => 0,
});
