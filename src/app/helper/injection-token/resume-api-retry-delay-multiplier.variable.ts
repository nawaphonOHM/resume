import { InjectionToken } from '@angular/core';

/** Exponential backoff multiplier for resume data API retry attempts. */
export const RESUME_API_RETRY_DELAY_MULTIPLIER = new InjectionToken<number>(
  'RESUME_API_RETRY_DELAY_MULTIPLIER',
  {
    providedIn: 'root',
    factory: () => 2,
  },
);
