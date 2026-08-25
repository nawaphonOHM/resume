import { InjectionToken } from '@angular/core';

export const OPEN_CV_RETRY_JITTER_MS = new InjectionToken<number>('OPEN_CV_RETRY_JITTER_MS', {
  providedIn: 'root',
  factory: () => 0,
});
