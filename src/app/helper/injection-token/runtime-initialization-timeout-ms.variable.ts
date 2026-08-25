import { InjectionToken } from '@angular/core';

export const RUNTIME_INITIALIZATION_TIMEOUT_MS = new InjectionToken<number>(
  'RUNTIME_INITIALIZATION_TIMEOUT_MS',
  {
    providedIn: 'root',
    factory: () => 15_000,
  },
);
