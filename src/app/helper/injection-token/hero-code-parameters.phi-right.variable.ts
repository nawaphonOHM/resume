import { InjectionToken } from '@angular/core';

/** Initial phase offset parameter (PHI in radians) for right hero code badge circular orbit motion (default: 0 rad). */
export const HERO_CODE_PHI_RIGHT = new InjectionToken<number>('HERO_CODE_PHI_RIGHT', {
  providedIn: 'root',
  factory: () => 0,
});
