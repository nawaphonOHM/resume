import { inject, InjectionToken } from '@angular/core';
import { STATUS_LUMINANCE_PHI } from './status-luminance-parameters.phi.variable.ts';
import { STATUS_LUMINANCE_A } from './status-luminance-parameters.amplitude.variable.ts';
import { STATUS_LUMINANCE_OMEGA } from './status-luminance-parameters.omega.variable.ts';

/** Calculates oscillating status dot luminance in the normalized [0, 1] range. */
export const calculateStatusLuminance = new InjectionToken<(elapsedSeconds: number) => number>(
  'calculateStatusLuminance',
  {
    providedIn: 'root',
    factory: () => {
      const fn = (A: number, omega: number, phi: number) => {
        return (elapsedSeconds: number): number => {
          const x_t = A * Math.cos(omega * elapsedSeconds + phi);
          return Math.min(1, Math.max(0, 0.5 + x_t));
        };
      };

      return fn(
        inject(STATUS_LUMINANCE_A),
        inject(STATUS_LUMINANCE_OMEGA),
        inject(STATUS_LUMINANCE_PHI),
      );
    },
  },
);
