import { InjectionToken } from '@angular/core';

export const assertNonEmptyString = new InjectionToken<
  (value: unknown, fieldName: string) => asserts value is string
>('assertNonEmptyString', {
  providedIn: 'root',
  factory: () => {
    return (value: unknown, fieldName: string): asserts value is string => {
      if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`The résumé ${fieldName} must be a non-empty string.`);
      }
    };
  },
});
