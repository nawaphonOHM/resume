import { InjectionToken } from '@angular/core';

/** Scale difference required to treat an image as downscaled rather than measurement noise. */
export const DOWNSCALE_TOLERANCE = new InjectionToken<number>('DOWNSCALE_TOLERANCE', {
  providedIn: 'root',
  factory: () => 0.01,
});
