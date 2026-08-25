import type { TechnologyIconBackgroundColor } from '../../type/technology-icon-background-color.type.ts';

export interface CardSurface {
  readonly backgroundColor: TechnologyIconBackgroundColor;
  readonly rgb: readonly [number, number, number];
  readonly tone: 'light' | 'dark';
}
