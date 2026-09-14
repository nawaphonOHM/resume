import { inject, InjectionToken } from '@angular/core';
import { HERO_CODE_F } from './hero-code-parameters.frequency.variable.ts';

/** Angular frequency parameter (OMEGA = 2 * PI * f) for hero code badges circular orbit motion. */
export const HERO_CODE_OMEGA = new InjectionToken<number>('HERO_CODE_OMEGA', {
  providedIn: 'root',
  factory: () => 2 * Math.PI * inject(HERO_CODE_F),
});
