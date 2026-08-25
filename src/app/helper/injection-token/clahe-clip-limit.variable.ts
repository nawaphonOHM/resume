import {InjectionToken} from '@angular/core';


export const CLAHE_CLIP_LIMIT = new InjectionToken(
  'CLAHE_CLIP_LIMIT',
  {providedIn: 'root', factory: () => 2}
)
