import { inject, InjectionToken } from '@angular/core';
import type { HeroCodeOrbitPositions } from '../interface/hero-code-orbit-positions/hero-code-orbit-positions.interface.ts';
import { HERO_CODE_A } from './hero-code-parameters.amplitude.variable.ts';
import { HERO_CODE_OMEGA } from './hero-code-parameters.omega.variable.ts';
import { HERO_CODE_PHI_LEFT } from './hero-code-parameters.phi-left.variable.ts';
import { HERO_CODE_PHI_RIGHT } from './hero-code-parameters.phi-right.variable.ts';
import { HERO_CODE_R_LEFT } from './hero-code-parameters.radius-left.variable.ts';
import { HERO_CODE_R_RIGHT } from './hero-code-parameters.radius-right.variable.ts';

/**
 * Calculates continuous two-dimensional circular orbital positions for the left and right
 * hero section code badges as a function of elapsed animation time.
 *
 * ### Physics & Kinematics Model
 * Each code badge undergoes uniform circular motion (orbit) around its respective base origin
 * anchor in the hero section canvas. The parametric equations for position at time $t$ are:
 *
 * ```
 * Left Badge Orbit:
 *   θ_left(t) = ω · t + φ_left
 *   x_left(t) = r_left · A · cos(θ_left(t))
 *   y_left(t) = r_left · A · sin(θ_left(t))
 *
 * Right Badge Orbit:
 *   θ_right(t) = ω · t + φ_right
 *   x_right(t) = r_right · A · cos(θ_right(t))
 *   y_right(t) = r_right · A · sin(θ_right(t))
 * ```
 *
 * ### Mathematical Parameters
 * - **$t$ (`elapsedSeconds`)**: Continuous elapsed time in seconds since animation loop startup
 *   ($t = (t_{\text{current}} - t_{\text{start}}) / 1000$).
 * - **$A$ (`HERO_CODE_A`)**: Dimensionless amplitude scale factor (default: `1.0`).
 * - **$\omega$ (`HERO_CODE_OMEGA`)**: Angular frequency in radians per second ($\omega = 2\pi f$).
 * - **$\phi_{\text{left}}$ (`HERO_CODE_PHI_LEFT`)**: Initial phase angle offset for the left badge
 *   in radians (default: $7\pi / 6 \approx 210^\circ$).
 * - **$\phi_{\text{right}}$ (`HERO_CODE_PHI_RIGHT`)**: Initial phase angle offset for the right badge
 *   in radians (default: $\pi / 6 \approx 30^\circ$).
 * - **$r_{\text{left}}$ (`HERO_CODE_R_LEFT`)**: Polar orbit radius in pixels for the left badge (default: `37px`).
 * - **$r_{\text{right}}$ (`HERO_CODE_R_RIGHT`)**: Polar orbit radius in pixels for the right badge (default: `50px`).
 *
 * @returns An injection token providing a factory function `(elapsedSeconds: number) => HeroCodeOrbitPositions`.
 */
export const calculateHeroCodePosition = new InjectionToken<
  (elapsedSeconds: number) => HeroCodeOrbitPositions
>('calculateHeroCodePosition', {
  providedIn: 'root',
  factory: () => {
    const fn = (
      A: number,
      omega: number,
      phiLeft: number,
      phiRight: number,
      rLeft: number,
      rRight: number,
    ) => {
      return (elapsedSeconds: number): HeroCodeOrbitPositions => {
        // Compute instantaneous polar angles θ(t) = ωt + φ in radians
        const leftAngle = omega * elapsedSeconds + phiLeft;
        const rightAngle = omega * elapsedSeconds + phiRight;

        // Project polar coordinates [r · A, θ] to 2D Cartesian offsets [x, y]
        return {
          left: {
            x: rLeft * A * Math.cos(leftAngle),
            y: rLeft * A * Math.sin(leftAngle),
          },
          right: {
            x: rRight * A * Math.cos(rightAngle),
            y: rRight * A * Math.sin(rightAngle),
          },
        };
      };
    };

    return fn(
      inject(HERO_CODE_A),
      inject(HERO_CODE_OMEGA),
      inject(HERO_CODE_PHI_LEFT),
      inject(HERO_CODE_PHI_RIGHT),
      inject(HERO_CODE_R_LEFT),
      inject(HERO_CODE_R_RIGHT),
    );
  },
});
