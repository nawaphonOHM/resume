import { InjectionToken } from '@angular/core';

/** Initial retry backoff base delay in milliseconds for resume data API requests. */
export const RESUME_API_RETRY_DELAY_MS = new InjectionToken<number>('RESUME_API_RETRY_DELAY_MS', {
  providedIn: 'root',
  factory: () => 1_000,
});
