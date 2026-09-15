import { inject, InjectionToken } from '@angular/core';
import type { HeroCodeOrbitPositions } from '../interface/hero-code-orbit-positions/hero-code-orbit-positions.interface.ts';
import { HERO_CODE_A } from './hero-code-parameters.amplitude.variable.ts';
import { HERO_CODE_OMEGA } from './hero-code-parameters.omega.variable.ts';
import { HERO_CODE_PHI_LEFT } from './hero-code-parameters.phi-left.variable.ts';
import { HERO_CODE_PHI_RIGHT } from './hero-code-parameters.phi-right.variable.ts';
import { HERO_CODE_R_LEFT } from './hero-code-parameters.radius-left.variable.ts';
import { HERO_CODE_R_RIGHT } from './hero-code-parameters.radius-right.variable.ts';

/** Calculates circular orbital coordinates for the hero section code badges over time. */
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
        const leftAngle = omega * elapsedSeconds + phiLeft;
        const rightAngle = omega * elapsedSeconds + phiRight;

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
