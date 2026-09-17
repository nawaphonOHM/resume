import { InjectionToken } from '@angular/core';

/** Angular frequency calculation function factory (ω(f) = 2 * PI * f) for hero code badges circular orbit motion. */
export const HERO_CODE_OMEGA = new InjectionToken<(f: number) => number>('HERO_CODE_OMEGA', {
  providedIn: 'root',
  factory: () => (f: number) => 2 * Math.PI * f,
});
