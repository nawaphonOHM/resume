import type {CardSurface} from '../card-surface.interface.ts';
import type {TechnologyIconBackgroundColor} from '../../../type/technology-icon-background-color.type.ts';
import {Service} from '@angular/core';

@Service()
export class DarkSurface implements CardSurface {
  readonly backgroundColor: TechnologyIconBackgroundColor = '#0d1b2d';
  readonly rgb: [number, number, number] = [13, 27, 45];
  readonly tone: "light" | "dark" = "dark";
}
