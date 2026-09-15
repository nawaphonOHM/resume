import { InjectionToken } from '@angular/core';

/** Polar radius parameter (r) for left hero code badge circular orbit motion. */
export const HERO_CODE_R_LEFT = new InjectionToken<number>('HERO_CODE_R_LEFT', {
  providedIn: 'root',
  factory: () => 37,
});
