import {inject, InjectionToken} from '@angular/core';
import type {
  HeroCodeOrbitPositions
} from '../interface/hero-code-orbit-positions/hero-code-orbit-positions.interface.ts';
import {HERO_CODE_OMEGA} from './hero-code-parameters.omega.variable.ts';
import {HERO_CODE_PHI_LEFT} from './hero-code-parameters.phi-left.variable.ts';
import {HERO_CODE_PHI_RIGHT} from './hero-code-parameters.phi-right.variable.ts';
import {HERO_CODE_R_LEFT} from './hero-code-parameters.radius-left.variable.ts';
import {HERO_CODE_R_RIGHT} from './hero-code-parameters.radius-right.variable.ts';
import {GCD} from './gcd.function.ts';

/**
 * Calculates continuous two-dimensional circular orbital positions for the left and right
 * hero section code badges as a function of continuous animation time in seconds ($t = t_{\text{unixStart}} + t_{\text{elapsed}}$
 * or initial Unix epoch timestamp in seconds $t_{\text{unixStart}} = \text{Date.now()} / 1000$).
 *
 * ### Physics & Kinematics Model
 * Each code badge undergoes uniform circular motion (orbit) around its respective base origin
 * anchor in the hero section canvas. The parametric equations for position at time $t$ (in seconds) are:
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
 * ### 2D Periodic Cycle & Period Derivation
 * The right badge rotates with angular frequency $\omega_{\text{right}} = \omega$ and period $T_{\text{right}} = \frac{2\pi}{\omega}$.
 * The left badge rotates with angular frequency $\omega_{\text{left}} = \omega \cdot \frac{r_{\text{right}}}{r_{\text{left}}}$ and period $T_{\text{left}} = \frac{2\pi \cdot r_{\text{left}}}{\omega \cdot r_{\text{right}}} = T_{\text{right}} \cdot \frac{r_{\text{left}}}{r_{\text{right}}}$.
 *
 * For both badges to return simultaneously to their initial phase states modulo $2\pi$, the system requires integer revolutions $m, n \in \mathbb{Z}^+$ such that:
 * $$m \cdot T_{\text{right}} = n \cdot T_{\text{left}} \implies \frac{m}{n} = \frac{r_{\text{left}}}{r_{\text{right}}}$$
 *
 * #### Why $\gcd(r_{\text{left}}, r_{\text{right}})$ is Needed
 * Any integer pair $(m, n)$ satisfying $\frac{m}{n} = \frac{r_{\text{left}}}{r_{\text{right}}}$ produces a valid repeating cycle, but to obtain the **minimal (fundamental) period**, the ratio $\frac{r_{\text{left}}}{r_{\text{right}}}$ must be reduced to its simplest coprime fraction:
 * - Minimal integer solutions: $m = \frac{r_{\text{left}}}{\gcd(r_{\text{left}}, r_{\text{right}})}$ and $n = \frac{r_{\text{right}}}{\gcd(r_{\text{left}}, r_{\text{right}})}$.
 * - Without $\gcd$, an unreduced period would be $\gcd(r_{\text{left}}, r_{\text{right}})$ times longer than necessary (e.g., for $r_{\text{left}} = 80, r_{\text{right}} = 50$, $\gcd = 10$, the minimal cycle is $8$ and $5$ revolutions, rather than $80$ and $50$).
 *
 * Therefore, the fundamental combined period $T$ of a single full cycle of the 2D periodic motion is:
 * $$T = m \cdot T_{\text{right}} = \frac{2\pi \cdot r_{\text{left}}}{\gcd(r_{\text{left}}, r_{\text{right}}) \cdot \omega}$$
 *
 * Over one full period $T$, the right badge completes $\frac{r_{\text{left}}}{\gcd(r_{\text{left}}, r_{\text{right}})}$ revolutions (e.g., $37$ revolutions with default radii $r_{\text{left}} = 37$, $r_{\text{right}} = 50$) and the left badge completes $\frac{r_{\text{right}}}{\gcd(r_{\text{left}}, r_{\text{right}})}$ revolutions (e.g., $50$ revolutions).
 *
 * ### Time Modulo Optimization
 * Wrapping $t$ modulo the fundamental period $T$ ($t_{\text{mod}} = t \pmod T$) before computing trigonometric angles ensures exact periodicity, prevents numerical drift, and eliminates floating-point precision loss when operating with large continuous timestamps ($t > 10^9\text{ s}$, such as Unix epoch seconds).
 *
 * ### Mathematical Parameters
 * - **$t$ (`elapsedSeconds`)**: Continuous time in seconds ($s$), evaluated either as the initial Unix epoch timestamp
 *   in seconds ($t_{\text{unixStart}} = \text{Date.now()} / 1000$) or dynamically during continuous frame animation
 *   ($t = t_{\text{unixStart}} + t_{\text{elapsed}}$ where $t_{\text{elapsed}} = (t_{\text{current}} - t_{\text{start}}) / 1000$).
 * - **$\omega$ (`HERO_CODE_OMEGA`)**: Angular frequency in radians per second ($\omega = 2\pi f$).
 * - **$\phi_{\text{left}}$ (`HERO_CODE_PHI_LEFT`)**: Initial phase angle offset for the left badge
 *   in radians (default: $0\text{ rad}$).
 * - **$\phi_{\text{right}}$ (`HERO_CODE_PHI_RIGHT`)**: Initial phase angle offset for the right badge
 *   in radians (default: $0\text{ rad}$).
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
      gcd: (a: number, b: number) => number
    ) => {
      // Compute GCD to find the minimal coprime revolution ratio and fundamental period T
      const g = gcd(rLeft, rRight);
      const period = omega > 0 && rLeft > 0 && rRight > 0 ? (2 * Math.PI * (rLeft / g)) / omega : 0;

      return (elapsedSeconds: number): HeroCodeOrbitPositions => {
        const newElapsedSeconds = period > 0 ? elapsedSeconds % period : elapsedSeconds;

        // Compute instantaneous polar angles θ(t) = ωt + φ in radians
        const leftAngle = omega * (rRight / rLeft) * newElapsedSeconds + phiLeft;
        const rightAngle = omega * newElapsedSeconds + phiRight;

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
      inject(GCD),
    );
  },
});
