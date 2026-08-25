import { InjectionToken } from '@angular/core';

export const OPEN_CV_RETRY_COUNT = new InjectionToken<number>('OPEN_CV_RETRY_COUNT', {
  providedIn: 'root',
  factory: () => 3,
});
