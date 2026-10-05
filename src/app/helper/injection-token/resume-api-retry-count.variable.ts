import { InjectionToken } from '@angular/core';

/** Maximum number of retry attempts for failed resume data API requests. */
export const RESUME_API_RETRY_COUNT = new InjectionToken<number>('RESUME_API_RETRY_COUNT', {
  providedIn: 'root',
  factory: () => 3,
});
