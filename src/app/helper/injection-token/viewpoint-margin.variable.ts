import { InjectionToken } from '@angular/core';

/** Minimum space retained between the overlay pane and each viewport edge. */
export const VIEWPORT_MARGIN = new InjectionToken<number>('VIEWPORT_MARGIN', {
  providedIn: 'root',
  factory: () => 16,
});
