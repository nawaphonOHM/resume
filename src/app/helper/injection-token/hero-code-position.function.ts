import { inject, InjectionToken } from '@angular/core';
import type { HeroCodeOrbitPositions } from '../interface/hero-code-orbit-positions/hero-code-orbit-positions.interface.ts';
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
 *   θ_left(t) = ω · (r_right / r_left) · t + φ_left
 *   x_left(t) = r_left · cos(θ_left(t))
 *   y_left(t) = r_left · sin(θ_left(t))
 *
 * Right Badge Orbit:
 *   θ_right(t) = ω · t + φ_right
 *   x_right(t) = r_right · cos(θ_right(t))
 *   y_right(t) = r_right · sin(θ_right(t))
 * ```
 *
 * ### Mathematical Parameters
 * - **$t$ (`elapsedSeconds`)**: Continuous elapsed time in seconds since animation loop startup
 *   ($t = (t_{\text{current}} - t_{\text{start}}) / 1000$).
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
      omega: number,
      phiLeft: number,
      phiRight: number,
      rLeft: number,
      rRight: number,
    ) => {
      return (elapsedSeconds: number): HeroCodeOrbitPositions => {
        // Compute instantaneous polar angles θ(t) = ωt + φ in radians
        const leftAngle = omega * (rRight / rLeft) * elapsedSeconds + phiLeft;
        const rightAngle = omega * elapsedSeconds + phiRight;

        // Project polar coordinates [r, θ] to 2D Cartesian offsets [x, y]
        return {
          left: {
            x: rLeft * Math.cos(leftAngle),
            y: rLeft * Math.sin(leftAngle),
          },
          right: {
            x: rRight * Math.cos(rightAngle),
            y: rRight * Math.sin(rightAngle),
          },
        };
      };
    };

    return fn(
      inject(HERO_CODE_OMEGA),
      inject(HERO_CODE_PHI_LEFT),
      inject(HERO_CODE_PHI_RIGHT),
      inject(HERO_CODE_R_LEFT),
      inject(HERO_CODE_R_RIGHT),
    );
  },
});
