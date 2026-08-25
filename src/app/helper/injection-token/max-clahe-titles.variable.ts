import {InjectionToken} from '@angular/core';


export const MAX_CLAHE_TILES = new InjectionToken(
  'MAX_CLAHE_TILES',
  {providedIn: 'root', factory: () => 8}
)
