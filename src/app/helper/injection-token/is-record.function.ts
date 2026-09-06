import { InjectionToken } from '@angular/core';

export const isRecord = new InjectionToken<(value: unknown) => value is Record<string, unknown>>(
  'isRecord',
  {
    providedIn: 'root',
    factory: () => {
      return (value: unknown): value is Record<string, unknown> => {
        return !!value && typeof value === 'object' && !Array.isArray(value);
      };
    },
  },
);
