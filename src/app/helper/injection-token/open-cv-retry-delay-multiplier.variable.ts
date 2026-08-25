import { InjectionToken } from '@angular/core';

export const OPEN_CV_RETRY_DELAY_MULTIPLIER = new InjectionToken<number>(
  'OPEN_CV_RETRY_DELAY_MULTIPLIER',
  {
    providedIn: 'root',
    factory: () => 1.0,
  },
);
