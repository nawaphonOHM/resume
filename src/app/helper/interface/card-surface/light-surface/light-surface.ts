import type {CardSurface} from '../card-surface.interface.ts';
import type {TechnologyIconBackgroundColor} from '../../../type/technology-icon-background-color.type.ts';
import {Service} from '@angular/core';


@Service()
export class LightSurface implements CardSurface {
  readonly backgroundColor: TechnologyIconBackgroundColor = '#ffffff';
  readonly rgb: [number, number, number] = [255, 255, 255];
  readonly tone: "light" | "dark" = "light";
}
