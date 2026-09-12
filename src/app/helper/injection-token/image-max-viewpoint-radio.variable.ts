import { InjectionToken } from '@angular/core';

/** Maximum share of either viewport dimension occupied by the preview image itself. */
export const IMAGE_MAX_VIEWPORT_RATIO = new InjectionToken<number>('IMAGE_MAX_VIEWPORT_RATIO', {
  providedIn: 'root',
  factory: () => 0.2,
});
