import { inject, InjectionToken } from '@angular/core';
import { STATUS_LUMINANCE_PHI } from './status-luminance-parameters.phi.variable.ts';
import { STATUS_LUMINANCE_A } from './status-luminance-parameters.amplitude.variable.ts';
import { STATUS_LUMINANCE_OMEGA } from './status-luminance-parameters.omega.variable.ts';

/**
 * Calculates the oscillating relative luminance value $L(t) \in [0, 1]$ for the hero availability
 * status dot using a simple harmonic oscillator model.
 *
 * ### Mathematical Formulation
 * The luminance pulsation follows a DC-biased, amplitude-scaled cosine wave bounded to the unit interval $[0, 1]$:
 *
 * ```
 * x(t) = A · cos(ω · t + φ)
 * L(t) = clamp(0.5 + x(t), 0, 1) = min(1, max(0, 0.5 + A · cos(ω · t + φ)))
 * ```
 *
 * ### Parameters & Physical Interpretation
 * - **$t$ (`elapsedSeconds`)**: Continuous elapsed time in seconds since animation loop initiation.
 * - **$A$ (`STATUS_LUMINANCE_A`)**: Oscillation amplitude (default: `0.5`). Governs peak-to-peak swing
 *   around the DC center point.
 * - **$\omega$ (`STATUS_LUMINANCE_OMEGA`)**: Angular frequency in radians per second ($\omega = 2\pi f$).
 *   With $f = 0.5\text{ Hz}$ (`STATUS_LUMINANCE_F`), $\omega = \pi\text{ rad/s}$, producing a full
 *   breathing period of $T = 1/f = 2.0\text{ seconds}$.
 * - **$\phi$ (`STATUS_LUMINANCE_PHI`)**: Initial phase angle in radians (default: `0`).
 * - **DC Offset ($+0.5$)**: Centers the sinusoidal range $[-A, +A] = [-0.5, +0.5]$ around $0.5$ so that
 *   the unclipped signal spans $[0.0, 1.0]$.
 * - **Clamping ($\min(1, \max(0, \cdot))$)**: Enforces strict adherence to the valid CSS lightness/opacity
 *   unit range $[0.0, 1.0]$ against floating-point boundary drift.
 *
 * @returns An injection token providing a factory function `(elapsedSeconds: number) => number`.
 */
export const calculateStatusLuminance = new InjectionToken<(elapsedSeconds: number) => number>(
  'calculateStatusLuminance',
  {
    providedIn: 'root',
    factory: () => {
      const fn = (A: number, omega: number, phi: number) => {
        return (elapsedSeconds: number): number => {
          // Compute instantaneous harmonic displacement x(t) = A · cos(ωt + φ)
          const x_t = A * Math.cos(omega * elapsedSeconds + phi);

          // Apply DC bias (+0.5) and clamp output to the normalized [0, 1] range
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
