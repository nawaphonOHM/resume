import {InjectionToken} from '@angular/core';


export const OPEN_CV_RETRY_DELAY_MS = new InjectionToken<number>(
  'OPEN_CV_RETRY_DELAY_MS',
  {
    providedIn: 'root',
    factory: () => 1_000,
  },
);
