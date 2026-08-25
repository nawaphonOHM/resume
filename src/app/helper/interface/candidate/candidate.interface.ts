import type { CardSurface } from '../card-surface/card-surface.interface.ts';

export interface Candidate {
  readonly pixels: Uint8ClampedArray;
  readonly score: number;
  readonly surface: CardSurface;
}
