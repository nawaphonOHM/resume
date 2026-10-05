import { InjectionToken } from '@angular/core';

/** Configurable injection token for backend API base origin/path. */
export const RESUME_DATA_API_BASE_URL = new InjectionToken<string>('RESUME_DATA_API_BASE_URL', {
  providedIn: 'root',
  factory: () => '',
});
