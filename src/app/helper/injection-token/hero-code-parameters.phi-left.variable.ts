import { InjectionToken } from '@angular/core';

/** Initial phase offset parameter (PHI in radians) for left hero code badge circular orbit motion (default: 0 rad). */
export const HERO_CODE_PHI_LEFT = new InjectionToken<number>('HERO_CODE_PHI_LEFT', {
  providedIn: 'root',
  factory: () => 0,
});
