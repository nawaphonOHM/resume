import { inject, InjectionToken } from '@angular/core';
import { STATUS_LUMINANCE_F } from './status-luminance-parameters.frequency.variable.ts';

/** Angular frequency parameter (OMEGA = 2 * PI * f) for status dot luminance oscillation. */
export const STATUS_LUMINANCE_OMEGA = new InjectionToken<number>('STATUS_LUMINANCE_OMEGA', {
  providedIn: 'root',
  factory: () => 2 * Math.PI * inject(STATUS_LUMINANCE_F),
});
