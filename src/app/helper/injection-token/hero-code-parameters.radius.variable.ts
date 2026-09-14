import { InjectionToken } from '@angular/core';

/** Polar radius parameter (r) for hero code badges circular orbit motion. */
export const HERO_CODE_R = new InjectionToken<number>('HERO_CODE_R', {
  providedIn: 'root',
  factory: () => 60,
});
