import {InjectionToken} from '@angular/core';


export const CLAHE_TILE_PIXEL_TARGET = new InjectionToken(
  'CLAHE_TILE_PIXEL_TARGET',
  {providedIn: 'root', factory: () => 16}
)
