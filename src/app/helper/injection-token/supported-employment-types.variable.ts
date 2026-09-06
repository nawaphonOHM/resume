import { InjectionToken } from '@angular/core';

export const SUPPORTED_EMPLOYMENT_TYPES = new InjectionToken<Set<string>>(
  'SUPPORTED_EMPLOYMENT_TYPES',
  { providedIn: 'root', factory: () => new Set<string>(['Internship', 'Permanent', 'Contract']) },
);
