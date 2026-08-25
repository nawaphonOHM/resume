import {InjectionToken} from '@angular/core';


export const MIN_CLAHE_TILES = new InjectionToken(
  'MIN_CLAHE_TILES',
  {providedIn: 'root', factory: () => 2}
)
