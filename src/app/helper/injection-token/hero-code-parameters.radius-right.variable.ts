import { InjectionToken } from '@angular/core';

/** Polar radius parameter (r) for right hero code badge circular orbit motion. */
export const HERO_CODE_R_RIGHT = new InjectionToken<number>('HERO_CODE_R_RIGHT', {
  providedIn: 'root',
  factory: () => 50,
});
