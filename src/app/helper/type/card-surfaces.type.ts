import {LightSurface} from '../interface/card-surface/light-surface/light-surface.ts';
import {DarkSurface} from '../interface/card-surface/dark-surface/dark-surface.ts';


export const CARD_SURFACES = [LightSurface, DarkSurface] as const;
