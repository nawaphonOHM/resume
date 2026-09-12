import { InjectionToken } from '@angular/core';

/** Preferred visual separation between an origin and its connected preview. */
export const ORIGIN_GAP = new InjectionToken<number>('ORIGIN_GAP', {
  providedIn: 'root',
  factory: () => 12,
});
