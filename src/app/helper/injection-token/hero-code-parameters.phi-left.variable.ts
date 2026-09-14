import { InjectionToken } from '@angular/core';

/** Initial phase offset parameter (PHI in radians) for left hero code badge circular orbit motion. */
export const HERO_CODE_PHI_LEFT = new InjectionToken<number>('HERO_CODE_PHI_LEFT', {
  providedIn: 'root',
  factory: () => (7 * Math.PI) / 6,
});
