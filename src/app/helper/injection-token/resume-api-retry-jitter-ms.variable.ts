import { InjectionToken } from '@angular/core';

/** Additive jitter in milliseconds applied to exponential retry backoff delays. */
export const RESUME_API_RETRY_JITTER_MS = new InjectionToken<number>('RESUME_API_RETRY_JITTER_MS', {
  providedIn: 'root',
  factory: () => 0,
});
