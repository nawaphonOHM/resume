import { inject, InjectionToken } from '@angular/core';
import { assertNonEmptyString } from './assert-non-empty-string.function.ts';

export const assertNonEmptyStringArray = new InjectionToken<
  (value: unknown, fieldName: string) => asserts value is string[]
>('assertNonEmptyStringArray', {
  providedIn: 'root',
  factory: () => {
    const fn = (
      assertNonEmptyStringFn: (value: unknown, fieldName: string) => asserts value is string,
    ) => {
      return (value: unknown, fieldName: string): asserts value is string[] => {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error(`The résumé ${fieldName} must contain at least one item.`);
        }

        for (const [index, item] of value.entries()) {
          assertNonEmptyStringFn(item, `${fieldName}[${index}]`);
        }
      };
    };

    return fn(inject(assertNonEmptyString));
  },
});
