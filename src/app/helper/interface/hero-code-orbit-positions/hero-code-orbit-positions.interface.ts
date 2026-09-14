import type { HeroCodeCoordinates } from '../hero-code-coordinates/hero-code-coordinates.interface.ts';

/** Cartesian orbital coordinates for both left and right hero code badges. */
export interface HeroCodeOrbitPositions {
  readonly left: HeroCodeCoordinates;
  readonly right: HeroCodeCoordinates;
}
