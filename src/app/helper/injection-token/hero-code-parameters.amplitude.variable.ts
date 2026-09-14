import { InjectionToken } from '@angular/core';

/** Amplitude parameter (A) for hero code badges circular orbit motion. */
export const HERO_CODE_A = new InjectionToken<number>('HERO_CODE_A', {
  providedIn: 'root',
  factory: () => 1,
});
